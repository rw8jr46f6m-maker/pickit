import {createHash} from 'node:crypto';
import {collect, googleError, Problem} from '../../../lib/youtube.mjs';
import {videoId} from '../../../lib/draw.mjs';
export const runtime = 'nodejs';
export const maxDuration = 60;
const cache = new Map<string,{until:number;data:Awaited<ReturnType<typeof collect>>}>();
const inflight = new Map<string,Promise<Awaited<ReturnType<typeof collect>>>>();
const limits = new Map<string,{until:number;count:number}>();
function throttle(ip:string) {
  const now=Date.now();
  for(const [k,v] of limits) if(v.until<=now) limits.delete(k);
  const key=createHash('sha256').update(ip).digest('hex');
  const item=limits.get(key) ?? {until:now+60000,count:0};
  if((!limits.has(key)&&limits.size>=3000)||++item.count>6) throw new Problem(429,'요청이 많아요. 1분 후 다시 시도해 주세요.');
  limits.set(key,item);
}
export async function POST(req:Request) {
  const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
  try {
    const here=new URL(req.url);
    if(req.headers.get('origin') && req.headers.get('origin')!==here.origin) throw new Problem(403,'사이트에서 직접 이용해 주세요.');
    throttle(process.env.VERCEL ? req.headers.get('x-vercel-forwarded-for')?.split(',')[0] || 'shared' : 'local');
    const raw=here.searchParams.get('url')||'';
    let id:string;
    try { if(raw.length>2048) throw Error(); id=videoId(raw); } catch { throw new Problem(400,'올바른 유튜브 영상 주소를 입력해 주세요.'); }
    const key=process.env.YOUTUBE_API_KEY;
    if(!key) throw new Problem(503,'실제 수집용 API 키가 설정되지 않았어요. 데모 체험을 이용해 주세요.');
    for(const [k,v] of cache) if(v.until<=Date.now()) cache.delete(k);
    const hit=cache.get(id);
    if(hit) return response(hit.data);
    let pending=inflight.get(id);
    if(!pending) {
      if(inflight.size>=3) throw new Problem(429,'현재 수집 중인 영상이 많아요. 잠시 후 다시 시도해 주세요.');
      const signal=AbortSignal.timeout(45000);
      pending=collect(id,async (endpoint:string,params:Record<string,string>)=>{
        const url=new URL('https://www.googleapis.com/youtube/v3/'+endpoint);
        url.search=new URLSearchParams(params).toString();
        const r=await fetch(url,{signal,cache:'no-store',headers:{'x-goog-api-key':key}});
        const data=await r.json();
        if(!r.ok) throw googleError(r.status,data.error?.errors?.[0]?.reason);
        return data;
      }).then(data=>{
        if(cache.size>=8) cache.delete(cache.keys().next().value!);
        cache.set(id,{data,until:Date.now()+120000});
        return data;
      }).finally(()=>inflight.delete(id));
      inflight.set(id,pending);
    }
    return response(await pending);
  } catch(e) {
    return e instanceof Problem ? response({error:e.message},e.status) : response({error:'네트워크 연결 또는 수집 시간이 초과됐어요. 다시 시도해 주세요.'},502);
  }
}