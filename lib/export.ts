import type {Result} from './types';
export function summary(r:Result) {
  return [r.demo?'PICKIT · 데모 추첨':'PICKIT · 추첨 결과',r.title,new Date(r.time).toLocaleString('ko-KR'), '당첨 '+r.winners.length+'명 · 대상 '+r.tickets+'개 · '+r.people+'명', '최상위 댓글 · '+(r.weighted?'댓글마다 1회':'채널마다 1회')+' · 중복 당첨 없음','키워드 '+(r.keyword||'전체')];
}
export function resultText(r:Result) {
  return [...summary(r),'',...r.winners.map((c,i)=>[String(i+1)+'. '+c.name,c.text,c.link].filter(Boolean).join('\n'))].join('\n');
}
export async function saveImage(r:Result) {
  const canvas=document.createElement('canvas');
  canvas.width=960; canvas.height=300+r.winners.length*100;
  const g=canvas.getContext('2d');
  if(!g) throw Error();
  g.fillStyle='#ffffff'; g.fillRect(0,0,canvas.width,canvas.height);
  const line=(s:string,y:number,size:number,color:string)=>{
    g.font=size+'px system-ui, sans-serif';g.fillStyle=color;
    let out=s.replace(/\s+/g,' ');
    if(g.measureText(out).width>864) {
      let tail=''; for(const ch of out) {if(g.measureText(tail+ch+'…').width>864) break; tail+=ch;} out=tail+'…';
    }
    g.fillText(out,48,y);
  };
  summary(r).forEach((s,i)=>line(s,48+i*39,i===0?34:23,i===0?'#3253d7':'#182033'));
  r.winners.forEach((c,i)=>{line(String(i+1).padStart(2,'0')+'   '+c.name,305+i*100,28,'#172039');line(c.text,342+i*100,23,'#475569');});
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error()),'image/png'));
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pickit-'+r.time+'.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),30000);
}