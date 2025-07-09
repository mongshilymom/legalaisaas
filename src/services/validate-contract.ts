// /pages/api/validate-contract.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { contractContent, companyName } = req.body;

  if (!contractContent || contractContent.length < 100) {
    return res.status(400).json({ valid: false, message: "계약 내용이 너무 짧습니다." });
  }

  if (!companyName || companyName.trim().length < 2) {
    return res.status(400).json({ valid: false, message: "회사명이 유효하지 않습니다." });
  }

  const requiredKeywords = ['기간', '급여', '책임', '해지'];
  const missingKeywords = requiredKeywords.filter(word => !contractContent.includes(word));

  if (missingKeywords.length > 0) {
    return res.status(400).json({
      valid: false,
      message: `다음 항목이 누락되었습니다: ${missingKeywords.join(', ')}`,
    });
  }

  return res.status(200).json({ valid: true, message: "✅ 계약서 형식이 유효합니다." });
}