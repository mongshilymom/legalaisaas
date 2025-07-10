import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../features/auth/authOptions';
import nodemailer from 'nodemailer';

interface UserGrowthData {
  user: {
    email: string;
    currentPlan: string;
    memberSince: string;
    totalDocuments: number;
    totalApiCalls: number;
    estimatedCost: number;
  };
  thisMonth: {
    documentsCreated: number;
    apiCalls: number;
    modelUsage: Array<{ model: string; calls: number; percentage: number }>;
  };
  predictions: {
    nextMonthUsage: number;
    recommendedPlan: string;
    potentialSavings: number;
    upgradeWorthScore: number;
  };
  comparison: {
    avgUserDocuments: number;
    yourRank: number;
    totalUsers: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { reportType, adminEmail } = req.body;

    if (!reportType || !['growth', 'admin', 'daily'].includes(reportType)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    if (reportType === 'daily') {
      // Trigger daily report manually
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/daily-send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send daily report');
      }
      
      return res.status(200).json(result);
    }

    // Get user growth data
    const userData = await getUserGrowthData(session.user.email);

    // Send appropriate email
    if (reportType === 'growth') {
      await sendGrowthReportEmail(session.user.email, userData);
    } else if (reportType === 'admin' && adminEmail) {
      await sendAdminGrowthReport(adminEmail, userData);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Report sent successfully' 
    });

  } catch (error) {
    console.error('Error sending report:', error);
    res.status(500).json({ 
      error: 'Failed to send report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getUserGrowthData(userEmail: string): Promise<UserGrowthData> {
  return {
    user: {
      email: userEmail,
      currentPlan: 'free',
      memberSince: '45',
      totalDocuments: 127,
      totalApiCalls: 1250,
      estimatedCost: 45.50
    },
    thisMonth: {
      documentsCreated: 23,
      apiCalls: 189,
      modelUsage: [
        { model: 'Claude', calls: 89, percentage: 47.1 },
        { model: 'GPT-4', calls: 56, percentage: 29.6 },
        { model: 'Gemini', calls: 44, percentage: 23.3 }
      ]
    },
    predictions: {
      nextMonthUsage: 220,
      recommendedPlan: 'pro',
      potentialSavings: 35,
      upgradeWorthScore: 78
    },
    comparison: {
      avgUserDocuments: 15,
      yourRank: 23,
      totalUsers: 1247
    }
  };
}

async function sendGrowthReportEmail(userEmail: string, data: UserGrowthData) {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const htmlTemplate = generateGrowthEmailTemplate(data);

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: userEmail,
    subject: `🚀 Legal AI 월간 성장 리포트 - ${new Date().toLocaleDateString('ko-KR')}`,
    html: htmlTemplate
  };

  await transporter.sendMail(mailOptions);
}

async function sendAdminGrowthReport(adminEmail: string, data: UserGrowthData) {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const htmlTemplate = generateAdminEmailTemplate(data);

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: adminEmail,
    subject: `📊 Legal AI 사용자 성장 리포트 - ${data.user.email}`,
    html: htmlTemplate
  };

  await transporter.sendMail(mailOptions);
}

function generateGrowthEmailTemplate(data: UserGrowthData): string {
  const upgradeRecommendation = data.predictions.upgradeWorthScore >= 60 ? 
    `<div style="background-color: #3B82F6; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0;">🎯 맞춤 플랜 추천</h3>
      <p style="margin: 0 0 15px 0;">${data.predictions.recommendedPlan.toUpperCase()} 플랜으로 업그레이드하여 월 $${data.predictions.potentialSavings}를 절약하세요!</p>
      <a href="https://yoursite.com/pricing?utm_source=email&utm_medium=growth_report" 
         style="background-color: white; color: #3B82F6; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
        플랜 업그레이드 하기
      </a>
    </div>` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Legal AI 성장 리포트</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0;">🚀 Legal AI 월간 성장 리포트</h1>
        <p style="margin: 0; opacity: 0.9;">${new Date().toLocaleDateString('ko-KR')} 기준</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #3B82F6; margin: 0 0 15px 0;">📊 이번 달 활동 요약</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
            <div style="font-size: 24px; font-weight: bold; color: #3B82F6;">${data.thisMonth.documentsCreated}</div>
            <div style="font-size: 14px; color: #666;">문서 생성</div>
          </div>
          <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
            <div style="font-size: 24px; font-weight: bold; color: #10B981;">${data.thisMonth.apiCalls}</div>
            <div style="font-size: 14px; color: #666;">AI 호출</div>
          </div>
        </div>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #3B82F6; margin: 0 0 15px 0;">🏆 나의 순위</h2>
        <p style="font-size: 18px; margin: 0;">
          전체 ${data.comparison.totalUsers}명 중 <strong style="color: #3B82F6;">#${data.comparison.yourRank}</strong>위
        </p>
        <p style="color: #666; margin: 5px 0 0 0;">
          상위 ${((data.comparison.yourRank / data.comparison.totalUsers) * 100).toFixed(0)}% 사용자입니다!
        </p>
      </div>

      ${upgradeRecommendation}

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #3B82F6; margin: 0 0 15px 0;">📈 다음 달 예측</h2>
        <p>예상 사용량: <strong>${data.predictions.nextMonthUsage}회</strong></p>
        <p>업그레이드 점수: <strong>${data.predictions.upgradeWorthScore}/100</strong></p>
      </div>

      <div style="text-align: center; padding: 20px; color: #666; border-top: 1px solid #e5e7eb; margin-top: 30px;">
        <p>Legal AI SaaS와 함께 성장해주셔서 감사합니다!</p>
        <p style="font-size: 12px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/growth" style="color: #3B82F6;">전체 리포트 보기</a> | 
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color: #666;">수신거부</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

function generateAdminEmailTemplate(data: UserGrowthData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Legal AI 사용자 리포트</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1F2937, #374151); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0;">📊 사용자 성장 리포트</h1>
        <p style="margin: 0; opacity: 0.9;">사용자: ${data.user.email}</p>
        <p style="margin: 0; opacity: 0.9;">생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #1F2937; margin: 0 0 15px 0;">사용자 정보</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>이메일:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.user.email}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>현재 플랜:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.user.currentPlan.toUpperCase()}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>가입 경과:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.user.memberSince}일</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>총 문서:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.user.totalDocuments}개</td></tr>
          <tr><td style="padding: 8px;"><strong>총 API 호출:</strong></td><td style="padding: 8px;">${data.user.totalApiCalls}회</td></tr>
        </table>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="color: #1F2937; margin: 0 0 15px 0;">예측 및 추천</h2>
        <p><strong>추천 플랜:</strong> ${data.predictions.recommendedPlan.toUpperCase()}</p>
        <p><strong>예상 절약액:</strong> $${data.predictions.potentialSavings}/월</p>
        <p><strong>업그레이드 점수:</strong> ${data.predictions.upgradeWorthScore}/100</p>
        <p><strong>전체 순위:</strong> #${data.comparison.yourRank} / ${data.comparison.totalUsers}</p>
      </div>

      <div style="text-align: center; padding: 20px; color: #666; border-top: 1px solid #e5e7eb; margin-top: 30px;">
        <p>Legal AI SaaS 관리자 리포트</p>
        <p style="font-size: 12px;">자동 생성된 리포트입니다.</p>
      </div>
    </body>
    </html>
  `;
}
