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
  assert.equal(await verifyChallenge('sample',cfg,req('/api/auth/start','POST',{})),false);
  globalThis.fetch=async()=>Response.json({success:true,hostname:'labs.solarispkn.com.ar',action:'comment'});
  assert.equal(await verifyChallenge('sample',cfg,req('/api/auth/start','POST',{})),true);
  globalThis.fetch=async()=>Response.json({success:false,hostname:'labs.solarispkn.com.ar',action:'login'});
  assert.equal(await verifyChallenge('sample',cfg,req('/api/auth/start','POST',{})),false);
 }finally{globalThis.fetch=previous;}
});
