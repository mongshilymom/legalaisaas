import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { createPlanChangeLog, updatePlanChangeLog } from '../plan/change-log';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

// Mock user lookup - replace with actual database
const mockUsers: { [email: string]: { id: string; currentPlan: string } } = {
  'test1@legalai.com': { id: 'user_001', currentPlan: 'free' },
  'test2@legalai.com': { id: 'user_002', currentPlan: 'free' },
  'test3@legalai.com': { id: 'user_003', currentPlan: 'free' },
  'test4@legalai.com': { id: 'user_004', currentPlan: 'free' },
};

function getPlanFromPriceId(priceId: string): string {
  // Map Stripe price IDs to plan names
  const priceIdToPlan: { [key: string]: string } = {
    'price_basic_monthly': 'basic',
    'price_basic_yearly': 'basic',
    'price_pro_monthly': 'pro',
    'price_pro_yearly': 'pro',
    'price_enterprise_monthly': 'enterprise',
    'price_enterprise_yearly': 'enterprise',
  };
  
  return priceIdToPlan[priceId] || 'basic';
}

async function sendConfirmationEmail(userEmail: string, eventType: string, planName: string) {
  // Mock email sending - replace with actual email service
  console.log(`📧 Email sent to ${userEmail}:`, {
    type: eventType,
    plan: planName,
    timestamp: new Date().toISOString()
  });
  
  // In production, use nodemailer or your email service:
  /*
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: userEmail,
    subject: `Payment ${eventType} - Legal AI SaaS`,
    html: emailTemplate
  });
  */
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  console.log('🔔 Stripe webhook received:', event.type);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('💰 Payment succeeded:', paymentIntent.id);
        
        // Get customer and subscription info
        const customerId = paymentIntent.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const userEmail = customer.email!;
        
        // Find user
        const user = mockUsers[userEmail];
        if (!user) {
          console.error('User not found for email:', userEmail);
          break;
        }
        
        // Create plan change log
        const planChangeLog = await createPlanChangeLog({
          userId: user.id,
          userEmail,
          fromPlan: user.currentPlan,
          toPlan: 'basic', // Default for one-time payments
          paymentMethod: 'stripe',
          paymentId: paymentIntent.id,
          reason: 'Stripe payment succeeded',
          metadata: {
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            paymentMethodId: paymentIntent.payment_method,
          }
        });
        
        // Update log to completed
        await updatePlanChangeLog(planChangeLog.id, {
          status: 'completed',
          completedAt: new Date().toISOString()
        });
        
        // Send confirmation email
        await sendConfirmationEmail(userEmail, 'succeeded', 'basic');
        
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ Payment failed:', paymentIntent.id);
        
        const customerId = paymentIntent.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const userEmail = customer.email!;
        
        const user = mockUsers[userEmail];
        if (!user) break;
        
        const planChangeLog = await createPlanChangeLog({
          userId: user.id,
          userEmail,
          fromPlan: user.currentPlan,
          toPlan: user.currentPlan, // No change on failure
          paymentMethod: 'stripe',
          paymentId: paymentIntent.id,
          reason: 'Stripe payment failed',
          metadata: {
            error: paymentIntent.last_payment_error,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
          }
        });
        
        await updatePlanChangeLog(planChangeLog.id, {
          status: 'failed',
          reason: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
        });
        
        await sendConfirmationEmail(userEmail, 'failed', user.currentPlan);
        
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🔄 Subscription created:', subscription.id);
        
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const userEmail = customer.email!;
        const user = mockUsers[userEmail];
        if (!user) break;
        
        // Get plan from price ID
        const priceId = subscription.items.data[0].price.id;
        const newPlan = getPlanFromPriceId(priceId);
        
        const planChangeLog = await createPlanChangeLog({
          userId: user.id,
          userEmail,
          fromPlan: user.currentPlan,
          toPlan: newPlan,
          paymentMethod: 'stripe',
          paymentId: subscription.id,
          reason: 'Stripe subscription created',
          metadata: {
            subscriptionId: subscription.id,
            priceId,
            interval: subscription.items.data[0].price.recurring?.interval,
          }
        });
        
        await updatePlanChangeLog(planChangeLog.id, {
          status: 'completed',
          completedAt: new Date().toISOString()
        });
        
        await sendConfirmationEmail(userEmail, 'subscription_created', newPlan);
        
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🔄 Subscription updated:', subscription.id);
        
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const userEmail = customer.email!;
        const user = mockUsers[userEmail];
        if (!user) break;
        
        const priceId = subscription.items.data[0].price.id;
        const newPlan = getPlanFromPriceId(priceId);
        
        // Only log if plan actually changed
        if (newPlan !== user.currentPlan) {
          const planChangeLog = await createPlanChangeLog({
            userId: user.id,
            userEmail,
            fromPlan: user.currentPlan,
            toPlan: newPlan,
            paymentMethod: 'stripe',
            paymentId: subscription.id,
            reason: 'Stripe subscription updated',
            metadata: {
              subscriptionId: subscription.id,
              priceId,
              status: subscription.status,
            }
          });
          
          await updatePlanChangeLog(planChangeLog.id, {
            status: 'completed',
            completedAt: new Date().toISOString()
          });
          
          await sendConfirmationEmail(userEmail, 'subscription_updated', newPlan);
        }
        
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🗑️ Subscription cancelled:', subscription.id);
        
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const userEmail = customer.email!;
        const user = mockUsers[userEmail];
        if (!user) break;
        
        const planChangeLog = await createPlanChangeLog({
          userId: user.id,
          userEmail,
          fromPlan: user.currentPlan,
          toPlan: 'free',
          paymentMethod: 'stripe',
          paymentId: subscription.id,
          reason: 'Stripe subscription cancelled',
          metadata: {
            subscriptionId: subscription.id,
            cancelledAt: subscription.canceled_at,
            cancelReason: subscription.cancellation_details?.reason,
          }
        });
        
        await updatePlanChangeLog(planChangeLog.id, {
          status: 'completed',
          completedAt: new Date().toISOString()
        });
        
        await sendConfirmationEmail(userEmail, 'subscription_cancelled', 'free');
        
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('🧾 Invoice payment succeeded:', invoice.id);
        
        // Handle recurring payment success
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
          const userEmail = customer.email!;
          
          await sendConfirmationEmail(userEmail, 'recurring_payment_succeeded', 'current_plan');
        }
        
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('❌ Invoice payment failed:', invoice.id);
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
          const userEmail = customer.email!;
          const user = mockUsers[userEmail];
          
          if (user) {
            const planChangeLog = await createPlanChangeLog({
              userId: user.id,
              userEmail,
              fromPlan: user.currentPlan,
              toPlan: user.currentPlan,
              paymentMethod: 'stripe',
              paymentId: invoice.id,
              reason: 'Stripe recurring payment failed',
              metadata: {
                invoiceId: invoice.id,
                subscriptionId: invoice.subscription,
                attemptCount: invoice.attempt_count,
              }
            });
            
            await updatePlanChangeLog(planChangeLog.id, {
              status: 'failed',
              reason: 'Recurring payment failed'
            });
            
            await sendConfirmationEmail(userEmail, 'recurring_payment_failed', user.currentPlan);
          }
        }
        
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.status(200).json({ received: true, event: event.type });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler error' });
  }
}