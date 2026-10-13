/**
 * SolarisPKN ID: narrow, explicitly audited OAuth adapters.
 * No auth provider receives a persistent token grant. OAuth tokens are never stored or logged.
 */
import { digest, token, now, json, verifyChallenge } from './security.js';

export const PROVIDERS = Object.freeze({
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    jwks: 'https://www.googleapis.com/oauth2/v3/certs',
    issuer: ['https://accounts.google.com','accounts.google.com'],
    scopes: 'openid',
    userinfo: null,
  },
  github: {
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    userinfo: 'https://api.github.com/user',
    scopes: 'read:user',
  },
});
const CONFIG = {google:['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'],github:['GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET']};
export const availableProviders = (env) =>
  Object.keys(PROVIDERS).filter(name=>CONFIG[name].every(key=>typeof env[key]==='string' && env[key].length>5));

export function oauthCallback(origin, provider){
  return origin+'/api/auth/callback/'+provider;
}
export async function startOAuth(request,env,provider){
  if(!availableProviders(env).includes(provider))return json({error:'provider_disabled'},503);
  const body=await request.json().catch(()=>null);
  if(!body||typeof body.turnstile!=='string')return json({error:'verification_required'},400);
  if(!(await verifyChallenge(body.turnstile,env,request)))return json({error:'verification_failed'},403);
  const state=token(32), verifier=token(32), nonce=token(32), stateHash=await digest(state);
  const challenge=await digest(verifier,'base64url');
  const time=now();
  await env.DB.prepare('INSERT INTO oauth_flows(state_digest,provider,pkce_verifier,nonce,created_at) VALUES(?,?,?,?,?)')
    .bind(stateHash,provider,verifier,nonce,time).run();
  const spec=PROVIDERS[provider];
  const origin=new URL(request.url).origin;
  const url=new URL(spec.authorize);
  url.searchParams.set('client_id',env[provider.toUpperCase()+'_CLIENT_ID']);
  url.searchParams.set('redirect_uri',oauthCallback(origin,provider));
  url.searchParams.set('response_type','code');
  url.searchParams.set('scope',spec.scopes);
  url.searchParams.set('state',state);
  url.searchParams.set('code_challenge',challenge);
  url.searchParams.set('code_challenge_method','S256');
  if(provider==='google')url.searchParams.set('nonce',nonce);
  const reply=json({authorize:url.toString()});
  reply.headers.append('Set-Cookie','__Host-labs_flow='+state+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=300');
  return reply;
}
function parseCookies(request){
  const cookies=new Map();
  for(const pair of (request.headers.get('cookie')||'').split(';')){
    const sep=pair.indexOf('=');
    if(sep>0)cookies.set(pair.slice(0,sep).trim(),pair.slice(sep+1).trim());
  }
  return cookies;
}
function clearFlowCookie(){
  return '__Host-labs_flow=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0';
}
function toBase64Url(bytes){
 return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');
}
function decodeB64(value){
  if(!/^[a-zA-Z0-9_-]+$/.test(value))throw Error('invalid encoded token');
  const binary=atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4));
  return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
async function googleIdentity(idToken,nonce,clientId){
 if(typeof idToken!=='string'||idToken.length>12000)throw Error('missing ID token');
 const parts=idToken.split('.');
 if(parts.length!==3)throw Error('invalid JWT');
 const header=JSON.parse(new TextDecoder().decode(decodeB64(parts[0])));
 const body=JSON.parse(new TextDecoder().decode(decodeB64(parts[1])));
 const nowSeconds=Math.floor(Date.now()/1000);
 if(header.alg!=='RS256'||typeof header.kid!=='string')throw Error('unsupported JWT');
 if(!PROVIDERS.google.issuer.includes(body.iss)||body.aud!==clientId||
    typeof body.sub!=='string'||body.sub.length>256||
    body.nonce!==nonce||!Number.isSafeInteger(body.exp)||body.exp<=nowSeconds||
    !Number.isSafeInteger(body.iat)||body.iat>nowSeconds+60||
    (body.nbf!==undefined&&body.nbf>nowSeconds+60))throw Error('invalid ID claims');
 const response=await fetch(PROVIDERS.google.jwks,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(6000)});
 if(!response.ok)throw Error('JWKS unavailable');
 const list=await response.json();
 const jwk=list.keys?.find(key=>key.kid===header.kid&&key.kty==='RSA'&&key.use!=='enc'&&(!key.alg||key.alg==='RS256'));
 if(!jwk)throw Error('signing key not found');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 const data=new TextEncoder().encode(parts[0]+'.'+parts[1]);
 if(!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decodeB64(parts[2]),data)))throw Error('invalid ID signature');
 return body.sub;
}
async function exchange(provider,code,flow,env,request){
 const spec=PROVIDERS[provider],origin=new URL(request.url).origin;
 const params=new URLSearchParams({
   client_id:env[provider.toUpperCase()+'_CLIENT_ID'],
   client_secret:env[provider.toUpperCase()+'_CLIENT_SECRET'],
   code,code_verifier:flow.pkce_verifier,
   redirect_uri:oauthCallback(origin,provider),grant_type:'authorization_code'
 });
 const response=await fetch(spec.token,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body:params,signal:AbortSignal.timeout(7000)});
 if(!response.ok)throw Error('token endpoint refused code');
 const body=await response.json();
 if(provider==='google')return googleIdentity(body.id_token,flow.nonce,env.GOOGLE_CLIENT_ID);
 if(typeof body.access_token!=='string'||body.access_token.length>4000||body.token_type?.toLowerCase()!=='bearer')throw Error('missing GitHub token');
 const profile=await fetch(spec.userinfo,{headers:{Authorization:'Bearer '+body.access_token,Accept:'application/vnd.github+json','User-Agent':'SolarisPKN-Labs'},signal:AbortSignal.timeout(6000)});
 if(!profile.ok)throw Error('GitHub user verification unavailable');
 const user=await profile.json();
 if(!Number.isSafeInteger(user.id)||user.id<1)return Promise.reject(Error('invalid GitHub user'));
 return String(user.id);
}
export async function handleOAuthCallback(request,env,provider){
 const url=new URL(request.url),origin=url.origin;
 const safeExit=()=>Response.redirect(origin+'/es/mi-cuenta/?auth=failed',303);
 if(!availableProviders(env).includes(provider))return safeExit();
 if(url.searchParams.has('error'))return safeExit();
 const state=url.searchParams.get('state')||'';
 const code=url.searchParams.get('code')||'';
 const cookie=parseCookies(request).get('__Host-labs_flow')||'';
 if(!/^[a-zA-Z0-9_-]{40,90}$/.test(state)||state!==cookie||code.length<3||code.length>2048)return safeExit();
 const stateHash=await digest(state);
 // UPDATE ... RETURNING consumes the state exactly once, before any outbound request.
 const flow=await env.DB.prepare('UPDATE oauth_flows SET consumed_at=? WHERE state_digest=? AND provider=? AND consumed_at IS NULL AND created_at>? RETURNING pkce_verifier,nonce')
  .bind(now(),stateHash,provider,now()-300).first();
 if(!flow)return safeExit();
 try {
   const subject=await exchange(provider,code,flow,env,request);
   const subjectHash=await digest(provider+':'+subject,'hex',env.IDENTITY_PEPPER);
   const existing=await env.DB.prepare('SELECT user_id FROM identities WHERE provider=? AND subject_digest=?').bind(provider,subjectHash).first();
   const uid=existing?.user_id||crypto.randomUUID();
   if(!existing){
     const time=now();
     await env.DB.prepare('INSERT INTO users(id,created_at) VALUES(?,?)').bind(uid,time).run();
     try{
       await env.DB.prepare('INSERT INTO identities(provider,subject_digest,user_id,created_at) VALUES(?,?,?,?)').bind(provider,subjectHash,uid,time).run();
     }catch{
       await env.DB.prepare('DELETE FROM users WHERE id=?').bind(uid).run();
       return safeExit();
     }
   }
   const user=await env.DB.prepare('SELECT id FROM users WHERE id=? AND disabled_at IS NULL').bind(uid).first();
   if(!user)return safeExit();
   const session=token(32),sessionHash=await digest(session),time=now();
   await env.DB.prepare('INSERT INTO sessions(token_digest,user_id,created_at,expires_at) VALUES(?,?,?,?)')
      .bind(sessionHash,uid,time,time+7*24*3600).run();
   const reply=Response.redirect(origin+'/es/mi-cuenta/?auth=success',303);
   reply.headers.append('Set-Cookie','__Host-labs_session='+session+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=604800');
   reply.headers.append('Set-Cookie',clearFlowCookie());
   reply.headers.set('Cache-Control','no-store');
   reply.headers.set('Referrer-Policy','no-referrer');
   return reply;
 }catch{
   // Do not leak provider token, code, error detail, or subject in logs or URLs.
   return safeExit();
 }
}
export function readSessionCookie(request){return parseCookies(request).get('__Host-labs_session')||'';}
export function expiredSessionCookie(){return '__Host-labs_session=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0';}
