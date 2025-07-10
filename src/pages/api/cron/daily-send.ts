import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import nodemailer from 'nodemailer';
import { authOptions } from '../../auth/authOptions';

interface DailyReportData {
  userEmail: string;
  userName: string;
  usageCount: number;
  planType: string;
  language: string;
  recommendations: string[];
  upgradeOffer?: {
    currentPlan: string;
    suggestedPlan: string;
    discount: number;
  };
}

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const generateEmailTemplate = (data: DailyReportData): string => {
  const { language, userName, usageCount, planType, recommendations, upgradeOffer } = data;
  
  const templates = {
    en: {
      subject: 'Daily Legal AI Report',
      greeting: `Hello ${userName},`,
      usageText: `You have used ${usageCount} AI queries today on your ${planType} plan.`,
      recommendationsTitle: 'Today\'s Recommendations:',
      upgradeText: upgradeOffer ? `Upgrade to ${upgradeOffer.suggestedPlan} for ${upgradeOffer.discount}% off!` : '',
      footer: 'Best regards,<br>Legal AI SaaS Team'
    },
    ko: {
      subject: '일일 법률 AI 리포트',
      greeting: `안녕하세요 ${userName}님,`,
      usageText: `오늘 ${planType} 플랜에서 ${usageCount}회 AI 쿼리를 사용하셨습니다.`,
      recommendationsTitle: '오늘의 추천사항:',
      upgradeText: upgradeOffer ? `${upgradeOffer.suggestedPlan}으로 업그레이드하고 ${upgradeOffer.discount}% 할인받으세요!` : '',
      footer: '감사합니다,<br>Legal AI SaaS 팀'
    },
    ja: {
      subject: '日次法律AIレポート',
      greeting: `こんにちは ${userName}様,`,
      usageText: `本日、${planType}プランで${usageCount}回のAIクエリをご利用いただきました。`,
      recommendationsTitle: '本日の推奨事項:',
      upgradeText: upgradeOffer ? `${upgradeOffer.suggestedPlan}にアップグレードして${upgradeOffer.discount}%オフ!` : '',
      footer: 'よろしくお願いいたします,<br>Legal AI SaaS チーム'
    }
  };
  
  const t = templates[language as keyof typeof templates] || templates.en;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${t.subject}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .recommendations { background: #f3f4f6; padding: 15px; margin: 20px 0; }
        .upgrade-offer { background: #fef3c7; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .footer { color: #6b7280; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Legal AI SaaS</h1>
        <p>${t.subject}</p>
      </div>
      <div class="content">
        <p>${t.greeting}</p>
        <p>${t.usageText}</p>
        
        <div class="recommendations">
          <h3>${t.recommendationsTitle}</h3>
          <ul>
            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
        
        ${upgradeOffer ? `
          <div class="upgrade-offer">
            <h3>🚀 ${t.upgradeText}</h3>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/upgrade" 
               style="background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Upgrade Now
            </a>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>${t.footer}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getUsersForDailyReport = async (): Promise<DailyReportData[]> => {
  // Mock data - replace with actual database query
  return [
    {
      userEmail: 'user@example.com',
      userName: 'John Doe',
      usageCount: 25,
      planType: 'Basic',
      language: 'en',
      recommendations: [
        'Consider upgrading to Pro for unlimited queries',
        'Review your contract templates for compliance',
        'Set up automated compliance checks'
      ],
      upgradeOffer: {
        currentPlan: 'Basic',
        suggestedPlan: 'Pro',
        discount: 20
      }
    }
  ];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is a cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const users = await getUsersForDailyReport();
    const emailPromises = users.map(async (user) => {
      const emailHtml = generateEmailTemplate(user);
      
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: user.userEmail,
        subject: user.language === 'ko' ? '일일 법률 AI 리포트' : 
                user.language === 'ja' ? '日次法律AIレポート' : 
                'Daily Legal AI Report',
        html: emailHtml,
      };
      
      return transporter.sendMail(mailOptions);
    });
    
    await Promise.all(emailPromises);
    
    res.status(200).json({ 
      success: true, 
      message: `Daily reports sent to ${users.length} users`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Daily report send error:', error);
    res.status(500).json({ error: 'Failed to send daily reports' });
  }
}
