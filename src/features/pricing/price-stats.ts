import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/authOptions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한 필요' });
  }

  const logPath = path.join(process.cwd(), 'logs', 'click-events.log');

  try {
    if (!fs.existsSync(logPath)) return res.status(200).json({});
    const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n');
    const counts: Record<string, number> = {};
    lines.forEach(line => {
      const match = line.match(/price=(\d+)/);
      if (match) {
        const price = match[1];
        counts[price] = (counts[price] || 0) + 1;
      }
    });
    return res.status(200).json(counts);
  } catch (err) {
    return res.status(500).json({ error: '처리 실패', detail: err });
  }
}
