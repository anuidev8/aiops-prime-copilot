# Design tokens

Visual system for AIOps Prime: **CSS custom properties** in `src/app/globals.css`, exposed to **Tailwind v4** via `@theme inline`.

---

## Source of truth

| File | Contents |
|------|----------|
| `src/app/globals.css` | `:root` tokens, `@theme inline`, utility classes, dark-friendly surfaces |
| Tailwind | `@import "tailwindcss"` — use semantic classes (`bg-primary`, `text-muted-foreground`) |

Prefer **semantic tokens** over raw HSL in components.

---

## Core palette (`:root`)

| Token | Purpose | Example usage |
|-------|---------|----------------|
| `--background` / `--foreground` | Page base | `bg-background`, `text-foreground` |
| `--card` / `--card-foreground` | Panels | `DashboardPanel`, cards |
| `--primary` / `--primary-foreground` | Brand actions | buttons, links, focus ring |
| `--primary-glow` | Gradient accent | hero gradients |
| `--secondary` / `--muted` | Subtle fills | sidebars, input backgrounds |
| `--accent` | Highlights | active nav |
| `--destructive` | Errors | failed pipeline |
| `--warning` / `--success` | Status | toasts, badges |
| `--border` / `--input` / `--ring` | Chrome | inputs, focus |
| `--radius` | Corner radius | `rounded-2xl` baseline (`1rem`) |

Values use **HSL components without `hsl()`** so Tailwind can do `hsl(var(--primary))`.

---

## AIOps-specific tokens

| Token | Purpose |
|-------|---------|
| `--sev-critical` | Critical incidents |
| `--sev-high` | High severity |
| `--sev-medium` | Medium |
| `--sev-low` | Low / healthy |
| `--glass-border` | Glassmorphism panels |
| `--gradient-bg` | Workspace background |
| `--gradient-primary` | CTA / avatar glow |
| `--gradient-card` | Elevated cards |
| `--shadow-glow` | Primary glow shadow |
| `--shadow-card` | Card elevation |
| `--sidebar-*` | App sidebar chrome |

### Severity in UI

Charts and badges map incident severity to these tokens (see `ProjectSeverityDonut`, incident tables).

Generative UI `RecommendationCard` uses **Tailwind utility combos** for risk (rose/amber/emerald), aligned with severity semantics—not separate CSS vars.

---

## Tailwind `@theme inline`

Maps CSS variables to Tailwind color keys:

```css
@theme inline {
  --color-background: hsl(var(--background));
  --color-primary: hsl(var(--primary));
  /* … */
}
```

Use in JSX: `className="bg-card border-border text-muted-foreground"`.

---

## Layout & motion tokens

| Pattern | Location |
|---------|----------|
| Dashboard motion variants | `src/features/operations-dashboard/ui/dashboard-motion.ts` |
| Workspace layout transitions | `src/features/aiops/layout/aiops-workspace-layout.tsx` |
| Copilot tool spinners | inline `animate-ping` on primary/cyan accents |

**Accessibility:** Components use `useReducedMotion()` from Framer Motion where animation is decorative.

---

## Component conventions

| Pattern | Guideline |
|---------|-----------|
| Panels | `DashboardPanel` + `border-border/50` + `bg-card/80` |
| Glass surfaces | `dashboardMotionSurfaceClass` helper |
| Copilot inline status | Small text `text-xs`, semantic borders (`border-emerald-500/25`) |
| Report layer | Overlay on dashboard; cyan accent for loading states |

Shared primitives: `src/shared/ui/` (layout, dashboard, shadcn-style buttons).

---

## Adding a new token

1. Add variable to `:root` in `globals.css` (HSL components).
2. Register in `@theme inline` if it should be a Tailwind color.
3. Use semantic name (`--chart-accent`, not `--blue-500`).
4. Document in this file if it is domain-specific (e.g. new severity band).

Avoid hardcoding hex in feature folders unless for one-off charts with no semantic meaning.

---

## Dark mode

The workspace is tuned for a **light-first** ops dashboard with soft gradients. If adding `.dark` overrides, mirror the same token names in `globals.css` rather than branching in every component.

---

## Related

- [README.md](./README.md) — UI layer overview
- [generative-ui.md](./generative-ui.md) — block styling patterns
