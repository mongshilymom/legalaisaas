import { NextApiRequest, NextApiResponse } from 'next';
import { createPlanChangeLog, updatePlanChangeLog } from '../plan/change-log';

interface TossWebhookEvent {
  eventType: 'PAYMENT_STATUS_CHANGED';
  createdAt: string;
  data: {
    paymentKey: string;
    orderId: string;
    status: 'READY' | 'IN_PROGRESS' | 'WAITING_FOR_DEPOSIT' | 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED' | 'EXPIRED';
    totalAmount: number;
    currency: string;
    method: string;
    orderName: string;
    approvedAt?: string;
    receipt?: {
      url: string;
    };
    failure?: {
      code: string;
      message: string;
    };
    customer?: {
      id: string;
      name: string;
      email: string;
    };
    metadata?: any;
  };
}

// Mock user lookup
const mockUsers: { [email: string]: { id: string; currentPlan: string } } = {
  'test1@legalai.com': { id: 'user_001', currentPlan: 'free' },
  'test2@legalai.com': { id: 'user_002', currentPlan: 'free' },
  'test3@legalai.com': { id: 'user_003', currentPlan: 'free' },
  'test4@legalai.com': { id: 'user_004', currentPlan: 'free' },
};

function getPlanFromAmount(amount: number): string {
  // Map amounts to plans (in Korean Won)
  if (amount >= 390000) return 'enterprise'; // ~$299
  if (amount >= 129000) return 'pro';        // ~$99
  if (amount >= 38000) return 'basic';       // ~$29
  return 'free';
}

async function sendTossConfirmationEmail(userEmail: string, eventType: string, planName: string, amount?: number) {
  console.log(`📧 Toss Email sent to ${userEmail}:`, {
    type: eventType,
    plan: planName,
    amount: amount ? `₩${amount.toLocaleString()}` : undefined,
    timestamp: new Date().toISOString()
  });
}

function verifyTossWebhook(req: NextApiRequest): boolean {
  // In production, verify the webhook signature
  // const signature = req.headers['toss-signature'];
  // const secret = process.env.TOSS_WEBHOOK_SECRET;
  // return verifySignature(req.body, signature, secret);
  
  // For now, just check if it has required fields
  return req.body && req.body.eventType && req.body.data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyTossWebhook(req)) {
    console.error('Toss webhook verification failed');
    return res.status(400).json({ error: 'Webhook verification failed' });
  }

  const event: TossWebhookEvent = req.body;
  console.log('🔔 Toss webhook received:', event.eventType, event.data.status);

  try {
    if (event.eventType === 'PAYMENT_STATUS_CHANGED') {
      const { data } = event;
      
      // Extract user email from metadata or customer info
      const userEmail = data.customer?.email || data.metadata?.userEmail;
      if (!userEmail) {
        console.error('No user email found in Toss webhook');
        return res.status(400).json({ error: 'User email required' });
      }

      const user = mockUsers[userEmail];
      if (!user) {
        console.error('User not found for email:', userEmail);
        return res.status(404).json({ error: 'User not found' });
      }

      switch (data.status) {
        case 'DONE': {
          console.log('💰 Toss payment succeeded:', data.paymentKey);
          
          const newPlan = getPlanFromAmount(data.totalAmount);
          
          const planChangeLog = await createPlanChangeLog({
            userId: user.id,
            userEmail,
            fromPlan: user.currentPlan,
            toPlan: newPlan,
            paymentMethod: 'toss',
            paymentId: data.paymentKey,
            reason: 'Toss payment succeeded',
            metadata: {
              orderId: data.orderId,
              amount: data.totalAmount,
              currency: data.currency,
              method: data.method,
              orderName: data.orderName,
              approvedAt: data.approvedAt,
              receiptUrl: data.receipt?.url,
            }
          });
          
          await updatePlanChangeLog(planChangeLog.id, {
            status: 'completed',
            completedAt: new Date().toISOString()
          });
          
          await sendTossConfirmationEmail(userEmail, 'payment_succeeded', newPlan, data.totalAmount);
          
          break;
        }

        case 'CANCELED':
        case 'ABORTED':
        case 'EXPIRED': {
          console.log('❌ Toss payment failed/cancelled:', data.paymentKey, data.status);
          
          const planChangeLog = await createPlanChangeLog({
            userId: user.id,
            userEmail,
            fromPlan: user.currentPlan,
            toPlan: user.currentPlan, // No change on failure
            paymentMethod: 'toss',
            paymentId: data.paymentKey,
            reason: `Toss payment ${data.status.toLowerCase()}`,
            metadata: {
              orderId: data.orderId,
              amount: data.totalAmount,
              status: data.status,
              failure: data.failure,
              orderName: data.orderName,
            }
          });
          
          await updatePlanChangeLog(planChangeLog.id, {
            status: 'failed',
            reason: data.failure?.message || `Payment ${data.status.toLowerCase()}`
          });
          
          await sendTossConfirmationEmail(userEmail, 'payment_failed', user.currentPlan, data.totalAmount);
          
          break;
        }

        case 'PARTIAL_CANCELED': {
          console.log('⚠️ Toss payment partially cancelled:', data.paymentKey);
          
          const planChangeLog = await createPlanChangeLog({
            userId: user.id,
            userEmail,
            fromPlan: user.currentPlan,
            toPlan: user.currentPlan,
            paymentMethod: 'toss',
            paymentId: data.paymentKey,
            reason: 'Toss payment partially cancelled',
            metadata: {
              orderId: data.orderId,
              amount: data.totalAmount,
              status: data.status,
              orderName: data.orderName,
            }
          });
          
          await updatePlanChangeLog(planChangeLog.id, {
            status: 'failed',
            reason: 'Payment partially cancelled'
          });
          
          await sendTossConfirmationEmail(userEmail, 'payment_partial_cancel', user.currentPlan, data.totalAmount);
          
          break;
        }

        case 'READY':
        case 'IN_PROGRESS':
        case 'WAITING_FOR_DEPOSIT': {
          console.log(`ℹ️ Toss payment in progress: ${data.paymentKey} - ${data.status}`);
          
          // Create pending log for tracking
          await createPlanChangeLog({
            userId: user.id,
            userEmail,
            fromPlan: user.currentPlan,
            toPlan: getPlanFromAmount(data.totalAmount),
            paymentMethod: 'toss',
            paymentId: data.paymentKey,
            reason: `Toss payment ${data.status.toLowerCase()}`,
            metadata: {
              orderId: data.orderId,
              amount: data.totalAmount,
              status: data.status,
              orderName: data.orderName,
            }
          });
          
          break;
        }

        default:
          console.log(`Unhandled Toss payment status: ${data.status}`);
      }
    }

    res.status(200).json({ received: true, eventType: event.eventType, status: event.data.status });
  } catch (error) {
    console.error('Toss webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler error' });
  }
}