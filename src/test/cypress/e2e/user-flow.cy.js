describe('User Flow E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display landing page correctly', () => {
    cy.contains('Legal AI SaaS').should('be.visible');
    cy.contains('법률 자동화의 미래').should('be.visible');
    cy.get('[data-cy="cta-button"]').should('be.visible');
  });

  it('should navigate to signup page', () => {
    cy.contains('무료 체험').click();
    cy.url().should('include', '/auth/signup');
  });

  it('should navigate to login page', () => {
    cy.contains('로그인').click();
    cy.url().should('include', '/auth/signin');
  });

  it('should handle email signup form', () => {
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('button[type="submit"]').click();
    // Add assertion for success message or redirect
  });

  it('should display features section', () => {
    cy.contains('빠른 분석').should('be.visible');
    cy.contains('컴플라이언스 보장').should('be.visible');
    cy.contains('다국가 지원').should('be.visible');
  });

  it('should display testimonials', () => {
    cy.contains('고객 후기').should('be.visible');
    cy.get('[data-cy="testimonial"]').should('have.length.at.least', 3);
  });

  it('should display footer with all links', () => {
    cy.get('footer').should('be.visible');
    cy.contains('서비스').should('be.visible');
    cy.contains('지원').should('be.visible');
    cy.contains('회사').should('be.visible');
  });

  it('should be responsive on mobile', () => {
    cy.viewport('iphone-6');
    cy.contains('Legal AI SaaS').should('be.visible');
    cy.get('[data-cy="mobile-menu"]').should('be.visible');
  });
});
