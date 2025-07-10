import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../features/auth/authOptions';
import { getUserCurrentPlan } from '../plan/change-log';

// Mock user database - replace with actual database
const mockUsers: { [email: string]: { id: string; plan: string; subscriptionId?: string; } } = {
  'test1@legalai.com': { id: 'user_001', plan: 'free' },
  'test2@legalai.com': { id: 'user_002', plan: 'basic', subscriptionId: 'sub_test_002' },
  'test3@legalai.com': { id: 'user_003', plan: 'pro', subscriptionId: 'sub_test_003' },
  'test4@legalai.com': { id: 'user_004', plan: 'free' },
  'admin@example.com': { id: 'admin_001', plan: 'enterprise' },
  'developer@legalaisaas.com': { id: 'dev_001', plan: 'enterprise' },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userEmail = session.user.email;
    const user = mockUsers[userEmail];
    
    if (!user) {
      // New user - default to free plan
      return res.status(200).json({
        plan: 'free',
        userId: 'new_user',
        subscriptionId: null,
        isActive: true,
        nextBillingDate: null,
        features: {
          monthlyQueries: 100,
          fileUploads: 5,
          advancedAnalysis: false,
          contractGeneration: false,
          prioritySupport: false,
          apiAccess: false
        }
      });
    }

    // Get the most up-to-date plan from change logs
    const currentPlan = await getUserCurrentPlan(user.id);
    
    const planFeatures = {
      free: {
        monthlyQueries: 100,
        fileUploads: 5,
        advancedAnalysis: false,
        contractGeneration: false,
        prioritySupport: false,
        apiAccess: false
      },
      basic: {
        monthlyQueries: 1000,
        fileUploads: 50,
        advancedAnalysis: true,
        contractGeneration: true,
        prioritySupport: false,
        apiAccess: false
      },
      pro: {
        monthlyQueries: 10000,
        fileUploads: 500,
        advancedAnalysis: true,
        contractGeneration: true,
        prioritySupport: true,
        apiAccess: true
      },
      enterprise: {
        monthlyQueries: -1, // unlimited
        fileUploads: -1,    // unlimited
        advancedAnalysis: true,
        contractGeneration: true,
        prioritySupport: true,
        apiAccess: true
      }
    };

    const features = planFeatures[currentPlan as keyof typeof planFeatures] || planFeatures.free;

    // Calculate next billing date (mock)
    const nextBillingDate = currentPlan !== 'free' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      : null;

    return res.status(200).json({
      plan: currentPlan,
      userId: user.id,
      subscriptionId: user.subscriptionId || null,
      isActive: currentPlan !== 'free',
      nextBillingDate,
      features,
      canUpgrade: currentPlan === 'free' || currentPlan === 'basic',
      canDowngrade: currentPlan === 'pro' || currentPlan === 'enterprise'
    });

  } catch (error) {
    console.error('Current plan API error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch current plan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}