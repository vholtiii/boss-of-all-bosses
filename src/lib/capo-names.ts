// Italian-American mob name generator for Capos
// Format: First "Nickname" Last  (e.g., Anthony "Marbles" Solerna)

const firstNames = [
  'Anthony', 'Vincent', 'Salvatore', 'Carmine', 'Dominic', 'Pasquale', 'Rocco',
  'Gennaro', 'Giuseppe', 'Nicholas', 'Frank', 'Michael', 'Joseph', 'Sal', 'Tony',
  'Angelo', 'Vito', 'Aniello', 'Nunzio', 'Silvio', 'Rudy', 'Paulie', 'Benny',
  'Jimmy', 'Johnny', 'Eddie', 'Lou', 'Ralph', 'Tommy', 'Richie', 'Bobby', 'Larry',
  'Phil', 'Gus', 'Sonny', 'Albert', 'Vinnie', 'Mickey', 'Joey', 'Petey', 'Augie',
  'Christopher', 'Dante', 'Enzo', 'Marco', 'Matteo', 'Lorenzo', 'Bruno', 'Luigi',
];

const nicknames = [
  'Marbles', 'The Chin', 'Big Pussy', 'Fat Tony', 'The Ant', 'Ice Pick',
  'Three Fingers', 'The Snake', 'Sally Boy', 'Tough Tony', 'The Saint', 'Bones',
  'Knuckles', 'Pretty Boy', 'The Hat', 'The Nose', 'Quack-Quack', 'Joe Bananas',
  'The Bull', 'Lefty', 'Cigars', 'The Beast', 'Tiny', 'The Weasel', 'Curly',
  'The Chief', 'Buckles', 'Cheech', 'The Wig', 'Meatball', 'Specs', 'The Whale',
  'Don Cheech', 'Half-Nose', 'The Owl', 'Skinny', 'Junior', 'The Mooch',
  'Vinny Gorgeous', 'Crazy Joe', 'No-Nose', 'The Clutch Hand', 'Gas Pipe',
  'Big Paulie', 'The Mayor', 'The Fish', 'Benny Eggs', 'The Horse', 'Joey Bag',
  'Sammy the Bull', 'Tony Ducks', 'The Hammer', 'Two-Knives', 'The Quiet Don',
  'Allie Boy', 'Patty Bombs', 'The Camel', 'Funzi', 'Skinny Joey', 'The Genius',
];

const lastNames = [
  'Solerna', 'Gambino', 'Castellano', 'Gigante', 'Bonanno', 'Persico', 'Lucchese',
  'Gravano', 'Aiello', 'Riina', 'Provenzano', 'Genovese', 'Magaddino', 'Anastasia',
  'Galante', 'Gotti', 'Profaci', 'Massino', 'Casso', 'Amuso', 'Corallo', 'Salerno',
  'Ruggiero', 'DeCavalcante', 'Scarpa', 'Vario', 'Cirillo', 'Ianniello',
  'Lombardozzi', 'Tieri', 'Pagano', 'Migliore', 'Indelicato', 'Napolitano',
  'Coppola', 'Marangello', 'Trafficante', 'Bruno', 'Scarfo', 'Marcello',
  'Civella', 'Zerilli', 'Catalano', 'Caruso', 'Mancini', 'Falcone', 'Romano',
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function generateCapoName(): string {
  return `${pick(firstNames)} "${pick(nicknames)}" ${pick(lastNames)}`;
}

/** Memorable street nicknames for soldiers (e.g. "Fat Sal", "Tommy Two-Guns"). */
export const SOLDIER_NICKNAMES: string[] = [
  'Fat Sal', 'Nicky the Nose', 'Tommy Two-Guns', 'Crazy Eddie', 'Benny the Bull',
  'Joey Knuckles', 'Frankie Bag of Donuts', 'Louie the Lip', 'Vinnie No-Show',
  'Paulie Walnuts', 'Big Pete', 'Skinny Vinny', 'Lefty Lou', 'The Hammer',
  'Tony Ducks', 'Sammy the Bull', 'Joey Bag', 'Cheech', 'The Weasel', 'Specs',
  'Meatball', 'The Whale', 'Half-Nose', 'The Owl', 'The Mooch', 'Buckles',
  'The Hat', 'Pretty Boy', 'The Snake', 'Three Fingers', 'Ice Pick', 'Bones',
  'Knuckles', 'The Saint', 'Tough Tony', 'Sally Boy', 'The Ant', 'Curly',
  'The Chief', 'The Wig', 'Don Cheech', 'Skinny Joey', 'The Genius', 'Funzi',
  'The Camel', 'Patty Bombs', 'Allie Boy', 'The Quiet Don', 'Two-Knives',
  'Benny Eggs', 'The Fish', 'The Horse', 'Gas Pipe', 'Big Paulie', 'The Mayor',
  'No-Nose', 'Crazy Joe', 'Vinny Gorgeous', 'Junior', 'The Clutch Hand',
  'Joey Bananas', 'Quack-Quack', 'The Beast', 'Tiny', 'Ralphie the Rat',
  'Danny Boy', 'Mikey the Mole', 'Frankie Five-Angels', 'Sal the Barber',
];

let soldierNameCounter = 0;

export function generateSoldierName(existingNames: string[] = []): string {
  const used = new Set(existingNames.filter(Boolean));
  const available = SOLDIER_NICKNAMES.filter((n) => !used.has(n));
  if (available.length > 0) {
    return pick(available);
  }
  soldierNameCounter += 1;
  return `Soldier #${soldierNameCounter}`;
}

/** Collect all unit names currently in play (soldiers + capos). */
export function collectExistingUnitNames(
  units: Array<{ name?: string }> = []
): string[] {
  return units.map((u) => u.name).filter((n): n is string => Boolean(n));
}
