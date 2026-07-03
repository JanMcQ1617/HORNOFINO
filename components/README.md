# ShootingStars — component integration

## Important: this repo is NOT a shadcn/React project

Hornofino is a **vanilla HTML/CSS/JS static site** (no build step, no React,
no Tailwind, no TypeScript). The supplied `shooting-stars.tsx` is a React
component that imports `@/lib/utils` and renders JSX — it **cannot run here as-is**.

So two things were done:

1. **It runs on the live site today** via a faithful vanilla-JS port:
   [`../shooting-stars.js`](../shooting-stars.js). Same algorithm (random edge
   spawn, fixed diagonal angle, distance-based scale growth, gradient trail,
   random respawn delay), recoloured to the brand and scoped to the Atlas night
   section. It's wired into `index.html`.
2. **The original component is preserved here** (`ui/shooting-stars.tsx`,
   `ui/shooting-stars-demo.tsx`, plus `../lib/utils.ts`) so if the site is ever
   migrated to Next.js + shadcn, it drops straight in.

## Default component path

shadcn/ui's default (from `components.json` aliases) is **`@/components/ui`** →
`components/ui/`. This project had no components folder, so it was created here.

**Why `/components/ui` matters:** the shadcn CLI writes every generated primitive
into exactly this folder and every generated file imports siblings with the
`@/components/ui/...` alias (see the demo's `import { ShootingStars } from
"@/components/ui/shooting-stars"`). If the folder or the `@/*` path alias is
missing, those imports fail to resolve and the CLI can't add or update components.
Keeping this exact path makes the whole shadcn ecosystem work without edits.

## To actually run the .tsx version (fresh shadcn project)

```bash
# 1. New TypeScript app (Next.js) — includes TS + the @/* path alias
npx create-next-app@latest hornofino-app --typescript --tailwind --eslint --app --src-dir=false

cd hornofino-app

# 2. Initialise shadcn/ui (creates components.json, lib/utils.ts, CSS vars)
npx shadcn@latest init

# 3. Component dependencies
npm install clsx tailwind-merge
```

If you have an existing project missing pieces:

- **TypeScript:** `npm install -D typescript @types/react @types/node` then add a
  `tsconfig.json` with the path alias:
  `"compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./*"] } }`
- **Tailwind:** `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`,
  then add the `@tailwind base; @tailwind components; @tailwind utilities;` directives to your global CSS.
- **shadcn structure:** `npx shadcn@latest init` (writes `components.json`, `lib/utils.ts`, aliases).

Then copy `ui/shooting-stars.tsx` into `components/ui/` and use `<ShootingStars />`.

## Integration questions, answered

- **Props passed:** `starColor`, `trailColor`, `minSpeed`/`maxSpeed`,
  `minDelay`/`maxDelay`, `starWidth`/`starHeight`, `className`. On our site the
  ported layers use brand colours (white/gold star, ember/`#fc4c02` trail) instead
  of the demo's neon.
- **State management:** none external — the component is self-contained (`useState`
  + `useEffect` + `requestAnimationFrame`). The vanilla port mirrors this with a
  per-layer object and one rAF loop.
- **Required assets:** none. Pure SVG/CSS, no images or icons — so no Unsplash or
  lucide-react needed for this component.
- **Responsive behaviour:** it reads `window.innerWidth/innerHeight` and re-spawns
  from screen edges, so it fills any viewport. The port also pauses when the Atlas
  section is scrolled off-screen and disables under `prefers-reduced-motion`.
- **Best placement:** as a full-bleed background layer inside a dark, `position:
  relative`, `overflow: hidden` hero — which is exactly the Atlas night section
  here (streaking behind the statue, under the headline).
