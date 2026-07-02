// ============================================================================
// PERIOD THEME — single source of truth for the 1920s "Gangsters: Organized
// Crime" visual identity.
//
// Family colors are desaturated, period-appropriate inks (used for SVG fills,
// inline styles, and map tints). The same values live as CSS variables in
// index.css (--gambino-gold etc.) for Tailwind classes — keep both in sync.
//
// Pure constants. No React, no game logic.
// ============================================================================

/** Desaturated period family inks. Hues match the old neon palette so
 *  returning players still recognize each family at a glance. */
export const FAMILY_COLORS: Record<string, string> = {
  gambino: '#69A7B9',   // steel teal        (was neon cyan)
  genovese: '#6B8F56',  // olive green       (was bright green)
  lucchese: '#6B7FB3',  // slate blue        (was royal blue)
  bonanno: '#B5493F',   // brick red         (was crimson)
  colombo: '#976BA5',   // faded plum        (was blue-violet)
  neutral: '#6A6156',   // warm gray-brown   (ordinary city block)
};

/** Slightly darker ink-wash variants for hex fills so control tints read as
 *  period ink rather than flat paint. */
export const FAMILY_INK_WASH: Record<string, string> = {
  gambino: '#4C7D8C',
  genovese: '#516D41',
  lucchese: '#51618B',
  bonanno: '#8C3831',
  colombo: '#74517F',
  neutral: '#544D44',
};

export const FAMILY_NAMES: Record<string, string> = {
  gambino: 'Gambino',
  genovese: 'Genovese',
  lucchese: 'Lucchese',
  bonanno: 'Bonanno',
  colombo: 'Colombo',
  neutral: 'Neutral',
};

/** Core period palette (hex mirrors of the CSS vars in index.css). */
export const PERIOD = {
  paper: '#F0E8D5',        // aged-paper cream
  paperAged: '#DCCFB0',    // darker paper edge
  ink: '#2A2018',          // ink brown-black
  inkFaded: '#5C4F40',     // faded ink
  brick: '#9E4436',        // muted brick red (grease pencil / stamps)
  brass: '#C9A24B',        // brass / gold accent
  felt: '#25473A',         // deep green felt
  sepiaShadow: '#171009',  // deepest shadow
} as const;

/** Terrain fills for the map re-skin: city blocks in sepia tones. */
export const TERRAIN_FILLS: Record<string, string> = {
  urban: '#3B3228',        // rooftop tar + brick
  industrial: '#403A2E',   // warehouse sheet metal
  residential: '#453A2C',  // brownstone rows
  docks: '#2E3634',        // wet piers / harbor slate
  commercial: '#443E2C',   // storefront awnings
};
