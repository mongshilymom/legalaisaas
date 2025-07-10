import { loadStripe } from '@stripe/stripe-js';

export const handlePayment = async (contractType) => {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractType })
  });

  const { id } = await response.json();
  const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);
  await stripe?.redirectToCheckout({ sessionId: id });
};
