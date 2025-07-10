# 환경 변수 설정 가이드

Legal AI SaaS 프로젝트의 환경 변수 설정에 대한 완전한 가이드입니다.

## 🚀 빠른 시작

1. `.env.example` 파일을 `.env.local`로 복사:
```bash
cp .env.example .env.local
```

2. 필수 환경 변수들을 설정하세요 (아래 섹션 참조)

3. 개발 서버를 시작:
```bash
npm run dev
```

## 📋 필수 환경 변수

다음 환경 변수들은 **반드시** 설정해야 합니다:

### 인증 & 보안
- `NEXTAUTH_SECRET` - NextAuth 보안 키 (openssl rand -base64 32로 생성)
- `JWT_SECRET` - JWT 토큰 서명용 키
- `ENCRYPTION_KEY` - 민감한 데이터 암호화용 키

### AI 서비스
- `CLAUDE_API_KEY` - Anthropic Claude API 키
- `OPENAI_API_KEY` - OpenAI API 키 (선택적)

### 결제 처리
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe 공개 키
- `STRIPE_SECRET_KEY` - Stripe 비밀 키

## 🎯 환경별 설정

### 개발 환경 (Development)
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

### 프로덕션 환경 (Production)
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
```

## 🤖 AI 서비스 설정

### Claude API 설정
```bash
CLAUDE_API_KEY=your-claude-api-key-here
CLAUDE_MODEL=claude-3-sonnet-20240229
CLAUDE_MAX_TOKENS=4000
CLAUDE_TEMPERATURE=0.7
```

### Claude 캐시 설정 (성능 최적화)
```bash
CLAUDE_CACHE_ENABLED=true
CLAUDE_CACHE_DEFAULT_TTL=86400000  # 24시간
CLAUDE_CACHE_MAX_SIZE_MB=100
CLAUDE_CACHE_ENABLE_ANALYTICS=true
```

## 💳 Stripe 결제 설정

### 테스트 환경
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### 프로덕션 환경
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📧 이메일 설정

Gmail을 사용하는 경우:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

**중요**: Gmail 2단계 인증이 활성화된 경우 앱 전용 비밀번호를 사용하세요.

## 🗄️ 데이터베이스 설정

### PostgreSQL
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/legal_ai_saas"
```

### MySQL
```bash
DATABASE_URL="mysql://username:password@localhost:3306/legal_ai_saas"
```

## 🔄 Cron 작업 설정

일일 리포트 이메일 자동화:
```bash
CRON_SECRET=your-secure-cron-secret
DAILY_REPORT_TIME=09:00
TIMEZONE=UTC
ENABLE_DAILY_REPORTS=true
```

## 🛠️ 기능 플래그

원하는 기능을 활성화/비활성화할 수 있습니다:
```bash
ENABLE_VOICE_CHAT=true
ENABLE_PDF_ANALYSIS=true
ENABLE_MULTI_LANGUAGE=true
ENABLE_DAILY_REPORTS=true
```

## 🚀 Vercel 배포 설정

GitHub Actions를 통한 자동 배포용:
```bash
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

## 🧪 테스트 환경 설정

Cypress E2E 테스트용:
```bash
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123
CYPRESS_RECORD_KEY=your-cypress-record-key
```

## 📊 캐시 모니터링 설정

Claude 캐시 성능 모니터링:
```bash
CACHE_ALERT_LOW_HIT_RATE=60          # 60% 미만 시 알림
CACHE_ALERT_HIGH_RESPONSE_TIME=5000  # 5초 초과 시 알림
CACHE_ALERT_HIGH_ERROR_RATE=5        # 5% 초과 시 알림
CACHE_ALERT_HIGH_CACHE_SIZE=80       # 80% 초과 시 알림
```

## 🔐 보안 모범 사례

1. **절대 비밀키를 Git에 커밋하지 마세요**
2. **프로덕션과 개발 환경에서 다른 키를 사용하세요**
3. **정기적으로 API 키를 교체하세요**
4. **환경 변수 파일의 권한을 제한하세요** (chmod 600 .env.local)

## 🆘 문제 해결

### 자주 발생하는 문제

1. **Claude API 호출 실패**
   - CLAUDE_API_KEY가 올바르게 설정되었는지 확인
   - API 사용량 한도를 확인

2. **Stripe 결제 실패**
   - 테스트/프로덕션 키가 일치하는지 확인
   - Webhook 엔드포인트가 올바르게 설정되었는지 확인

3. **이메일 발송 실패**
   - SMTP 설정을 확인
   - Gmail 앱 전용 비밀번호 사용 여부 확인

### 환경 변수 검증

애플리케이션 시작 시 필수 환경 변수가 모두 설정되었는지 자동으로 검증합니다. 누락된 변수가 있으면 명확한 오류 메시지를 표시합니다.

## 📞 지원

환경 설정에 문제가 있으면:
1. 이 문서를 다시 확인하세요
2. [GitHub Issues](https://github.com/your-repo/issues)에 문제를 보고하세요
3. 민감한 정보는 절대 포함하지 마세요

## 📝 체크리스트

배포 전 다음 항목들을 확인하세요:

- [ ] 모든 필수 환경 변수가 설정됨
- [ ] API 키들이 올바른 환경(테스트/프로덕션)에 맞게 설정됨
- [ ] 데이터베이스 연결이 작동함
- [ ] 이메일 발송이 작동함
- [ ] Stripe 결제가 작동함
- [ ] Claude API 호출이 작동함
- [ ] 캐시 시스템이 작동함
- [ ] Cron 작업이 설정됨