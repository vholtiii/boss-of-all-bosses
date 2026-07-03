/** Flavor text when tension with a rival crosses warning thresholds. */

export type FamilyId = 'gambino' | 'genovese' | 'lucchese' | 'bonanno' | 'colombo';

export const FAMILY_DISPLAY_NAMES: Record<FamilyId, string> = {
  gambino: 'Gambino',
  genovese: 'Genovese',
  lucchese: 'Lucchese',
  bonanno: 'Bonanno',
  colombo: 'Colombo',
};

export const RIVAL_TENSION_LINES: Record<FamilyId, { at60: string[]; at75: string[] }> = {
  gambino: {
    at60: [
      'Word on the street — the Gambinos are getting restless. Something\'s brewing.',
      'Your soldiers report Gambino muscle moving closer to the border. Keep your eyes open.',
      'The Gambinos haven\'t said anything — but their capos are asking questions about your territory.',
    ],
    at75: [
      'The Gambinos have made their intentions clear. War is near.',
      'A Gambino soldier was spotted casing one of your rackets. This is not a courtesy call.',
      'The old man on Mulberry Street is done talking. Prepare for trouble.',
    ],
  },
  genovese: {
    at60: [
      'Word on the street — the Genovese are getting restless. Something\'s brewing.',
      'Genovese soldiers have been seen near your supply lines. They\'re probing.',
      'The Genovese consigliere cancelled a sitdown. That\'s never a good sign.',
    ],
    at75: [
      'The Genovese have made their intentions clear. War is near.',
      'Genovese capos are holding war councils. Your name comes up often.',
      'The Quiet Family is getting loud. Steel yourself — blood may spill.',
    ],
  },
  lucchese: {
    at60: [
      'Word on the street — the Lucchese are getting restless. Something\'s brewing.',
      'Lucchese scouts have been watching your hexes. They know your layout.',
      'A Lucchese capo was overheard saying your family is "soft." Take note.',
    ],
    at75: [
      'The Lucchese have made their intentions clear. War is near.',
      'Lucchese hit teams are assembling. Your intel says they\'re not bluffing.',
      'The Lucchese family moves like a knife — quiet, then sudden. War is coming.',
    ],
  },
  bonanno: {
    at60: [
      'Word on the street — the Bonannos are getting restless. Something\'s brewing.',
      'Bonanno enforcers are shaking down shops on your border. A message, perhaps.',
      'The Bonannos stopped returning your calls. Respect is slipping.',
    ],
    at75: [
      'The Bonannos have made their intentions clear. War is near.',
      'Bonanno soldiers are fortifying positions near your territory. This ends badly if you wait.',
      'The Bonannos live by intimidation — and they\'ve started aiming it at you.',
    ],
  },
  colombo: {
    at60: [
      'Word on the street — the Colombos are getting restless. Something\'s brewing.',
      'The Colombos are unpredictable — and lately, unpredictable means hostile.',
      'Colombo muscle is showing up where it shouldn\'t. Someone\'s testing you.',
    ],
    at75: [
      'The Colombos have made their intentions clear. War is near.',
      'Even the Colombos\' allies don\'t know what they\'ll do next — but your soldiers do. War.',
      'The Colombo family is volatile. Right now, that volatility points straight at you.',
    ],
  },
};

export function pickTensionLine(family: string, threshold: 60 | 75): string {
  const lines = RIVAL_TENSION_LINES[family as FamilyId];
  if (!lines) {
    const label = FAMILY_DISPLAY_NAMES[family as FamilyId] || family;
    return threshold === 75
      ? `The ${label} have made their intentions clear. War is near.`
      : `Word on the street — the ${label} are getting restless. Something's brewing.`;
  }
  const pool = threshold === 75 ? lines.at75 : lines.at60;
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface WarDeclarationCopy {
  headline: string;
  body: string;
  subtext: string;
}

export function getWarDeclarationCopy(
  familyA: string,
  familyB: string,
  playerFamily: string,
  warDuration: number
): WarDeclarationCopy {
  const fA = FAMILY_DISPLAY_NAMES[familyA as FamilyId] || familyA;
  const fB = FAMILY_DISPLAY_NAMES[familyB as FamilyId] || familyB;
  const playerInvolved = familyA === playerFamily || familyB === playerFamily;

  if (playerInvolved) {
    const rival = familyA === playerFamily ? fB : fA;
    return {
      headline: 'WAR DECLARED',
      body: `The ${rival} Family has declared war on your organization.`,
      subtext: `The streets run cold tonight. ${warDuration} turns of blood and fire. Diplomatic lockout. -20% income on contested borders.`,
    };
  }

  return {
    headline: 'WAR ERUPTS',
    body: `The ${fA} and ${fB} families have gone to war.`,
    subtext: `The balance of power shifts. Watch the borders — their fight may become yours.`,
  };
}
