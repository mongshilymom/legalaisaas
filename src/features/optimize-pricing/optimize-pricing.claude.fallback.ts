import type { NextApiRequest, NextApiResponse } from 'next';

const cache = new Map<string, { suggestedPrice: number; reason: string }>();
const FALLBACK_PRICE = 199000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const cacheKey = prompt.slice(0, 200);
    if (cache.has(cacheKey)) {
      return res.status(200).json(cache.get(cacheKey));
    }

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

    let parsed = { suggestedPrice: FALLBACK_PRICE, reason: 'Claude 응답이 비정상적이라 기본가 적용' };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.warn('Claude 응답 파싱 실패, fallback 사용');
    }

    cache.set(cacheKey, parsed);
    res.status(200).json(parsed);
  } catch (error) {
    console.error('Claude fallback API 오류:', error);
    res.status(200).json({
      suggestedPrice: FALLBACK_PRICE,
      reason: 'Claude 호출 실패 - 기본가 적용'
    });
  }
}
