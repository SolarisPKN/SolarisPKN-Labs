import {availableProviders,startOAuth,handleOAuthCallback,readSessionCookie,expiredSessionCookie} from './oauth.js';
import {now,digest,json,sameOrigin,protectedRequest,payload,verifyChallenge,limit,isConfigured,publicIdentifier} from './security.js';

const UNAVAILABLE=json({error:'account_not_configured'},503);
const fail=(code='bad_request',status=400)=>json({error:code},status);
const userQuery='SELECT s.user_id AS id,s.created_at AS session_created,u.alias,u.created_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_digest=? AND s.revoked_at IS NULL AND s.expires_at>? AND u.disabled_at IS NULL';
const privateHeaders={'Cache-Control':'private, no-store, max-age=0'};
async function currentUser(request,env){
 const session=readSessionCookie(request);
 if(!/^[A-Za-z0-9_-]{40,90}$/.test(session))return null;
 return env.DB.prepare(userQuery).bind(await digest(session),now()).first();
}
async function ipBucket(request,env,label){
 // HMAC prevents storing the visitor's IP in D1.
 const ip=request.headers.get('cf-connecting-ip')||'unknown';
 return digest('rate:'+label+':'+ip,'hex',env.IDENTITY_PEPPER);
}
async function jsonMutation(request,limitSize=4000){
 if(!protectedRequest(request))return null;
 return payload(request,limitSize);
}
async function requireRate(request,env,label,period,max){
 const key=await ipBucket(request,env,label);
 return limit(env.DB,key,period,max);
}
async function verifyPublicPost(request,env,slug){
 const url=new URL(request.url);
 const path='/es/blog/'+encodeURIComponent(slug)+'/';
 const response=await env.ASSETS.fetch(new Request(url.origin+path));
 return response.status===200 && (response.headers.get('content-type')||'').includes('text/html');
}
async function preferences(env,userId){
 const existing=await env.DB.prepare('SELECT language,theme FROM preferences WHERE user_id=?').bind(userId).first();
 return existing||{language:'es',theme:'system'};
}
async function getMe(user,env){
 const counts=await Promise.all([
   env.DB.prepare('SELECT COUNT(*) n FROM favorites WHERE user_id=?').bind(user.id).first(),
   env.DB.prepare('SELECT COUNT(*) n FROM follows WHERE user_id=?').bind(user.id).first(),
   env.DB.prepare('SELECT COUNT(*) n FROM comments WHERE user_id=?').bind(user.id).first()
 ]);
 const providers=await env.DB.prepare('SELECT provider FROM identities WHERE user_id=? ORDER BY provider').bind(user.id).all();
 return {authenticated:true,user:{id:user.id,alias:user.alias,createdAt:user.created_at},
   providers:(providers.results||[]).map(x=>x.provider),
   totals:{favorites:counts[0]?.n||0,following:counts[1]?.n||0,comments:counts[2]?.n||0},
   preferences:await preferences(env,user.id)};
}
export async function handleAccountApi(request,env){
 const url=new URL(request.url),pathname=url.pathname,method=request.method.toUpperCase();
 if(!pathname.startsWith('/api/'))return null;
 if(method==='OPTIONS')return fail('method_not_allowed',405);
 if(pathname==='/api/account/status'&&method==='GET'){
  return json({enabled:isConfigured(env),providers:isConfigured(env)?availableProviders(env):[],
    turnstileSiteKey:isConfigured(env)?env.TURNSTILE_SITE_KEY:null,
    features:{passkeys:false,linkedProviders:false,moderation:'manual',freeTierOnly:true}});
 }
 if(!isConfigured(env))return UNAVAILABLE;
 if(pathname.startsWith('/api/auth/callback/')){
  if(method!=='GET')return fail('method_not_allowed',405);
  const provider=pathname.slice('/api/auth/callback/'.length);
  if(!/^(google|github)$/.test(provider))return fail('not_found',404);
  return handleOAuthCallback(request,env,provider);
 }
 if(pathname==='/api/auth/start'&&method==='POST'){
  if(!sameOrigin(request)||!(request.headers.get('content-type')||'').startsWith('application/json'))return fail('bad_origin',403);
  if(!(await requireRate(request,env,'login',300,5)))return fail('rate_limited',429);
  const body=await payload(request,3000);
  if(!body||!availableProviders(env).includes(body.provider))return fail('provider_disabled',503);
  return startOAuth(request,env,body.provider,body);
 }
 if(pathname==='/api/comments'&&method==='GET'){
  const slug=url.searchParams.get('post');
  if(!publicIdentifier(slug))return fail('invalid_post',400);
  const list=await env.DB.prepare("SELECT c.id,c.body,c.created_at,u.alias FROM comments c JOIN users u ON c.user_id=u.id WHERE c.post_slug=? AND c.status='approved' AND u.disabled_at IS NULL ORDER BY c.created_at DESC LIMIT 40").bind(slug).all();
  return json({comments:(list.results||[]).map(row=>({id:row.id,text:row.body,author:row.alias||'SolarisPKN member',createdAt:row.created_at}))});
 }
 const user=await currentUser(request,env);
 if(pathname==='/api/account/me'&&method==='GET')return json(user?await getMe(user,env):{authenticated:false});
 if(!user)return fail('unauthorized',401);
 if(pathname==='/api/account/overview'&&method==='GET'){
  const sessions=await env.DB.prepare('SELECT created_at,expires_at FROM sessions WHERE user_id=? AND revoked_at IS NULL AND expires_at>? ORDER BY created_at DESC LIMIT 12').bind(user.id,now()).all();
  return json({...await getMe(user,env),sessions:(sessions.results||[]).map(s=>({createdAt:s.created_at,expiresAt:s.expires_at}))});
 }
 if(pathname==='/api/account/logout'&&method==='POST'){
  if(!(await jsonMutation(request,128)))return fail('bad_origin',403);
  const raw=readSessionCookie(request);
  if(raw){await env.DB.prepare('UPDATE sessions SET revoked_at=? WHERE token_digest=?').bind(now(),await digest(raw)).run();}
  const response=json({ok:true});response.headers.append('Set-Cookie',expiredSessionCookie());return response;
 }
 if((pathname==='/api/account/favorites'||pathname==='/api/account/follows')){
  const table=pathname.endsWith('/favorites')?'favorites':'follows';
  if(method==='GET'){
   const result=await env.DB.prepare('SELECT project,created_at FROM '+table+' WHERE user_id=? ORDER BY created_at DESC LIMIT 120').bind(user.id).all();
   return json({items:result.results||[]});
  }
  if(method!=='POST')return fail('method_not_allowed',405);
  const body=await jsonMutation(request,500);
  if(!body||!publicIdentifier(body.project)||!['add','remove'].includes(body.action))return fail('invalid_input',400);
  if(!(await limit(env.DB,'account:'+user.id+':'+table,3600,45)))return fail('rate_limited',429);
  if(body.action==='remove')await env.DB.prepare('DELETE FROM '+table+' WHERE user_id=? AND project=?').bind(user.id,body.project).run();
  else await env.DB.prepare('INSERT OR IGNORE INTO '+table+'(user_id,project,created_at) VALUES(?,?,?)').bind(user.id,body.project,now()).run();
  return json({ok:true});
 }
 if(pathname==='/api/account/preferences'){
  if(method==='GET')return json({preferences:await preferences(env,user.id)});
  if(method!=='POST')return fail('method_not_allowed',405);
  const body=await jsonMutation(request,400);
  if(!body||!['es','en'].includes(body.language)||!['dark','light','system'].includes(body.theme))return fail('invalid_preferences',400);
  await env.DB.prepare('INSERT INTO preferences(user_id,language,theme) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET language=excluded.language,theme=excluded.theme')
   .bind(user.id,body.language,body.theme).run();
  return json({ok:true});
 }
 if(pathname==='/api/account/profile'&&method==='POST'){
  const body=await jsonMutation(request,350);
  const alias=typeof body?.alias==='string'?body.alias.trim():null;
  if(!alias||!/^[A-Za-z0-9_]{3,24}$/.test(alias)||/^(admin|moderator|solarispkn|support|system)$/i.test(alias))return fail('invalid_alias',400);
  if(!(await limit(env.DB,'alias:'+user.id,86400,3)))return fail('rate_limited',429);
  try{await env.DB.prepare('UPDATE users SET alias=? WHERE id=?').bind(alias,user.id).run();}
  catch{return fail('alias_taken',409);}
  return json({ok:true,alias});
 }
 if(pathname==='/api/comments'&&method==='POST'){
  const body=await jsonMutation(request,2200);
  if(!body||!publicIdentifier(body.post)||typeof body.text!=='string'||typeof body.turnstile!=='string')return fail('invalid_input',400);
  const text=body.text.trim();
  if(text.length<3||text.length>1000||text.split(/https?:\/\//gi).length>3)return fail('invalid_comment',400);
  if(!(await limit(env.DB,'comment:'+user.id,600,3)))return fail('rate_limited',429);
  if(!(await verifyPublicPost(request,env,body.post)))return fail('unknown_post',404);
  if(!(await verifyChallenge(body.turnstile,env,request,'comment')))return fail('verification_failed',403);
  const id=crypto.randomUUID();
  await env.DB.prepare("INSERT INTO comments(id,user_id,post_slug,body,status,created_at) VALUES(?,?,?,?,'pending',?)").bind(id,user.id,body.post,text,now()).run();
  return json({ok:true,status:'pending',id},202);
 }
 if(pathname==='/api/account/comments'&&method==='GET'){
  const result=await env.DB.prepare('SELECT id,post_slug,body,status,created_at FROM comments WHERE user_id=? ORDER BY created_at DESC LIMIT 60').bind(user.id).all();
  return json({items:result.results||[]});
 }
 if(pathname==='/api/account/comments/delete'&&method==='POST'){
  const body=await jsonMutation(request,300);
  if(!body||typeof body.id!=='string'||body.id.length>80)return fail('invalid_input',400);
  await env.DB.prepare('DELETE FROM comments WHERE id=? AND user_id=?').bind(body.id,user.id).run();
  return json({ok:true});
 }
 if(pathname==='/api/account/export'&&method==='GET'){
  if(!(await limit(env.DB,'export:'+user.id,3600,3)))return fail('rate_limited',429);
  const tables=['favorites','follows','comments','preferences'];
  const exportData={account:{id:user.id,alias:user.alias,createdAt:user.created_at}};
  for(const table of tables){
   const columns=table==='comments'?'id,post_slug,body,status,created_at':table==='preferences'?'language,theme':'project,created_at';
   const result=await env.DB.prepare('SELECT '+columns+' FROM '+table+' WHERE user_id=? LIMIT 500').bind(user.id).all();
   exportData[table]=result.results||[];
  }
  const reply=json(exportData);reply.headers.set('Content-Disposition','attachment; filename="solarispkn-account-export.json"');
  return reply;
 }
 if(pathname==='/api/account/delete'&&method==='POST'){
  const body=await jsonMutation(request,2500);
  if(!body||body.confirm!=='DELETE'||typeof body.turnstile!=='string')return fail('confirmation_required',400);
  if(user.session_created<now()-600)return fail('reauth_required',403);
  if(!(await verifyChallenge(body.turnstile,env,request,'sensitive')))return fail('verification_failed',403);
  await env.DB.prepare('DELETE FROM users WHERE id=?').bind(user.id).run();
  const response=json({ok:true});response.headers.append('Set-Cookie',expiredSessionCookie());return response;
 }
 return fail('not_found',404);
}
