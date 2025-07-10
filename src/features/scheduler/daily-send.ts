export const config = { runtime: 'edge' };

export default async function handler() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-click-chart-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  return new Response('✅ 추천가 클릭 차트 메일 전송 완료');
}
