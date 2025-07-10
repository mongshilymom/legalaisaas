export const config = { runtime: 'edge' };

export default async function handler() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-click-chart-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const log = `[${new Date().toISOString()}] CRON STATUS: ${
      res.ok ? '✅ SUCCESS' : '❌ FAIL'
    } (${res.status})\n`;

    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/log-cron-status`, {
      method: 'POST',
      body: JSON.stringify({ log }),
      headers: { 'Content-Type': 'application/json' }
    });

    return new Response('✅ 추천가 클릭 차트 메일 전송 완료');
  } catch (err) {
    const failLog = `[${new Date().toISOString()}] CRON STATUS: ❌ ERROR\n`;
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/log-cron-status`, {
      method: 'POST',
      body: JSON.stringify({ log: failLog }),
      headers: { 'Content-Type': 'application/json' }
    });

    return new Response('❌ 메일 전송 및 로그 기록 실패', { status: 500 });
  }
}
