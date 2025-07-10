import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { log } = JSON.parse(req.body || '{}');
  if (!log) return res.status(400).json({ error: 'log가 필요합니다.' });

  const logPath = path.join(process.cwd(), 'logs', 'cron-status.log');
  try {
    fs.appendFileSync(logPath, log, 'utf-8');
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '로그 기록 실패', detail: err });
  }
}
