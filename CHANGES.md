REFACTOR SUMMARY
================

FILES TO CREATE / REPLACE:
---------------------------

1. games/set/components/SetCard.tsx         [NEW]
   → Reusable card component with gold dark theme

2. games/set/components/SetSolver.tsx       [REPLACE]
   → Uses: GameTitle, StatusChip, GhostButton from @/shared/components
   → Uses: shared panel/btn-action/btn-ghost/divider-label CSS classes
   → Interactive: click set result to highlight cards in hand
   → Remove button on hover per card

3. games/set/components/SetGenerator.tsx   [NEW - replace old one if exists]
   → Difficulty tier picker (Kings-style)
   → Playable board: click 3 cards → checks if valid set
   → Score tracker, hint button, win banner

4. app/games/sets/page.tsx                 [REPLACE]
   → PageLayout with 2 tabs: Solver + Generator
   → "use client" with useState for tab

FILES UNCHANGED:
----------------
- games/set/components/shape.tsx
- games/set/lib/constants.ts
- games/set/lib/difficulty.ts
- games/set/lib/generator.ts
- games/set/lib/solver.ts
- games/set/lib/types.ts
- games/set/lib/validator.ts
- shared/component/GameTitle.tsx  (OLD path — SetSolver.tsx was using this wrong path)
  NOTE: new files import from @/shared/components (correct barrel)

KEY DESIGN CHANGES:
-------------------
- Removed all white/light theme from old global.css classes
- Now uses: bg-bg, panel, btn-action, btn-ghost, btn-control, chip, divider-label
- Gold border system: border-gold-600 / hover:border-gold-500 / active: border-gold-200
- Status chips for counts/state using StatusChip variant="gold|ok|err|ghost"
- WinBanner for game completion
- GameTitle for consistent headers
