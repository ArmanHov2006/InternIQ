# InternIQ — Complete Design System Implementation

You are implementing a premium, acquisition-grade design system for InternIQ, an AI-powered job application tracker built with Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Radix UI, shadcn/ui, Framer Motion, and Zustand.

## BRAND IDENTITY

**Palette: Black + Orange**
The product must feel: calm, intelligent, precise, structured, premium, trustworthy, emotionally stabilizing.
Tone: clear, direct, warm, not playful.
One accent only: orange. No competing colors.

---

## COLOR SYSTEM

Replace the existing OKLCH purple palette in `src/app/globals.css` with this system:

### Light Mode (`:root`)
```css
--background: #FAFAFA;
--foreground: #0A0A0A;
--card: #FFFFFF;
--card-foreground: #0A0A0A;
--popover: #FFFFFF;
--popover-foreground: #0A0A0A;
--primary: #FF6A2B;
--primary-foreground: #FFFFFF;
--secondary: #F5F5F5;
--secondary-foreground: #0A0A0A;
--accent: #FF8A50;
--accent-foreground: #FFFFFF;
--muted: #F0F0F0;
--muted-foreground: #6B6B6B;
--border: rgba(0, 0, 0, 0.08);
--input: rgba(0, 0, 0, 0.06);
--ring: #FF6A2B;



--glow: rgba(255, 106, 43, 0.15);
--accent-cyan: #FF8A50;
--surface-glass: rgba(255, 255, 255, 0.80);
--radius: 0.75rem;
```

### Dark Mode (`.dark`) — PRIMARY MODE, design-first
```css
--background: #050505;
--foreground: #E8E8ED;
--card: #0E0E0E;
--card-foreground: #E8E8ED;
--popover: #0A0A0A;
--popover-foreground: #E8E8ED;
--primary: #FF6A2B;
--primary-foreground: #FFFFFF;
--secondary: #141414;
--secondary-foreground: #E8E8ED;
--accent: #FF8A50;
--accent-foreground: #FFFFFF;
--muted: #1A1A1A;
--muted-foreground: #8B8FA3;
--border: rgba(255, 255, 255, 0.06);
--input: rgba(255, 255, 255, 0.06);
--ring: #FF6A2B;
--glow: rgba(255, 106, 43, 0.20);
--accent-cyan: #FF8A50;
--surface-glass: rgba(255, 255, 255, 0.04);
--radius: 0.75rem;
```

### Semantic Status Colors (both modes)
```css
--status-saved: #FF7A3D;
--status-applied: #FF8A50;
--status-interview: #FFB380;
--status-offer: #4ADE80;
--status-rejected: #F87171;
```

### Glow & Shadow Tokens (dark mode)
```css
--glow-sm: 0 0 20px rgba(255, 106, 43, 0.15);
--glow-md: 0 0 40px rgba(255, 106, 43, 0.20), 0 0 80px rgba(255, 138, 80, 0.10);
--glow-lg: 0 0 60px rgba(255, 106, 43, 0.20), 0 0 120px rgba(255, 138, 80, 0.08);
```

### Background Gradient (body)
Replace the purple radial gradients with:
```css
body {
  background-image:
    radial-gradient(circle at 10% 10%, rgba(255, 106, 43, 0.06) 0, transparent 35%),
    radial-gradient(circle at 90% 15%, rgba(255, 138, 80, 0.04) 0, transparent 30%),
    radial-gradient(circle at 45% 65%, rgba(255, 122, 61, 0.03) 0, transparent 35%);
  background-attachment: fixed;
}
```

### Text Gradient
```css
.text-gradient {
  @apply bg-gradient-to-r from-[#FF6A2B] via-[#FF8A50] to-[#FFB380] bg-clip-text text-transparent;
}
```

---

## TYPOGRAPHY

- **Font stack**: Inter (sans), Geist Mono (mono), Cal Sans (display) — already configured
- **Scale**: 11px (micro), 12px (caption), 13px (body-sm), 14px (body), 16px (subtitle), 22px (section), 28px (page title), 32px (metric value)
- **Weights**: 400 (body), 500 (labels/nav), 600 (headings), 700 (titles/metrics)
- **Letter spacing**: -1px on large numbers (32px+), default elsewhere

---

## SPACING GRID

- **Base**: 4px
- **Component padding**: 12px (badges), 14–16px (cards), 20px (stat cards), 24px (panels), 32px (page margins), 40px (wide margins)
- **Gaps**: 2px (nav items), 4px (tight), 8px (compact), 12px (standard), 16px (cards/columns), 20px (chart gaps), 24px (sections), 32px (page sections)

---

## RADIUS TOKENS

- `--radius`: 0.75rem (12px) — default for cards, inputs
- Small: 6px — score badges, small pills
- Medium: 8px — buttons, logo mark
- Large: 12px — cards, kanban cards, drawer panels
- XL: 16px — major panels, stat cards
- Pill: 9999px — status badges, avatar

---

## ELEVATION TOKENS

- **Card**: `border: 1px solid rgba(255,255,255,0.04)` — no box-shadow by default
- **Hover card**: `border-color: rgba(255,255,255,0.08)`
- **Active nav**: `background: rgba(255,255,255,0.06)`
- **AI glow**: `box-shadow: 0 0 24px rgba(255,106,43,0.15)` — only on AI-related elements
- **Inputs**: `background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)`

---

## COMPONENT SPECIFICATIONS

### Sidebar (256px fixed)
- Background: `#080808`
- Right border: `1px solid rgba(255,255,255,0.04)`
- Logo: 32px orange gradient square (rounded-lg) + "InternIQ" text 18px/700
- Nav items: 20px icon + 14px label, 10px vertical padding, 16px horizontal, 12px gap
  - Default: icon `#8B8FA3`, text `#8B8FA3`
  - Active: icon `#FF6A2B`, text `#E8E8ED`, bg `rgba(255,255,255,0.06)`, rounded-xl
- Footer: avatar circle (32px, orange-tinted bg) + name 13px/500 + email 11px/400 muted

### Stat Card
- Background: `#0E0E0E`, rounded-2xl, 20px padding
- Border: `1px solid rgba(255,255,255,0.04)`
- Label: 12px/500, color `#8B8FA3`
- Value: 32px/700, color `#E8E8ED`, letter-spacing -1px
- Trend: 12px, green `#4ADE80` with trending-up icon

### Kanban Card
- Background: `#0E0E0E`, rounded-xl, 16px padding, 12px gap
- Top row: company 13px/600 white + AI score badge (orange bg, sparkles icon, percentage)
- Role: 14px/500, color `#CDCDD6`
- Bottom row: status badge + date 11px muted

### Kanban Column
- Background: `rgba(8,8,8,0.5)`, rounded-xl
- Header: status dot (8px circle, status color) + title 13px/600 + count badge
- Cards slot: 8px padding, 8px gap

### AI Action Card
- Background: `#0E0E0E`, rounded-xl, horizontal layout, center-aligned
- Left: 36px icon wrapper (orange-tinted bg, rounded-lg)
- Center: title 14px/500 + description 12px/muted
- Right: "Run" button (orange bg, white text, rounded-lg, 8x16 padding)

### Badge Variants
- **Orange (default/applied)**: bg `rgba(255,106,43,0.09)`, text `#FF6A2B`, pill shape
- **Green (offer)**: bg `rgba(74,222,128,0.09)`, text `#4ADE80`
- **Red (rejected)**: bg `rgba(248,113,113,0.09)`, text `#F87171`
- **Peach (interview)**: bg `rgba(255,179,128,0.09)`, text `#FFB380`

### Button
- **Primary**: bg `#FF6A2B`, text white, rounded-lg, 8x16 padding, 13px/600
- **Secondary/ghost**: bg transparent, border `rgba(255,255,255,0.06)`, text `#8B8FA3`
- **Destructive**: bg `rgba(248,113,113,0.09)`, text `#F87171`

### Input / Form Field
- Label: 12px/500, color `#8B8FA3`, 6px gap above input
- Input: height 40px, bg `rgba(255,255,255,0.03)`, border `rgba(255,255,255,0.04)`, rounded-lg, 14px horizontal padding
- Text: 13px, color `#CDCDD6`
- Placeholder: color `rgba(139,143,163,0.25)`

---

## SCREEN LAYOUTS

### 1. Dashboard (`/dashboard`)
```
┌─────────┬──────────────────────────────────────┐
│ Sidebar │  Page Title + "Add Application" btn  │
│  256px  │  ┌──────┬──────┬──────┬──────┐       │
│         │  │Stat 1│Stat 2│Stat 3│Stat 4│       │
│         │  └──────┴──────┴──────┴──────┘       │
│         │  ┌─────────────────┬──────────┐       │
│         │  │ Recent Activity │ Quick    │       │
│         │  │ (feed list)     │ Actions  │       │
│         │  │                 │ (3 cards)│       │
│         │  └─────────────────┴──────────┘       │
└─────────┴──────────────────────────────────────┘
```
- Header: "Dashboard" 28px/700 + subtitle 14px muted + orange "Add Application" button
- 4 stat cards in a row: Total Applications (127), Interview Rate (34%), Avg Fit Score (76), Offers (3)
- Bottom split: Recent Activity panel (left, fill) + Quick Actions panel (right, 360px fixed)
- Activity items: colored dot + event text + timestamp + badge
- Quick actions: icon wrapper + title/desc + chevron-right

### 2. Pipeline — Kanban (`/dashboard/pipeline`)
```
┌─────────┬──────────────────────────────────────┐
│ Sidebar │  Header + Search + Add btn           │
│         │  ┌─────┬─────┬─────┬─────┬─────┐    │
│         │  │Saved│Appld│Intv │Offer│Rjctd│    │
│         │  │     │     │     │     │     │    │
│         │  │cards│cards│cards│cards│cards│    │
│         │  │     │     │     │     │     │    │
│         │  └─────┴─────┴─────┴─────┴─────┘    │
└─────────┴──────────────────────────────────────┘
```
- 5 equal columns, 16px gap, each scrollable
- Column header: status dot (color-coded) + name + count badge
- Search input: 240px, ghost style with search icon
- Status dot colors: Saved `#FF7A3D`, Applied `#FF8A50`, Interview `#FFB380`, Offer `#4ADE80`, Rejected `#F87171`

### 3. Application Drawer (overlay on Pipeline)
- **Focus Mode**: background dims to 35% opacity + dark overlay `rgba(0,0,0,0.4)`
- Drawer: 672px wide, slides from right, bg `#080808`, left border
- Header: Company name 22px/700 + status badge + role 14px muted + close button
- Tabs: "AI Actions" (active, orange underline), "Overview", "Notes", "Timeline"
- AI Fit Score card: 56px gradient orange square with score number + title + explanation text + orange glow shadow
- 5 AI action cards stacked: Fit Analysis, Resume Tailor, Cover Letter, Interview Prep, Cold Email

### 4. Settings (`/dashboard/settings`)
```
┌─────────┬────────┬──────────────────────────┐
│ Sidebar │Settings│  Content Panel           │
│         │  Nav   │  Profile Form            │
│         │ 220px  │                          │
└─────────┴────────┴──────────────────────────┘
```
- Settings nav: 220px, separated by right border
- Categories: Profile (active), Resumes, API Keys, Notifications, Integrations, Appearance
- Active category: orange icon, white text, subtle bg
- Form: "Personal Information" card with fields (First Name, Last Name, Email, Username, Bio) + Cancel/Save buttons

### 5. Insights (`/dashboard/insights`)
- Header: "Insights" + date range filter ("Last 30 days") + Export button
- Chart row: Application Funnel bar chart (left, fill) + Status Breakdown legend (right, 360px)
  - Bars: gradient (transparent-to-solid), colors matching status system
  - Legend: colored dots + label + count + percentage
- Table: "Top Companies by Fit Score" with Company, Role, Fit Score (colored), Status badge

### 6. Gmail Automation (`/dashboard/automation`)
- Connection status card: green check-circle icon + "Gmail Connected" + email + last sync + Disconnect button (red ghost)
- 3 metric stat cards: Emails Processed, Auto-Detected, Status Updates
- Event Log: filterable list with color-coded event icons (mail-check green, calendar orange, mail-x red, mail default)

---

## MOTION SPECIFICATION

### Timing Scale
- **Micro**: 100ms — hover states, color transitions
- **Fast**: 200ms — tab switches, badge state changes
- **Standard**: 300ms — panel transitions, card interactions
- **Emphasis**: 450ms — drawer open/close, focus mode
- **Dramatic**: 600ms — page transitions, first-load reveals

### Easing
- **Default**: `cubic-bezier(0.16, 1, 0.3, 1)` — already defined as EASE_OUT
- **Spring snap**: `stiffness: 500, damping: 30` — kanban drag
- **Spring drag**: `stiffness: 300, damping: 30` — card dragging
- **Spring bounce**: `stiffness: 400, damping: 15` — success states

### Behaviors
- **Hover on cards**: `border-color` transitions to `rgba(255,255,255,0.08)` over 100ms
- **Kanban drag**: card lifts with `scale(1.02)` + subtle shadow, spring physics
- **Drawer open**: slide from right 672px, ease-out 450ms, background dims simultaneously
- **AI generating**: pulsing orange glow on the action card (2.5s cycle)
- **Tab switch**: underline slides to active tab, 200ms
- **Success**: brief scale(1.05) bounce + green check fade-in

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## SIGNATURE EXPERIENCES

### 1. Focus Mode (Application Drawer)
When opening an application card, the entire pipeline background dims smoothly. The drawer slides in from the right. This creates a focused, distraction-free context for AI analysis. Implement with Framer Motion `AnimatePresence`.

### 2. AI Confidence System
The AI Fit Score is displayed as a gradient orange square (56px) with the numeric score. Surrounded by a subtle orange glow (`box-shadow: 0 0 24px rgba(255,106,43,0.15)`). Below it: a one-sentence natural language explanation. The glow pulses subtly (2.5s cycle) while AI is processing.

### 3. Career Timeline
Events in the activity feed and automation log use a vertical timeline pattern with colored dots indicating event type. Each event shows what happened + when + status change. Structured like version control commits.

---

## CONSTANTS UPDATE

Update `src/lib/constants.ts` STATUS_COLORS to match:
```typescript
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  applied: "bg-orange-400/10 text-orange-300 border-orange-400/20",
  interview: "bg-amber-300/10 text-amber-200 border-amber-300/20",
  offer: "bg-green-400/10 text-green-400 border-green-400/20",
  rejected: "bg-red-400/10 text-red-400 border-red-400/20",
};
```

---

## IMPLEMENTATION RULES

1. **Dark mode is the primary design target** — design dark-first, light mode is secondary
2. **One accent only** — `#FF6A2B` orange. No blue, no purple, no teal anywhere in the product UI
3. **AI elements get glow** — only AI-related components (fit score, sparkles icon, generating states) use the orange glow. Everything else is flat
4. **Hierarchy through weight, not color** — use font-weight and opacity to create hierarchy, not multiple accent colors
5. **Cards have no shadow** — only a 1px border at `rgba(255,255,255,0.04)`. Elevation is communicated through background shade differences
6. **Spacing breathes** — 32px minimum page padding, 20px minimum card padding, never less than 8px gap between interactive elements
7. **States are design** — every interactive element needs: default, hover, active, focus, disabled states defined
8. **Zero visual noise** — no decorative gradients, no background patterns, no unnecessary dividers. The body radial gradients are the only ambient decoration allowed
9. **Dense but calm** — information density is high but every element has breathing room
10. **Consistency everywhere** — if a pattern is used once, it must be used the same way everywhere

---

## FILES TO MODIFY

1. `src/app/globals.css` — Replace all CSS variables and utility classes
2. `tailwind.config.ts` — Update color tokens, shadows, animations
3. `src/lib/constants.ts` — Update STATUS_COLORS
4. `src/lib/animations.ts` — Keep existing, already good
5. `src/components/dashboard/sidebar.tsx` — Update to match new sidebar spec
6. `src/components/dashboard/shell.tsx` — Update layout wrapper
7. `src/components/dashboard/stat-card.tsx` — Update styling
8. `src/components/kanban/kanban-card.tsx` — Update card design
9. `src/components/kanban/kanban-column.tsx` — Update column design
10. `src/components/pipeline/application-drawer.tsx` — Update drawer + focus mode
11. `src/components/pipeline/application-ai-panels.tsx` — Update AI action cards
12. `src/components/ai/fit-score-display.tsx` — Update score badge with orange gradient + glow
13. `src/components/ui/button.tsx` — Update variant colors
14. `src/components/ui/badge.tsx` — Update to orange system
15. `src/components/ui/card.tsx` — Update border/bg tokens
16. `src/components/ui/input.tsx` — Update styling
17. All dashboard pages in `src/app/(dashboard)/dashboard/` — Apply new spacing and layout patterns
