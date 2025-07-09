'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function DynamicPriceBox({ selectedPlan }: { selectedPlan: string }) {
  const { data: session, status } = useSession();
  const [price, setPrice] = useState(199000);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrice = async () => {
      if (selectedPlan !== 'premium' || !session?.user?.email) return;

      setLoading(true);
      try {
        const res = await fetch('/api/claude/optimize-pricing', {
          method: 'POST',
          body: JSON.stringify({
            prompt: \`이 사용자의 이메일은 \${session?.user?.email}, 현재 플랜은 basic입니다. 프리미엄 요금 추천해줘.\`,
            email: session?.user?.email
          }),
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        setPrice(data.suggestedPrice ?? 199000);
        setReason(data.reason ?? '');
      } catch {
        setPrice(199000);
        setReason('');
      }
      setLoading(false);
    };

    fetchPrice();
  }, [selectedPlan, session?.user?.email]);

  const handleClick = async () => {
    if (!session?.user) return;

    await fetch('/api/track-click', {
      method: 'POST',
      body: JSON.stringify({
        email: session.user.email,
        clickedPrice: price,
        reason,
        timestamp: new Date().toISOString()
      }),
      headers: { 'Content-Type': 'application/json' }
    });
  };

  if (status === 'loading') return null;

  return (
    <div
      className="border rounded-md p-4 bg-white shadow-sm mt-4 w-full sm:max-w-md mx-auto cursor-pointer hover:shadow-md transition"
      onClick={handleClick}
    >
      <h2 className="text-lg font-bold text-center sm:text-left">프리미엄 요금제</h2>
      <p className="text-3xl font-semibold mt-2 text-center sm:text-left text-blue-700">
        ₩{price.toLocaleString()}원
      </p>

      {!session?.user && (
        <p className="text-sm text-gray-500 mt-2 text-center sm:text-left italic">
          🔒 로그인 후 AI 최적 요금이 표시됩니다.
        </p>
      )}

      {session?.user && loading && (
        <p className="text-blue-500 text-sm mt-1 text-center sm:text-left">
          ⏳ AI 최적 요금 분석 중...
        </p>
      )}

      {session?.user && !loading && reason && (
        <p className="text-sm text-gray-600 mt-2 italic text-center sm:text-left">
          📌 <span className="font-medium">AI 추천 사유:</span> {reason}
        </p>
      )}
    </div>
  );
}
