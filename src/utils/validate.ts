// pages/api/validate.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { contractContent, userData } = req.body;

  if (!contractContent || contractContent.length < 50) {
    return res.status(400).json({ valid: false, message: "계약 내용이 너무 짧습니다." });
  }

  if (!userData?.companyName) {
    return res.status(400).json({ valid: false, message: "회사명이 누락되었습니다." });
  }

  return res.status(200).json({ valid: true, message: "검증 완료" });
}