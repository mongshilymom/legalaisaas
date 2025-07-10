// cypress/e2e/login_payment_flow.cy.js

describe('로그인 → 결제 → 플랜 반영 통합 테스트', () => {
  it('사용자가 로그인 후 결제 성공 시 플랜이 반영된다', () => {
    // 1. 로그인 세션 설정 (NextAuth 쿠키 예시)
    cy.setCookie('next-auth.session-token', 'test-user-session-token');

    // 2. 마이페이지 접속 전 플랜 상태 확인
    cy.visit('/mypage');
    cy.contains('현재 플랜: basic').should('exist');

    // 3. 요금제 페이지로 이동하여 프리미엄 결제 버튼 클릭
    cy.visit('/pricing');
    cy.contains('프리미엄 시작하기').click();

    // 4. 결제 성공 페이지로 리디렉션 시뮬레이션
    cy.visit('/success');

    // 5. 플랜 변경 API 자동 호출됨 → 마이페이지에서 다시 확인
    cy.visit('/mypage');
    cy.contains('현재 플랜: premium').should('exist');
  });
});
