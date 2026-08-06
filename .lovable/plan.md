# Map Readability + Management HUD Polish

## Goal
Make the map the primary decision surface and make the sidebars feel like a management console: less visual noise, stronger hierarchy, and clearer ownership/status at a glance. Preserve the noir aesthetic, existing mechanics, and interaction rules.

## User priorities
- Map readability
- HUD and sidebars

## Changes

### 1. Map visual hierarchy
- Establish a clear visual priority for map states: selected/actionable hexes first, player ownership second, rival ownership third, neutral terrain last.
- Reduce competing always-visible labels and badges where the same hex already has a unit, business, supply, or tactical marker.
- Strengthen selected and actionable hex treatment with a consistent outline/fill treatment so the next click is obvious without making the whole board glow.
- Keep supply-node outlines continuous and move their badges clear of the hex perimeter so connectivity reads cleanly.
- Add a compact, token-based map status key that explains ownership, units, supply, selected, and threat states without requiring the player to decode symbols.
- Preserve fog-of-war behavior, click targets, panning, zoom, and all combat/territory logic.

### 2. Map controls and context
- Refine the map control cluster into a quieter utility strip with grouped zoom/reset and visibility toggles.
- Make active visibility toggles visually distinct from inactive ones while keeping controls compact.
- Improve pinned territory / selected unit context so it reads as one coordinated map inspector instead of multiple floating layers.

### 3. Left management sidebar
- Reorder the top of the panel around the management loop: family/turn identity, resource snapshot, current phase guidance, then actions.
- Reduce repeated explanatory copy and move deeper rules into existing tooltips or expandable sections.
- Give actionable warnings (informants, heat, prosecution, locked phase) a consistent severity treatment and stronger scan order.
- Keep the existing action previews and phase locks, but make disabled reasons shorter and easier to compare.

### 4. Right intelligence sidebar
- Make the rival comparison the compact overview, with detailed rival cards remaining expandable below it.
- Keep Supply Ledger, Businesses, and event history as distinct sections with clearer section headers and less nested visual weight.
- Preserve family highlighting and supply-node jump behavior.
- Keep “Just Happened” docked at the bottom, but visually separate it as a short-lived report rail so it does not compete with persistent intelligence.

### 5. Top/bottom HUD cleanup
- Reduce duplicate status emphasis between the top resource/turn area and sidebars.
- Keep threats, expiring pacts, deployment ratio, and phase controls visible, but group them by urgency and use fewer simultaneous animated treatments.
- Retain existing keyboard and click flows, including the Next Step control and Smart End Turn behavior.

## Technical approach
- Update `EnhancedMafiaHexGrid.tsx` for map layering, marker deconfliction, map controls, and legend presentation.
- Update `GameSidePanels.tsx` for sidebar hierarchy, compact management summaries, and section styling.
- Update `JustHappenedFeed.tsx` only if needed for the docked report-rail styling; do not change its data derivation or timing behavior.
- Add or reuse semantic tokens in `src/index.css`; avoid new hardcoded component colors and preserve family colors from `period-theme.ts`.
- Use existing Button, Tooltip, Badge, Collapsible, and ScrollArea components for interactive controls.
- Verify desktop and mobile layouts, map interaction states, and the existing focused jump/highlight flows after implementation.

## Out of scope
- No balance, AI, combat, economy, or diplomacy changes.
- No changes to map generation, fog-of-war rules, supply calculations, or action availability.
- No new backend or persistence work.
