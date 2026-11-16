export class Problem extends Error {
  /** @param {number} status @param {string} message */
  constructor(status, message) { super(message); this.status = status; }
}
export function googleError(status, reason) {
  if (['dailyLimitExceeded','quotaExceeded'].includes(reason)) return new Problem(503,'오늘의 YouTube API 할당량을 모두 사용했어요.');
  if (reason === 'commentsDisabled') return new Problem(403,'이 영상은 댓글이 비활성화되어 있어요.');
  if (status === 404 || reason === 'videoNotFound') return new Problem(404,'영상을 찾을 수 없어요. 삭제되었거나 비공개일 수 있어요.');
  if (status === 429 || reason === 'rateLimitExceeded') return new Problem(429,'YouTube 요청이 몰렸어요. 잠시 후 다시 시도해 주세요.');
  return new Problem(502,'YouTube 요청에 실패했어요. 잠시 후 다시 시도하거나 운영자에게 알려 주세요.');
}
export async function collect(id, request) {
  const video = (await request('videos',{id,part:'snippet',fields:'items(snippet(title,channelTitle))'})).items?.[0];
  if (!video) throw googleError(404,'videoNotFound');
  const entries = [], ids = new Set(), tokens = new Set();
  let token = '', skipped = 0, bytes = 0;
  do {
    if (tokens.has(token) || tokens.size >= 10) throw new Problem(422,'수집 한도(10페이지)를 넘었거나 페이지가 반복됐어요. 일부 댓글만으로는 추첨할 수 없어요.');
    tokens.add(token);
    const page = await request('commentThreads',{videoId:id, part:'snippet',textFormat:'plainText',maxResults:'100',order:'time',...(token ? {pageToken:token} : {}),fields:'nextPageToken,items(snippet(topLevelComment(id,snippet(authorChannelId,authorDisplayName,authorProfileImageUrl,textDisplay))))'});
    if (!Array.isArray(page.items)) throw new Problem(502,'댓글 응답을 읽을 수 없어요.');
    for (const item of page.items) {
      const c = item.snippet.topLevelComment;
      if (ids.has(c.id)) continue;
      ids.add(c.id);
      const s = c.snippet;
      if (!s.authorChannelId?.value) { skipped++; continue; }
      const entry = {id:c.id, channel:s.authorChannelId.value,name:s.authorDisplayName,text:s.textDisplay, avatar:s.authorProfileImageUrl || '',link:'https://www.youtube.com/watch?v='+id+'&lc='+encodeURIComponent(c.id)};
      bytes += new TextEncoder().encode(JSON.stringify(entry)).length;
      if (bytes > 2500000) throw new Problem(422,'댓글 데이터가 2.5MB 한도를 넘어 추첨을 중단했어요.');
      entries.push(entry);
    }
    token = page.nextPageToken;
  } while(token);
  return {platform:'youtube',title:video.snippet.title,owner:video.snippet.channelTitle,demo:false,entries,fetched:ids.size,skipped,collectedAt:Date.now()};
}