// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

import 'cypress-file-upload';

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  win.fetch = null;
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Add global before hook
beforeEach(() => {
  // Clear cookies and local storage before each test
  cy.clearCookies();
  cy.clearLocalStorage();
  
  // Set up API interceptors
  cy.intercept('POST', '/api/auth/session', { fixture: 'auth/session.json' }).as('getSession');
  cy.intercept('POST', '/api/auth/signin', { fixture: 'auth/signin.json' }).as('signIn');
  cy.intercept('POST', '/api/payment/create-checkout-session', { fixture: 'payment/checkout.json' }).as('createCheckout');
  cy.intercept('POST', '/api/ai/analyze', { fixture: 'ai/analysis.json' }).as('analyzeContract');
});
