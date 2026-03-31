# InternIQ Design System Rules

## Product Identity

InternIQ is an AI-powered career operations platform. Every design decision must reinforce: **calm, intelligent, precise, structured, premium, trustworthy, emotionally stabilizing**.

This is daily-use workflow software. Not a marketing site. Not a toy. An operating system for career progression.

---

## Brand Rules (Non-Negotiable)

- **ClarityOverDecoration** — Every element must justify its existence. If it doesn't aid comprehension, remove it.
- **HierarchyIsPower** — Visual weight must follow information priority. Primary action > secondary > tertiary. Always.
- **OneAccentOnly** — Primary brand color (`--primary`) is the sole accent. Never introduce secondary accent colors for emphasis. Cyan and magenta exist only for data visualization differentiation.
- **MotionWithPurpose** — No decorative animation. Every transition must communicate state change, spatial relationship, or feedback.
- **SpacingBreathes** — Dense information requires generous negative space between sections. Cards need room. Lists need air.
- **StatesAreDesign** — Empty, loading, error, success, disabled, hover, focus, active — all are designed states, not afterthoughts.
- **AIHasIdentity** — AI-generated content must be visually distinct from user content. AI actions get the subtle glow treatment.
- **ConsistencyEverywhere** — Same pattern, same component. No one-off implementations.
- **DenseButCalm** — High information density achieved through hierarchy and spacing, not cramming.
- **ZeroVisualNoise** — No gradients for decoration. No borders that don't separate. No shadows that don't elevate.
- **TrustThroughStructure** — Predictable layouts, consistent patterns, reliable interactions build trust.

**Tone**: Clear, direct, warm. Never playful, never corporate. Think: a competent mentor, not a chatbot.

---

## Color System

### Semantic Palette (OKLCH)

IMPORTANT: Never hardcode hex or oklch values. Always use CSS variables defined in `src/app/globals.css` and referenced via Tailwind tokens in `tailwind.config.ts`.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `oklch(0.985 0.005 255)` | `oklch(0.13 0.02 260)` | Page background |
| `--foreground` | `oklch(0.21 0.02 260)` | `oklch(0.95 0.01 260)` | Primary text |
| `--card` | `oklch(1 0 0 / 85%)` | `oklch(0.17 0.025 260)` | Card surfaces |
| `--primary` | `oklch(0.58 0.23 265)` | `oklch(0.65 0.25 265)` | Brand accent, CTAs, active states |
| `--accent` | `oklch(0.64 0.17 300)` | `oklch(0.7 0.2 300)` | Data viz only (magenta) |
| `--accent-cyan` | `oklch(0.7 0.14 195)` | `oklch(0.75 0.15 195)` | Data viz only (cyan) |
| `--muted` | `oklch(0.94 0.01 255)` | `oklch(0.25 0.015 260)` | Subtle backgrounds |
| `--muted-foreground` | `oklch(0.52 0.02 260)` | `oklch(0.65 0.01 260)` | Secondary text, labels |
| `--border` | `oklch(0.72 0.01 260 / 35%)` | `oklch(1 0 0 / 8%)` | Dividers, card borders |
| `--input` | `oklch(0.9 0.01 260 / 70%)` | `oklch(1 0 0 / 10%)` | Input backgrounds |
| `--glow` | `oklch(0.58 0.23 265 / 25%)` | `oklch(0.65 0.25 265 / 30%)` | AI indicator glow |
| `--ring` | Same as `--primary` | Same as `--primary` | Focus rings |

### Status Colors (Kanban Pipeline)

IMPORTANT: Status colors are defined in `src/lib/constants.ts` as `STATUS_COLORS`. When implementing status indicators, always import from constants — never define inline.

| Status | Semantic | Light Treatment |
|--------|----------|-----------------|
| Saved | `blue` | Neutral, unstarted — low contrast |
| Applied | `indigo` | Active, in-motion — medium contrast |
| Interview | `purple` | High-signal, attention — elevated contrast |
| Offer | `green` | Success, positive — celebration subtle |
| Rejected | `red` | Closed, ended — muted, not aggressive |

### Color Rules

- IMPORTANT: Text on `--background` must meet WCAG AA contrast (4.5:1 minimum)
- IMPORTANT: Interactive elements must have 3:1 contrast against adjacent colors
- Never use `--primary` for large background fills — it's an accent, not a surface
- `--muted-foreground` is for labels, captions, timestamps — never primary content
- AI-related surfaces get `shadow-glow-xs` or `shadow-glow-sm` — not color changes

---

## Typography System

### Font Stack

| Token | Font | Usage |
|-------|------|-------|
| `font-sans` | `var(--font-sans)`, Inter | Body text, UI labels, all general content |
| `font-mono` | `var(--font-mono)`, Geist Mono | Numeric data, code, scores, technical values |
| `font-display` | `var(--font-display)`, Cal Sans | Page titles, section headers (sparingly) |

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | `text-3xl` (30px) | `font-display` semibold | 1.2 | Page titles only (Dashboard, Pipeline, Settings) |
| Heading 1 | `text-2xl` (24px) | `font-sans` semibold | 1.3 | Section headers |
| Heading 2 | `text-xl` (20px) | `font-sans` semibold | 1.35 | Card titles, drawer headers |
| Heading 3 | `text-lg` (18px) | `font-sans` medium | 1.4 | Sub-section headers |
| Body | `text-sm` (14px) | `font-sans` regular | 1.5 | Primary body text, descriptions |
| Caption | `text-xs` (12px) | `font-sans` regular | 1.4 | Labels, timestamps, metadata |
| Mono Data | `text-sm` (14px) | `font-mono` medium | 1.4 | Scores, percentages, counts |

### Typography Rules

- IMPORTANT: `text-sm` (14px) is the default body size — this is a dense productivity tool, not a marketing page
- IMPORTANT: `font-display` (Cal Sans) is reserved for page-level titles only. Max 1 per viewport.
- Numeric values (scores, percentages, counts, dates) always use `font-mono`
- Never use `text-base` (16px) for body text in the dashboard — it wastes density
- All caps only for very short labels (2-3 words max), always with `tracking-wider text-xs`
- Line length should not exceed 65ch for readability

---

## Spacing System

### Base Grid: 4px

All spacing derives from a 4px base. Use Tailwind's spacing scale.

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` / `p-1` | 4px | Icon-to-label, tight inline spacing |
| `gap-1.5` / `p-1.5` | 6px | Badge padding, compact controls |
| `gap-2` / `p-2` | 8px | Within-component spacing |
| `gap-3` / `p-3` | 12px | Card internal padding (compact) |
| `gap-4` / `p-4` | 16px | Card internal padding (standard), section gap |
| `gap-5` / `p-5` | 20px | Card padding (comfortable) |
| `gap-6` / `p-6` | 24px | Section spacing, major gaps |
| `gap-8` / `p-8` | 32px | Page section separation |
| `gap-12` / `p-12` | 48px | Major page divisions |

### Spacing Rules

- IMPORTANT: Cards use `p-4` minimum. Never `p-2` on a card — it looks cramped.
- Between Kanban columns: `gap-4`
- Between cards in a column: `gap-3`
- Between sections on a page: `gap-8`
- Sidebar width: `w-64` (256px) collapsed to `w-16` (64px)
- Drawer width: `max-w-2xl` (672px)

---

## Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | `calc(var(--radius) - 4px)` = 12px | Badges, tags, small chips |
| `rounded-md` | `calc(var(--radius) - 2px)` = 14px | Inputs, buttons |
| `rounded-lg` | `var(--radius)` = 16px | Cards, dialogs, sheets |
| `rounded-full` | 9999px | Avatars, pills, circular actions |

### Radius Rules

- IMPORTANT: All cards use `rounded-lg`. No exceptions.
- Buttons: `rounded-md`
- Inputs: `rounded-md`
- Nested elements reduce radius by one step (card `rounded-lg` > inner section `rounded-md`)
- Never mix radius sizes within the same visual group

---

## Elevation System

| Level | Shadow | Usage |
|-------|--------|-------|
| 0 — Flat | none | Inline elements, text, icons |
| 1 — Subtle | `shadow-sm` | Cards at rest, inputs |
| 2 — Raised | `shadow-md` | Hovered cards, dropdowns |
| 3 — Floating | `shadow-lg` | Modals, drawers, popovers |
| 4 — Glow | `shadow-glow-xs` to `shadow-glow-sm` | AI-related surfaces |

### Elevation Rules

- IMPORTANT: Glow shadows (`shadow-glow-*`) are exclusively for AI-related elements
- Cards at rest: `shadow-sm` or no shadow (border only)
- Cards on hover: transition to `shadow-md`
- Drawers/modals: `shadow-lg`
- Never stack multiple shadow types on one element

---

## Component Library

### Source of Truth

UI primitives live in `src/components/ui/`. Feature components in their respective directories (`src/components/kanban/`, `src/components/dashboard/`, etc.).

IMPORTANT: Always check `src/components/ui/` for existing components before creating new ones. Reuse aggressively.

### Component Architecture

Components follow shadcn/ui patterns:
- Built on Radix UI primitives for accessibility
- Styled with Tailwind + `cn()` utility from `src/lib/utils.ts`
- Variants via Class Variance Authority (CVA)
- All support `className` prop for composition
- Forward refs via `React.forwardRef`
- Export both component and variants

### Key Components

| Component | Path | Notes |
|-----------|------|-------|
| Button | `ui/button.tsx` | Variants: default, destructive, outline, secondary, ghost, link |
| Card | `ui/card.tsx` | Compound: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| Dialog | `ui/dialog.tsx` | Radix-based modal |
| Sheet | `ui/sheet.tsx` | Slide-over drawer (used for application detail) |
| Input | `ui/input.tsx` | Standard text input |
| Select | `ui/select.tsx` | Radix-based select |
| Tabs | `ui/tabs.tsx` | Radix-based tab navigation |
| Badge | `ui/badge.tsx` | Status indicators |
| Dropdown Menu | `ui/dropdown-menu.tsx` | Radix-based dropdown |
| Command Palette | `ui/command-palette.tsx` | cmdk-based command menu |
| Empty State | `ui/empty-state.tsx` | Zero-data state component |
| Skeleton Shimmer | `ui/skeleton-shimmer.tsx` | Loading placeholder |
| Glass Card | `ui/glass-card.tsx` | Glassmorphism variant card |

### Component Rules

- IMPORTANT: Never install new icon packages. Use Lucide React (`lucide-react`) exclusively.
- IMPORTANT: All interactive components must have visible focus states (`:focus-visible` with `ring-2 ring-ring ring-offset-2`)
- Toast notifications use Sonner (`sonner`) — never implement custom toasts
- Charts use Recharts (`recharts`) — never implement custom chart primitives
- State management uses Zustand stores in `src/stores/`
- `cn()` from `src/lib/utils.ts` for all className merging — never manual string concatenation

---

## State System

Every component must account for all possible states. This is not optional.

### Universal States

| State | Treatment |
|-------|-----------|
| **Default** | Base styles |
| **Hover** | Subtle background shift + cursor pointer. Cards: `shadow-sm → shadow-md` transition |
| **Focus** | `ring-2 ring-ring ring-offset-2 ring-offset-background` |
| **Active/Pressed** | Scale to `scale-[0.98]` briefly |
| **Disabled** | `opacity-50 pointer-events-none` |
| **Loading** | Skeleton shimmer (`ui/skeleton-shimmer.tsx`) or spinner. Never blank. |
| **Empty** | Empty state component (`ui/empty-state.tsx`) with icon + message + action |
| **Error** | Red-tinted border + error message below. Never alert boxes. |
| **Success** | Brief green checkmark + toast. Not persistent. |

### AI-Specific States

| State | Treatment |
|-------|-----------|
| **AI Idle** | No special treatment — element looks standard |
| **AI Generating** | Pulsing glow (`animate-glow-pulse` + `shadow-glow-xs`), shimmer placeholder for content area |
| **AI Complete** | Brief glow flash, then settle to `shadow-glow-xs`. Content fades in with `animate-blur-in` |
| **AI Error** | Glow turns red briefly, then disappears. Error message in `text-destructive` |
| **AI Confidence** | Score in `font-mono`, color-coded: green (80+), yellow (60-79), red (<60) |

### State Rules

- IMPORTANT: Loading states must appear within 100ms of action initiation
- IMPORTANT: Empty states must always include a clear call-to-action
- Skeleton shimmer dimensions must match the expected content dimensions
- Error states show inline, adjacent to the element — never as page-level alerts
- Success states are transient (2-3 seconds) — they don't persist

---

## Motion System

### Timing Scale

| Token | Duration | Usage |
|-------|----------|-------|
| `instant` | 100ms | Active/pressed states, toggles |
| `fast` | 150ms | Hover transitions, micro-interactions |
| `normal` | 300ms | Tab switches, dropdown open, card interactions |
| `slow` | 450ms | Drawer slide, modal entrance |
| `deliberate` | 600ms | Page section reveals, content fade-in |

### Easing

| Name | Value | Usage |
|------|-------|-------|
| `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Primary easing for all UI motion |
| `spring-snap` | `{ stiffness: 500, damping: 30 }` | Drag-and-drop snap |
| `spring-drag` | `{ stiffness: 300, damping: 30 }` | Drag following |
| `spring-bounce` | `{ stiffness: 400, damping: 15 }` | Success/celebration (rare) |

### Animation Library

Reusable Framer Motion variants are defined in `src/lib/animations.ts`. IMPORTANT: Always import from this file — never define inline animation objects.

| Variant | Effect | Usage |
|---------|--------|-------|
| `fadeInUp` | Opacity 0→1, Y +40→0 | Section reveals, card entrances |
| `fadeInDown` | Opacity 0→1, Y -40→0 | Dropdown content, notification entry |
| `fadeInLeft/Right` | Opacity 0→1, X ±40→0 | Drawer slides, side panel reveals |
| `scaleIn` | Opacity 0→1, scale 0.9→1 | Modal entrance, popover |
| `blurIn` | Opacity 0→1, blur 10→0 | AI-generated content reveal |
| `staggerContainer` + `staggerItem` | Sequential children reveal | Lists, Kanban columns, card grids |

### Motion Behaviors

| Interaction | Motion |
|-------------|--------|
| **Hover** | `transition-all duration-150 ease-out`. Background + shadow only. No transform. |
| **Drag (Kanban)** | `spring-drag` follow, `scale-[1.02]` + `shadow-lg` + `rotate-[1deg]` while dragging. `spring-snap` on drop. |
| **Tab switch** | Content crossfade 300ms. No slide. |
| **Drawer open** | `fadeInRight` 450ms from right edge. Backdrop `opacity 0→1` 300ms. |
| **Modal open** | `scaleIn` 450ms. Backdrop `opacity 0→1` 300ms. |
| **Timeline reveal** | `staggerContainer` with `staggerItem` at 100ms intervals. |
| **AI generating** | `animate-glow-pulse` (2.5s loop). Content area shows `animate-shimmer`. |
| **AI complete** | `blurIn` for content. Single glow-pulse then settle. |
| **Success** | Brief `spring-bounce` on icon. Toast enters with `fadeInDown`. |
| **Page load** | `staggerContainer` for all page sections. First paint < 100ms. |

### Reduced Motion

IMPORTANT: Always respect `prefers-reduced-motion`. The global CSS already disables animations. Framer Motion components should also check:
```tsx
const prefersReducedMotion = useReducedMotion()
```

---

## Screen Specifications

### 1. Kanban Pipeline (`/dashboard/pipeline`)

**Layout**: Full-width horizontal scroll. Sidebar 256px + content.
**Grid**: 5 equal columns (one per status), min-width 280px each.
**Density**: Cards show: company logo, role title, company name, fit score badge, date. No more.
**Hierarchy**: Column header (status + count) → cards → add button at bottom.
**Interactions**: Drag to reorder/move between columns. Click to open drawer. Hover: `shadow-md` + subtle lift.
**Motion**: Drag uses `spring-drag`. Drop uses `spring-snap`. New card: `fadeInUp`. Reorder: layout animation 300ms.

### 2. Application Drawer (`Sheet` from right)

**Layout**: `max-w-2xl` (672px). Fixed header + scrollable body + fixed footer.
**Density**: Tabs for sections — Overview, AI Actions, Notes, History. One concern per tab.
**Hierarchy**: Company + Role title (H2) → Status badge → Tabs → Content.
**Interactions**: Tab switch: crossfade 300ms. Close: slide right 300ms. AI actions: inline expansion.
**Motion**: Open: `fadeInRight` 450ms. Close: reverse. Tab content: 200ms crossfade.

### 3. AI Action Panel (within Application Drawer)

**Layout**: Vertical stack of action cards. Each card: icon + title + description + run button.
**Density**: One action per row. Results expand inline below the action card.
**Hierarchy**: Action title → description → button. Results: score (large, mono) → explanation → details.
**Interactions**: Run button → loading state → results expand. Re-run available after completion.
**Motion**: Button press: `scale-[0.98]` instant. Generating: `glow-pulse` on card border. Results: `blurIn` 600ms.
**AI Identity**: Active/generating actions get `shadow-glow-xs`. Results panel gets subtle `border-primary/20`.

### 4. Dashboard (`/dashboard`)

**Layout**: 2-row structure. Top: 4 stat cards in grid. Bottom: activity feed or quick actions.
**Grid**: `grid-cols-4` on desktop, `grid-cols-2` on tablet, `grid-cols-1` on mobile.
**Density**: Stat cards: large number (`text-3xl font-mono`), label (`text-xs text-muted-foreground`), trend indicator.
**Hierarchy**: Stats (scannable) → Recent activity → Quick actions.
**Interactions**: Stat cards: hover for tooltip with details. Activity items: click to navigate.
**Motion**: Page load: `staggerContainer` with `staggerItem` for stat cards (100ms intervals).

### 5. Settings (`/dashboard/settings`)

**Layout**: Left nav (settings categories) + right content panel. Classic settings pattern.
**Density**: Generous spacing between setting groups. Each setting: label + description + control.
**Hierarchy**: Category nav → Section header → Individual settings.
**Interactions**: Standard form interactions. Save: immediate with toast confirmation.
**Motion**: Category switch: content crossfade 200ms. Save: subtle green flash on saved fields.

### 6. Gmail Automation (`/dashboard/automation`)

**Layout**: Status header (connected/disconnected) → Event log → Configuration.
**Density**: Event log is dense (table-like). Configuration is spacious (form-like).
**Hierarchy**: Connection status (prominent) → Event feed → Settings.
**Interactions**: Connect/disconnect: confirmation dialog. Events: expandable rows.
**Motion**: Connection status change: `scaleIn`. New events: `fadeInUp` prepend animation.

### 7. Insights / Analytics (`/dashboard/insights`)

**Layout**: Filter bar (top) → Charts grid → Data tables.
**Grid**: `grid-cols-2` for charts on desktop, `grid-cols-1` on mobile.
**Density**: Charts sized for readability, not decoration. Data tables are compact.
**Hierarchy**: Filters → Primary chart (full-width) → Secondary charts (half-width) → Details.
**Interactions**: Chart hover: tooltip with exact values. Filter change: charts animate with data transition.
**Motion**: Chart data transitions: 300ms ease. Filter apply: brief loading shimmer then data refresh.

---

## Signature Experiences

### 1. Focus Mode (Application Drawer)

When opening an application, the background content dims to `opacity-40` and blurs slightly (`blur-sm`). The drawer becomes the sole focus point. This communicates: "you are now working on this specific application."

**Implementation**: Backdrop overlay with `bg-background/60 backdrop-blur-sm`. Drawer content at full opacity. Close on backdrop click or Escape.

### 2. AI Confidence System

Every AI analysis produces a confidence score displayed as:
- Score: Large `font-mono` number (e.g., "87%")
- Color: Green (80+), Yellow (60-79), Red (<60) — using semantic colors, not brand colors
- Explanation: One sentence why, in `text-muted-foreground text-sm`
- Detail: Expandable section with full breakdown

This is not a gimmick. It builds trust by showing the AI's reasoning transparency.

### 3. Career Timeline (Version Control Metaphor)

Application history displayed as a vertical timeline resembling git log:
- Each event is a "commit": timestamp, action, details
- Status changes are "branch points" with status badge
- AI actions are marked with the glow indicator
- Dense, scannable, chronological

**Layout**: Vertical line on left. Event nodes as circles. Content to the right. Alternating subtle background for readability.

---

## Accessibility

- IMPORTANT: All interactive elements must be keyboard accessible
- IMPORTANT: All images must have alt text. Decorative images: `alt=""`
- IMPORTANT: Color must never be the sole indicator of state — always pair with icon or text
- Focus order must follow visual reading order
- Minimum touch target: 44x44px on mobile
- Screen reader: all Radix UI primitives handle ARIA. Custom components must match.
- Contrast: AA minimum (4.5:1 body text, 3:1 large text and UI components)
- `prefers-reduced-motion` is respected globally (see `globals.css`)
- `prefers-color-scheme` drives initial theme via `next-themes`

---

## Figma MCP Integration Rules

### Required Flow (do not skip)

1. Run `get_design_context` first to fetch the structured representation for the exact node(s)
2. If the response is too large or truncated, run `get_metadata` to get the high-level node map, then re-fetch only the required node(s) with `get_design_context`
3. Run `get_screenshot` for a visual reference of the node variant being implemented
4. Only after you have both `get_design_context` and `get_screenshot`, download any assets needed and start implementation
5. Translate the output into this project's conventions, styles, and framework
6. Validate against Figma for 1:1 look and behavior before marking complete

### Implementation Rules

- Treat the Figma MCP output (React + Tailwind) as a representation of design and behavior, not as final code style
- Reuse existing components from `src/components/ui/` instead of duplicating functionality
- Use the project's CSS variable color system, not raw Tailwind colors
- Map Figma spacing to the 4px grid system
- Respect existing routing, state management, and data-fetch patterns
- Strive for 1:1 visual parity with the Figma design
- Validate the final UI against the Figma screenshot

### Asset Handling

- IMPORTANT: If the Figma MCP server returns a localhost source for an image or SVG, use that source directly
- IMPORTANT: DO NOT import/add new icon packages — use Lucide React or assets from Figma payload
- IMPORTANT: DO NOT use or create placeholders if a localhost source is provided
- Store downloaded assets in `public/assets/`

---

## Project Architecture

| Path | Purpose |
|------|---------|
| `src/components/ui/` | Base UI components (shadcn/ui + custom) |
| `src/components/dashboard/` | Dashboard shell, sidebar, stat cards |
| `src/components/kanban/` | Kanban board, columns, cards, filters |
| `src/components/pipeline/` | Application drawer, AI panels |
| `src/components/ai/` | AI feature components (chatbot, fit score, etc.) |
| `src/components/settings/` | Settings page components |
| `src/components/landing/` | Marketing page (not product UI) |
| `src/stores/` | Zustand state stores |
| `src/hooks/` | Custom React hooks |
| `src/lib/` | Utilities, constants, animations, services |
| `src/lib/animations.ts` | Framer Motion variants (reuse these) |
| `src/lib/constants.ts` | App constants, status definitions |
| `src/app/(dashboard)/` | Dashboard routes |
| `src/app/api/` | API routes |
| `src/app/globals.css` | Design tokens (CSS variables) |
| `tailwind.config.ts` | Tailwind theme extension |

### Code Conventions

- Path alias: `@/*` maps to `./src/*`
- Import order: React → third-party → internal → types
- Component files: kebab-case filenames, PascalCase exports
- Props interfaces: `[ComponentName]Props`
- Store hooks: `use[StoreName]` (e.g., `useKanbanStore`)
- Custom hooks: `use[Feature]` (e.g., `useAuth`)
- Utilities: `cn()` from `@/lib/utils` for className merging
- Never use inline styles — always Tailwind classes

---

## Implementation Checklist

When building or modifying any screen:

1. Check existing components in `src/components/ui/` first
2. Use CSS variables from `globals.css` — never hardcode colors
3. Import animations from `src/lib/animations.ts`
4. Import constants from `src/lib/constants.ts`
5. Use `cn()` for all className composition
6. Implement all states: default, hover, focus, loading, empty, error, disabled
7. Ensure keyboard accessibility (tab order, focus visible, escape to close)
8. Test both light and dark modes
9. Verify `prefers-reduced-motion` behavior
10. Use `font-mono` for all numeric displays
11. Keep body text at `text-sm` (14px)
12. Cards: `rounded-lg`, `p-4` minimum, `shadow-sm` at rest
13. AI elements: `shadow-glow-xs` indicator, `blurIn` for generated content
14. Toasts via Sonner for feedback — never custom notifications
