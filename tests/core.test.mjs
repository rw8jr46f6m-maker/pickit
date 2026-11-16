import test from 'node:test';
import {videoId,draw,tickets} from '../lib/draw.mjs';
import {collect,googleError} from '../lib/youtube.mjs';
function equal(actual,expected){if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Unexpected '+JSON.stringify(actual));}
function fails(fn){try{fn();}catch{return;}throw Error('Expected failure');}
async function rejects(fn,message){try{await fn();}catch(e){if(e.message.includes(message))return;throw e;}throw Error('Expected rejection');}
const id='abcDEF12_-3';
for(const link of ['https://www.youtube.com/watch?v='+id,'youtu.be/'+id+'?si=share','https://youtube.com/shorts/'+id,'https://m.youtube.com/watch?t=1&v='+id]){
 test('URL '+link,()=>equal(videoId(link),id));
}
test('invalid URLs',()=>{for(const u of ['https://youtube.com.other/watch?v='+id,'javascript:bad','https://youtube.com@evil.org/watch?v='+id,'https://youtube.com/watch?v=short','https://youtube.com/watch?v='+id+'&v='+id])fails(()=>videoId(u));});
const rows=[['A','x'],['A','참여'],['A','참여'],['B','참여'],['','참여']].map(([channel,text],i)=>({id:String(i),channel,text,name:'같은 이름',link:'',avatar:''}));
test('filter before channel dedup; same name and missing ID',()=>equal(tickets(rows,' 참여 ',false).map(c=>c.id),['1','3']));
test('equal chance per channel',()=>{const p=tickets(rows,'',false);equal(p.map((_,i)=>draw(p,1,()=>i)[0].channel),['A','B']);});
test('weighted chances and distinct winners for every first ticket',()=>{const p=tickets(rows,'참여',true);equal(p.map((_,i)=>draw(p,2,()=>0).length),[2,2,2]);equal(p.map((_,i)=>{let first=true;return draw(p,2,()=>{if(first){first=false;return i;}return 0;}).map(c=>c.channel).join('');}),['AB','AB','BA']);});
test('invalid winner count',()=>{for(const n of [3,1.5,0,-1,NaN])fails(()=>draw(tickets(rows,'',true),n));});
const video={items:[{snippet:{title:'mock',channelTitle:'mock'}}]};
function thread(id,channel='A'){return {snippet:{topLevelComment:{id,snippet:{authorChannelId:{value:channel},textDisplay:'text',authorDisplayName:'name'}}},replies:{comments:[{id:'reply'}]}};}
test('no comments',async()=>equal((await collect(id,async e=>e==='videos'?video:{items:[]})).fetched,0));
test('unavailable video',()=>rejects(()=>collect(id,async()=>({items:[]})),'비공개'));
test('pagination, overlapping pages, replies and unknown author',async()=>{const pages=[];const r=await collect(id,async (e,p)=>{if(e==='videos')return video;pages.push(p.pageToken||'');return p.pageToken?{items:[thread('1'),thread('2','B'),thread('3','')]}:{items:[thread('1')],nextPageToken:'next'};});equal(pages,['','next']);equal([r.fetched,r.skipped,r.entries.map(c=>c.id)],[3,1,['1','2']]);});
test('disabled comments',()=>rejects(()=>collect(id,async e=>{if(e==='videos')return video;throw googleError(403,'commentsDisabled');}),'비활성화'));
test('quota exhausted',()=>equal(googleError(403,'quotaExceeded').status,503));
test('network error interrupts retrieval',()=>rejects(()=>collect(id,async e=>{if(e==='videos')return video;throw Error('network');}),'network'));
test('no partial drawing above limit',()=>{let page=0;return rejects(()=>collect(id,async e=>e==='videos'?video:{items:[],nextPageToken:String(++page)}),'한도');});
