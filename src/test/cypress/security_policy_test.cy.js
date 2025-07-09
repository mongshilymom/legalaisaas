// cypress/e2e/security_policy_test.cy.js

describe('인증/보안 정책 테스트', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('인증 시스템 테스트', () => {
    it('유효하지 않은 자격 증명으로 로그인 시도 시 실패', () => {
      cy.visit('/auth/signin');
      
      // 잘못된 이메일/패스워드 입력
      cy.get('input[name="email"]').type('invalid@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      // 로그인 실패 확인
      cy.contains('로그인 실패').should('be.visible');
      cy.url().should('include', '/auth/signin');
    });

    it('올바른 자격 증명으로 로그인 성공', () => {
      cy.visit('/auth/signin');
      
      // 올바른 이메일/패스워드 입력
      cy.get('input[name="email"]').type('admin@example.com');
      cy.get('input[name="password"]').type('1234');
      cy.get('button[type="submit"]').click();
      
      // 로그인 성공 확인
      cy.url().should('include', '/dashboard');
      cy.contains('환영합니다').should('be.visible');
    });

    it('세션 만료 시 자동 로그아웃', () => {
      // 로그인
      cy.visit('/auth/signin');
      cy.get('input[name="email"]').type('admin@example.com');
      cy.get('input[name="password"]').type('1234');
      cy.get('button[type="submit"]').click();
      
      // 세션 쿠키 삭제 (세션 만료 시뮬레이션)
      cy.clearCookies();
      
      // 보호된 페이지 접근 시도
      cy.visit('/premium-only-page');
      
      // 로그인 페이지로 리디렉션 확인
      cy.url().should('include', '/auth/signin');
      cy.contains('로그인이 필요합니다').should('be.visible');
    });
  });

  describe('권한 제어 테스트', () => {
    it('로그인 없이 보호된 페이지 접근 차단', () => {
      const protectedPages = [
        '/premium-only-page',
        '/protected-page',
        '/mypage'
      ];

      protectedPages.forEach(page => {
        cy.visit(page);
        cy.url().should('include', '/auth/signin');
        cy.contains('로그인이 필요합니다').should('be.visible');
      });
    });

    it('기본 플랜 사용자의 프리미엄 기능 접근 차단', () => {
      // 기본 플랜으로 로그인
      cy.setCookie('next-auth.session-token', 'basic-plan-user-token');
      
      // 프리미엄 기능 접근 시도
      cy.visit('/premium-only-page');
      
      // 권한 없음 메시지 확인
      cy.contains('프리미엄 플랜이 필요합니다').should('be.visible');
      cy.contains('업그레이드').should('be.visible');
    });

    it('프리미엄 플랜 사용자의 모든 기능 접근 허용', () => {
      // 프리미엄 플랜으로 로그인
      cy.setCookie('next-auth.session-token', 'premium-plan-user-token');
      
      // 프리미엄 기능 접근
      cy.visit('/premium-only-page');
      
      // 프리미엄 콘텐츠 확인
      cy.contains('프리미엄 기능').should('be.visible');
      cy.get('.premium-feature').should('be.visible');
    });
  });

  describe('입력 데이터 검증 테스트', () => {
    beforeEach(() => {
      // 테스트용 로그인
      cy.setCookie('next-auth.session-token', 'test-user-session-token');
    });

    it('XSS 공격 방지 - 스크립트 태그 입력', () => {
      cy.visit('/');
      
      // 악성 스크립트 입력 시도
      const maliciousScript = '<script>alert("XSS")</script>';
      
      cy.get('input[name="companyName"]').type(maliciousScript);
      cy.get('button').contains('AI 계약서 생성하기').click();
      
      // 스크립트가 실행되지 않음 확인
      cy.window().then((win) => {
        expect(win.console.error).to.not.have.been.called;
      });
      
      // 새니타이즈된 텍스트 확인
      cy.get('input[name="companyName"]').should('not.contain', '<script>');
    });

    it('SQL 인젝션 방지 - 특수 문자 입력', () => {
      cy.visit('/');
      
      // SQL 인젝션 시도
      const sqlInjection = "'; DROP TABLE users; --";
      
      cy.get('input[name="companyName"]').type(sqlInjection);
      cy.get('button').contains('AI 계약서 생성하기').click();
      
      // 오류 없이 처리됨 확인
      cy.contains('오류가 발생했습니다').should('not.exist');
    });

    it('파일 업로드 보안 검증', () => {
      cy.visit('/');
      cy.get('nav').contains('AI 문서 분석').click();
      
      // 허용되지 않은 파일 형식 업로드 시도
      cy.fixture('malicious_file.exe').then(fileContent => {
        cy.get('input[type="file"]').attachFile({
          fileContent: fileContent.toString(),
          fileName: 'malicious.exe',
          mimeType: 'application/octet-stream'
        });
      });
      
      // 파일 형식 오류 메시지 확인
      cy.contains('PDF, DOCX, TXT 파일만 업로드 가능합니다').should('be.visible');
    });

    it('파일 크기 제한 검증', () => {
      cy.visit('/');
      cy.get('nav').contains('AI 문서 분석').click();
      
      // 큰 파일 업로드 시도 (10MB 초과)
      const largeFile = new Array(11 * 1024 * 1024).fill('a').join('');
      
      cy.get('input[type="file"]').attachFile({
        fileContent: largeFile,
        fileName: 'large_file.pdf',
        mimeType: 'application/pdf'
      });
      
      // 파일 크기 오류 메시지 확인
      cy.contains('파일 크기는 10MB를 초과할 수 없습니다').should('be.visible');
    });
  });

  describe('API 보안 테스트', () => {
    it('인증 없이 API 호출 시 401 오류', () => {
      cy.request({
        method: 'POST',
        url: '/api/save-plan',
        failOnStatusCode: false,
        body: { plan: 'premium' }
      }).then((response) => {
        expect(response.status).to.eq(401);
      });
    });

    it('CSRF 토큰 검증', () => {
      cy.setCookie('next-auth.session-token', 'test-user-session-token');
      
      // CSRF 토큰 없이 요청
      cy.request({
        method: 'POST',
        url: '/api/save-plan',
        failOnStatusCode: false,
        body: { plan: 'premium' }
      }).then((response) => {
        expect(response.status).to.eq(403);
      });
    });

    it('Rate Limiting 검증', () => {
      cy.setCookie('next-auth.session-token', 'test-user-session-token');
      
      // 연속 요청으로 Rate Limit 테스트
      for (let i = 0; i < 100; i++) {
        cy.request({
          method: 'POST',
          url: '/api/create-checkout-session',
          failOnStatusCode: false,
          body: { contractType: 'employment' }
        }).then((response) => {
          if (i > 50) {
            expect(response.status).to.eq(429); // Too Many Requests
          }
        });
      }
    });
  });

  describe('세션 관리 테스트', () => {
    it('동시 로그인 제한', () => {
      // 첫 번째 세션 로그인
      cy.visit('/auth/signin');
      cy.get('input[name="email"]').type('admin@example.com');
      cy.get('input[name="password"]').type('1234');
      cy.get('button[type="submit"]').click();
      
      cy.getCookie('next-auth.session-token').should('exist');
      
      // 두 번째 창에서 동일 사용자 로그인 시도
      cy.window().then((win) => {
        const newWindow = win.open('/auth/signin', '_blank');
        
        cy.wrap(newWindow).within(() => {
          cy.get('input[name="email"]').type('admin@example.com');
          cy.get('input[name="password"]').type('1234');
          cy.get('button[type="submit"]').click();
          
          // 첫 번째 세션 무효화 확인
          cy.contains('다른 위치에서 로그인되었습니다').should('be.visible');
        });
      });
    });

    it('비정상적인 세션 활동 탐지', () => {
      cy.setCookie('next-auth.session-token', 'test-user-session-token');
      
      // 비정상적인 IP에서 접근 시뮬레이션
      cy.request({
        method: 'GET',
        url: '/api/user/profile',
        headers: {
          'X-Forwarded-For': '192.168.1.100'
        }
      }).then(() => {
        // 보안 알림 확인
        cy.visit('/mypage');
        cy.contains('새로운 위치에서 로그인이 감지되었습니다').should('be.visible');
      });
    });
  });

  describe('데이터 보호 테스트', () => {
    it('민감한 정보 마스킹', () => {
      cy.setCookie('next-auth.session-token', 'test-user-session-token');
      cy.visit('/mypage');
      
      // 개인정보가 마스킹되어 표시됨 확인
      cy.contains('admin@example.com').should('not.exist');
      cy.contains('ad***@example.com').should('be.visible');
    });

    it('로그에 민감한 정보 기록되지 않음', () => {
      cy.visit('/auth/signin');
      cy.get('input[name="email"]').type('admin@example.com');
      cy.get('input[name="password"]').type('1234');
      cy.get('button[type="submit"]').click();
      
      // 브라우저 콘솔에 민감한 정보 없음 확인
      cy.window().then((win) => {
        const logs = win.console.log.calls?.all() || [];
        logs.forEach(log => {
          expect(log.args.join(' ')).to.not.include('1234');
          expect(log.args.join(' ')).to.not.include('admin@example.com');
        });
      });
    });
  });

  describe('보안 헤더 테스트', () => {
    it('보안 헤더 존재 확인', () => {
      cy.visit('/');
      
      cy.window().then((win) => {
        const headers = win.document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
        expect(headers).to.exist;
        
        const csp = win.document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        expect(csp).to.exist;
      });
    });

    it('HTTPS 리디렉션 확인', () => {
      // HTTP로 접근 시 HTTPS로 리디렉션
      cy.request({
        method: 'GET',
        url: 'http://localhost:3000',
        followRedirect: false
      }).then((response) => {
        expect(response.status).to.eq(301);
        expect(response.headers.location).to.include('https://');
      });
    });
  });

  describe('결제 보안 테스트', () => {
    it('결제 정보 암호화 확인', () => {
      cy.setCookie('next-auth.session-token', 'test-user-session-token');
      cy.visit('/pricing');
      cy.contains('프리미엄 시작하기').click();
      
      // 결제 페이지에서 SSL 확인
      cy.url().should('include', 'https://');
      
      // 카드 정보 입력 필드 보안 확인
      cy.get('input[name="cardNumber"]').should('have.attr', 'type', 'password');
      cy.get('form').should('have.attr', 'autocomplete', 'off');
    });

    it('결제 토큰 검증', () => {
      cy.setCookie('next-auth.session-token', 'test-user-session-token');
      
      // 유효하지 않은 토큰으로 결제 시도
      cy.request({
        method: 'POST',
        url: '/api/payment/process',
        failOnStatusCode: false,
        body: { 
          paymentToken: 'invalid_token',
          amount: 199000
        }
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.error).to.include('Invalid payment token');
      });
    });
  });

  describe('감사 로그 테스트', () => {
    it('로그인 시도 기록', () => {
      cy.visit('/auth/signin');
      cy.get('input[name="email"]').type('admin@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      // 감사 로그 API 호출 확인
      cy.intercept('POST', '/api/audit/log').as('auditLog');
      cy.wait('@auditLog').then((interception) => {
        expect(interception.request.body).to.have.property('action', 'login_attempt');
        expect(interception.request.body).to.have.property('success', false);
      });
    });

    it('민감한 작업 로그 기록', () => {
      cy.setCookie('next-auth.session-token', 'test-user-session-token');
      cy.visit('/success'); // 플랜 변경 페이지
      
      // 플랜 변경 감사 로그 확인
      cy.intercept('POST', '/api/audit/log').as('auditLog');
      cy.wait('@auditLog').then((interception) => {
        expect(interception.request.body).to.have.property('action', 'plan_change');
        expect(interception.request.body).to.have.property('userId');
      });
    });
  });
});