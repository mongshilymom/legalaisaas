import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/authOptions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한 필요' });
  }

  const logPath = path.join(process.cwd(), 'logs', 'cron-status.log');

  try {
    if (!fs.existsSync(logPath)) return res.status(200).json({ logs: [] });
    const content = fs.readFileSync(logPath, 'utf-8');
    const logs = content.trim().split('\n').reverse();
    return res.status(200).json({ logs });
  } catch (err) {
    return res.status(500).json({ error: '로그 읽기 실패', detail: err });
  }
}
