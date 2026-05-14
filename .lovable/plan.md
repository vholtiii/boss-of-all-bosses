## Change

In `src/components/CapoPromotionPanel.tsx`, when a soldier is `eligible && !isPending`:

1. Swap the card outline/background from the current muted primary tint to a clear green:
   - `border-primary/30 bg-primary/5` → `border-green-500/60 bg-green-500/10 ring-1 ring-green-500/40`
2. Add a small line inside the card (above the Promote button) reading **"🎖️ Eligible for stripes"** in green text.
3. Keep the existing "Eligible" badge in the top-right (recolored to green to match) and the Promote button unchanged.

In-ceremony cards (yellow) and ineligible cards stay as they are.

No logic changes — purely the visual/text affordance the user asked for.
