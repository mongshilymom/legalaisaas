import { NextApiRequest, NextApiResponse } from 'next';
// import { prisma } from '../../lib/prisma';
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '../authOptions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: '허용되지 않은 요청 방식입니다.' });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: '이메일이 필요합니다.' });

    // const session = await getServerSession(req, res, authOptions);
    // if (!session || session.user.email !== 'admin@example.com') {
    //   return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
    // }

    // 실제 DB 업데이트 예시 (prisma 사용 시)
    // const user = await prisma.user.update({
    //   where: { email },
    //   data: { subscriptionPlan: 'basic' }
    // });

    console.log(`✅ ${email} 사용자의 플랜이 basic으로 초기화되었습니다.`);

    return res.status(200).json({ message: '플랜 초기화 완료' });
  } catch (error) {
    console.error('❌ 초기화 실패:', error);
    return res.status(500).json({ error: '서버 오류' });
  }
}
