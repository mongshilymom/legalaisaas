// cypress/e2e/login_payment_plan_flow.cy.js

describe('로그인 → 결제 → 요금제 반영 자동 테스트', () => {
  beforeEach(() => {
    // 테스트 전 초기 설정
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('전체 플로우: 로그인 → 결제 → 플랜 반영 테스트', () => {
    // 1. 로그인 프로세스
    cy.visit('/auth/signin');
    
    // 로그인 폼 입력
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // 로그인 성공 확인
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome').should('be.visible');
    
    // 2. 현재 플랜 확인 (기본 플랜)
    cy.visit('/mypage');
    cy.contains('현재 플랜: basic').should('exist');
    
    // 3. 요금제 페이지로 이동
    cy.visit('/pricing');
    cy.contains('프리미엄 시작하기').click();
    
    // 4. 결제 페이지 로드 확인
    cy.url().should('include', '/payment');
    cy.contains('결제 정보').should('be.visible');
    
    // 5. 결제 정보 입력 (테스트 데이터)
    cy.get('input[name="cardNumber"]').type('4242424242424242');
    cy.get('input[name="expiry"]').type('12/25');
    cy.get('input[name="cvc"]').type('123');
    cy.get('input[name="name"]').type('Test User');
    
    // 6. 결제 버튼 클릭
    cy.get('button[type="submit"]').contains('결제하기').click();
    
    // 7. 결제 성공 페이지로 리디렉션 확인
    cy.url().should('include', '/success');
    cy.contains('결제가 완료되었습니다').should('be.visible');
    
    // 8. 플랜 변경 API 호출 확인
    cy.intercept('POST', '/api/save-plan').as('savePlan');
    cy.wait('@savePlan').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
    });
    
    // 9. 마이페이지에서 플랜 변경 확인
    cy.visit('/mypage');
    cy.contains('현재 플랜: premium').should('exist');
    
    // 10. 프리미엄 기능 접근 확인
    cy.visit('/premium-only-page');
    cy.contains('프리미엄 콘텐츠').should('be.visible');
    cy.get('.premium-feature').should('be.visible');
  });

  it('결제 실패 시 플랜 변경 안됨 테스트', () => {
    // 로그인
    cy.setCookie('next-auth.session-token', 'test-user-session-token');
    
    // 기본 플랜 확인
    cy.visit('/mypage');
    cy.contains('현재 플랜: basic').should('exist');
    
    // 결제 페이지로 이동
    cy.visit('/pricing');
    cy.contains('프리미엄 시작하기').click();
    
    // 잘못된 카드 정보 입력 (결제 실패 시뮬레이션)
    cy.get('input[name="cardNumber"]').type('4000000000000002');
    cy.get('input[name="expiry"]').type('12/25');
    cy.get('input[name="cvc"]').type('123');
    cy.get('input[name="name"]').type('Test User');
    
    // 결제 버튼 클릭
    cy.get('button[type="submit"]').contains('결제하기').click();
    
    // 결제 실패 페이지로 리디렉션 확인
    cy.url().should('include', '/cancel');
    cy.contains('결제가 실패했습니다').should('be.visible');
    
    // 플랜이 변경되지 않음 확인
    cy.visit('/mypage');
    cy.contains('현재 플랜: basic').should('exist');
    
    // 프리미엄 페이지 접근 차단 확인
    cy.visit('/premium-only-page');
    cy.contains('권한이 없습니다').should('be.visible');
  });

  it('로그인 없이 결제 시도 시 로그인 페이지로 리디렉션', () => {
    // 로그인 없이 결제 페이지 접속
    cy.visit('/pricing');
    cy.contains('프리미엄 시작하기').click();
    
    // 로그인 페이지로 리디렉션 확인
    cy.url().should('include', '/auth/signin');
    cy.contains('로그인이 필요합니다').should('be.visible');
  });

  it('세션 만료 시 로그아웃 및 플랜 초기화', () => {
    // 로그인 및 프리미엄 플랜 설정
    cy.setCookie('next-auth.session-token', 'test-user-session-token');
    cy.visit('/success');
    
    // 프리미엄 플랜 확인
    cy.visit('/mypage');
    cy.contains('현재 플랜: premium').should('exist');
    
    // 세션 만료 시뮬레이션
    cy.clearCookies();
    
    // 페이지 새로고침
    cy.reload();
    
    // 로그인 페이지로 리디렉션 확인
    cy.url().should('include', '/auth/signin');
    
    // 재로그인 후 플랜 상태 확인
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    cy.visit('/mypage');
    cy.contains('현재 플랜: basic').should('exist');
  });

  it('플랜 변경 로그 기록 확인', () => {
    // 로그인 및 결제 과정
    cy.setCookie('next-auth.session-token', 'test-user-session-token');
    cy.visit('/success');
    
    // 플랜 변경 로그 API 호출 확인
    cy.intercept('POST', '/api/plan-change-log').as('planChangeLog');
    cy.wait('@planChangeLog').then((interception) => {
      expect(interception.request.body).to.have.property('previousPlan', 'basic');
      expect(interception.request.body).to.have.property('newPlan', 'premium');
      expect(interception.response.statusCode).to.equal(200);
    });
    
    // 플랜 변경 기록 페이지 확인
    cy.visit('/mypage');
    cy.contains('플랜 변경 이력').click();
    cy.contains('basic → premium').should('be.visible');
  });

  it('동시 다중 결제 시도 방지', () => {
    cy.setCookie('next-auth.session-token', 'test-user-session-token');
    
    // 첫 번째 결제 시도
    cy.visit('/pricing');
    cy.contains('프리미엄 시작하기').click();
    
    // 두 번째 탭에서 동시 결제 시도
    cy.window().then((win) => {
      win.open('/pricing', '_blank');
    });
    
    // 동시 결제 차단 메시지 확인
    cy.contains('이미 진행 중인 결제가 있습니다').should('be.visible');
  });

  it('API 응답 검증', () => {
    // 결제 성공 API 응답 검증
    cy.intercept('POST', '/api/payment/create-checkout-session', {
      statusCode: 200,
      body: { id: 'test-session-id' }
    }).as('createCheckoutSession');
    
    cy.intercept('POST', '/api/save-plan', {
      statusCode: 200,
      body: { success: true, plan: 'premium' }
    }).as('savePlan');
    
    cy.setCookie('next-auth.session-token', 'test-user-session-token');
    cy.visit('/pricing');
    cy.contains('프리미엄 시작하기').click();
    
    cy.wait('@createCheckoutSession');
    cy.wait('@savePlan');
    
    // API 호출 검증
    cy.get('@createCheckoutSession').should('have.been.calledOnce');
    cy.get('@savePlan').should('have.been.calledOnce');
  });
});