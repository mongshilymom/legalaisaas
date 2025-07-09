// cypress/e2e/csv_download.cy.js

describe('관리자 대시보드 CSV 다운로드 테스트', () => {
  beforeEach(() => {
    cy.visit('/admin/log-dashboard');

    // Mock 로그인 세션 (NextAuth + localStorage 등 기반으로 조정)
    cy.setCookie('next-auth.session-token', 'admin-session-token');
  });

  it('CSV 다운로드 버튼 클릭 시 파일 생성되는지 확인', () => {
    cy.intercept('GET', '/api/get-plan-change-logs*').as('fetchLogs');

    // 버튼이 나올 때까지 기다림
    cy.wait('@fetchLogs');
    cy.get('button').contains('📤 CSV 다운로드').click();

    // 다운로드가 일어났는지 확인 (cypress-downloadfile 플러그인 필요)
    const downloadsFolder = Cypress.config('downloadsFolder');
    cy.readFile(`${downloadsFolder}/plan_change_logs.csv`).should('exist');
    cy.readFile(`${downloadsFolder}/plan_change_logs.csv`).then((content) => {
      expect(content).to.include('이메일,이전 플랜,변경된 플랜,변경일');
    });
  });
});
