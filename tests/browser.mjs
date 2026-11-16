// Run after starting npm run dev. Browser-only development dependency.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
 for(const width of [390,768,1280]){
  const context=await browser.newContext({viewport:{width,height:850},colorScheme:'dark',permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();
  await page.goto('http://localhost:3000');
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).colorScheme),'dark');
  await page.getByRole('button',{name:'밝은 화면과 어두운 화면 전환'}).click();
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
  await page.getByRole('button',{name:'데모 체험'}).click();
  assert.equal(await page.getByLabel('포함할 키워드').count(),0);
  await page.getByLabel('댓글마다 참여 기회 부여').check();
  await page.getByLabel('당첨자 수').fill('2');
  await page.getByRole('button',{name:'추첨 시작'}).click();
  await page.getByRole('heading',{name:'당첨자 2명'}).waitFor();
  assert.equal(await page.locator('ol li').count(),2);
  await page.getByRole('button',{name:'결과 복사'}).click();
  await page.getByText('결과를 복사했어요.').waitFor();
  assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/데모 추첨/);
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'PNG 저장'}).click();
  const file=await download;
  assert.match(file.suggestedFilename(),/\.png$/);
  assert.equal(await file.failure(),null);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const url='https://youtu.be/abcDEF12_-3';
  const entry={id:'sample',channel:'channel-A',name:'테스트 작성자',text:'첫 영상부터 잘 봤어요!',link:url+'&lc=sample',avatar:''};
  await page.route('**/api/comments?*',route=>{
    assert.equal(new URL(route.request().url()).searchParams.get('url'),url);
    return route.fulfill({json:{demo:false,platform:'youtube',title:'테스트 영상',owner:'채널',entries:[entry],fetched:1,skipped:0,collectedAt:Date.now()}});
  });
  await page.getByLabel('유튜브 영상 링크').fill(url);
  await page.getByRole('button',{name:'댓글 불러오기'}).click();
  await page.getByText(/참여 가능한 댓글 읽기/).click();
  await page.locator('ul').getByText(entry.text).waitFor();
  await page.getByLabel('당첨자 수').fill('1');
  await page.getByRole('button',{name:'추첨 시작'}).click();
  const winner=page.locator('ol li');
  await winner.getByText(entry.text,{exact:true}).waitFor();
  assert.equal(await winner.getByRole('link',{name:entry.name}).getAttribute('href'),'https://www.youtube.com/channel/channel-A');
  assert.equal(await winner.getByRole('link',{name:'원본 댓글'}).getAttribute('href'),entry.link);
  await context.close();
  console.log('PASS',width);
 }
}finally{await browser.close();}
