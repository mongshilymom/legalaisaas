import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15'
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { contractType } = req.body;

  if (!contractType?.stripePriceId) {
    return res.status(400).json({ error: 'stripePriceId 누락' });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price: contractType.stripePriceId,
      quantity: 1
    }],
    success_url: \`\${req.headers.origin}/success\`,
    cancel_url: \`\${req.headers.origin}/cancel\`
  });

  res.status(200).json({ id: session.id });
}
