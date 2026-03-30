# 프로덕션 배포 가이드

## 1. 빌드 완료 상태
✅ 빌드 완료: `dist/` 폴더에 프로덕션 파일 준비됨

## 2. 프로덕션 배포 방식 선택

### 옵션 A: 자체 서버 배포 (Node.js 서버)
**필요한 것:**
- Node.js 18+ 설치된 서버
- MySQL 데이터베이스
- PM2 또는 Docker

**배포 단계:**
```bash
# 1. 프로덕션 환경변수 설정
cp .env.production .env  # 또는 서버에서 환경변수 설정

# 2. 빌드 파일 업로드
scp -r dist/ user@server:/app/

# 3. 서버에서 실행
cd /app
npm install --production
npm run start
```

### 옵션 B: Docker 배포
**Dockerfile 생성:**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install --production

COPY dist ./dist
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
```

**배포:**
```bash
docker build -t enactus-mvp .
docker run -p 3000:3000 --env-file .env.production enactus-mvp
```

### 옵션 C: Vercel 배포
```bash
npm install -g vercel
vercel deploy --prod
```

### 옵션 D: AWS / Azure / Google Cloud
각 플랫폼별 배포 가이드 참고

## 3. 환경변수 검증 체크리스트

배포 전 반드시 확인:
- [ ] `VITE_APP_ID` - 실제 OAuth 앱 ID 입력
- [ ] `VITE_OAUTH_PORTAL_URL` - HTTPS URL (프로덕션)
- [ ] `JWT_SECRET` - 32자 이상의 강력한 secret
- [ ] `DATABASE_URL` - 프로덕션 MySQL 연결 정보
- [ ] `OAUTH_SERVER_URL` - HTTPS URL (프로덕션)

## 4. 배포 후 확인사항

```bash
# 로그 확인
npm run start

# 상태 확인
curl http://localhost:3000/

# 프로세스 모니터링 (PM2 사용시)
pm2 start dist/index.js --name enactus-mvp
pm2 logs enactus-mvp
```

## 5. 다른 사람과 링크 공유

배포 후 `https://your-domain.com`을 공유하면 누구나 접근 가능합니다:
- ✅ HTTPS 배포된 URL → 누구나 사용 가능
- ❌ `localhost:3000` → 자신의 컴퓨터에서만 가능

## 6. 트러블슈팅

**포트 3000이 이미 사용 중인 경우:**
```bash
npm start -- --port 3001
```

**데이터베이스 연결 오류:**
- DATABASE_URL 확인
- MySQL 서버 실행 확인
- 방화벽 설정 확인

**외부 접근 안 되는 경우:**
- 서버 방화벽/보안그룹 설정 (포트 3000 개방)
- 도메인 DNS 설정 확인
