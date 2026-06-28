# HORNOFINO

A minimalist website for **Hornofino** — an artisan bakery & café — rebuilt with a
clean **Greek aesthetic**: marble whites, deep Aegean blue, olive gold, a Greek-key
(meander) motif, and inscriptional Cinzel typography.

> Inspired in structure by [hornofino.com](https://www.hornofino.com/) (menu categories,
> locations, online-ordering, and customer reviews), reinterpreted as a minimal,
> Mediterranean-themed brand.

## Design system

| Token        | Value     | Use                         |
| ------------ | --------- | --------------------------- |
| Marble white | `#f7f4ec` | Background                  |
| Aegean blue  | `#15324f` | Primary / accents           |
| Olive gold   | `#c2992f` | Highlights, eyebrows        |
| Charcoal ink | `#1d2733` | Text, footer                |

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
  logo.svg      # amphora-in-meander emblem
  meander.svg   # tileable Greek-key band
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
