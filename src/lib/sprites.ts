// Painterly noir sprite pack (CDN-hosted assets).
import unitSoldier from '@/assets/sprites/unit-soldier.png.asset.json';
import unitCapo from '@/assets/sprites/unit-capo.png.asset.json';
import unitBoss from '@/assets/sprites/unit-boss.png.asset.json';
import bizStorefront from '@/assets/sprites/biz-storefront.png.asset.json';
import bizBrothel from '@/assets/sprites/biz-brothel.png.asset.json';
import bizGambling from '@/assets/sprites/biz-gambling.png.asset.json';
import bizLoan from '@/assets/sprites/biz-loan.png.asset.json';
import crestBonanno from '@/assets/sprites/crest-bonanno.png.asset.json';
import crestColombo from '@/assets/sprites/crest-colombo.png.asset.json';
import crestGambino from '@/assets/sprites/crest-gambino.png.asset.json';
import crestGenovese from '@/assets/sprites/crest-genovese.png.asset.json';
import crestLucchese from '@/assets/sprites/crest-lucchese.png.asset.json';

export const UNIT_SPRITES = {
  soldier: unitSoldier.url,
  capo: unitCapo.url,
  boss: unitBoss.url,
} as const;

export const CREST_SPRITES: Record<string, string> = {
  bonanno: crestBonanno.url,
  colombo: crestColombo.url,
  gambino: crestGambino.url,
  genovese: crestGenovese.url,
  lucchese: crestLucchese.url,
};

/** Maps every business type in the game onto one of the four painted buildings. */
export const BUSINESS_SPRITES: Record<string, string> = {
  store_front: bizStorefront.url,
  store: bizStorefront.url,
  restaurant: bizStorefront.url,
  laundromat: bizStorefront.url,
  construction: bizStorefront.url,
  docks: bizStorefront.url,
  brothel: bizBrothel.url,
  nightclub: bizBrothel.url,
  gambling_den: bizGambling.url,
  gambling: bizGambling.url,
  casino: bizGambling.url,
  speakeasy: bizGambling.url,
  loan_sharking: bizLoan.url,
  drug_trafficking: bizLoan.url,
};

export function businessSprite(type?: string | null): string | null {
  if (!type) return null;
  return BUSINESS_SPRITES[type] ?? bizStorefront.url;
}

/**
 * Tier-variant art for the development layer: each building track gets a
 * distinct painting per tier so upgrades read on the map.
 */
export const BUILDING_TIER_SPRITES: Record<string, Record<number, string>> = {
  store_front: { 1: bizStorefront.url, 2: storefrontT2, 3: storefrontT3 },
  brothel: { 1: bizBrothel.url, 2: brothelT2, 3: brothelT3 },
  gambling_den: { 1: bizGambling.url, 2: gamblingT2, 3: gamblingT3 },
  loan_sharking: { 1: bizLoan.url, 2: loanT2, 3: loanT3 },
  legal_front: { 1: legalT1, 2: legalT2, 3: legalT3 },
  safehouse: { 1: safehouseT1, 2: safehouseT2 },
};

/** Sprite for a building track at a given tier (falls back to tier 1 art). */
export function buildingSprite(type?: string | null, tier: number = 1): string | null {
  if (!type) return null;
  const track = BUILDING_TIER_SPRITES[type];
  if (!track) return businessSprite(type);
  return track[tier] ?? track[1] ?? null;
}

