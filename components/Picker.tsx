'use client';
import {useEffect,useMemo,useState} from 'react';
import {draw,tickets,videoId} from '../lib/draw.mjs';
import {demo} from '../lib/demo';
import {resultText,saveImage} from '../lib/export';
import type {Collection,Entry,Result} from '../lib/types';

export default function Picker({offline=false}:{offline?:boolean}){
  const [url,setUrl]=useState(''), [data,setData]=useState<Collection|null>(null);
  const [weighted,setWeighted]=useState(false),[count,setCount]=useState('1');
  const [result,setResult]=useState<Result|null>(null),[busy,setBusy]=useState(''),[message,setMessage]=useState(''),[manual,setManual]=useState('');
  const [theme,setTheme]=useState('');
  useEffect(()=>{if(theme)document.documentElement.dataset.theme=theme;},[theme]);
  function toggleTheme(){const dark=theme?theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;setTheme(dark?'light':'dark');}
  const pool=useMemo(()=>tickets(data?.entries??[],weighted),[data,weighted]);
  const people=new Set(pool.map(c=>c.channel)).size;
  function reset(){setResult(null);setMessage('');setManual('');}
  async function load(){
    reset();setData(null);setBusy('load');
    try{videoId(url);const r=await fetch('/api/comments?url='+encodeURIComponent(url.trim()),{method:'POST',signal:AbortSignal.timeout(55000)});const body=await r.json();if(!r.ok)throw Error(body.error||'수집에 실패했어요.');setData(body);}
    catch(e){setMessage(e instanceof Error && !['TypeError','SyntaxError','TimeoutError'].includes(e.name)?e.message:'연결에 실패했어요. 잠시 후 다시 시도해 주세요.');}
    finally{setBusy('');}
  }
  async function pick(){
    if(!data||busy)return;
    reset();
    try{
      const winners=draw(pool,Number(count));
      const snapshot={title:data.title,demo:data.demo,time:Date.now(),tickets:pool.length,people,weighted,winners};
      setBusy('draw');await new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?0:550));
      setResult(snapshot);
    }catch(e){setMessage(e instanceof Error?e.message:'추첨에 실패했어요.');}finally{setBusy('');}
  }
  async function copy(){if(!result)return;try{await navigator.clipboard.writeText(resultText(result));setMessage('결과를 복사했어요.');}catch{setManual(resultText(result));setMessage('아래 결과를 선택해 복사해 주세요.');}}
  return <><header><nav className="flex items-center justify-between"><a className="brand" href="#home"><b aria-hidden="true">✳</b> PICKIT</a><div className="flex items-center gap-4"><a href="#help">이용 안내</a><button className="theme" onClick={toggleTheme} aria-label="밝은 화면과 어두운 화면 전환">◐</button></div></nav></header>
    <main id="home"><div className="hero"><span className="eyebrow"><i/> PICKIT BETA · YOUTUBE</span><h1>댓글 추첨,<br/>가장 간단하게<span>.</span></h1><p>영상 링크 하나로 이벤트 당첨자를 뽑아보세요.</p></div>
    <section><div className="platform"><strong>▶ YouTube</strong><small>Instagram · 준비 중</small></div>
    {offline ? <p>오프라인 베타예요. 아래 ‘데모 체험’을 눌러 가상 댓글로 추첨해 보세요. 실제 영상은 서버 버전에서 연결할 수 있어요.</p> : <form onSubmit={e=>{e.preventDefault();void load();}}><label htmlFor="url">유튜브 영상 링크</label><div className="inputrow"><input id="url" type="text" inputMode="url" autoComplete="off" placeholder="유튜브 영상 또는 Shorts 링크 붙여넣기" maxLength={2048} value={url} disabled={!!busy} onChange={e=>{setUrl(e.target.value);setData(null);reset();}} required/><button className="primary" disabled={!!busy}>{busy==='load'?'수집 중…':'댓글 불러오기'}</button></div></form>}
    <div className="foot"><span>공개 최상위 댓글만 수집 · 답글 제외</span><button disabled={!!busy} onClick={()=>{reset();setUrl('');setData(demo());}}>데모 체험 ↗</button></div></section>
    {data&&<section><small>{data.demo?'데모 데이터 · 가상 댓글':'YouTube · 수집 완료'}　{new Date(data.collectedAt).toLocaleTimeString('ko-KR')}</small><h2>{data.title}</h2><p>{data.owner} · 최상위 댓글 {data.fetched}개 · 채널 ID 미확인 {data.skipped}개 제외</p>
    <CommentList key={data.collectedAt} entries={data.entries}/>
    <fieldset disabled={!!busy}><legend>추첨 조건</legend><div className="settings"><label>당첨자 수<input type="number" min="1" max="50" value={count} onChange={e=>{reset();setCount(e.target.value);}}/></label></div>
    <label className="check"><input type="checkbox" checked={weighted} onChange={e=>{reset();setWeighted(e.target.checked);}}/> 댓글마다 참여 기회 부여</label><p>{weighted?'작성한 댓글이 많을수록 첫 당첨 확률이 높아요.':'채널별 최신 댓글 하나만 참여해요.'} 한 채널은 한 번만 당첨돼요.</p></fieldset>
    <div className="foot"><strong>대상 댓글 {pool.length}개 · {people}명</strong><button className="primary" disabled={!!busy||!people} onClick={pick}>{busy==='draw'?'추첨 중…':result?'다시 추첨':'추첨 시작'}</button></div>{!people&&<p>{data.fetched?'조건에 맞는 참여자가 없어요.':'이 영상에는 공개 최상위 댓글이 없어요.'}</p>}</section>}
    {busy==='draw'&&<div role="status" className="pulse">당첨자를 공개합니다…</div>}
    {result&&<section aria-live="polite"><small>{result.demo?'DEMO · 데모 결과':'PICKIT · 추첨 결과'}</small><h2>당첨자 {result.winners.length}명</h2><p>{new Date(result.time).toLocaleString('ko-KR')} · 대상 댓글 {result.tickets}개 · {result.people}명</p><p>최상위 댓글 · {result.weighted?'댓글마다 1회':'채널마다 1회'} · 중복 당첨 없음</p><ol>{result.winners.map((w,i)=><li key={w.channel}><span className="avatar">{w.avatar?<img alt="" referrerPolicy="no-referrer" src={w.avatar}/>:w.name.slice(0,1)}</span><div><small>당첨 {i+1}</small><h3>{result.demo ? w.name : <a href={'https://www.youtube.com/channel/'+encodeURIComponent(w.channel)} target="_blank" rel="noreferrer">{w.name}</a>}</h3><p>{w.text}</p>{w.link&&<a href={w.link} target="_blank" rel="noreferrer">원본 댓글 ↗</a>}</div></li>)}</ol><div className="actions"><button onClick={copy}>결과 복사</button><button onClick={()=>saveImage(result).catch(()=>setMessage('이미지를 저장할 수 없어요. 결과 복사를 이용해 주세요.'))}>PNG 저장</button><button onClick={reset}>결과 지우기</button></div>{manual&&<textarea aria-label="복사용 결과" readOnly value={manual} onFocus={e=>e.target.select()}/>}</section>}
    {message&&<p role="status" className="notice">{message}</p>}
    <details id="help"><summary>이용 안내</summary><p>일반 영상, Shorts, 모바일·공유 링크를 지원해요. 한 영상당 최대 10페이지(1,000개)까지 수집하며 한도를 넘으면 추첨을 중단해요. 수집 중 새 댓글이 달리거나 삭제되면 목록이 달라질 수 있어요.</p><p>추첨 결과는 현재 화면에만 유지돼요. 새로고침하거나 다시 추첨하기 전에 필요한 결과를 저장해 주세요. PNG는 긴 댓글을 요약 표시하며 복사는 전문을 담아요.</p></details>
    </main><footer>PICKIT <span>댓글 랜덤 추첨기</span></footer></>;
}

function CommentList({entries}:{entries:Entry[]}) {
  const [page,setPage]=useState(0);
  const size=10;
  if(!entries.length)return null;
  return <details>
    <summary>참여 가능한 댓글 읽기 ({entries.length}개)</summary>
    <ul>{entries.slice(page*size,(page+1)*size).map(entry=>
      <li key={entry.id}><div><strong>{entry.name}</strong><p>{entry.text}</p></div></li>
    )}</ul>
    {entries.length>size&&<div className="actions">
      <button disabled={page===0} onClick={()=>setPage(page-1)}>이전</button>
      <span>{page+1} / {Math.ceil(entries.length/size)}</span>
      <button disabled={(page+1)*size>=entries.length} onClick={()=>setPage(page+1)}>다음</button>
    </div>}
  </details>;
}
