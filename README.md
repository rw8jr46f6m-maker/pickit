# PICKIT 베타 1

설치 없이 체험하려면 이 브랜치의 성공한 GitHub Actions 검사에서 PICKIT-Beta 압축 파일을 받아 풀고 PICKIT-Beta.html을 브라우저로 여세요. 데모 체험 → 추첨 시작으로 가상 댓글을 추첨할 수 있습니다. 오프라인 파일은 외부 요청을 보내지 않습니다. 실영상 테스트는 아래의 Next.js 서버에서 진행합니다.

Node.js 22.13 이상. 이 디렉터리에서 npm install, npm test, npm run typecheck, npm run build 순으로 실행하세요. 개발 화면은 npm run dev 후 http://localhost:3000 에서 확인합니다. 첫 설치 시 생성된 package-lock.json을 Git에 포함하세요.

## 실제 댓글
Google Cloud 프로젝트에서 YouTube Data API v3를 사용 설정하고 API 키를 발급하세요. API 제한에서 YouTube Data API v3만 선택합니다. .env.example을 .env.local로 복사하고 YOUTUBE_API_KEY에 입력한 다음 서버를 다시 시작하세요. 키가 없더라도 데모 체험 버튼은 동작합니다. 실제 영상 오류는 데모로 대체하지 않습니다.

## 배포
본인이 정한 새 GitHub 저장소에 소스를 올리고 Vercel에서 Import Project → Next.js를 선택하세요. Production 환경변수에 같은 이름으로 키를 추가한 뒤 배포하세요. Preview는 필요한 경우에만 별도 제한 키를 사용하세요. 키나 .env.local을 커밋하지 마세요. 배포 후 실제 이벤트 영상으로 원본 댓글 이동과 수집 건수를 확인하세요.

## 운영
댓글 100개씩 최대 10페이지, 결과 데이터 2.5MB, 수집 시간 45초. 한도를 넘으면 부분 추첨을 거부합니다. 2분 캐시는 최대 8개 영상이며 다음 요청 때 만료 항목을 정리합니다. 동일 영상의 동시 수집을 합칩니다. IP별 분당 6회, 동시 수집 3개는 서버 인스턴스별 한도입니다. 공개 확장 시 Vercel Firewall의 사이트 전체 규칙과 Google Cloud 쿼터를 함께 설정하세요. 로그에 댓글 또는 키를 직접 기록하지 않습니다. 결과는 브라우저 메모리에만 남습니다.

## 테스트
npm test는 고정한 모의 API 응답으로 검사합니다. 브라우저 검사는 개발 서버를 먼저 켜고 별도 터미널에서 npm install --no-save --package-lock=false playwright, npx playwright install chromium, node tests/browser.mjs 순으로 실행하세요. 390/768/1280px, 테마 변경, 데모 추첨, 복사, PNG 다운로드를 검사합니다.

## 설계
app/api/comments/route.ts 서버 환경변수, 입력 검증, 요청 제한, 캐시
lib/youtube.mjs 공식 API 응답을 공통 Collection 구조로 변환
lib/types.ts 플랫폼과 독립적인 참여자 및 추첨 결과 타입
lib/draw.mjs 채널 ID 기준 참여권 구성, Web Crypto 거절 샘플링, 한 채널당 한 자리
lib/export.ts 텍스트 및 PNG 출력
app/page.tsx 입력, 데모, 조건, 결과. app/globals.css 반응형·테마
tests/ 단위 테스트와 선택형 브라우저 테스트

## 공식 문서
https://developers.google.com/youtube/v3/docs/commentThreads/list
https://developers.google.com/youtube/v3/determine_quota_cost
https://console.cloud.google.com/apis/library/youtube.googleapis.com
https://vercel.com/pricing
