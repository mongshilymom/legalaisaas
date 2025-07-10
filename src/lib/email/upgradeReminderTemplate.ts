export interface UpgradeReminderData {
  userName: string;
  userEmail: string;
  currentPlan: string;
  documentsCount: number;
  daysActive: number;
  language: 'ko' | 'en' | 'ja' | 'zh';
  upgradeUrl: string;
}

function getTranslations(language: 'ko' | 'en' | 'ja' | 'zh') {
  const translations = {
    ko: {
      subject: '🚀 더 많은 기능을 사용해보세요! Legal AI 업그레이드 안내',
      greeting: '안녕하세요',
      intro: '최근 7일간 Legal AI SaaS를 활발히 사용해주셨네요!',
      stats: '현재까지의 활동',
      documents: '생성한 문서',
      days: '활동 일수',
      currentPlan: '현재 플랜',
      upgrade: {
        title: '🎯 Pro 플랜으로 업그레이드하고 더 많은 혜택을 누리세요',
        benefits: [
          '무제한 문서 생성',
          '고급 AI 모델 (Claude, GPT-4, Gemini Pro) 접근',
          '우선 고객 지원',
          '고급 분석 도구',
          '팀 협업 기능',
          'API 접근'
        ],
        pricing: '월 $99부터 시작',
        cta: 'Pro 플랜으로 업그레이드',
        limited: '⏰ 한정 시간! 첫 달 50% 할인'
      },
      testimonial: {
        title: '고객 후기',
        content: 'Pro 플랜 덕분에 법무 업무 효율이 3배 증가했습니다!',
        author: '김변호사, 법무법인 에이스'
      },
      footer: {
        unsubscribe: '이메일 수신을 원하지 않으시면',
        here: '여기를 클릭하세요',
        contact: '문의사항이 있으시면 언제든 연락주세요.'
      }
    },
    en: {
      subject: '🚀 Unlock More Features! Legal AI Upgrade Invitation',
      greeting: 'Hello',
      intro: 'You\'ve been actively using Legal AI SaaS in the past 7 days!',
      stats: 'Your Activity So Far',
      documents: 'Documents Created',
      days: 'Days Active',
      currentPlan: 'Current Plan',
      upgrade: {
        title: '🎯 Upgrade to Pro and Unlock Premium Features',
        benefits: [
          'Unlimited document generation',
          'Access to advanced AI models (Claude, GPT-4, Gemini Pro)',
          'Priority customer support',
          'Advanced analytics tools',
          'Team collaboration features',
          'API access'
        ],
        pricing: 'Starting from $99/month',
        cta: 'Upgrade to Pro Plan',
        limited: '⏰ Limited Time! 50% off your first month'
      },
      testimonial: {
        title: 'Customer Success Story',
        content: 'Pro plan increased our legal workflow efficiency by 3x!',
        author: 'Attorney Kim, Ace Law Firm'
      },
      footer: {
        unsubscribe: 'If you don\'t want to receive these emails',
        here: 'click here',
        contact: 'Contact us anytime if you have questions.'
      }
    },
    ja: {
      subject: '🚀 より多くの機能をお試しください！Legal AI アップグレードのご案内',
      greeting: 'こんにちは',
      intro: '過去7日間、Legal AI SaaSを積極的にご利用いただいております！',
      stats: 'これまでのご利用状況',
      documents: '作成した文書',
      days: '利用日数',
      currentPlan: '現在のプラン',
      upgrade: {
        title: '🎯 Proプランにアップグレードして、さらなる機能をご活用ください',
        benefits: [
          '文書生成無制限',
          '高度なAIモデル（Claude、GPT-4、Gemini Pro）へのアクセス',
          '優先カスタマーサポート',
          '高度な分析ツール',
          'チームコラボレーション機能',
          'APIアクセス'
        ],
        pricing: '月額$99から',
        cta: 'Proプランにアップグレード',
        limited: '⏰ 期間限定！初月50%オフ'
      },
      testimonial: {
        title: 'お客様の声',
        content: 'Proプランのおかげで法務業務の効率が3倍になりました！',
        author: '金弁護士、エース法律事務所'
      },
      footer: {
        unsubscribe: 'これらのメールの受信を希望されない場合は',
        here: 'こちらをクリック',
        contact: 'ご質問がございましたら、いつでもお気軽にお問い合わせください。'
      }
    },
    zh: {
      subject: '🚀 解锁更多功能！Legal AI 升级邀请',
      greeting: '您好',
      intro: '您在过去7天中积极使用Legal AI SaaS！',
      stats: '您的使用统计',
      documents: '创建的文档',
      days: '活跃天数',
      currentPlan: '当前计划',
      upgrade: {
        title: '🎯 升级到Pro版本，解锁高级功能',
        benefits: [
          '无限文档生成',
          '访问高级AI模型（Claude、GPT-4、Gemini Pro）',
          '优先客户支持',
          '高级分析工具',
          '团队协作功能',
          'API访问'
        ],
        pricing: '每月$99起',
        cta: '升级到Pro计划',
        limited: '⏰ 限时优惠！首月50%折扣'
      },
      testimonial: {
        title: '客户成功案例',
        content: 'Pro计划让我们的法律工作效率提高了3倍！',
        author: '金律师，王牌律师事务所'
      },
      footer: {
        unsubscribe: '如果您不想接收这些邮件',
        here: '请点击这里',
        contact: '如有任何问题，请随时联系我们。'
      }
    }
  };
  
  return translations[language];
}

export function generateUpgradeReminderEmail(data: UpgradeReminderData) {
  const t = getTranslations(data.language);
  
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
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .logo {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .content {
            padding: 30px;
        }
        
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1e293b;
        }
        
        .intro {
            font-size: 16px;
            margin-bottom: 30px;
            color: #475569;
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        
        .stats-section {
            background: #f8fafc;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
        }
        
        .stats-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 15px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
        }
        
        .stat-item {
            text-align: center;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: 700;
            color: #3b82f6;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 14px;
            color: #64748b;
            font-weight: 500;
        }
        
        .upgrade-section {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            border: 2px solid #f59e0b;
        }
        
        .upgrade-title {
            font-size: 20px;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .benefits-list {
            list-style: none;
            margin-bottom: 25px;
        }
        
        .benefits-list li {
            padding: 8px 0;
            color: #78350f;
            position: relative;
            padding-left: 25px;
        }
        
        .benefits-list li:before {
            content: "✅";
            position: absolute;
            left: 0;
        }
        
        .pricing {
            text-align: center;
            font-size: 18px;
            font-weight: 600;
            color: #92400e;
            margin-bottom: 20px;
        }
        
        .limited-offer {
            background: #fee2e2;
            color: #991b1b;
            padding: 10px;
            border-radius: 6px;
            text-align: center;
            margin-bottom: 25px;
            font-weight: 600;
        }
        
        .cta-button {
            display: block;
            width: 100%;
            background: #3b82f6;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: background-color 0.3s ease;
            margin-bottom: 15px;
        }
        
        .cta-button:hover {
            background: #2563eb;
        }
        
        .testimonial {
            background: #f0f9ff;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            border-left: 4px solid #0ea5e9;
        }
        
        .testimonial-title {
            font-size: 16px;
            font-weight: 600;
            color: #0c4a6e;
            margin-bottom: 10px;
        }
        
        .testimonial-content {
            font-style: italic;
            color: #075985;
            margin-bottom: 10px;
            font-size: 15px;
        }
        
        .testimonial-author {
            color: #0369a1;
            font-weight: 500;
            font-size: 14px;
        }
        
        .footer {
            background: #f8fafc;
            padding: 25px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        
        .footer p {
            margin-bottom: 10px;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                box-shadow: none;
            }
            
            .header, .content {
                padding: 20px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚖️</div>
            <h1>Legal AI SaaS</h1>
            <p>${t.subject}</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                ${t.greeting} ${data.userName}! 👋
            </div>
            
            <div class="intro">
                ${t.intro}
            </div>
            
            <div class="stats-section">
                <div class="stats-title">${t.stats}</div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-number">${data.documentsCount}</div>
                        <div class="stat-label">${t.documents}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${data.daysActive}</div>
                        <div class="stat-label">${t.days}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${data.currentPlan.toUpperCase()}</div>
                        <div class="stat-label">${t.currentPlan}</div>
                    </div>
                </div>
            </div>
            
            <div class="upgrade-section">
                <div class="upgrade-title">${t.upgrade.title}</div>
                
                <ul class="benefits-list">
                    ${t.upgrade.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                </ul>
                
                <div class="pricing">${t.upgrade.pricing}</div>
                
                <div class="limited-offer">${t.upgrade.limited}</div>
                
                <a href="${data.upgradeUrl}" class="cta-button">${t.upgrade.cta}</a>
            </div>
            
            <div class="testimonial">
                <div class="testimonial-title">${t.testimonial.title}</div>
                <div class="testimonial-content">"${t.testimonial.content}"</div>
                <div class="testimonial-author">- ${t.testimonial.author}</div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Legal AI SaaS</strong> • ${t.footer.contact}</p>
            <p>
                ${t.footer.unsubscribe} 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(data.userEmail)}">${t.footer.here}</a>
            </p>
        </div>
    </div>
</body>
</html>`;

  const text = `
${t.greeting} ${data.userName}!

${t.intro}

${t.stats}:
- ${t.documents}: ${data.documentsCount}
- ${t.days}: ${data.daysActive}
- ${t.currentPlan}: ${data.currentPlan.toUpperCase()}

${t.upgrade.title}
${t.upgrade.benefits.map(benefit => `• ${benefit}`).join('\n')}

${t.upgrade.pricing}
${t.upgrade.limited}

${t.upgrade.cta}: ${data.upgradeUrl}

${t.testimonial.title}
"${t.testimonial.content}"
- ${t.testimonial.author}

${t.footer.contact}
${t.footer.unsubscribe}: ${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(data.userEmail)}
`;

  return {
    subject: t.subject,
    html,
    text
  };
}