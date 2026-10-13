// Shared account security helpers — no third-party runtime dependencies.
const encoder=new TextEncoder();
export const now=()=>Math.floor(Date.now()/1000);
export function token(n=32){
 const bytes=crypto.getRandomValues(new Uint8Array(n));
 return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');
}
function hex(bytes){return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function digest(value,output='hex',key=null){
 let bytes;
 if(key){
   if(typeof key!=='string'||key.length<32)throw Error('IDENTITY_PEPPER is not configured securely');
   const imported=await crypto.subtle.importKey('raw',encoder.encode(key),'HMAC',{hash:'SHA-256'},false,['sign']);
   bytes=new Uint8Array(await crypto.subtle.sign('HMAC',imported,encoder.encode(value)));
 }else{
   bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
 }
 return output==='base64url'?btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,''):hex(bytes);
}
export function json(value,status=200,extra={}){
 const headers=new Headers({'Content-Type':'application/json; charset=utf-8',
   'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff',
   'Referrer-Policy':'no-referrer','X-Frame-Options':'DENY',
   'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'",...extra});
 return new Response(JSON.stringify(value),{status,headers});
}
export function sameOrigin(request){
 const origin=request.headers.get('origin');
 const target=new URL(request.url).origin;
 const referer=request.headers.get('referer');
 if(origin!==target)return false;
 if(referer){try{if(new URL(referer).origin!==target)return false;}catch{return false;}}
 const site=request.headers.get('sec-fetch-site');
 return !site||site==='same-origin';
}
export function protectedRequest(request){
 const type=request.headers.get('content-type')||'';
 return sameOrigin(request)&&type.toLowerCase().split(';')[0]==='application/json';
}
export async function payload(request,max=4000){
 const size=Number(request.headers.get('content-length'));
 if(size>max)return null;
 const text=await request.text();
 if(text.length>max)return null;
 try{const obj=JSON.parse(text);return obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:null;}catch{return null;}
}
export async function verifyChallenge(value,env,request){
 if(typeof value!=='string'||!value||value.length>2048||!env.TURNSTILE_SECRET)return false;
 const body=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:value});
 try{
  const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,
    signal:AbortSignal.timeout(6000)
  });
  if(!response.ok)return false;
  const verdict=await response.json();
  const target=new URL(request.url);
  return verdict.success===true && verdict.hostname===target.hostname &&
    (verdict.action==='login'||verdict.action==='comment'||verdict.action==='sensitive');
 }catch{return false;}
}
export async function limit(db,source,windowSeconds,maxCount){
 // Caller supplies a non-PII digest, not a raw IP or token.
 const window=Math.floor(now()/windowSeconds);
 const result=await db.prepare('INSERT INTO rate_buckets(bucket,window,count) VALUES(?,?,1) ON CONFLICT(bucket,window) DO UPDATE SET count=count+1 RETURNING count')
 .bind(source,window).first();
 return Number(result?.count||0)<=maxCount;
}
export function isConfigured(env){
 return env.ACCOUNT_ENABLED==='true' && !!env.DB && typeof env.IDENTITY_PEPPER==='string' &&
 env.IDENTITY_PEPPER.length>=32 && typeof env.TURNSTILE_SECRET==='string' && env.TURNSTILE_SECRET.length>10 &&
 typeof env.TURNSTILE_SITE_KEY==='string' && env.TURNSTILE_SITE_KEY.length>10;
}
export function publicIdentifier(value){
 return typeof value==='string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,79}$/.test(value);
}
