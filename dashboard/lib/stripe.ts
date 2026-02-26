import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

// Map Stripe Price IDs to internal plan names and credit amounts.
// Replace these placeholder IDs with real ones from your Stripe dashboard.
export const PRICE_TO_PLAN: Record<string, { plan: string; credits: number; price: number }> = {
  'price_1T4sDJI8BOMrgAxcwp6QasFi': { plan: 'starter', credits: 100,  price: 20  },
  'price_1T4sDxI8BOMrgAxcvXZtcdUk': { plan: 'pro',     credits: 300,  price: 50  },
  'price_1T4sP2I8BOMrgAxcCSNyeZlz': { plan: 'scale',   credits: 700,  price: 100 },
  'price_1T4sPkI8BOMrgAxcKWMGKS3U': { plan: 'scale',   credits: 1000, price: 145 },
  'price_1T4sQCI8BOMrgAxc6R53jZxr': { plan: 'scale',   credits: 2000, price: 290 },
  'price_1T4sQTI8BOMrgAxcmTJ1ebCw': { plan: 'scale',   credits: 3000, price: 430 },
  'price_1T4sQjI8BOMrgAxco8QqYKJf': { plan: 'scale',   credits: 5000, price: 715 },
}

// Reverse lookup: plan name to default price ID
export const PLAN_TO_PRICE: Record<string, string> = {
  'starter': 'price_1T4sDJI8BOMrgAxcwp6QasFi',
  'pro':     'price_1T4sDxI8BOMrgAxcvXZtcdUk',
  'scale':   'price_1T4sP2I8BOMrgAxcCSNyeZlz',
}

// Scale tier options for the pricing page dropdown
export const SCALE_TIERS = [
  { credits: 700,  price: 100, priceId: 'price_1T4sP2I8BOMrgAxcCSNyeZlz' },
  { credits: 1000, price: 145, priceId: 'price_1T4sPkI8BOMrgAxcKWMGKS3U' },
  { credits: 2000, price: 290, priceId: 'price_1T4sQCI8BOMrgAxc6R53jZxr' },
  { credits: 3000, price: 430, priceId: 'price_1T4sQTI8BOMrgAxcmTJ1ebCw' },
  { credits: 5000, price: 715, priceId: 'price_1T4sQjI8BOMrgAxco8QqYKJf' },
]
