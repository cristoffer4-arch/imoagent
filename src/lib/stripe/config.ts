import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: '',
    features: [
      'Up to 10 properties',
      'Basic search',
      '1 AI agent access',
      'Basic analytics',
    ],
  },
  PRO: {
    name: 'Professional',
    price: 4900, // $49/month in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    features: [
      'Unlimited properties',
      'All 7 AI agents',
      'Advanced search (7+ portals)',
      'SMART goals coaching',
      'Gamification features',
      'Document scanner',
      'Commission calculator',
      'Priority support',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 9900, // $99/month in cents
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Custom integrations',
      'Advanced analytics',
      'White-label option',
      'Dedicated support',
      'Custom AI training',
    ],
  },
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS
