import test from 'node:test';
import assert from 'node:assert/strict';
import {PLAYLISTS,parsePublicFeed,fetchRecentPublicPlaylist,decodeText} from '../src/utils/tech-playlist-feed.js';
import worker from '../src/worker.js';

const fixture='<?xml version="1.0" encoding="UTF-8"?>'
 +'<feed xmlns="http://www.w3.org/2005/Atom" xmlns:yt="http://www.youtube.com/xml/schemas/2015">'
 +'<entry><yt:videoId>abcdefghijk</yt:videoId><title>PC &amp; Hardware &#x1F4BB;</title><published>2026-10-19T08:00:00+00:00</published></entry>'
 +'<entry><yt:videoId>123456789ab</yt:videoId><title>Automotor &lt;electrónica&gt;</title></entry>'
 +'<entry><yt:videoId>bad</yt:videoId><title>Invalid</title></entry></feed>';

test('only exact two public playlist IDs are allowed',()=>{
 assert.deepEqual(Object.keys(PLAYLISTS),['pc','auto']);
 assert.equal(PLAYLISTS.pc,'PLVxh46uVOYfb5YCI8AqG5jK_TB8p0vu9D');
 assert.equal(PLAYLISTS.auto,'PLVxh46uVOYfYbTsYFmaZ31w8AyCOs9yuG');
});
test('public feed parses videos and safely decodes titles',()=>{
 const v=parsePublicFeed(fixture);
 assert.equal(v.length,2);
 assert.equal(v[0].title,'PC & Hardware 💻');
 assert.equal(v[1].title,'Automotor <electrónica>');
 assert.equal(decodeText('&#39; &amp; &unknown;'),"' & &unknown;");
});
test('no credentials needed and fresh Atom fetch happens per call',async()=>{
 let calls=0;
 const stub=async (url)=>{calls++;assert.ok(url.includes(PLAYLISTS.pc));return new Response(fixture,{status:200});};
 const one=await fetchRecentPublicPlaylist('pc',stub);
 const two=await fetchRecentPublicPlaylist('pc',stub);
 assert.equal(calls,2);
 assert.equal(one.videos.length,2);
 assert.equal(two.partial,true);
 assert.equal((await fetchRecentPublicPlaylist('anything',stub)).status,404);
});
test('Worker routes live list before static asset serving, no untrusted upstream URL',async()=>{
 const previous=globalThis.fetch;
 let hits=0;
 globalThis.fetch=async(url)=>{hits++;assert.ok(url.startsWith('https://www.youtube.com/feeds/videos.xml?playlist_id='));return new Response(fixture,{status:200});};
 const assets={fetch:async()=>new Response('STATIC',{status:200})};
 try{
  const response=await worker.fetch(new Request('https://labs.solarispkn.com.ar/api/tech-playlist?list=auto'),{ASSETS:assets});
  assert.equal(response.status,200);
  const json=await response.json();
  assert.equal(json.videos.length,2);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(hits,1);
  const invalid=await worker.fetch(new Request('https://labs.solarispkn.com.ar/api/tech-playlist?list=https://example.com'),{ASSETS:assets});
  assert.equal(invalid.status,404);
  assert.equal(hits,1);
 }finally{globalThis.fetch=previous;}
});

test('Worker resolves older playlist video titles via public oEmbed without secrets',async()=>{
 const old=globalThis.fetch;
 let hits=0;
 globalThis.fetch=async(url)=>{
  hits++;
  assert.ok(String(url).startsWith('https://www.youtube.com/oembed?url='));
  assert.ok(String(url).includes('abcdefghijk'));
  return Response.json({title:'Hardware & Reparaciones'});
 };
 const assets={fetch:async()=>new Response('STATIC',{status:200})};
 try{
  const yes=await worker.fetch(new Request('https://labs.solarispkn.com.ar/api/tech-video-title?id=abcdefghijk'),{ASSETS:assets});
  assert.equal(yes.status,200);
  const data=await yes.json();
  assert.equal(data.title,'Hardware & Reparaciones');
  assert.equal(data.id,'abcdefghijk');
  assert.equal(hits,1);
  const no=await worker.fetch(new Request('https://labs.solarispkn.com.ar/api/tech-video-title?id=https%3A%2F%2Fexample.com'),{ASSETS:assets});
  assert.equal(no.status,400);
  assert.equal(hits,1);
 }finally{globalThis.fetch=old;}
});
