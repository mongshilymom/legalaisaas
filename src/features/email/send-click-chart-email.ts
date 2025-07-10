import nodemailer from 'nodemailer';
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

  const chartPath = path.join(process.cwd(), 'public', 'charts', 'click_price_chart_admin_dashboard.png');
  if (!fs.existsSync(chartPath)) return res.status(404).json({ error: '차트 파일이 없습니다.' });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to: process.env.EMAIL_RECEIVER ?? session.user.email,
    subject: '📊 추천가 클릭 차트 리포트 (자동 발송)',
    html: \`
      <h2>📊 Claude 추천가 클릭 분포</h2>
      <p>아래는 최근 기준 클릭 로그 통계 차트입니다.</p>
      <img src="cid:chartimg" style="max-width: 100%; border: 1px solid #ccc; border-radius: 6px;" />
    \`,
    attachments: [
      {
        filename: 'click_price_chart_admin_dashboard.png',
        path: chartPath,
        cid: 'chartimg'
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '메일 전송 실패', detail: err });
  }
}
