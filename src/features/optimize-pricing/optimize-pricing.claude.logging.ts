import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const cache = new Map<string, { suggestedPrice: number; reason: string }>();
const FALLBACK_PRICE = 199000;
const LOG_PATH = path.resolve('./logs/claude-pricing-log.json');

function logToFile(entry: object) {
  try {
    const log = fs.existsSync(LOG_PATH)
      ? JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'))
      : [];
    log.push({ timestamp: new Date().toISOString(), ...entry });
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
  } catch (err) {
    console.error('로그 저장 실패:', err);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, email = 'unknown@user.com' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const cacheKey = prompt.slice(0, 200);
    if (cache.has(cacheKey)) {
      const result = cache.get(cacheKey)!;
      logToFile({ email, source: 'cache', ...result });
      return res.status(200).json(result);
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
    logToFile({ email, source: 'claude', ...parsed });

    res.status(200).json(parsed);
  } catch (error) {
    console.error('Claude API 호출 실패:', error);
    const fallback = {
      suggestedPrice: FALLBACK_PRICE,
      reason: 'Claude 호출 실패 - 기본가 적용'
    };
    logToFile({ email, source: 'fallback', ...fallback });
    res.status(200).json(fallback);
  }
}
