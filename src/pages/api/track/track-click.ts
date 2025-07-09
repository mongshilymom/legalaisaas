import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/authOptions';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: '인증 필요' });

  const { email, clickedPrice, reason, timestamp } = JSON.parse(req.body);

  const logDir = path.join(process.cwd(), 'logs');
  const logPath = path.join(logDir, 'click-events.log');

  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
    const logLine = `[${timestamp}] email=${email}, price=${clickedPrice}, reason="${reason}"\n`;
    fs.appendFileSync(logPath, logLine, 'utf-8');
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '로그 기록 실패', detail: err });
  }
}
