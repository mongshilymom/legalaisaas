# Legal AI SaaS Platform

## 개요
AI 기반 법무 솔루션 플랫폼으로, 계약서 생성, 문서 분석, 컴플라이언스 체크, 법무 상담 등 종합적인 법무 서비스를 제공합니다.

## 주요 기능

### 1. 스마트 계약서 생성
- 업종별 맞춤형 계약서 자동 생성
- 6가지 계약서 유형 지원 (근로계약서, 용역계약서, NDA, 업무협약서, 임대차계약서, 가맹계약서)
- 위험도 분석 및 보호 조항 자동 포함
- 실시간 법령 반영

### 2. AI 문서 분석
- 계약서 위험도 분석
- 불리한 조항 자동 탐지
- 누락된 조항 식별
- 개선 방안 제시

### 3. 컴플라이언스 체크
- 실시간 법적 준수 상태 모니터링
- 개인정보보호법, 근로기준법, 공정거래법, 상법 등 주요 법률 준수 체크
- 종합 컴플라이언스 점수 제공

### 4. AI 법무상담
- 24시간 AI 법무 어시스턴트
- 전문 변호사 수준의 답변
- 실시간 채팅 상담

## 기술 스택

### Frontend
- React.js
- TypeScript
- Tailwind CSS
- Recharts (차트 라이브러리)
- Lucide React (아이콘)

### Backend
- Next.js API Routes
- NextAuth.js (인증)
- Stripe (결제)
- Claude AI (AI 서비스)

### 테스트
- Cypress (E2E 테스트)
- Jest (단위 테스트)

## 프로젝트 구조

```
Legal_AI_SaaS/
├── components/           # 재사용 가능한 컴포넌트
│   ├── ComplianceScore.tsx
│   ├── LanguageSwitcher.tsx
│   ├── LegalChatBot.tsx
│   └── ...
├── pages/               # Next.js 페이지
│   ├── api/            # API 라우트
│   ├── auth/           # 인증 관련 페이지
│   └── payment/        # 결제 관련 페이지
├── services/           # 비즈니스 로직
│   ├── callAI.ts
│   ├── pricing-engine.ts
│   └── ...
├── hooks/              # 커스텀 훅
├── translations/       # 다국어 지원
├── types/             # TypeScript 타입 정의
├── utils/             # 유틸리티 함수
└── test/              # 테스트 파일
```

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp utils/env.example .env.local
```

필요한 환경 변수:
- `NEXT_PUBLIC_STRIPE_KEY`: Stripe 공개 키
- `STRIPE_SECRET_KEY`: Stripe 비밀 키
- `NEXTAUTH_SECRET`: NextAuth 시크릿
- `CLAUDE_API_KEY`: Claude AI API 키

### 3. 개발 서버 실행
```bash
npm run dev
```

## 테스트 실행

### E2E 테스트
```bash
npm run cypress:open
```

### 단위 테스트
```bash
npm run test
```

## 주요 컴포넌트

### LegalAIApp (legal_ai_saas_complete.tsx)
- 메인 애플리케이션 컴포넌트
- 4개 탭으로 구성된 사용자 인터페이스
- 상태 관리 및 API 통신

### ClickLogAnalyzer (ClickLogAnalyzer.tsx)
- 클릭 이벤트 분석 대시보드
- 차트 및 통계 표시
- 로그 파일 파싱 및 시각화

### 테스트 파일
- `login_payment_plan_flow.cy.js`: 로그인→결제→플랜 반영 통합 테스트
- `chart_render.cy.js`: 차트 렌더링 테스트
- `unauthorized_access.cy.js`: 권한 없는 접근 테스트

## 보안 및 인증

### 인증 시스템
- NextAuth.js 기반 인증
- 세션 관리 및 권한 제어
- 프리미엄 기능 접근 제어

### 보안 기능
- 입력 데이터 검증 및 새니타이제이션
- XSS 및 인젝션 공격 방지
- 파일 업로드 제한 (크기, 형식)

## 결제 시스템

### Stripe 통합
- 안전한 결제 처리
- 구독 모델 지원
- 결제 성공/실패 처리

### 요금제
- Basic: 기본 기능
- Premium: 전체 기능 + AI 상담

## 다국어 지원

### 지원 언어
- 한국어 (기본)
- 영어

### 번역 파일
- `translations/translation.ko.json`
- `translations/translation.en.json`

## 성능 최적화

### 캐싱
- AI 응답 캐싱
- 로컬 스토리지 활용

### 오류 처리
- 재시도 로직
- 사용자 친화적 오류 메시지

## 배포

### 환경 설정
1. 프로덕션 환경 변수 설정
2. Stripe 웹훅 설정
3. 도메인 설정

### 배포 스크립트
```bash
npm run build
npm start
```

## 기여 방법

1. 이슈 생성 또는 기존 이슈 확인
2. 기능 브랜치 생성
3. 코드 작성 및 테스트
4. 풀 리퀘스트 제출

## 라이선스

MIT License

## 연락처

- 이메일: support@legal-ai-saas.com
- 문서: https://docs.legal-ai-saas.com
- 이슈 추적: https://github.com/legal-ai-saas/issues