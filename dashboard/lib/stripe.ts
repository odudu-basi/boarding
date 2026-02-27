import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

// Map Stripe Price IDs to internal plan names and credit amounts.
export const PRICE_TO_PLAN: Record<string, { plan: string; credits: number; price: number }> = {
  'price_1T5Mf1KHtI6VLNHOM7WqGj9l': { plan: 'starter', credits: 100,  price: 20  },
  'price_1T5MfOKHtI6VLNHOQtPzywEO': { plan: 'pro',     credits: 300,  price: 50  },
  'price_1T5MfnKHtI6VLNHOM16BdKLr': { plan: 'scale',   credits: 700,  price: 100 },
  'price_1T5Mg3KHtI6VLNHONUaorpm7': { plan: 'scale',   credits: 1000, price: 145 },
  'price_1T5MgTKHtI6VLNHOZp2NrLOI': { plan: 'scale',   credits: 2000, price: 290 },
  'price_1T5MgnKHtI6VLNHOtPKJdIwy': { plan: 'scale',   credits: 3000, price: 430 },
  'price_1T5Mh6KHtI6VLNHODM3dAkZW': { plan: 'scale',   credits: 5000, price: 715 },
}

// Reverse lookup: plan name to default price ID
export const PLAN_TO_PRICE: Record<string, string> = {
  'starter': 'price_1T5Mf1KHtI6VLNHOM7WqGj9l',
  'pro':     'price_1T5MfOKHtI6VLNHOQtPzywEO',
  'scale':   'price_1T5MfnKHtI6VLNHOM16BdKLr',
}

// Scale tier options for the pricing page dropdown
export const SCALE_TIERS = [
  { credits: 700,  price: 100, priceId: 'price_1T5MfnKHtI6VLNHOM16BdKLr' },
  { credits: 1000, price: 145, priceId: 'price_1T5Mg3KHtI6VLNHONUaorpm7' },
  { credits: 2000, price: 290, priceId: 'price_1T5MgTKHtI6VLNHOZp2NrLOI' },
  { credits: 3000, price: 430, priceId: 'price_1T5MgnKHtI6VLNHOtPKJdIwy' },
  { credits: 5000, price: 715, priceId: 'price_1T5Mh6KHtI6VLNHODM3dAkZW' },
]
