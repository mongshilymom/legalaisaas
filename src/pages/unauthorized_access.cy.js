// cypress/e2e/unauthorized_access.cy.js

describe('비관리자 접근 차단 테스트', () => {
  it('로그인하지 않은 사용자는 접근 불가 메시지를 본다', () => {
    cy.clearCookies(); // 세션 없음 상태

    cy.visit('/admin/log-dashboard');

    cy.contains('관리자만 접근 가능한 페이지입니다.').should('exist');
  });

  it('일반 유저는 관리자 대시보드 접근이 차단된다', () => {
    // 일반 사용자 세션 설정 (NextAuth 쿠키 예시)
    cy.setCookie('next-auth.session-token', 'user-session-token');

    cy.visit('/admin/log-dashboard');

    cy.contains('관리자만 접근 가능한 페이지입니다.').should('exist');
  });
});
