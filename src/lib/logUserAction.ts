import fs from 'fs';
import path from 'path';

export interface UserActionLog {
  type: 'SEO_VISITOR' | 'CTA_CLICK' | 'UPGRADE_ATTEMPT' | 'DOCUMENT_GENERATED' | 'PAGE_VIEW';
  page?: string;
  tag?: string;
  userId?: string;
  source?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  ip?: string;
}

export async function logUserAction(action: Omit<UserActionLog, 'timestamp'>) {
  const logData: UserActionLog = {
    ...action,
    timestamp: new Date().toISOString()
  };

  try {
    const logDir = path.join(process.cwd(), 'logs');
    const logPath = path.join(logDir, 'user-actions.log');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(logPath, JSON.stringify(logData) + '\n', 'utf-8');
  } catch (error) {
    console.error('User action logging error:', error);
  }
}

export async function getSeoStats(): Promise<{
  totalVisits: number;
  uniquePages: string[];
  topTags: { tag: string; count: number }[];
  conversionRate: number;
}> {
  try {
    const logPath = path.join(process.cwd(), 'logs', 'user-actions.log');
    
    if (!fs.existsSync(logPath)) {
      return { totalVisits: 0, uniquePages: [], topTags: [], conversionRate: 0 };
    }
    
    const logContent = fs.readFileSync(logPath, 'utf-8');
    const logs = logContent.split('\n').filter(line => line.trim()).map(line => {
      try {
        return JSON.parse(line) as UserActionLog;
      } catch {
        return null;
      }
    }).filter(Boolean) as UserActionLog[];
    
    const seoVisits = logs.filter(log => log.type === 'SEO_VISITOR');
    const ctaClicks = logs.filter(log => log.type === 'CTA_CLICK' && log.source === 'seo');
    
    const uniquePages = [...new Set(seoVisits.map(log => log.page).filter(Boolean))];
    
    const tagCounts = seoVisits.reduce((acc, log) => {
      if (log.tag) {
        acc[log.tag] = (acc[log.tag] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const conversionRate = seoVisits.length > 0 ? (ctaClicks.length / seoVisits.length) * 100 : 0;
    
    return {
      totalVisits: seoVisits.length,
      uniquePages,
      topTags,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  } catch (error) {
    console.error('Error getting SEO stats:', error);
    return { totalVisits: 0, uniquePages: [], topTags: [], conversionRate: 0 };
  }
}