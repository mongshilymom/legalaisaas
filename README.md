# 🚀 Legal AI SaaS Platform

> 🏆 **엔터프라이즈급 법률 AI SaaS 플랫폼** - Next.js 14 + TypeScript + AI 통합

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mongshilymom/legalaisaas)

## ⚡ 핵심 기능

- 🤖 **AI 법률 상담**: Claude, GPT, Gemini 멀티 AI 통합
- 📄 **계약서 분석**: 실시간 컴플라이언스 검토
- 🌐 **다국어 지원**: 한국어, 영어, 일본어
- 💳 **결제 시스템**: Stripe 통합 구독 모델
- 📊 **대시보드**: 사용량 분석 및 리포팅
- 🔐 **보안**: NextAuth.js 인증 + 권한 관리

## 🏗️ 프로젝트 구조

```
Legal_AI_SaaS/
├── 📁 src/
│   ├── components/     # UI 컴포넌트
│   ├── hooks/         # React 커스텀 훅
│   ├── services/      # 비즈니스 로직 & AI 서비스
│   ├── pages/         # Next.js 페이지 라우팅
│   ├── features/      # 도메인별 기능 모듈
│   ├── types/         # TypeScript 타입 정의
│   └── utils/         # 공통 유틸리티
├── 📁 docs/          # 프로젝트 문서화
├── 📁 data/          # 데이터 파일
└── 📁 scripts/       # 배포/관리 스크립트
```

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone https://github.com/mongshilymom/legalaisaas.git
cd legalaisaas
```

### 2. 의존성 설치
```bash
npm install
# 또는
yarn install
```

### 3. 환경변수 설정
```bash
cp .env.example .env.local
```

필수 환경변수:
```env
NEXTAUTH_SECRET=your_secret_key
OPENAI_API_KEY=your_openai_key
CLAUDE_API_KEY=your_claude_key
STRIPE_SECRET_KEY=your_stripe_key
```

### 4. 개발 서버 실행
```bash
npm run dev
# 또는
yarn dev
```

🌐 **브라우저에서 확인**: [http://localhost:3000](http://localhost:3000)

## 🎯 주요 기능

### 🤖 AI 통합
- **Claude**: 법률 문서 분석 전문
- **GPT-4**: 일반적인 법률 상담
- **Gemini**: 다국어 법률 검토

### 📊 대시보드
- 실시간 사용량 모니터링
- 클릭 이벤트 분석
- 수익 대시보드
- 사용자 행동 분석

### 💳 결제 시스템
- 구독 기반 요금제
- Stripe 보안 결제
- 플랜 변경 기능
- 결제 이력 관리

## 🔧 기술 스택

### Frontend
- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **NextAuth.js** - 인증

### Backend
- **Next.js API Routes** - 서버리스 API
- **Stripe** - 결제 처리
- **Winston** - 로깅 시스템

### AI Services
- **OpenAI GPT-4** - 자연어 처리
- **Anthropic Claude** - 문서 분석
- **Google Gemini** - 다국어 지원

## 📦 배포

### Vercel (추천)
```bash
npm run build
vercel --prod
```

### 수동 배포
```bash
./scripts/deploy.sh
```

## 🤝 기여

1. 포크 생성
2. 피처 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 커밋 (`git commit -m 'Add amazing feature'`)
4. 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 💬 지원

- 📧 **이메일**: support@legalaisaas.com
- 📱 **GitHub Issues**: [이슈 생성](https://github.com/mongshilymom/legalaisaas/issues)
- 📖 **문서**: [docs/README.md](docs/README.md)

---

⭐ **이 프로젝트가 도움이 되었다면 별점을 눌러주세요!**
