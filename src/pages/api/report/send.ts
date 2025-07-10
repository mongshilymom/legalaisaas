import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/authOptions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Trigger daily report manually
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/daily-send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send report');
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Report send error:', error);
    res.status(500).json({ error: 'Failed to send report' });
  }
}
