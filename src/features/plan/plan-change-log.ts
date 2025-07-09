import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../authOptions';
// import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: '허용되지 않은 요청 방식입니다.' });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: '인증된 사용자만 기록할 수 있습니다.' });

  try {
    const { oldPlan, newPlan } = req.body;
    const email = session.user.email;
    const timestamp = new Date().toISOString();

    if (!oldPlan || !newPlan) return res.status(400).json({ error: 'oldPlan과 newPlan이 필요합니다.' });

    // 예: DB에 기록 (prisma 사용 시)
    // await prisma.planChangeLog.create({
    //   data: { email, oldPlan, newPlan, changedAt: new Date() }
    // });

    console.log(`📋 [PLAN LOG] ${email}: ${oldPlan} → ${newPlan} at ${timestamp}`);
    return res.status(200).json({ message: '플랜 변경 로그 저장 완료' });
  } catch (err) {
    console.error('❌ 플랜 로그 저장 실패:', err);
    return res.status(500).json({ error: '서버 오류' });
  }
}
