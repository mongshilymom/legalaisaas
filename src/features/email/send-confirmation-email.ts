import { NextApiRequest, NextApiResponse } from 'next';
// import { Resend } from 'resend'; // 또는 Postmark, SendGrid 등

// const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: '허용되지 않은 요청 방식입니다.' });

  try {
    const { email, plan } = req.body;
    if (!email || !plan) return res.status(400).json({ error: 'email과 plan은 필수입니다.' });

    const subject = '[Legal AI Pro] 프리미엄 결제 완료 안내';
    const html = `
      <h2>🎉 ${plan} 플랜 결제가 완료되었습니다!</h2>
      <p>안녕하세요, ${email}님!</p>
      <p>Legal AI Pro의 프리미엄 기능을 이제부터 모두 이용하실 수 있습니다.</p>
      <ul>
        <li>📄 고급 계약서 생성</li>
        <li>🔍 AI 기반 리스크 분석</li>
        <li>🌐 다국어 지원</li>
        <li>🔒 보안 기능 강화</li>
      </ul>
      <p>언제든지 문의가 있으시면 support@legalai.pro 로 연락주세요!</p>
    `;

    // 실제 전송 로직 (활성화 시)
    // await resend.emails.send({
    //   from: 'noreply@legalai.pro',
    //   to: email,
    //   subject,
    //   html
    // });

    console.log(`✉️ [MOCK] 결제 완료 이메일 발송됨 → ${email}`);
    return res.status(200).json({ message: '이메일 발송 완료' });
  } catch (err) {
    console.error('❌ 이메일 발송 실패:', err);
    return res.status(500).json({ error: '서버 오류' });
  }
}
