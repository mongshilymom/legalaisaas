describe('Contract Analysis E2E Tests', () => {
  beforeEach(() => {
    // Login as authenticated user
    cy.login('test@example.com', 'password123');
    cy.visit('/dashboard');
  });

  it('should upload and analyze contract document', () => {
    cy.get('[data-cy="upload-button"]').click();
    
    // Upload a test PDF file
    cy.fixture('test-contract.pdf').then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent: fileContent.toString(),
        fileName: 'test-contract.pdf',
        mimeType: 'application/pdf'
      });
    });
    
    cy.get('[data-cy="analyze-button"]').click();
    
    // Wait for analysis to complete
    cy.get('[data-cy="analysis-results"]', { timeout: 30000 }).should('be.visible');
    
    // Check that analysis results are displayed
    cy.contains('분석 결과').should('be.visible');
    cy.get('[data-cy="risk-score"]').should('be.visible');
    cy.get('[data-cy="compliance-check"]').should('be.visible');
  });

  it('should display contract risk assessment', () => {
    cy.uploadContract('test-contract.pdf');
    
    cy.get('[data-cy="risk-assessment"]').should('be.visible');
    cy.get('[data-cy="high-risk-items"]').should('exist');
    cy.get('[data-cy="medium-risk-items"]').should('exist');
    cy.get('[data-cy="low-risk-items"]').should('exist');
  });

  it('should show compliance violations', () => {
    cy.uploadContract('non-compliant-contract.pdf');
    
    cy.get('[data-cy="compliance-violations"]').should('be.visible');
    cy.contains('컴플라이언스 위반').should('be.visible');
    cy.get('[data-cy="violation-details"]').should('have.length.at.least', 1);
  });

  it('should allow downloading analysis report', () => {
    cy.uploadContract('test-contract.pdf');
    
    cy.get('[data-cy="download-report"]').click();
    
    // Check that download was triggered
    cy.readFile('cypress/downloads/analysis-report.pdf').should('exist');
  });

  it('should save analysis to history', () => {
    cy.uploadContract('test-contract.pdf');
    
    cy.visit('/history');
    cy.get('[data-cy="analysis-history"]').should('be.visible');
    cy.contains('test-contract.pdf').should('be.visible');
  });

  it('should handle invalid file types', () => {
    cy.get('[data-cy="upload-button"]').click();
    
    cy.fixture('invalid-file.txt').then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent: fileContent.toString(),
        fileName: 'invalid-file.txt',
        mimeType: 'text/plain'
      });
    });
    
    cy.contains('지원되지 않는 파일 형식').should('be.visible');
  });

  it('should handle large file uploads', () => {
    cy.get('[data-cy="upload-button"]').click();
    
    // Test with file larger than limit
    cy.fixture('large-contract.pdf').then(fileContent => {
      cy.get('input[type="file"]').attachFile({
        fileContent: fileContent.toString(),
        fileName: 'large-contract.pdf',
        mimeType: 'application/pdf'
      });
    });
    
    cy.contains('파일 크기가 너무 통니다').should('be.visible');
  });
});

// Custom command for contract upload
Cypress.Commands.add('uploadContract', (fileName) => {
  cy.get('[data-cy="upload-button"]').click();
  cy.fixture(fileName).then(fileContent => {
    cy.get('input[type="file"]').attachFile({
      fileContent: fileContent.toString(),
      fileName: fileName,
      mimeType: 'application/pdf'
    });
  });
  cy.get('[data-cy="analyze-button"]').click();
  cy.get('[data-cy="analysis-results"]', { timeout: 30000 }).should('be.visible');
});
