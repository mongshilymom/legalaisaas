import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../features/auth/authOptions';
import { sendTemplateEmail, generateTestEmail, testEmailConnection, getAdminEmails } from '../../../lib/email/send';
import { generateGrowthEmailTemplate, GrowthEmailData } from '../../../lib/email/growth-template';
import { getCachedGrowthStats } from '../../../lib/logs/growthTracker';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication for non-cron requests
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      const session = await getServerSession(req, res, authOptions);
      
      if (!session?.user?.email) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is admin
      const isAdmin = session.user.email.includes('admin') || 
                     session.user.email === 'developer@legalaisaas.com';
      
      if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }

    const { type, recipients, language } = req.body;

    // Test email connection first
    const connectionTest = await testEmailConnection();
    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        error: 'Email connection failed',
        details: connectionTest.error
      });
    }

    const emailRecipients = recipients || getAdminEmails();
    
    if (emailRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No email recipients specified'
      });
    }

    let emailResult;

    switch (type) {
      case 'test':
        // Send simple test email
        const testTemplate = generateTestEmail();
        emailResult = await sendTemplateEmail(testTemplate, emailRecipients);
        break;

      case 'growth':
        // Send growth report email
        console.log('📊 Generating test growth report...');
        
        // Get real growth stats
        const growthStats = await getCachedGrowthStats();
        
        // Mock daily metrics for test
        const dailyMetrics = {
          totalLogins: 234,
          documentsGenerated: 87,
          newSignups: 15,
          paymentSuccessRate: 96.2,
          topModel: 'claude-3-sonnet',
          topModelUsage: 1580,
        };
        
        const comparisonData = {
          usersGrowthRate: '+12.5%',
          revenueGrowthRate: '+8.3%',
          activeUsersRate: '+15.2%',
        };

        const emailData: GrowthEmailData = {
          growthStats,
          dailyMetrics,
          comparisonData,
          recipients: emailRecipients,
          language: language || 'ko',
        };

        const growthTemplate = generateGrowthEmailTemplate(emailData);
        emailResult = await sendTemplateEmail(growthTemplate, emailRecipients);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid email type. Use "test" or "growth"'
        });
    }

    if (emailResult.success) {
      console.log('✅ Test email sent successfully:', {
        type,
        recipients: emailRecipients.length,
        messageId: emailResult.messageId,
      });

      return res.status(200).json({
        success: true,
        message: `${type} email sent successfully`,
        data: {
          type,
          recipients: emailRecipients.length,
          messageId: emailResult.messageId,
          timestamp: new Date().toISOString(),
        }
      });
    } else {
      throw new Error(emailResult.error || 'Email sending failed');
    }

  } catch (error) {
    console.error('❌ Test email failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Test email failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}