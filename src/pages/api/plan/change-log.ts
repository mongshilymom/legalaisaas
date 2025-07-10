import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../features/auth/authOptions';

export interface PlanChangeLog {
  id: string;
  userId: string;
  userEmail: string;
  fromPlan: string;
  toPlan: string;
  changeType: 'upgrade' | 'downgrade' | 'cancellation' | 'reactivation';
  paymentMethod: 'stripe' | 'toss' | 'manual';
  paymentId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reason?: string;
  metadata?: any;
  createdAt: string;
  completedAt?: string;
}

// Mock database - replace with actual database in production
let planChangeLogs: PlanChangeLog[] = [
  {
    id: 'log_001',
    userId: 'user_001',
    userEmail: 'test1@legalai.com',
    fromPlan: 'free',
    toPlan: 'basic',
    changeType: 'upgrade',
    paymentMethod: 'stripe',
    paymentId: 'pi_test_001',
    amount: 29,
    currency: 'USD',
    status: 'completed',
    reason: 'User upgrade via pricing page',
    createdAt: new Date('2024-07-10T10:00:00Z').toISOString(),
    completedAt: new Date('2024-07-10T10:01:00Z').toISOString()
  },
  {
    id: 'log_002',
    userId: 'user_002',
    userEmail: 'test2@legalai.com',
    fromPlan: 'basic',
    toPlan: 'pro',
    changeType: 'upgrade',
    paymentMethod: 'toss',
    paymentId: 'toss_test_002',
    amount: 70,
    currency: 'USD',
    status: 'completed',
    reason: 'Monthly upgrade',
    createdAt: new Date('2024-07-10T11:00:00Z').toISOString(),
    completedAt: new Date('2024-07-10T11:02:00Z').toISOString()
  }
];

let userPlans: { [userId: string]: { plan: string; email: string } } = {
  'user_001': { plan: 'basic', email: 'test1@legalai.com' },
  'user_002': { plan: 'pro', email: 'test2@legalai.com' },
  'user_003': { plan: 'free', email: 'test3@legalai.com' },
  'user_004': { plan: 'free', email: 'test4@legalai.com' }
};

function generateId(): string {
  return 'log_' + Math.random().toString(36).substr(2, 9);
}

function determineChangeType(fromPlan: string, toPlan: string): 'upgrade' | 'downgrade' | 'cancellation' | 'reactivation' {
  const planHierarchy = { free: 0, basic: 1, pro: 2, enterprise: 3 };
  const fromLevel = planHierarchy[fromPlan as keyof typeof planHierarchy] || 0;
  const toLevel = planHierarchy[toPlan as keyof typeof planHierarchy] || 0;
  
  if (toPlan === 'free' && fromPlan !== 'free') return 'cancellation';
  if (fromPlan === 'free' && toPlan !== 'free') return 'reactivation';
  if (toLevel > fromLevel) return 'upgrade';
  if (toLevel < fromLevel) return 'downgrade';
  
  return 'upgrade'; // fallback
}

function getPlanPrice(plan: string): number {
  const prices = { free: 0, basic: 29, pro: 99, enterprise: 299 };
  return prices[plan as keyof typeof prices] || 0;
}

export async function createPlanChangeLog(data: {
  userId: string;
  userEmail: string;
  fromPlan: string;
  toPlan: string;
  paymentMethod: 'stripe' | 'toss' | 'manual';
  paymentId?: string;
  reason?: string;
  metadata?: any;
}): Promise<PlanChangeLog> {
  const log: PlanChangeLog = {
    id: generateId(),
    userId: data.userId,
    userEmail: data.userEmail,
    fromPlan: data.fromPlan,
    toPlan: data.toPlan,
    changeType: determineChangeType(data.fromPlan, data.toPlan),
    paymentMethod: data.paymentMethod,
    paymentId: data.paymentId,
    amount: getPlanPrice(data.toPlan) - getPlanPrice(data.fromPlan),
    currency: 'USD',
    status: 'pending',
    reason: data.reason || 'Plan change requested',
    metadata: data.metadata,
    createdAt: new Date().toISOString()
  };
  
  planChangeLogs.push(log);
  
  // In production, this would save to database
  // await db.planChangeLog.create({ data: log });
  
  return log;
}

export async function updatePlanChangeLog(
  logId: string, 
  updates: Partial<Pick<PlanChangeLog, 'status' | 'completedAt' | 'reason' | 'metadata'>>
): Promise<PlanChangeLog | null> {
  const logIndex = planChangeLogs.findIndex(log => log.id === logId);
  
  if (logIndex === -1) {
    return null;
  }
  
  planChangeLogs[logIndex] = {
    ...planChangeLogs[logIndex],
    ...updates,
    completedAt: updates.status === 'completed' ? new Date().toISOString() : planChangeLogs[logIndex].completedAt
  };
  
  // Update user plan if completed
  if (updates.status === 'completed') {
    const log = planChangeLogs[logIndex];
    userPlans[log.userId] = { plan: log.toPlan, email: log.userEmail };
  }
  
  return planChangeLogs[logIndex];
}

export async function getUserPlanChangeLogs(userId: string): Promise<PlanChangeLog[]> {
  return planChangeLogs.filter(log => log.userId === userId);
}

export async function getAllPlanChangeLogs(): Promise<PlanChangeLog[]> {
  return planChangeLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getUserCurrentPlan(userId: string): Promise<string> {
  return userPlans[userId]?.plan || 'free';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        if (req.query.userId) {
          const logs = await getUserPlanChangeLogs(req.query.userId as string);
          return res.status(200).json({ logs });
        } else {
          // Admin only - get all logs
          const session = await getServerSession(req, res, authOptions);
          if (!session?.user?.email?.includes('admin')) {
            return res.status(403).json({ error: 'Admin access required' });
          }
          
          const allLogs = await getAllPlanChangeLogs();
          return res.status(200).json({ logs: allLogs });
        }

      case 'POST':
        const { userId, userEmail, fromPlan, toPlan, paymentMethod, paymentId, reason, metadata } = req.body;
        
        if (!userId || !userEmail || !fromPlan || !toPlan || !paymentMethod) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const newLog = await createPlanChangeLog({
          userId,
          userEmail,
          fromPlan,
          toPlan,
          paymentMethod,
          paymentId,
          reason,
          metadata
        });
        
        return res.status(201).json({ log: newLog });

      case 'PUT':
        const { logId, status, completedAt, reason: updateReason, metadata: updateMetadata } = req.body;
        
        if (!logId) {
          return res.status(400).json({ error: 'Log ID required' });
        }
        
        const updatedLog = await updatePlanChangeLog(logId, {
          status,
          completedAt,
          reason: updateReason,
          metadata: updateMetadata
        });
        
        if (!updatedLog) {
          return res.status(404).json({ error: 'Log not found' });
        }
        
        return res.status(200).json({ log: updatedLog });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Plan change log API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}