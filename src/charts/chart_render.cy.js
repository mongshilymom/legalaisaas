// cypress/e2e/chart_render.cy.js

describe('플랜 요약 차트 렌더링 테스트', () => {
  beforeEach(() => {
    cy.visit('/admin/log-dashboard');

    // 관리자 세션 쿠키 설정 (NextAuth 토큰 시뮬레이션)
    cy.setCookie('next-auth.session-token', 'admin-session-token');
  });

  it('플랜 요약 BarChart가 렌더링되고 막대가 존재하는지 확인', () => {
    cy.intercept('GET', '/api/get-plan-change-logs*').as('fetchLogs');

    cy.wait('@fetchLogs');
    cy.get('h2').contains('플랜별 변경 수').should('exist');

    // 차트 영역 내 svg 요소가 존재하는지 확인
    cy.get('svg').should('exist');

    // 막대 그래프의 막대 rect 요소들이 존재하는지 확인
    cy.get('svg').find('rect').its('length').should('be.gte', 1);
  });
});
