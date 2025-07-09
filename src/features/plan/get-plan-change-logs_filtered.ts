import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../authOptions';
// import { prisma } from '../../lib/prisma';

function isWithinRange(dateStr, startStr, endStr) {
  const date = new Date(dateStr).getTime();
  const start = startStr ? new Date(startStr).getTime() : -Infinity;
  const end = endStr ? new Date(endStr).getTime() : Infinity;
  return date >= start && date <= end;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: '허용되지 않은 요청 방식입니다.' });

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.email !== 'admin@example.com') {
    return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
  }

  try {
    const { startDate, endDate } = req.query;

    const allLogs = [
      { email: 'user1@example.com', oldPlan: 'basic', newPlan: 'premium', changedAt: '2025-07-09T09:30:00Z' },
      { email: 'user2@example.com', oldPlan: 'premium', newPlan: 'enterprise', changedAt: '2025-07-10T11:10:00Z' },
      { email: 'user3@example.com', oldPlan: 'basic', newPlan: 'premium', changedAt: '2025-07-12T14:00:00Z' }
    ];

    const filteredLogs = allLogs.filter((log) =>
      isWithinRange(log.changedAt, startDate as string, endDate as string)
    );

    return res.status(200).json({ logs: filteredLogs });
  } catch (err) {
    console.error('❌ 필터링 로그 불러오기 실패:', err);
    return res.status(500).json({ error: '서버 오류' });
  }
}
