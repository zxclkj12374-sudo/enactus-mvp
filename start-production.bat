@echo off
REM Windows 프로덕션 시작 스크립트

echo Starting Enactus MVP Production Build...

REM 환경변수 설정
set NODE_ENV=production

REM 프로덕션 빌드 실행
npm start

pause
