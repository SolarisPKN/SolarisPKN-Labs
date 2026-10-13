import test from 'node:test';
import assert from 'node:assert/strict';
import {handleAccountApi} from '../src/auth/api.js';
import {digest,token,sameOrigin,publicIdentifier,isConfigured,limit,verifyChallenge} from '../src/auth/security.js';

const host='https://labs.solarispkn.com.ar';
function req(path,method='GET',body=null,from=host){
 const headers=new Headers();
 if(from)headers.set('origin',from);
 if(body!==null)headers.set('content-type','application/json');
 return new Request(host+path,{method,headers,body:body===null?undefined:JSON.stringify(body)});
}
function env(extra={}){
 return {ACCOUNT_ENABLED:'true',IDENTITY_PEPPER:'testing-pepper-do-not-use-production-1234567890',
 TURNSTILE_SECRET:'test-turnstile-secret-configuration',TURNSTILE_SITE_KEY:'test-turnstile-site-key-value',
 DB:{prepare(){throw Error('Unexpected private DB query');}},...extra};
}
test('fail-closed defaults protect unconfigured database and users',async()=>{
 const disabled={};
 const status=await handleAccountApi(req('/api/account/status'),disabled);
 assert.equal((await status.json()).enabled,false);
 for(const [path,method,body] of [
  ['/api/account/me','GET',null],
  ['/api/account/export','GET',null],
  ['/api/auth/start','POST',{provider:'google',turnstile:'fake'}]
 ]){
   const result=await handleAccountApi(req(path,method,body),disabled);
   assert.equal(result.status,503);
   assert.match(result.headers.get('cache-control'),/no-store/);
 }
});
test('public configuration cannot reveal OAuth secrets or identity pepper',async()=>{
 const cfg=env({GOOGLE_CLIENT_ID:'a-public-client-id',GOOGLE_CLIENT_SECRET:'private-client-secret'});
 const r=await handleAccountApi(req('/api/account/status'),cfg);
 const raw=await r.text();const status=JSON.parse(raw);
 assert.equal(status.enabled,true);assert.deepEqual(status.providers,['google']);
 assert.equal(status.features.passkeys,false);
 assert.ok(!raw.includes(cfg.GOOGLE_CLIENT_SECRET));
 assert.ok(!raw.includes(cfg.IDENTITY_PEPPER));
});
test('private profile, favorites, follows, export and comments reject unauthenticated requests',async()=>{
 const cfg=env();
 for(const path of ['/api/account/me','/api/account/overview','/api/account/favorites','/api/account/follows','/api/account/comments','/api/account/export']){
   const response=await handleAccountApi(req(path),cfg);
   if(path==='/api/account/me')assert.deepEqual(await response.json(),{authenticated:false});
   else assert.equal(response.status,401,path);
 }
 for(const path of ['/api/account/profile','/api/comments','/api/account/delete']){
   const response=await handleAccountApi(req(path,'POST',{alias:'test'}),cfg);
   assert.equal(response.status,401,path);
 }
});
test('login origin and provider allowlist block invalid requests',async()=>{
 const cfg=env({DB:{prepare(){return {bind(){return {first:async()=>({count:1})};}};}}});
 const evil=await handleAccountApi(req('/api/auth/start','POST',{provider:'google'},'https://attacker.example'),cfg);
 assert.equal(evil.status,403);
 const missingProvider=await handleAccountApi(req('/api/auth/start','POST',{provider:'baidu',turnstile:'fake'}),cfg);
 assert.equal(missingProvider.status,503);
});
test('random tokens and hashed opaque identifiers',async()=>{
 assert.equal(publicIdentifier('SolarisPKN-Labs'),true);
 for(const s of ['','../data','a','<script>','x'.repeat(120)])assert.equal(publicIdentifier(s),false);
 assert.notEqual(token(),token());
 assert.match(await digest(token()),/^[a-f0-9]{64}$/);
 assert.notEqual(await digest('id','hex','test-pepper-000000000000000000000000'),await digest('id','hex','test-pepper-111111111111111111111111'));
 assert.equal(sameOrigin(req('/api/account/me','POST',{})),true);
 assert.equal(sameOrigin(req('/api/account/me','POST',{},'https://evil.example')),false);
});
test('rate counters cannot exceed configured allowance',async()=>{
 let count=0;const db={prepare(){return {bind(){return {first:async()=>({count:++count})};}};}};
 assert.equal(await limit(db,'private-count',60,2),true);
 assert.equal(await limit(db,'private-count',60,2),true);
 assert.equal(await limit(db,'private-count',60,2),false);
});
test('Turnstile server verification requires hostname and successful verdict',async()=>{
 const previous=globalThis.fetch;
 try{
  const cfg=env();
  globalThis.fetch=async()=>Response.json({success:true,hostname:'attacker.example',action:'login'});
  assert.equal(await verifyChallenge('sample',cfg,req('/api/auth/start','POST',{}),'login'),false);
  globalThis.fetch=async()=>Response.json({success:true,hostname:'labs.solarispkn.com.ar',action:'comment'});
  assert.equal(await verifyChallenge('sample',cfg,req('/api/auth/start','POST',{}),'comment'),true);
  assert.equal(await verifyChallenge('sample',cfg,req('/api/auth/start','POST',{}),'sensitive'),false);
  globalThis.fetch=async()=>Response.json({success:false,hostname:'labs.solarispkn.com.ar',action:'login'});
  assert.equal(await verifyChallenge('sample',cfg,req('/api/auth/start','POST',{}),'login'),false);
 }finally{globalThis.fetch=previous;}
});

test('Google OIDC requires signed nonce-bound token; state is one-use',async()=>{
 const existingFetch=globalThis.fetch;
 const kp=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk={...(await crypto.subtle.exportKey('jwk',kp.publicKey)),kid:'test-key-id',use:'sig',alg:'RS256'};
 const fixtures={flow:null,uid:null,session:null,ident:null};
 const db={prepare(sql){return {bind(...args){return {
  async first(){
   if(sql.includes('rate_buckets'))return {count:1};
   if(sql.startsWith('UPDATE oauth_flows')){
     if(!fixtures.flow||fixtures.flow.used||args[1]!==fixtures.flow.hash)return null;
     fixtures.flow.used=true;return {pkce_verifier:fixtures.flow.verifier,nonce:fixtures.flow.nonce};
   }
   if(sql.startsWith('SELECT user_id FROM identities'))return fixtures.ident?{user_id:fixtures.uid}:null;
   if(sql.startsWith('SELECT id FROM users'))return fixtures.uid?{id:fixtures.uid}:null;
   return null;
  },
  async run(){
   if(sql.startsWith('INSERT INTO oauth_flows'))fixtures.flow={hash:args[0],verifier:args[2],nonce:args[3],used:false};
   if(sql.startsWith('INSERT INTO users'))fixtures.uid=args[0];
   if(sql.startsWith('INSERT INTO identities'))fixtures.ident=true;
   if(sql.startsWith('INSERT INTO sessions'))fixtures.session=args[0];
   return {success:true,meta:{changes:1}};
  }
 };}};}};
 const cfg=env({DB:db,GOOGLE_CLIENT_ID:'a-public-google-id',GOOGLE_CLIENT_SECRET:'fake-configured-app-secret'});
 const base64=v=>Buffer.from(v instanceof Uint8Array?v:(typeof v==='string'?v:JSON.stringify(v))).toString('base64url');
 globalThis.fetch=async (url)=>{
  const target=String(url);
  if(target.includes('siteverify'))return Response.json({success:true,hostname:'labs.solarispkn.com.ar',action:'login'});
  if(target.includes('oauth2.googleapis.com/token')){
   const header=base64({alg:'RS256',kid:'test-key-id'});
   const body=base64({iss:'https://accounts.google.com',aud:cfg.GOOGLE_CLIENT_ID,sub:'safe_subject_123',
     nonce:fixtures.flow.nonce,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600});
   const text=header+'.'+body;
   const signature=new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',kp.privateKey,new TextEncoder().encode(text)));
   return Response.json({id_token:text+'.'+base64(signature)});
  }
  if(target.includes('googleapis.com/oauth2/v3/certs'))return Response.json({keys:[jwk]});
  throw Error('Unexpected network fetch in OIDC test');
 };
 try{
  const start=await handleAccountApi(req('/api/auth/start','POST',{provider:'google',turnstile:'unit-test-token'}),cfg);
  assert.equal(start.status,200);
  const authorization=new URL((await start.json()).authorize);
  assert.equal(authorization.hostname,'accounts.google.com');
  const state=authorization.searchParams.get('state');
  assert.equal(authorization.searchParams.get('code_challenge_method'),'S256');
  const cookie=start.headers.get('set-cookie').split(';')[0];
  const url='/api/auth/callback/google?state='+encodeURIComponent(state)+'&code=fake-auth-code';
  const callbackRequest=new Request(host+url,{headers:{cookie}});
  const first=await handleAccountApi(callbackRequest,cfg);
  assert.equal(first.status,303);
  assert.match(first.headers.get('set-cookie'),/__Host-labs_session=/);
  assert.ok(fixtures.session);
  const second=await handleAccountApi(new Request(host+url,{headers:{cookie}}),cfg);
  assert.equal(second.status,303);
  assert.match(second.headers.get('location'),/auth=failed/);
 }finally{globalThis.fetch=existingFetch;}
});
