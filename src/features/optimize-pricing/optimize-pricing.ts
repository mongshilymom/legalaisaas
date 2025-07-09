import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    // 🧠 Mocked Claude response for now (replace with real Claude API call)
    const simulatedResponse = {
      suggestedPrice: 149000,
      reason: "30% 할인 적용: 현재 사용자의 전환율 및 활동 데이터를 기반으로 한 최적가입니다."
    };

    res.status(200).json(simulatedResponse);
  } catch (error) {
    console.error('Claude pricing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
