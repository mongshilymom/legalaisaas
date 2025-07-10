export const callAI = async (prompt: string): Promise<string> => {
  try {
    // 기본: Claude API 호출
    return await window.claude.complete(prompt);
  } catch (err1) {
    console.warn("Claude 실패 → GPT 시도");
    try {
      const res = await fetch('/api/gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const json = await res.json();
      return json.result;
    } catch (err2) {
      console.warn("GPT 실패 → Bedrock 시도");
      try {
        const res = await fetch('/api/bedrock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const json = await res.json();
        return json.result;
      } catch (err3) {
        console.error("모든 AI API 실패");
        return "❌ AI 응답에 실패했습니다. 다시 시도해 주세요.";
      }
    }
  }
};