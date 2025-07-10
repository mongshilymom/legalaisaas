import { GrowthData } from '../logs/growthTracker';

export interface GrowthEmailData {
  growthStats: GrowthData;
  dailyMetrics: {
    totalLogins: number;
    documentsGenerated: number;
    newSignups: number;
    paymentSuccessRate: number;
    topModel: string;
    topModelUsage: number;
  };
  comparisonData: {
    usersGrowthRate: string;
    revenueGrowthRate: string;
    activeUsersRate: string;
  };
  recipients: string[];
  language: 'ko' | 'en';
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function getTranslations(language: 'ko' | 'en') {
  const translations = {
    ko: {
      subject: '📊 Legal AI SaaS - 일일 성장 리포트',
      title: 'Legal AI SaaS 일일 성장 리포트',
      subtitle: '운영진을 위한 핵심 지표 요약',
      overview: '📈 성장 개요',
      keyMetrics: '🔑 핵심 지표',
      userMetrics: '👥 사용자 지표',
      paymentMetrics: '💳 결제 지표',
      aiUsage: '🤖 AI 사용량',
      geographic: '🌍 지역별 현황',
      totalUsers: '총 사용자',
      newUsers: '신규 사용자',
      activeUsers: '활성 사용자',
      retentionRate: '리텐션율',
      totalRevenue: '총 수익',
      conversionRate: '전환율',
      paymentSuccess: '결제 성공률',
      aiCalls: 'AI 호출 수',
      topModel: '인기 모델',
      documentsGenerated: '생성된 문서',
      totalLogins: '총 로그인',
      usersGrowthRate: '사용자 증가율',
      revenueGrowthRate: '수익 증가율',
      activeUsersRate: '활성 사용자율',
      breakdown: '세부 분석',
      planDistribution: '플랜 분포',
      modelUsage: '모델 사용량',
      countryStats: '국가별 통계',
      actionItems: '💡 액션 아이템',
      actionItem1: '신규 사용자 온보딩 개선 필요',
      actionItem2: '결제 실패율 모니터링 강화',
      actionItem3: '인기 모델 성능 최적화',
      footer: '이 리포트는 매일 자동으로 생성됩니다.',
      viewDashboard: '상세 대시보드 보기',
      generatedAt: '생성 시각',
      contactInfo: '문의사항이 있으시면 개발팀에 연락하세요.',
    },
    en: {
      subject: '📊 Legal AI SaaS - Daily Growth Report',
      title: 'Legal AI SaaS Daily Growth Report',
      subtitle: 'Key Metrics Summary for Operations Team',
      overview: '📈 Growth Overview',
      keyMetrics: '🔑 Key Metrics',
      userMetrics: '👥 User Metrics',
      paymentMetrics: '💳 Payment Metrics',
      aiUsage: '🤖 AI Usage',
      geographic: '🌍 Geographic Overview',
      totalUsers: 'Total Users',
      newUsers: 'New Users',
      activeUsers: 'Active Users',
      retentionRate: 'Retention Rate',
      totalRevenue: 'Total Revenue',
      conversionRate: 'Conversion Rate',
      paymentSuccess: 'Payment Success Rate',
      aiCalls: 'AI Calls',
      topModel: 'Top Model',
      documentsGenerated: 'Documents Generated',
      totalLogins: 'Total Logins',
      usersGrowthRate: 'User Growth Rate',
      revenueGrowthRate: 'Revenue Growth Rate',
      activeUsersRate: 'Active User Rate',
      breakdown: 'Detailed Breakdown',
      planDistribution: 'Plan Distribution',
      modelUsage: 'Model Usage',
      countryStats: 'Country Statistics',
      actionItems: '💡 Action Items',
      actionItem1: 'Improve new user onboarding experience',
      actionItem2: 'Monitor payment failure rates closely',
      actionItem3: 'Optimize performance of popular models',
      footer: 'This report is automatically generated daily.',
      viewDashboard: 'View Detailed Dashboard',
      generatedAt: 'Generated at',
      contactInfo: 'Contact the development team for any questions.',
    }
  };
  
  return translations[language];
}

export function generateGrowthEmailTemplate(data: GrowthEmailData): EmailTemplate {
  const t = getTranslations(data.language);
  const { growthStats, dailyMetrics, comparisonData } = data;
  
  const currentDate = new Date().toLocaleDateString(data.language === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const html = `
<!DOCTYPE html>
<html lang="${data.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.subject}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 32px 24px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .date-info {
            background-color: #f1f5f9;
            padding: 16px 24px;
            border-left: 4px solid #3b82f6;
            margin: 0;
        }
        
        .content {
            padding: 24px;
        }
        
        .section {
            margin-bottom: 32px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .metric-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            text-align: center;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 4px;
        }
        
        .metric-label {
            font-size: 14px;
            color: #64748b;
            font-weight: 500;
        }
        
        .metric-change {
            font-size: 12px;
            margin-top: 4px;
            padding: 2px 8px;
            border-radius: 12px;
            display: inline-block;
        }
        
        .metric-change.positive {
            background-color: #dcfce7;
            color: #166534;
        }
        
        .metric-change.negative {
            background-color: #fee2e2;
            color: #991b1b;
        }
        
        .breakdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .breakdown-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
        }
        
        .breakdown-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 12px;
        }
        
        .breakdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        
        .breakdown-item:last-child {
            border-bottom: none;
        }
        
        .breakdown-label {
            font-size: 14px;
            color: #475569;
        }
        
        .breakdown-value {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
        }
        
        .action-items {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
        }
        
        .action-items ul {
            list-style: none;
            padding-left: 0;
        }
        
        .action-items li {
            padding: 4px 0;
            color: #92400e;
        }
        
        .action-items li:before {
            content: "→ ";
            font-weight: bold;
        }
        
        .cta-section {
            text-align: center;
            padding: 24px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
        }
        
        .cta-button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        .footer {
            background: #1e293b;
            color: white;
            padding: 24px;
            text-align: center;
            font-size: 14px;
        }
        
        .footer p {
            margin-bottom: 8px;
        }
        
        @media (max-width: 600px) {
            .metrics-grid {
                grid-template-columns: 1fr;
            }
            
            .breakdown-grid {
                grid-template-columns: 1fr;
            }
            
            .container {
                margin: 0;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${t.title}</h1>
            <p>${t.subtitle}</p>
        </div>
        
        <div class="date-info">
            <strong>${currentDate}</strong> • ${t.generatedAt}: ${new Date().toLocaleTimeString()}
        </div>
        
        <div class="content">
            <!-- Key Metrics Section -->
            <div class="section">
                <h2 class="section-title">${t.keyMetrics}</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${growthStats.userGrowth.totalUsers.toLocaleString()}</div>
                        <div class="metric-label">${t.totalUsers}</div>
                        <div class="metric-change positive">+${comparisonData.usersGrowthRate}</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value">${growthStats.userGrowth.recentUsers}</div>
                        <div class="metric-label">${t.newUsers} (7${data.language === 'ko' ? '일' : ' days'})</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value">${growthStats.upselling.conversionRate.toFixed(1)}%</div>
                        <div class="metric-label">${t.conversionRate}</div>
                        <div class="metric-change positive">+${comparisonData.revenueGrowthRate}</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value">${(100 - growthStats.churn.churnRate).toFixed(1)}%</div>
                        <div class="metric-label">${t.retentionRate}</div>
                        <div class="metric-change positive">+${comparisonData.activeUsersRate}</div>
                    </div>
                </div>
            </div>
            
            <!-- Daily Metrics Section -->
            <div class="section">
                <h2 class="section-title">${t.overview}</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${dailyMetrics.totalLogins.toLocaleString()}</div>
                        <div class="metric-label">${t.totalLogins}</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value">${dailyMetrics.documentsGenerated.toLocaleString()}</div>
                        <div class="metric-label">${t.documentsGenerated}</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value">${growthStats.modelUsage.totalApiCalls.toLocaleString()}</div>
                        <div class="metric-label">${t.aiCalls}</div>
                    </div>
                    
                    <div class="metric-card">
                        <div class="metric-value">${dailyMetrics.paymentSuccessRate.toFixed(1)}%</div>
                        <div class="metric-label">${t.paymentSuccess}</div>
                    </div>
                </div>
            </div>
            
            <!-- Detailed Breakdown -->
            <div class="section">
                <h2 class="section-title">${t.breakdown}</h2>
                <div class="breakdown-grid">
                    <div class="breakdown-card">
                        <div class="breakdown-title">${t.planDistribution}</div>
                        ${growthStats.planChanges.planDistribution.map(plan => `
                            <div class="breakdown-item">
                                <span class="breakdown-label">${plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1)}</span>
                                <span class="breakdown-value">${plan.count} (${plan.percentage.toFixed(1)}%)</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="breakdown-card">
                        <div class="breakdown-title">${t.modelUsage}</div>
                        ${growthStats.modelUsage.modelBreakdown.slice(0, 4).map(model => `
                            <div class="breakdown-item">
                                <span class="breakdown-label">${model.model}</span>
                                <span class="breakdown-value">${model.calls.toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="breakdown-card">
                        <div class="breakdown-title">${t.countryStats}</div>
                        ${growthStats.geographic.countryDistribution.slice(0, 4).map(country => `
                            <div class="breakdown-item">
                                <span class="breakdown-label">${country.country}</span>
                                <span class="breakdown-value">${country.users} (${country.percentage.toFixed(1)}%)</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Action Items -->
            <div class="section">
                <h2 class="section-title">${t.actionItems}</h2>
                <div class="action-items">
                    <ul>
                        <li>${t.actionItem1}</li>
                        <li>${t.actionItem2}</li>
                        <li>${t.actionItem3}</li>
                        <li>${t.topModel}: ${dailyMetrics.topModel} (${dailyMetrics.topModelUsage.toLocaleString()} ${data.language === 'ko' ? '회 호출' : 'calls'})</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="cta-section">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/growth" class="cta-button">
                ${t.viewDashboard}
            </a>
            <p style="color: #64748b; font-size: 14px;">${t.contactInfo}</p>
        </div>
        
        <div class="footer">
            <p><strong>Legal AI SaaS</strong> • ${t.footer}</p>
            <p>${t.generatedAt}: ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>`;

  const text = `
${t.title}
${t.subtitle}

${t.generatedAt}: ${currentDate}

${t.keyMetrics}:
- ${t.totalUsers}: ${growthStats.userGrowth.totalUsers.toLocaleString()} (+${comparisonData.usersGrowthRate})
- ${t.newUsers}: ${growthStats.userGrowth.recentUsers}
- ${t.conversionRate}: ${growthStats.upselling.conversionRate.toFixed(1)}%
- ${t.retentionRate}: ${(100 - growthStats.churn.churnRate).toFixed(1)}%

${t.overview}:
- ${t.totalLogins}: ${dailyMetrics.totalLogins.toLocaleString()}
- ${t.documentsGenerated}: ${dailyMetrics.documentsGenerated.toLocaleString()}
- ${t.aiCalls}: ${growthStats.modelUsage.totalApiCalls.toLocaleString()}
- ${t.paymentSuccess}: ${dailyMetrics.paymentSuccessRate.toFixed(1)}%

${t.actionItems}:
• ${t.actionItem1}
• ${t.actionItem2}
• ${t.actionItem3}

${t.viewDashboard}: ${process.env.NEXT_PUBLIC_APP_URL}/admin/growth

${t.footer}
`;

  return {
    subject: t.subject,
    html,
    text
  };
}