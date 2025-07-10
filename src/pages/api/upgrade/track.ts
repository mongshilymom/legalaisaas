import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/authOptions';
import fs from 'fs';
import path from 'path';

interface UpgradeInteraction {
  id: string;
  userId: string;
  action: 'banner_shown' | 'banner_clicked' | 'banner_dismissed' | 'upgrade_click' | 'checkout_started' | 'payment_completed' | 'payment_failed';
  source: string;
  page: string;
  timestamp: string;
  metadata?: {
    featureName?: string;
    currentUsage?: number;
    usageLimit?: number;
    priority?: string;
    planSelected?: string;
    amount?: number;
    currency?: string;
    [key: string]: any;
  };
  sessionId?: string;
  userAgent?: string;
  referrer?: string;
}

const upgradeLogPath = path.join(process.cwd(), 'logs', 'plan-change.log');

function ensureUpgradeLogExists() {
  const logDir = path.dirname(upgradeLogPath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function generateInteractionId(): string {
  return `upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    const {
      action,
      source,
      page,
      timestamp,
      metadata
    } = req.body;

    if (!action || !source || !page) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    ensureUpgradeLogExists();

    const interaction: UpgradeInteraction = {
      id: generateInteractionId(),
      userId: session?.user?.email || 'anonymous',
      action,
      source,
      page,
      timestamp: timestamp || new Date().toISOString(),
      metadata,
      sessionId: req.headers['x-session-id'] as string || `session_${Date.now()}`,
      userAgent: req.headers['user-agent'],
      referrer: req.headers['referer']
    };

    // Append to log file
    fs.appendFileSync(upgradeLogPath, JSON.stringify(interaction) + '\n', 'utf-8');

    // Also log to existing user action system
    const { logUserAction } = await import('../../../lib/logUserAction');
    await logUserAction({
      type: 'UPGRADE_INTERACTION',
      page,
      userId: interaction.userId,
      metadata: {
        action,
        source,
        ...metadata
      }
    });

    res.status(200).json({ 
      success: true, 
      interactionId: interaction.id 
    });

  } catch (error) {
    console.error('Upgrade tracking error:', error);
    res.status(500).json({ error: 'Failed to track upgrade interaction' });
  }
}

// Helper function to get upgrade analytics
export async function getUpgradeAnalytics(
  startDate?: string,
  endDate?: string,
  userId?: string
) {
  try {
    if (!fs.existsSync(upgradeLogPath)) {
      return {
        totalInteractions: 0,
        conversionRate: 0,
        topSources: [],
        timelineData: []
      };
    }

    const logContent = fs.readFileSync(upgradeLogPath, 'utf-8');
    const interactions = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line) as UpgradeInteraction;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Filter by date range if provided
    let filteredInteractions = interactions;
    if (startDate) {
      filteredInteractions = filteredInteractions.filter(
        i => i!.timestamp >= startDate
      );
    }
    if (endDate) {
      filteredInteractions = filteredInteractions.filter(
        i => i!.timestamp <= endDate
      );
    }
    if (userId) {
      filteredInteractions = filteredInteractions.filter(
        i => i!.userId === userId
      );
    }

    // Calculate metrics
    const totalInteractions = filteredInteractions.length;
    const upgradeClicks = filteredInteractions.filter(i => i!.action === 'upgrade_click').length;
    const paymentsCompleted = filteredInteractions.filter(i => i!.action === 'payment_completed').length;
    const bannersShown = filteredInteractions.filter(i => i!.action === 'banner_shown').length;

    const conversionRate = bannersShown > 0 ? (paymentsCompleted / bannersShown) * 100 : 0;

    // Top sources
    const sourceCounts: Record<string, number> = {};
    filteredInteractions.forEach(i => {
      sourceCounts[i!.source] = (sourceCounts[i!.source] || 0) + 1;
    });

    const topSources = Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));

    // Timeline data (daily aggregation)
    const timelineMap: Record<string, { date: string; interactions: number; conversions: number }> = {};
    
    filteredInteractions.forEach(i => {
      const date = i!.timestamp.split('T')[0];
      if (!timelineMap[date]) {
        timelineMap[date] = { date, interactions: 0, conversions: 0 };
      }
      timelineMap[date].interactions++;
      if (i!.action === 'payment_completed') {
        timelineMap[date].conversions++;
      }
    });

    const timelineData = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalInteractions,
      upgradeClicks,
      paymentsCompleted,
      bannersShown,
      conversionRate: Math.round(conversionRate * 100) / 100,
      topSources,
      timelineData,
      summary: {
        clickThroughRate: bannersShown > 0 ? Math.round((upgradeClicks / bannersShown) * 10000) / 100 : 0,
        checkoutConversionRate: upgradeClicks > 0 ? Math.round((paymentsCompleted / upgradeClicks) * 10000) / 100 : 0
      }
    };

  } catch (error) {
    console.error('Failed to get upgrade analytics:', error);
    throw error;
  }
}