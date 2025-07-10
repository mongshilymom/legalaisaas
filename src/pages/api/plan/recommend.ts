import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../features/auth/authOptions';

interface UserUsage {
  daily_queries: number;
  monthly_queries: number;
  file_uploads: number;
  ai_analysis_count: number;
  contract_generations: number;
  current_plan: string;
  plan_start_date: string;
  industry: string;
  company_size: string;
}

interface PlanRecommendation {
  recommended_plan: string;
  confidence_score: number;
  reasons: string[];
  upgrade_benefits: string[];
  cost_analysis: {
    current_cost: number;
    recommended_cost: number;
    savings_potential: string;
  };
  ai_insights: string;
}

// Mock user usage data - replace with actual database queries
const getUserUsageData = async (userId: string): Promise<UserUsage> => {
  // This would typically fetch from your database
  return {
    daily_queries: 45,
    monthly_queries: 1200,
    file_uploads: 25,
    ai_analysis_count: 80,
    contract_generations: 15,
    current_plan: 'basic',
    plan_start_date: '2024-06-01',
    industry: 'Legal Services',
    company_size: 'medium'
  };
};

const callClaudeForRecommendation = async (usage: UserUsage): Promise<PlanRecommendation> => {
  const prompt = `
You are a Legal AI SaaS pricing expert. Analyze the following user usage data and provide a personalized plan recommendation.

User Data:
- Current Plan: ${usage.current_plan}
- Daily Queries: ${usage.daily_queries}
- Monthly Queries: ${usage.monthly_queries}
- File Uploads: ${usage.file_uploads}
- AI Analysis Count: ${usage.ai_analysis_count}
- Contract Generations: ${usage.contract_generations}
- Industry: ${usage.industry}
- Company Size: ${usage.company_size}
- Plan Start Date: ${usage.plan_start_date}

Available Plans:
1. Basic Plan ($29/month): 100 queries/month, 5 file uploads, basic AI analysis
2. Pro Plan ($99/month): 1000 queries/month, 50 file uploads, advanced AI analysis, contract generation
3. Enterprise Plan ($299/month): Unlimited queries, unlimited uploads, premium AI features, priority support

Please provide a recommendation in this exact JSON format:
{
  "recommended_plan": "pro|enterprise|basic",
  "confidence_score": 0.85,
  "reasons": ["reason1", "reason2", "reason3"],
  "upgrade_benefits": ["benefit1", "benefit2", "benefit3"],
  "cost_analysis": {
    "current_cost": 29,
    "recommended_cost": 99,
    "savings_potential": "20% efficiency gain"
  },
  "ai_insights": "Detailed explanation of why this plan fits the user's needs"
}

Focus on usage patterns, growth trajectory, and ROI. Be specific and actionable.
`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
        max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '2000'),
        temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7'),
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Extract JSON from Claude's response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response');
    }

    const recommendation: PlanRecommendation = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!recommendation.recommended_plan || !recommendation.reasons || !recommendation.ai_insights) {
      throw new Error('Invalid recommendation structure from Claude');
    }

    return recommendation;
  } catch (error) {
    console.error('Claude API call failed:', error);
    
    // Fallback recommendation based on simple rules
    return generateFallbackRecommendation(usage);
  }
};

const generateFallbackRecommendation = (usage: UserUsage): PlanRecommendation => {
  let recommendedPlan = 'basic';
  let reasons = ['Based on current usage patterns'];
  let upgradeBenefits = ['Enhanced features'];
  
  if (usage.monthly_queries > 800 || usage.file_uploads > 40) {
    recommendedPlan = 'enterprise';
    reasons = [
      'High monthly query volume exceeds Pro plan limits',
      'Frequent file uploads indicate professional usage',
      'Enterprise features would optimize your workflow'
    ];
    upgradeBenefits = [
      'Unlimited queries and file uploads',
      'Priority customer support',
      'Advanced AI analytics',
      'Custom integrations'
    ];
  } else if (usage.monthly_queries > 150 || usage.ai_analysis_count > 20) {
    recommendedPlan = 'pro';
    reasons = [
      'Usage exceeds Basic plan limits',
      'Regular AI analysis indicates professional needs',
      'Contract generation feature would add value'
    ];
    upgradeBenefits = [
      '10x more queries per month',
      'Advanced AI analysis features',
      'Contract generation capability',
      'Priority email support'
    ];
  }

  const currentCost = usage.current_plan === 'basic' ? 29 : usage.current_plan === 'pro' ? 99 : 299;
  const recommendedCost = recommendedPlan === 'basic' ? 29 : recommendedPlan === 'pro' ? 99 : 299;

  return {
    recommended_plan: recommendedPlan,
    confidence_score: 0.75,
    reasons,
    upgrade_benefits: upgradeBenefits,
    cost_analysis: {
      current_cost: currentCost,
      recommended_cost: recommendedCost,
      savings_potential: recommendedCost > currentCost ? 
        `${Math.round(((recommendedCost - currentCost) / currentCost) * 100)}% increase in capabilities` :
        'Optimal plan for current usage'
    },
    ai_insights: `Based on your ${usage.industry} industry usage patterns and ${usage.company_size} company size, the ${recommendedPlan} plan offers the best value for your legal AI needs.`
  };
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

    // Get user usage data
    const userId = session.user.email; // In real app, use proper user ID
    const usageData = await getUserUsageData(userId);

    // Get AI-powered recommendation
    const recommendation = await callClaudeForRecommendation(usageData);

    // Log the recommendation for analytics
    console.log('Plan recommendation generated:', {
      userId,
      currentPlan: usageData.current_plan,
      recommendedPlan: recommendation.recommended_plan,
      confidenceScore: recommendation.confidence_score,
      timestamp: new Date().toISOString()
    });

    // Transform to frontend format
    const response = {
      recommendedPlan: recommendation.recommended_plan === 'pro' ? '프리미엄 플랜' : 
                      recommendation.recommended_plan === 'enterprise' ? '엔터프라이즈 플랜' : '기본 플랜',
      currentPlan: usageData.current_plan === 'pro' ? '프리미엄 플랜' : 
                  usageData.current_plan === 'enterprise' ? '엔터프라이즈 플랜' : '기본 플랜',
      reason: recommendation.ai_insights,
      benefits: recommendation.upgrade_benefits,
      costSavings: recommendation.cost_analysis.recommended_cost > recommendation.cost_analysis.current_cost ? 
                  recommendation.cost_analysis.recommended_cost - recommendation.cost_analysis.current_cost : 0,
      urgency: recommendation.confidence_score > 0.8 ? 'high' : 
               recommendation.confidence_score > 0.6 ? 'medium' : 'low',
      usageStats: {
        contractsGenerated: usageData.contract_generations,
        chatMessages: usageData.monthly_queries,
        documentsAnalyzed: usageData.ai_analysis_count,
        lastActiveDate: new Date().toISOString()
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Plan recommendation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate plan recommendation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}