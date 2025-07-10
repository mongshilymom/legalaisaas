import { NextApiRequest, NextApiResponse } from 'next';
import { getCachedGrowthStats } from '../../../lib/logs/growthTracker';
import { generateGrowthEmailTemplate, GrowthEmailData } from '../../../lib/email/growth-template';
import { sendTemplateEmail, getAdminEmails, testEmailConnection } from '../../../lib/email/send';

// Mock daily metrics - in production, fetch from your analytics/database
async function getDailyMetrics() {
  // Simulate fetching daily metrics
  const today = new Date();
  const randomFactor = Math.random() * 0.5 + 0.75; // 75-125% variation
  
  return {
    totalLogins: Math.floor(245 * randomFactor),
    documentsGenerated: Math.floor(89 * randomFactor),
    newSignups: Math.floor(12 * randomFactor),
    paymentSuccessRate: 94.5 + (Math.random() * 10 - 5), // 89.5-99.5%
    topModel: 'claude-3-sonnet',
    topModelUsage: Math.floor(1250 * randomFactor),
  };
}

// Mock comparison data - in production, calculate from historical data
async function getComparisonData() {
  return {
    usersGrowthRate: '+12.5%',
    revenueGrowthRate: '+8.3%',
    activeUsersRate: '+15.2%',
  };
}

function getPreferredLanguage(): 'ko' | 'en' {
  // Default to Korean, but can be configured via environment variable
  const defaultLang = process.env.GROWTH_EMAIL_LANGUAGE || 'ko';
  return defaultLang === 'en' ? 'en' : 'ko';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is a cron request or admin request
  const isValidCronRequest = req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
  const isManualTest = req.query.test === 'true' && req.query.key === process.env.CRON_SECRET;
  
  if (!isValidCronRequest && !isManualTest) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  console.log('🚀 Starting daily growth email generation...');

  try {
    // Test email connection first
    const connectionTest = await testEmailConnection();
    if (!connectionTest.success) {
      throw new Error(`Email connection failed: ${connectionTest.error}`);
    }

    // Get admin email recipients
    const recipients = getAdminEmails();
    if (recipients.length === 0) {
      throw new Error('No admin email recipients configured');
    }

    console.log('📧 Email recipients:', recipients);

    // Fetch growth statistics
    console.log('📊 Fetching growth statistics...');
    const growthStats = await getCachedGrowthStats();
    
    // Get daily metrics
    console.log('📈 Fetching daily metrics...');
    const dailyMetrics = await getDailyMetrics();
    
    // Get comparison data
    console.log('📊 Fetching comparison data...');
    const comparisonData = await getComparisonData();

    // Prepare email data
    const emailData: GrowthEmailData = {
      growthStats,
      dailyMetrics,
      comparisonData,
      recipients,
      language: getPreferredLanguage(),
    };

    // Generate email template
    console.log('📝 Generating email template...');
    const emailTemplate = generateGrowthEmailTemplate(emailData);

    // Send email to all recipients
    console.log('📧 Sending growth report email...');
    const emailResult = await sendTemplateEmail(
      emailTemplate,
      recipients,
      process.env.SMTP_USER || 'noreply@legalaisaas.com'
    );

    if (!emailResult.success) {
      throw new Error(`Email sending failed: ${emailResult.error}`);
    }

    const executionTime = Date.now() - startTime;
    
    // Log success
    console.log('✅ Daily growth email sent successfully:', {
      recipients: recipients.length,
      messageId: emailResult.messageId,
      language: emailData.language,
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString(),
      metrics: {
        totalUsers: growthStats.userGrowth.totalUsers,
        newUsers: growthStats.userGrowth.recentUsers,
        conversionRate: growthStats.upselling.conversionRate.toFixed(2) + '%',
        dailyLogins: dailyMetrics.totalLogins,
        documentsGenerated: dailyMetrics.documentsGenerated,
      }
    });

    // Optional: Save email sending log to database
    // await saveEmailLog({
    //   type: 'growth_report',
    //   recipients,
    //   messageId: emailResult.messageId,
    //   status: 'sent',
    //   sentAt: new Date(),
    // });

    res.status(200).json({
      success: true,
      message: 'Daily growth email sent successfully',
      data: {
        recipients: recipients.length,
        messageId: emailResult.messageId,
        language: emailData.language,
        executionTime,
        summary: {
          totalUsers: growthStats.userGrowth.totalUsers,
          newUsers: growthStats.userGrowth.recentUsers,
          conversionRate: `${growthStats.upselling.conversionRate.toFixed(2)}%`,
          retentionRate: `${(100 - growthStats.churn.churnRate).toFixed(1)}%`,
          dailyLogins: dailyMetrics.totalLogins,
          documentsGenerated: dailyMetrics.documentsGenerated,
        },
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('❌ Daily growth email failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString(),
    });

    // Optional: Save error log to database
    // await saveEmailLog({
    //   type: 'growth_report',
    //   recipients: getAdminEmails(),
    //   status: 'failed',
    //   error: error instanceof Error ? error.message : 'Unknown error',
    //   attemptedAt: new Date(),
    // });

    res.status(500).json({
      success: false,
      error: 'Failed to send daily growth email',
      message: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
      timestamp: new Date().toISOString(),
    });
  }
}

// Optional: Function to save email logs to database
// async function saveEmailLog(log: {
//   type: string;
//   recipients: string[];
//   messageId?: string;
//   status: 'sent' | 'failed';
//   error?: string;
//   sentAt?: Date;
//   attemptedAt?: Date;
// }) {
//   // Save to database
//   // await db.emailLog.create({ data: log });
// }