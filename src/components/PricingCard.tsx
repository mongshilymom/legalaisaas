import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export const PricingCard = ({ contractType, price }: { contractType: string, price: number }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ contractType, price }),
    });

    const data = await res.json();
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId: data.id });
    setLoading(false);
  };

  return (
    <div className="border p-4 rounded shadow text-center">
      <h3 className="text-xl font-semibold mb-2">{contractType}</h3>
      <p className="text-2xl font-bold mb-4">{(price / 100).toLocaleString()}원</p>
      <button
        onClick={handlePayment}
        className="bg-green-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? '처리 중...' : '결제하고 시작하기'}
      </button>
    </div>
  );
};