import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../features/auth/authOptions';
import { getSeoStats } from '../../../lib/logUserAction';
import fs from 'fs';
import path from 'path';

interface TrafficAnalytics {
  seoVisitors: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  conversions: {
    total: number;
    rate: number;
    topConvertingPages: { page: string; conversions: number }[];
  };
  topPages: { page: string; visits: number }[];
  topSeoTags: { tag: string; visits: number; conversions: number; rate: number }[];
  trends: {
    daily: { date: string; visits: number; conversions: number }[];
    weekly: { week: string; visits: number; conversions: number }[];
  };
}

async function getDetailedTrafficAnalytics(): Promise<TrafficAnalytics> {
  try {
    const logPath = path.join(process.cwd(), 'logs', 'user-actions.log');
    
    if (!fs.existsSync(logPath)) {
      return getEmptyAnalytics();
    }
    
    const logContent = fs.readFileSync(logPath, 'utf-8');
    const logs = logContent.split('\n').filter(line => line.trim()).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Filter SEO visitors and CTA clicks
    const seoVisitors = logs.filter(log => log.type === 'SEO_VISITOR');
    const seoConversions = logs.filter(log => log.type === 'CTA_CLICK' && log.source === 'seo');
    
    // Time-based metrics
    const todaySeoVisitors = seoVisitors.filter(log => new Date(log.timestamp) >= today);
    const weekSeoVisitors = seoVisitors.filter(log => new Date(log.timestamp) >= weekStart);
    const monthSeoVisitors = seoVisitors.filter(log => new Date(log.timestamp) >= monthStart);
    
    // Page analytics
    const pageVisits = seoVisitors.reduce((acc, log) => {
      if (log.page) {
        acc[log.page] = (acc[log.page] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const pageConversions = seoConversions.reduce((acc, log) => {
      if (log.page) {
        acc[log.page] = (acc[log.page] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topPages = Object.entries(pageVisits)
      .map(([page, visits]) => ({ page, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);
    
    const topConvertingPages = Object.entries(pageConversions)
      .map(([page, conversions]) => ({ page, conversions }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 5);
    
    // SEO tag analytics
    const tagAnalytics = seoVisitors.reduce((acc, log) => {
      if (log.tag) {
        if (!acc[log.tag]) {
          acc[log.tag] = { visits: 0, conversions: 0 };
        }
        acc[log.tag].visits += 1;
      }
      return acc;
    }, {} as Record<string, { visits: number; conversions: number }>);
    
    seoConversions.forEach(log => {
      if (log.tag && tagAnalytics[log.tag]) {
        tagAnalytics[log.tag].conversions += 1;
      }
    });
    
    const topSeoTags = Object.entries(tagAnalytics)
      .map(([tag, data]) => ({
        tag,
        visits: data.visits,
        conversions: data.conversions,
        rate: data.visits > 0 ? Math.round((data.conversions / data.visits) * 10000) / 100 : 0
      }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);
    
    // Trend analytics
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();
    
    const dailyTrends = last30Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const dayVisits = seoVisitors.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= dayStart && logDate < dayEnd;
      }).length;
      
      const dayConversions = seoConversions.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= dayStart && logDate < dayEnd;
      }).length;
      
      return {
        date: dateStr,
        visits: dayVisits,
        conversions: dayConversions
      };
    });
    
    // Weekly trends
    const last12Weeks = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() - (i * 7));
      return date;
    }).reverse();
    
    const weeklyTrends = last12Weeks.map(weekDate => {
      const weekEnd = new Date(weekDate);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekVisits = seoVisitors.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= weekDate && logDate < weekEnd;
      }).length;
      
      const weekConversions = seoConversions.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= weekDate && logDate < weekEnd;
      }).length;
      
      return {
        week: `${weekDate.getMonth() + 1}/${weekDate.getDate()}`,
        visits: weekVisits,
        conversions: weekConversions
      };
    });
    
    const conversionRate = seoVisitors.length > 0 ? 
      Math.round((seoConversions.length / seoVisitors.length) * 10000) / 100 : 0;
    
    return {
      seoVisitors: {
        total: seoVisitors.length,
        today: todaySeoVisitors.length,
        thisWeek: weekSeoVisitors.length,
        thisMonth: monthSeoVisitors.length
      },
      conversions: {
        total: seoConversions.length,
        rate: conversionRate,
        topConvertingPages
      },
      topPages,
      topSeoTags,
      trends: {
        daily: dailyTrends,
        weekly: weeklyTrends
      }
    };
  } catch (error) {
    console.error('Error getting detailed traffic analytics:', error);
    return getEmptyAnalytics();
  }
}

function getEmptyAnalytics(): TrafficAnalytics {
  return {
    seoVisitors: { total: 0, today: 0, thisWeek: 0, thisMonth: 0 },
    conversions: { total: 0, rate: 0, topConvertingPages: [] },
    topPages: [],
    topSeoTags: [],
    trends: { daily: [], weekly: [] }
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check admin authentication
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to access analytics'
      });
    }

    // You might want to add admin role check here
    // For now, allowing any authenticated user
    
    console.log('📊 Traffic analytics request from:', session.user.email);

    const analytics = await getDetailedTrafficAnalytics();
    
    console.log('✅ Traffic analytics generated:', {
      totalSeoVisitors: analytics.seoVisitors.total,
      conversionRate: analytics.conversions.rate,
      topPageCount: analytics.topPages.length,
      trendDataPoints: analytics.trends.daily.length
    });

    res.status(200).json({
      success: true,
      data: analytics,
      meta: {
        timestamp: new Date().toISOString(),
        generatedBy: session.user.email
      }
    });

  } catch (error) {
    console.error('❌ Traffic analytics failed:', error);

    res.status(500).json({
      success: false,
      error: 'Analytics generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}