// Custom commands for Legal AI SaaS E2E tests

// Login command
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/auth/signin');
    cy.get('[data-cy="email-input"]').type(email);
    cy.get('[data-cy="password-input"]').type(password);
    cy.get('[data-cy="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });
});

// Admin login command
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@example.com', 'admin123');
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="user-menu"]').click();
  cy.get('[data-cy="logout-button"]').click();
  cy.url().should('include', '/');
});

// Create user command
Cypress.Commands.add('createUser', (userData) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/signup',
    body: userData,
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body;
  });
});

// Upload file command
Cypress.Commands.add('uploadFile', (fileName, fileType = 'application/pdf') => {
  cy.fixture(fileName).then(fileContent => {
    cy.get('input[type="file"]').attachFile({
      fileContent: fileContent,
      fileName: fileName,
      mimeType: fileType,
    });
  });
});

// Wait for AI analysis
Cypress.Commands.add('waitForAnalysis', () => {
  cy.get('[data-cy="analysis-spinner"]').should('be.visible');
  cy.get('[data-cy="analysis-results"]', { timeout: 30000 }).should('be.visible');
  cy.get('[data-cy="analysis-spinner"]').should('not.exist');
});

// Check notification
Cypress.Commands.add('checkNotification', (message, type = 'success') => {
  cy.get(`[data-cy="notification-${type}"]`).should('be.visible').and('contain', message);
});

// Navigate to page
Cypress.Commands.add('navigateTo', (page) => {
  cy.get(`[data-cy="nav-${page}"]`).click();
  cy.url().should('include', `/${page}`);
});

// Select plan
Cypress.Commands.add('selectPlan', (planName) => {
  cy.get(`[data-cy="${planName.toLowerCase()}-plan"]`).within(() => {
    cy.get('[data-cy="select-plan"]').click();
  });
});

// Fill payment form
Cypress.Commands.add('fillPaymentForm', (cardData = {}) => {
  const defaultCard = {
    number: '4242424242424242',
    expiry: '12/34',
    cvc: '123',
    postal: '12345',
  };
  
  const card = { ...defaultCard, ...cardData };
  
  cy.get('[data-cy="card-number"]').type(card.number);
  cy.get('[data-cy="card-expiry"]').type(card.expiry);
  cy.get('[data-cy="card-cvc"]').type(card.cvc);
  cy.get('[data-cy="card-postal"]').type(card.postal);
});

// Complete payment
Cypress.Commands.add('completePayment', () => {
  cy.get('[data-cy="pay-button"]').click();
  cy.url().should('include', '/success');
  cy.contains('결제 성공').should('be.visible');
});

// Seed test data
Cypress.Commands.add('seedTestData', () => {
  cy.request('POST', '/api/test/seed', {
    users: [
      {
        email: 'test@example.com',
        password: 'password123',
        plan: 'basic',
      },
      {
        email: 'pro-user@example.com',
        password: 'password123',
        plan: 'pro',
      },
      {
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
      },
    ],
  });
});

// Clean test data
Cypress.Commands.add('cleanTestData', () => {
  cy.request('DELETE', '/api/test/clean');
});

// Mock AI response
Cypress.Commands.add('mockAIResponse', (responseData) => {
  cy.intercept('POST', '/api/ai/analyze', {
    statusCode: 200,
    body: responseData,
  }).as('mockAnalysis');
});

// Check accessibility
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Take screenshot with timestamp
Cypress.Commands.add('screenshotWithTimestamp', (name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  cy.screenshot(`${name}-${timestamp}`);
});
