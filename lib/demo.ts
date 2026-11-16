import type {Collection} from './types';
export function demo():Collection {
  const names=['먼지','여름','주노','여름','도토리','소리'];
  const messages=['다음 편도 기대돼요!','참여합니다 🎉','목소리 듣고 바로 알아봤어요','참여 한 번 더!','참여 완료!','오늘도 잘 봤어요'];
  return {platform:'youtube',demo:true,title:'데모 · 퉁퉁칸의 댓글 이벤트',owner:'가상 영상',collectedAt:Date.now(),fetched:6,skipped:0,entries:names.map((name,i)=>({id:String(i),name,channel:'demo-'+name,text:messages[i],avatar:'',link:''}))};
}