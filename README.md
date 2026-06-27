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

```
index.html      # single-page site
styles.css      # design system + layout
script.js       # mobile nav + reveal-on-scroll
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

## Sections

Hero · Story · Menu (Breakfast, Breads, Pastries, Sandwiches, Soups, Drinks) ·
Online Ordering · Locations · Reviews · Footer.
