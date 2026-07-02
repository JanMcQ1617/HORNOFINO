# HORNOFINO

A website for **Hornofino** — an artisan bakery & café — in an **orange-forward
colorway**: a warm cream ground with the brand's bold orange (`#fc4c02`, from
[hornofino.com](https://www.hornofino.com/)) leading, plus solid-orange hero/CTA
bands, a Greek-key (meander) motif, and inscriptional Cinzel typography.

> Structure follows hornofino.com (menu categories, locations, online-ordering, and
> customer reviews), rebuilt as a fast static multi-page site.

## Design system

Orange-forward: warm cream ground with the brand orange leading.

| Token         | Value     | Use                          |
| ------------- | --------- | ---------------------------- |
| Warm cream    | `#fdf3ea` | Background                   |
| White         | `#ffffff` | Cards & panels               |
| Brand orange  | `#fc4c02` | Primary — buttons, bands, accents |
| Deep orange   | `#d83a00` | Hover                        |
| Warm amber    | `#d98a1e` | Highlights, eyebrows         |
| Warm charcoal | `#241a12` | Text                         |

- **Display type:** Cinzel · **Body serif:** Cormorant Garamond · **UI sans:** Jost
- **Motif:** Greek-key meander dividers (`assets/meander.svg` used as a CSS mask)
- Pure HTML/CSS/JS — no build step, no dependencies.

## Structure

Multi-page static site — shared nav/footer, design system, and motif across every page.

```
index.html      # Home — hero, story & menu teasers, reviews, CTA
menu.html       # Full itemized menu by category, with prices
about.html      # Our Story — values, φιλοξενία, timeline
locations.html  # Three bakeries — hours, addresses, directions
contact.html    # Contact & online-order form (demo)
styles.css      # design system + layout for all pages
script.js       # mobile nav, reveal-on-scroll, form handling
assets/
  logo-white.png / logo-dark.png  # brand wordmark (white for dark, dark spare)
  favicon.png     # brand "H" on orange
  meander.svg     # tileable Greek-key band
  hero.jpg, breakfast/breads/pastries/sandwiches/soups/drinks  # food imagery
```

## Run locally

Just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Brand assets

This site is built **for Hornofino** using the brand's own assets:

- **Logo** — `logo-dark.png` (nav, on light marble) and `logo-white.png` (footer, on
  dark) are the Hornofino *Pan · Café · Vino* wordmark, recolored from the brand's
  original white logo. `favicon.png` is the brand "H" letterform on Aegean blue.
- **Food photography** — breakfast, pastries, sandwiches, soups, and drinks are
  Hornofino's own product photos. The hero banner is composed from three of them.
- **`breads.jpg`** is a placeholder marble scene (no bread photo exists in the brand
  set yet) — swap in a real bread shot when available.
- The **Greek-key (meander) motif** and the marble / Aegean-blue / olive-gold styling
  are original design work for this project.

## Live site

Hosted on GitHub Pages: **https://janmcq1617.github.io/HORNOFINO/**

## Pages

- **Home** — hero, story & menu teasers, online-ordering CTA, reviews
- **Menu** — Breakfast, Breads, Pastries, Sandwiches, Soups, Drinks (itemized with prices)
- **Our Story** — fire / time / φιλοξενία values and a short timeline
- **Locations** — Harbor Street, Olive Square, Marble Row
- **Contact** — order/contact form (demo, confirms on-screen)
- **Basket** (`cart.html`) — line items, quantity steppers, live totals
- **Checkout** (`checkout.html`) — customer details + secure pay button

## 3D arrow journey (home page)

A stylized Greek marble archer (built from Three.js primitives, no model files)
stands beside the hero. Scrolling draws his bow and releases a 3D arrow that flies
along a spline through the page's waypoints — story, menu cards, order CTA, and
reviews — flashing each one and popping a label chip as it passes. Click the statue
or the **Release the Arrow** button for an auto-scroll tour. Implementation in
[journey.js](journey.js) (Three.js via CDN import map, fixed transparent canvas,
1 world unit = 1 CSS px at z=0, `pointer-events: none` so the page stays fully
interactive). Disabled under `prefers-reduced-motion`.

## Cart & payments

- Client-side cart in `cart.js` — add-to-cart on every menu item, basket persists in
  `localStorage`, live count badge in the nav, quantity/remove on the basket page.
- Checkout is **stubbed for Stripe**: it confirms on-screen today and takes no money.
  To enable real card payments, follow **[STRIPE-SETUP.md](STRIPE-SETUP.md)** (deploy a
  small serverless function + set two values in `cart.js`). Card data never touches the
  site — Stripe handles it on its own secure page.
