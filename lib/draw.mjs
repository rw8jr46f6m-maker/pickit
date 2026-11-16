/** @param {string} raw */
export function videoId(raw) {
  const match = /^(?:https?:\/\/)?(?:(?:www\.|m\.)?youtube\.com\/(?:watch\?([^#\s]+)|shorts\/([\w-]{11})(?:\/)?(?:\?[^#\s]*)?)|youtu\.be\/([\w-]{11})(?:\/)?(?:\?[^#\s]*)?)(?:#[^\s]*)?$/i.exec(raw.trim());
  if (match) {
    const ids = match[1] ? match[1].split('&').filter(p => p.startsWith('v=')).map(p => p.slice(2)) : [match[2] || match[3]];
    if (ids.length === 1 && /^[\w-]{11}$/.test(ids[0])) return ids[0];
  }
  throw Error('유튜브 영상 또는 Shorts 주소를 확인해 주세요.');
}
/** @param {import('./types').Entry[]} entries @param {boolean} weighted */
export function tickets(entries, weighted) {
  const seen = new Set();
  return entries.filter(c => {
    if (!c.channel || (!weighted && seen.has(c.channel))) return false;
    seen.add(c.channel);
    return true;
  });
}
/** @param {number} size */
export function secureIndex(size) {
  const word = new Uint32Array(1);
  const limit = 2 ** 32 - (2 ** 32 % size);
  do { crypto.getRandomValues(word); } while (word[0] >= limit);
  return word[0] % size;
}
/** @param {import('./types').Entry[]} pool @param {number} count */
export function draw(pool, count, choose = secureIndex) {
  const people = new Set(pool.map(c => c.channel)).size;
  if (!Number.isInteger(count) || count < 1 || count > Math.min(50, people)) throw Error('당첨자 수는 참여자 수 이내에서 1~50명으로 설정해 주세요.');
  let left = pool;
  const winners = [];
  while (winners.length < count) {
    const winner = left[choose(left.length)];
    winners.push(winner);
    left = left.filter(c => c.channel !== winner.channel);
  }
  return winners;
}