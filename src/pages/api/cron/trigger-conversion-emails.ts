import { NextApiRequest, NextApiResponse } from 'next';
import { getEligibleUsersForEmail, userGrowthLogger } from '../../../lib/logs/userGrowthActivity';
import { generateUpgradeReminderEmail } from '../../../lib/email/upgradeReminderTemplate';
import { sendEmail } from '../../../lib/email/send';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests and verify cron secret
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret for security
  const cronSecret = req.headers.authorization?.replace('Bearer ', '');
  if (cronSecret !== process.env.CRON_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const startTime = Date.now();
    console.log('🚀 Starting conversion email trigger job...');

    // Get all users eligible for conversion emails
    const eligibleUsers = await getEligibleUsersForEmail();
    console.log(`📧 Found ${eligibleUsers.length} eligible users for conversion emails`);

    const results = {
      total: eligibleUsers.length,
      upgrade_emails_sent: 0,
      engagement_emails_sent: 0,
      errors: 0,
      processed_users: [] as string[]
    };

    // Process each eligible user
    for (const user of eligibleUsers) {
      try {
        const emailType = user.shouldTriggerUpgrade ? 'upgrade_reminder' : 'engagement_reminder';
        
        // Skip if we've already sent an email to this user in the last 24 hours
        const hasRecentEmail = await checkRecentEmailSent(user.userId, emailType);
        if (hasRecentEmail) {
          console.log(`⏭️ Skipping ${user.email} - recent email already sent`);
          continue;
        }

        // Generate email content
        const emailData = {
          userName: user.email.split('@')[0], // Simple name extraction
          userEmail: user.email,
          currentPlan: user.currentPlan,
          documentsCount: user.documentsLast7Days,
          daysActive: Math.max(1, 7 - user.lastLoginDays), // Active days in last week
          language: await getUserLanguage(user.userId), // Default to Korean
          upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?utm_source=email&utm_medium=conversion&utm_campaign=${emailType}&user=${user.userId}`
        };

        const emailTemplate = generateUpgradeReminderEmail(emailData);

        // Send email
        await sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        });

        // Log the email trigger
        await userGrowthLogger.logEmailTrigger(user.userId, user.email, emailType);

        // Update results
        if (emailType === 'upgrade_reminder') {
          results.upgrade_emails_sent++;
        } else {
          results.engagement_emails_sent++;
        }
        
        results.processed_users.push(user.email);

        console.log(`✅ Sent ${emailType} email to ${user.email}`);

        // Rate limiting: wait 100ms between emails to avoid overwhelming email service
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Failed to send email to ${user.email}:`, error);
        results.errors++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`🎉 Conversion email job completed in ${duration}ms`);
    console.log(`📊 Results: ${results.upgrade_emails_sent} upgrade emails, ${results.engagement_emails_sent} engagement emails, ${results.errors} errors`);

    // Log job completion
    await logCronJobExecution('conversion-emails', results);

    res.status(200).json({
      success: true,
      message: 'Conversion email job completed successfully',
      results,
      duration_ms: duration
    });

  } catch (error) {
    console.error('❌ Conversion email job failed:', error);
    
    // Log job failure
    await logCronJobExecution('conversion-emails', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function checkRecentEmailSent(userId: string, emailType: string): Promise<boolean> {
  // Check if we've sent an email to this user in the last 24 hours
  // In production, this would query your database
  // For now, we'll use a simple check based on localStorage or file system
  
  try {
    // Mock implementation - replace with actual database query
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // This should query your email log table:
    // SELECT * FROM email_logs WHERE user_id = ? AND email_type = ? AND created_at > ?
    
    // For demo purposes, always return false (allow sending)
    return false;
    
  } catch (error) {
    console.error('Error checking recent emails:', error);
    return false; // Allow sending if check fails
  }
}

async function getUserLanguage(userId: string): Promise<'ko' | 'en' | 'ja' | 'zh'> {
  // Get user's preferred language from database
  // For now, return Korean as default
  try {
    // This should query your users table:
    // SELECT locale FROM users WHERE id = ?
    
    // Mock data
    const mockUserLanguages: { [key: string]: 'ko' | 'en' | 'ja' | 'zh' } = {
      '1': 'ko',
      '2': 'en',
      '3': 'ja',
      '4': 'zh'
    };
    
    return mockUserLanguages[userId] || 'ko';
    
  } catch (error) {
    console.error('Error getting user language:', error);
    return 'ko'; // Default fallback
  }
}

async function logCronJobExecution(jobName: string, results: any): Promise<void> {
  try {
    // Log cron job execution to database or monitoring system
    // This helps track job performance and debug issues
    
    const logEntry = {
      job_name: jobName,
      executed_at: new Date().toISOString(),
      results: JSON.stringify(results),
      success: !results.error
    };
    
    console.log('📋 Cron job log:', logEntry);
    
    // In production, save to database:
    // await db.cronJobLogs.create({ data: logEntry });
    
  } catch (error) {
    console.error('Failed to log cron job execution:', error);
  }
}

// Helper function to manually trigger the job (for testing)
export async function triggerConversionEmailsManually() {
  try {
    const response = await fetch('/api/cron/trigger-conversion-emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to trigger conversion emails manually:', error);
    throw error;
  }
}