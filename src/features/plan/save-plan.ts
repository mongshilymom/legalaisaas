import type { NextApiRequest, NextApiResponse } from 'next';
// import { getServerSession } from 'next-auth'; // If using NextAuth
// import { prisma } from '../../lib/prisma'; // If using Prisma or your DB connector

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: '허용되지 않은 요청 방식입니다.' });

  try {
    // const session = await getServerSession(req, res, authOptions);
    // if (!session) return res.status(401).json({ error: '인증된 사용자만 접근 가능합니다.' });

    const { userId, plan } = req.body;

    if (!userId || !plan) return res.status(400).json({ error: 'userId와 plan은 필수입니다.' });

    // 예: DB 저장 로직
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: { subscriptionPlan: plan }
    // });

    console.log(`✅ [서버] 사용자 ${userId}의 플랜이 '${plan}'으로 저장되었습니다.`);

    return res.status(200).json({ message: '플랜 저장 완료' });
  } catch (error) {
    console.error('플랜 저장 오류:', error);
    return res.status(500).json({ error: '서버 오류' });
  }
}
