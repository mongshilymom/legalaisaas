import nodemailer from 'nodemailer';
import { EmailTemplate } from './growth-template';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

let transporter: nodemailer.Transporter | null = null;

function createTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };

  transporter = nodemailer.createTransporter(config);
  
  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const emailTransporter = createTransporter();
    
    // Verify transporter configuration
    await emailTransporter.verify();
    
    const mailOptions = {
      from: options.from || process.env.SMTP_USER,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    
    console.log('📧 Email sent successfully:', {
      messageId: info.messageId,
      recipients: mailOptions.to,
      subject: options.subject,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('📧 Email sending failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    };
  }
}

export async function sendTemplateEmail(
  template: EmailTemplate,
  recipients: string | string[],
  from?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendEmail({
    from: from || process.env.SMTP_USER || 'noreply@legalaisaas.com',
    to: recipients,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const emailTransporter = createTransporter();
    await emailTransporter.verify();
    
    console.log('✅ Email connection test successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Email connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown connection error',
    };
  }
}

export function getAdminEmails(): string[] {
  const adminEmails = process.env.ADMIN_EMAILS || 'admin@example.com,developer@legalaisaas.com';
  return adminEmails.split(',').map(email => email.trim()).filter(Boolean);
}

// Email template for testing
export function generateTestEmail(): EmailTemplate {
  return {
    subject: '🧪 Legal AI SaaS - Email Test',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3b82f6;">Email Test Successful! ✅</h1>
        <p>This is a test email from the Legal AI SaaS system.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h3>System Information:</h3>
          <ul>
            <li>SMTP Host: ${process.env.SMTP_HOST}</li>
            <li>SMTP Port: ${process.env.SMTP_PORT}</li>
            <li>Environment: ${process.env.NODE_ENV}</li>
          </ul>
        </div>
        <p>If you received this email, the email system is working correctly.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Legal AI SaaS Development Team
        </p>
      </div>
    `,
    text: `
Email Test Successful!

This is a test email from the Legal AI SaaS system.
Timestamp: ${new Date().toISOString()}

System Information:
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- Environment: ${process.env.NODE_ENV}

If you received this email, the email system is working correctly.

Legal AI SaaS Development Team
    `,
  };
}