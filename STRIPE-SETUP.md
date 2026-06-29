# Turning on real Stripe payments

The cart and checkout already work end-to-end. Checkout is currently in **stub
mode** — it confirms the order on-screen but takes no money. Flip it to live card
payments by doing two things: (1) deploy a tiny serverless function that creates a
Stripe Checkout Session, and (2) fill in two values in `cart.js`.

> Why a function? Stripe's **secret key** must never live in the website (anyone
> could read it). The browser only uses the **publishable key** and is redirected to
> Stripe's own secure page — so card details never touch this site.

## 1. Deploy the function (Netlify example)

Create `netlify/functions/create-checkout-session.js`:

```js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const { items, customer } = JSON.parse(event.body || "{}");
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer?.email || undefined,
      line_items: (items || []).map((it) => ({
        quantity: it.qty,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(it.price * 100), // cents
          product_data: { name: it.name },
        },
      })),
      success_url: "https://YOUR-SITE/checkout.html?paid=1",
      cancel_url: "https://YOUR-SITE/cart.html",
    });
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};
```

Add `stripe` as a dependency (`npm i stripe`), connect the repo to Netlify, and set
the env var **`STRIPE_SECRET_KEY`** in the Netlify dashboard (use a `sk_test_…` key
first). Netlify serves the function at `/.netlify/functions/create-checkout-session`.

> Prefer Vercel or Cloudflare Workers? Same idea — one endpoint that calls
> `stripe.checkout.sessions.create` and returns `{ url }`.

## 2. Point the site at it

In `cart.js`, near the top:

```js
var STRIPE = {
  publishableKey: "pk_live_or_test_xxx",                 // safe to expose
  endpoint: "/.netlify/functions/create-checkout-session"
};
```

That's it. With both values set, the **Pay with Card** button posts the basket to the
function, gets a Stripe Checkout URL back, and redirects the customer there. Stripe
handles the card, then returns them to `success_url`.

## 3. Test, then go live

- Use **test keys** + Stripe's test card `4242 4242 4242 4242` (any future date/CVC).
- When ready, swap to **live keys** and confirm the success/cancel URLs match the
  real domain.
- Optional next steps: clear the basket on the success page, add a Stripe webhook to
  record paid orders, and collect a delivery address in the Checkout Session.
