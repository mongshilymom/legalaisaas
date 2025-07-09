import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const response = await fetch('https://api.anthropic.com/v1/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens_to_sample: 300,
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`
      })
    });

    const result = await response.json();
    const rawText = result.completion?.trim();

    // 🔍 JSON 파싱
    const parsed = JSON.parse(rawText);
    res.status(200).json(parsed);

  } catch (error) {
    console.error('Claude API 호출 오류:', error);
    res.status(500).json({ error: 'Claude API 호출 실패' });
  }
}
