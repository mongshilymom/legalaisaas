// pages/api/strategy/route.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { callPerplexityReport } from '@/lib/ai/callPerplexity';
import { callGeminiSummary } from '@/lib/ai/callGemini';
import { callClaudeStrategicReport } from '@/lib/ai/callClaude';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, contractId, contractText, summary, riskPoints, mode = 'auto' } = req.body;

  try {
    let result;

    switch (mode) {
      case 'perplexity':
        result = await callPerplexityReport(contractText);
        break;
      case 'gemini':
        result = await callGeminiSummary(contractText);
        break;
      case 'claude':
      case 'auto':
      default:
        result = await callClaudeStrategicReport({ userId, contractId, summary, riskPoints });
        break;
    }

    return res.status(200).json({ result });
  } catch (error) {
    console.error('❌ AI 라우팅 오류:', error);
    return res.status(500).json({ error: 'AI 전략 분석 중 오류 발생' });
  }
}