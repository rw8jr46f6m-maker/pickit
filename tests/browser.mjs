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
  await page.getByLabel('포함할 키워드').fill('참여');
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
  await context.close();
  console.log('PASS',width);
 }
}finally{await browser.close();}
