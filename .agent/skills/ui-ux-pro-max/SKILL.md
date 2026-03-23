---
name: ui-ux-pro-max
description: AI-powered design intelligence with searchable databases of UI styles, color palettes, font pairings, chart types, and UX guidelines
---

# UI/UX Pro Max

Design intelligence toolkit providing searchable databases for UI design decisions.

## Search Command

```bash
python3 haki/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> [-n <max_results>]
```

### Domain Search

| Domain       | Description                                                                    |
| ------------ | ------------------------------------------------------------------------------ |
| `product`    | Product type recommendations (SaaS, e-commerce, portfolio)                     |
| `style`      | UI styles (glassmorphism, minimalism, brutalism) + AI prompts and CSS keywords |
| `typography` | Font pairings with Google Fonts imports                                        |
| `color`      | Color palettes by product type                                                 |
| `landing`    | Page structure and CTA strategies                                              |
| `chart`      | Chart types and library recommendations                                        |
| `ux`         | Best practices and anti-patterns                                               |

### Stack Search

```bash
python3 haki/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack <stack>
```

Available stacks: `html-tailwind` (default), `react`, `nextjs`, `astro`, `vue`, `nuxtjs`, `nuxt-ui`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`

## When to Use

- Before building any UI — search for style, color, and typography recommendations
- When starting a new project — search by product type for full design system
- When adding charts — search for chart type and library recommendations
- When designing landing pages — search for structure and CTA patterns

## Prerequisites

Python 3.x (no external dependencies required)
