describe('Upgrade Flow E2E Tests', () => {
  beforeEach(() => {
    // Login as basic plan user
    cy.login('basic-user@example.com', 'password123');
    cy.visit('/dashboard');
  });

  it('should display upgrade prompt for basic users', () => {
    cy.get('[data-cy="upgrade-banner"]').should('be.visible');
    cy.contains('업그레이드').should('be.visible');
  });

  it('should navigate to pricing page', () => {
    cy.get('[data-cy="upgrade-button"]').click();
    cy.url().should('include', '/pricing');
  });

  it('should display pricing plans', () => {
    cy.visit('/pricing');
    
    cy.contains('Basic').should('be.visible');
    cy.contains('Pro').should('be.visible');
    cy.contains('Enterprise').should('be.visible');
    
    cy.get('[data-cy="pricing-card"]').should('have.length', 3);
  });

  it('should initiate upgrade to Pro plan', () => {
    cy.visit('/pricing');
    
    cy.get('[data-cy="pro-plan"]').within(() => {
      cy.get('[data-cy="select-plan"]').click();
    });
    
    cy.url().should('include', '/checkout');
    cy.contains('Pro 플랜').should('be.visible');
  });

  it('should complete payment flow', () => {
    cy.visit('/checkout');
    
    // Fill payment information (using test Stripe keys)
    cy.get('[data-cy="card-number"]').type('4242424242424242');
    cy.get('[data-cy="card-expiry"]').type('12/34');
    cy.get('[data-cy="card-cvc"]').type('123');
    cy.get('[data-cy="card-postal"]').type('12345');
    
    cy.get('[data-cy="pay-button"]').click();
    
    // Should redirect to success page
    cy.url().should('include', '/success');
    cy.contains('결제 성공').should('be.visible');
  });

  it('should update user plan after successful payment', () => {
    cy.completeUpgrade('Pro');
    
    cy.visit('/dashboard');
    cy.get('[data-cy="current-plan"]').should('contain', 'Pro');
    cy.get('[data-cy="upgrade-banner"]').should('not.exist');
  });

  it('should handle payment failure', () => {
    cy.visit('/checkout');
    
    // Use a card that will be declined
    cy.get('[data-cy="card-number"]').type('4000000000000002');
    cy.get('[data-cy="card-expiry"]').type('12/34');
    cy.get('[data-cy="card-cvc"]').type('123');
    cy.get('[data-cy="card-postal"]').type('12345');
    
    cy.get('[data-cy="pay-button"]').click();
    
    cy.contains('결제 실패').should('be.visible');
    cy.url().should('include', '/checkout');
  });

  it('should allow plan cancellation', () => {
    cy.completeUpgrade('Pro');
    
    cy.visit('/settings');
    cy.get('[data-cy="cancel-subscription"]').click();
    
    cy.get('[data-cy="confirm-cancel"]').click();
    
    cy.contains('구독 취소').should('be.visible');
  });

  it('should show usage limits for different plans', () => {
    cy.visit('/dashboard');
    
    // Basic plan user should see usage limits
    cy.get('[data-cy="usage-meter"]').should('be.visible');
    cy.contains('10/10 쿼리 사용').should('be.visible');
    
    // Upgrade to Pro
    cy.completeUpgrade('Pro');
    cy.visit('/dashboard');
    
    // Pro plan should have higher limits
    cy.contains('100/100 쿼리 사용').should('be.visible');
  });

  it('should apply discount codes', () => {
    cy.visit('/checkout');
    
    cy.get('[data-cy="discount-code"]').type('SAVE20');
    cy.get('[data-cy="apply-discount"]').click();
    
    cy.contains('20% 할인').should('be.visible');
    cy.get('[data-cy="total-price"]').should('contain', '$24.00'); // Assuming $30 - 20%
  });
});

// Custom command for completing upgrade
Cypress.Commands.add('completeUpgrade', (planName) => {
  cy.visit('/pricing');
  cy.get(`[data-cy="${planName.toLowerCase()}-plan"]`).within(() => {
    cy.get('[data-cy="select-plan"]').click();
  });
  
  // Complete payment with test card
  cy.get('[data-cy="card-number"]').type('4242424242424242');
  cy.get('[data-cy="card-expiry"]').type('12/34');
  cy.get('[data-cy="card-cvc"]').type('123');
  cy.get('[data-cy="card-postal"]').type('12345');
  
  cy.get('[data-cy="pay-button"]').click();
  cy.url().should('include', '/success');
});
