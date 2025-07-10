import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/authOptions';
import { getSeoStats } from '../../../lib/logUserAction';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isAdmin = session.user.email?.includes('admin') || 
                 session.user.email === 'developer@legalaisaas.com';
  
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const period = req.query.period as string || '7d';
    const seoStats = await getSeoStats();
    
    const recentVisits = getRecentSeoVisits(period);
    
    res.status(200).json({
      ...seoStats,
      recentVisits,
      period
    });
  } catch (error) {
    console.error('Error fetching SEO stats:', error);
    res.status(500).json({ error: 'Failed to fetch SEO statistics' });
  }
}

function getRecentSeoVisits(period: string) {
  try {
    const logPath = path.join(process.cwd(), 'logs', 'seo-visits.log');
    
    if (!fs.existsSync(logPath)) {
      return [];
    }
    
    const logContent = fs.readFileSync(logPath, 'utf-8');
    const logs = logContent.split('\n').filter(line => line.trim()).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    const periodMs = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    }[period] || 7 * 24 * 60 * 60 * 1000;
    
    const cutoffTime = Date.now() - periodMs;
    
    return logs
      .filter(log => new Date(log.timestamp).getTime() > cutoffTime)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100);
  } catch (error) {
    console.error('Error reading SEO visits:', error);
    return [];
  }
}