import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import jsPDF from 'jspdf';

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
    dailyActivity: Array<{ date: string; documents: number; apiCalls: number }>;
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const session = await getSession({ req });
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { format } = req.query;
    if (!format || (format !== 'pdf' && format !== 'csv')) {
      return res.status(400).json({ error: 'Invalid format. Use pdf or csv' });
    }

    // Get user growth data (mock data for demonstration)
    const userData = await getUserGrowthData(session.user.email || '');
    
    if (format === 'csv') {
      const csvContent = generateCSVReport(userData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="growth-report-${new Date().toISOString().split('T')[0]}.csv"`);
      res.status(200).send(csvContent);
      
    } else if (format === 'pdf') {
      const pdfBuffer = await generatePDFReport(userData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="growth-report-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.status(200).send(Buffer.from(pdfBuffer));
    }

  } catch (error) {
    console.error('Error generating growth report:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function getUserGrowthData(userEmail: string): Promise<UserGrowthData> {
  // In production, this would query your database for actual user data
  // For now, return mock data
  
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
      ],
      dailyActivity: [
        { date: '07-01', documents: 3, apiCalls: 12 },
        { date: '07-02', documents: 1, apiCalls: 8 },
        { date: '07-03', documents: 5, apiCalls: 15 },
        { date: '07-04', documents: 2, apiCalls: 7 },
        { date: '07-05', documents: 4, apiCalls: 14 },
        { date: '07-06', documents: 0, apiCalls: 0 },
        { date: '07-07', documents: 3, apiCalls: 11 },
        { date: '07-08', documents: 2, apiCalls: 9 },
        { date: '07-09', documents: 3, apiCalls: 13 }
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

function generateCSVReport(data: UserGrowthData): string {
  const currentDate = new Date().toLocaleDateString('ko-KR');
  
  const csvRows = [
    `Legal AI SaaS 성장 리포트 - ${currentDate}`,
    '',
    '=== 사용자 정보 ===',
    `이메일,${data.user.email}`,
    `현재 플랜,${data.user.currentPlan.toUpperCase()}`,
    `가입 경과일,${data.user.memberSince}일`,
    `총 생성 문서,${data.user.totalDocuments}개`,
    `총 AI 호출,${data.user.totalApiCalls}회`,
    `예상 비용,$${data.user.estimatedCost}`,
    '',
    '=== 이번 달 활동 ===',
    `생성한 문서,${data.thisMonth.documentsCreated}개`,
    `AI 호출 수,${data.thisMonth.apiCalls}회`,
    '',
    '=== AI 모델 사용 분포 ===',
    'Model,Calls,Percentage',
    ...data.thisMonth.modelUsage.map(model => 
      `${model.model},${model.calls},${model.percentage.toFixed(1)}%`
    ),
    '',
    '=== 일별 활동 현황 ===',
    'Date,Documents,API Calls',
    ...data.thisMonth.dailyActivity.map(day => 
      `${day.date},${day.documents},${day.apiCalls}`
    ),
    '',
    '=== 예측 및 추천 ===',
    `다음 달 예상 사용량,${data.predictions.nextMonthUsage}회`,
    `추천 플랜,${data.predictions.recommendedPlan.toUpperCase()}`,
    `예상 절약액,$${data.predictions.potentialSavings}/월`,
    `업그레이드 점수,${data.predictions.upgradeWorthScore}/100`,
    '',
    '=== 사용자 비교 ===',
    `전체 순위,#${data.comparison.yourRank} / ${data.comparison.totalUsers}`,
    `평균 문서 생성,${data.comparison.avgUserDocuments}개/월`,
    `상위 퍼센트,${((data.comparison.yourRank / data.comparison.totalUsers) * 100).toFixed(1)}%`,
    '',
    `리포트 생성 시간: ${new Date().toLocaleString('ko-KR')}`,
    'Generated by Legal AI SaaS - https://legalaisaas.com'
  ];
  
  return csvRows.join('\n');
}

async function generatePDFReport(data: UserGrowthData): Promise<Uint8Array> {
  // Note: jsPDF has limitations with Korean fonts
  // In production, consider using a server-side PDF library like Puppeteer
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Add title
  doc.setFontSize(20);
  doc.text('Legal AI SaaS Growth Report', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 40, { align: 'center' });
  
  let yPos = 60;
  
  // User Information Section
  doc.setFontSize(16);
  doc.text('User Information', 20, yPos);
  yPos += 15;
  
  doc.setFontSize(10);
  const userInfo = [
    `Email: ${data.user.email}`,
    `Current Plan: ${data.user.currentPlan.toUpperCase()}`,
    `Member Since: ${data.user.memberSince} days`,
    `Total Documents: ${data.user.totalDocuments}`,
    `Total API Calls: ${data.user.totalApiCalls}`,
    `Estimated Cost: $${data.user.estimatedCost}`
  ];
  
  userInfo.forEach(info => {
    doc.text(info, 25, yPos);
    yPos += 8;
  });
  
  yPos += 10;
  
  // This Month's Activity
  doc.setFontSize(16);
  doc.text('This Month\'s Activity', 20, yPos);
  yPos += 15;
  
  doc.setFontSize(10);
  const monthlyInfo = [
    `Documents Created: ${data.thisMonth.documentsCreated}`,
    `API Calls: ${data.thisMonth.apiCalls}`
  ];
  
  monthlyInfo.forEach(info => {
    doc.text(info, 25, yPos);
    yPos += 8;
  });
  
  yPos += 10;
  
  // Model Usage
  doc.setFontSize(16);
  doc.text('AI Model Usage Distribution', 20, yPos);
  yPos += 15;
  
  doc.setFontSize(10);
  data.thisMonth.modelUsage.forEach(model => {
    doc.text(`${model.model}: ${model.calls} calls (${model.percentage.toFixed(1)}%)`, 25, yPos);
    yPos += 8;
  });
  
  yPos += 10;
  
  // Predictions & Recommendations
  doc.setFontSize(16);
  doc.text('Predictions & Recommendations', 20, yPos);
  yPos += 15;
  
  doc.setFontSize(10);
  const predictions = [
    `Next Month Usage: ${data.predictions.nextMonthUsage} calls`,
    `Recommended Plan: ${data.predictions.recommendedPlan.toUpperCase()}`,
    `Potential Savings: $${data.predictions.potentialSavings}/month`,
    `Upgrade Score: ${data.predictions.upgradeWorthScore}/100`
  ];
  
  predictions.forEach(pred => {
    doc.text(pred, 25, yPos);
    yPos += 8;
  });
  
  yPos += 10;
  
  // User Comparison
  doc.setFontSize(16);
  doc.text('User Comparison', 20, yPos);
  yPos += 15;
  
  doc.setFontSize(10);
  const comparison = [
    `Your Rank: #${data.comparison.yourRank} out of ${data.comparison.totalUsers}`,
    `Average User Documents: ${data.comparison.avgUserDocuments}/month`,
    `Top ${((data.comparison.yourRank / data.comparison.totalUsers) * 100).toFixed(1)}% user`
  ];
  
  comparison.forEach(comp => {
    doc.text(comp, 25, yPos);
    yPos += 8;
  });
  
  // Add footer
  doc.setFontSize(8);
  doc.text('Generated by Legal AI SaaS', pageWidth / 2, pageHeight - 20, { align: 'center' });
  doc.text('https://legalaisaas.com', pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  return doc.output('arraybuffer');
}

// Helper function to validate session server-side
async function getSession({ req }: { req: NextApiRequest }) {
  try {
    // This is a simplified session check
    // In production, use proper session validation
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    
    // Mock session for demonstration
    return {
      user: {
        email: 'user@example.com',
        id: '1'
      }
    };
  } catch (error) {
    return null;
  }
}