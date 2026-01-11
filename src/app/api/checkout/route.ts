import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const defaultPrice = process.env.STRIPE_PRICE_ID ?? "price_imoagent_premium";
const launchCoupon = process.env.STRIPE_COUPON_ID ?? null;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const origin =
    request.headers.get("origin") ??
    request.headers.get("x-forwarded-host") ??
    "http://localhost:3000";

  if (!stripeKey) {
    return NextResponse.json({
      url: `${origin}/pricing?status=mock`,
      message: "Stripe desabilitado em desenvolvimento - retorno simulado.",
    });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2024-11-20.acacia",  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: body.priceId ?? defaultPrice,
        quantity: 1,
      },
    ],
    discounts:
      body.voucher === "LancamentoPortugal" && launchCoupon
        ? [{ coupon: launchCoupon }]
        : undefined,
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?status=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    price: defaultPrice,
    voucher: "LancamentoPortugal",
  });
}
