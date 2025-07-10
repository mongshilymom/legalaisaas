# Email Automation Documentation

## 📧 Email System Overview

The Legal AI SaaS platform includes a comprehensive email automation system that sends daily reports to users based on their plan type, usage patterns, and preferences. The system supports multi-language templates and automated scheduling.

## 🚀 Features

- **Daily Report Automation**: Scheduled daily reports sent via Vercel Cron
- **Multi-language Support**: Korean, Japanese, and English templates
- **Plan-based Personalization**: Different content based on user subscription
- **Usage Analytics**: Track email open rates and user engagement
- **Upgrade Recommendations**: Smart upselling based on usage patterns

## 📋 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel Cron   │───▶│  Daily Report   │───▶│   Email Queue   │
│   (09:00 UTC)   │    │   Generator     │    │   (Nodemailer)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   User Data     │    │   Email         │
                       │   Collection    │    │   Delivery      │
                       └─────────────────┘    └─────────────────┘
```

## 🛠️ Implementation

### 1. Cron Job Configuration

**File**: `vercel.json`
```json
{
  "cron": [
    {
      "path": "/api/cron/daily-send",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule**: Daily at 9:00 AM UTC (configured in environment variables)

### 2. API Routes

#### Daily Report Endpoint
**File**: `src/pages/api/cron/daily-send.ts`

**Features**:
- Fetches user data from database
- Generates personalized email content
- Sends emails via SMTP
- Logs delivery status
- Returns summary statistics

**Authentication**: Bearer token verification using `CRON_SECRET`

#### Manual Report Trigger
**File**: `src/pages/api/report/send.ts`

**Features**:
- Allows authorized users to trigger reports manually
- Useful for testing and debugging
- Requires user authentication

### 3. Email Templates

#### Template Structure
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Daily Legal AI Report</title>
  <style>/* Responsive email styles */</style>
</head>
<body>
  <div class="header"><!-- Company branding --></div>
  <div class="content">
    <p><!-- Personalized greeting --></p>
    <p><!-- Usage statistics --></p>
    <div class="recommendations"><!-- AI recommendations --></div>
    <div class="upgrade-offer"><!-- Upgrade promotion --></div>
  </div>
  <div class="footer"><!-- Company info --></div>
</body>
</html>
```

#### Multi-language Support

**Korean Template**:
```javascript
ko: {
  subject: '일일 법률 AI 리포트',
  greeting: `안녕하세요 ${userName}님,`,
  usageText: `오늘 ${planType} 플랜에서 ${usageCount}회 AI 쿼리를 사용하셨습니다.`,
  recommendationsTitle: '오늘의 추천사항:',
  upgradeText: `${suggestedPlan}으로 업그레이드하고 ${discount}% 할인받으세요!`,
  footer: '감사합니다,<br>Legal AI SaaS 팀'
}
```

**Japanese Template**:
```javascript
ja: {
  subject: '日次法律AIレポート',
  greeting: `こんにちは ${userName}様,`,
  usageText: `本日、${planType}プランで${usageCount}回のAIクエリをご利用いただきました。`,
  recommendationsTitle: '本日の推奨事項:',
  upgradeText: `${suggestedPlan}にアップグレードして${discount}%オフ!`,
  footer: 'よろしくお願いいたします,<br>Legal AI SaaS チーム'
}
```

**English Template**:
```javascript
en: {
  subject: 'Daily Legal AI Report',
  greeting: `Hello ${userName},`,
  usageText: `You have used ${usageCount} AI queries today on your ${planType} plan.`,
  recommendationsTitle: 'Today\'s Recommendations:',
  upgradeText: `Upgrade to ${suggestedPlan} for ${discount}% off!`,
  footer: 'Best regards,<br>Legal AI SaaS Team'
}
```

## ⚙️ Configuration

### Environment Variables

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cron Configuration
CRON_SECRET=your-cron-secret-here
DAILY_REPORT_TIME=09:00
TIMEZONE=UTC
ENABLE_DAILY_REPORTS=true

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### SMTP Setup (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Configure Environment Variables**:
   ```bash
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

## 📊 Email Analytics

### User Data Collection

```javascript
const getUsersForDailyReport = async () => {
  // Fetch users from database
  const users = await prisma.user.findMany({
    where: {
      emailNotifications: true,
      isActive: true
    },
    include: {
      plan: true,
      usageMetrics: true
    }
  });
  
  return users.map(user => ({
    userEmail: user.email,
    userName: user.name,
    usageCount: user.usageMetrics.dailyQueries,
    planType: user.plan.name,
    language: user.preferences.language,
    recommendations: generateRecommendations(user),
    upgradeOffer: generateUpgradeOffer(user)
  }));
};
```

### Personalization Logic

```javascript
const generateRecommendations = (user) => {
  const recommendations = [];
  
  // Usage-based recommendations
  if (user.usageMetrics.dailyQueries > user.plan.queryLimit * 0.8) {
    recommendations.push('Consider upgrading to Pro for unlimited queries');
  }
  
  // Feature-based recommendations
  if (user.plan.name === 'Basic') {
    recommendations.push('Review your contract templates for compliance');
    recommendations.push('Set up automated compliance checks');
  }
  
  return recommendations;
};

const generateUpgradeOffer = (user) => {
  if (user.plan.name === 'Basic' && user.usageMetrics.dailyQueries > 20) {
    return {
      currentPlan: 'Basic',
      suggestedPlan: 'Pro',
      discount: 20
    };
  }
  return null;
};
```

## 🧪 Testing

### Manual Testing

```bash
# Test email sending locally
curl -X POST http://localhost:3000/api/report/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Automated Testing

```javascript
// Cypress E2E test
it('should send daily report email', () => {
  cy.request({
    method: 'POST',
    url: '/api/cron/daily-send',
    headers: {
      'Authorization': `Bearer ${Cypress.env('CRON_SECRET')}`
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.success).to.be.true;
  });
});
```

### Email Preview

```javascript
// Generate email preview for testing
const generateEmailPreview = (userData) => {
  const emailHtml = generateEmailTemplate(userData);
  
  // Save to file for preview
  fs.writeFileSync('./email-preview.html', emailHtml);
  
  return emailHtml;
};
```

## 🔧 Troubleshooting

### Common Issues

1. **SMTP Authentication Failed**
   ```bash
   # Check credentials
   echo $SMTP_USER
   echo $SMTP_PASS
   
   # Test connection
   npm install -g smtp-tester
   smtp-tester $SMTP_HOST $SMTP_PORT $SMTP_USER $SMTP_PASS
   ```

2. **Cron Job Not Running**
   ```bash
   # Check Vercel function logs
   vercel logs
   
   # Test cron endpoint manually
   curl -X POST https://your-app.vercel.app/api/cron/daily-send \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

3. **Email Templates Not Rendering**
   ```bash
   # Check template syntax
   node -e "console.log(require('./email-template.js').template)"
   
   # Validate HTML
   npx html-validate email-template.html
   ```

### Error Handling

```javascript
try {
  await transporter.sendMail(mailOptions);
  console.log(`Email sent successfully to ${user.email}`);
} catch (error) {
  console.error(`Failed to send email to ${user.email}:`, error);
  
  // Log error to monitoring service
  await logEmailError({
    userId: user.id,
    email: user.email,
    error: error.message,
    timestamp: new Date()
  });
}
```

## 📈 Performance Optimization

### Batch Processing

```javascript
const BATCH_SIZE = 50;

const sendEmailsInBatches = async (users) => {
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    
    const emailPromises = batch.map(user => sendEmail(user));
    await Promise.all(emailPromises);
    
    // Add delay between batches to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
```

### Rate Limiting

```javascript
const rateLimiter = {
  tokens: 100,
  refillRate: 10,
  lastRefill: Date.now(),
  
  async acquire() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(100, this.tokens + timePassed * this.refillRate);
    this.lastRefill = now;
    
    if (this.tokens < 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.acquire();
    }
    
    this.tokens--;
  }
};
```

## 🛡️ Security

### Authentication

```javascript
// Verify cron request
if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Data Protection

```javascript
// Sanitize user data
const sanitizeUserData = (user) => {
  return {
    email: user.email,
    name: user.name?.substring(0, 50), // Limit name length
    plan: user.plan?.name || 'Basic',
    // Never include sensitive data like passwords
  };
};
```

## 🔄 Maintenance

### Regular Tasks

1. **Monitor Email Deliverability**
   - Check bounce rates
   - Monitor spam scores
   - Update sender reputation

2. **Update Templates**
   - Refresh design periodically
   - A/B test subject lines
   - Update content based on user feedback

3. **Performance Monitoring**
   - Track email send times
   - Monitor error rates
   - Analyze user engagement

### Backup Strategy

```javascript
// Backup email templates
const backupTemplates = async () => {
  const templates = {
    daily: emailTemplates.daily,
    welcome: emailTemplates.welcome,
    upgrade: emailTemplates.upgrade
  };
  
  await fs.writeFile(
    `./backups/email-templates-${Date.now()}.json`,
    JSON.stringify(templates, null, 2)
  );
};
```

## 📞 Support

For email system issues:

1. **Check Vercel Function logs**
2. **Verify SMTP configuration**
3. **Test email delivery manually**
4. **Review user feedback**
5. **Monitor email analytics**

---

**Note**: This email automation system is designed to be scalable, maintainable, and compliant with email marketing best practices. Regular monitoring and updates are recommended to ensure optimal performance.
