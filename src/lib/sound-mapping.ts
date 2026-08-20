export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type SoundRequest = { sound: string; kind?: 'voice-bark' };

/**
 * Maps a notification title + type to the sound(s) that should play.
 * Returns an array so multiple sounds can be fired (e.g., a combat sound + a voice bark).
 */
export function getSoundsForNotification(title: string, type: NotificationType): SoundRequest[] {
  const t = title || '';

  switch (type) {
    case 'success': {
      if (t.includes('Contract Fulfilled')) return [{ sound: 'assassin_kill' }, { sound: 'hit_success', kind: 'voice-bark' }];
      if (t.includes('Construction Started')) return [{ sound: 'construction_start' }];
      if (t.includes('Business Complete')) return [{ sound: 'construction_complete' }];
      if (/Bought Out|Buy[- ]Out|Racket Acquired/i.test(t)) return [{ sound: 'buyout' }];
      if (/Upgraded|Upgrade Complete|Tier/i.test(t)) return [{ sound: 'upgrade' }];
      if (/New Soldier|New Recruit|Recruits?\b/i.test(t)) return [{ sound: 'levelup' }];
      if (/Promoted|Promotion|New Capo/i.test(t)) return [{ sound: 'levelup' }, { sound: 'promotion', kind: 'voice-bark' }];
      if (t.includes('Supply Deal Active')) return [{ sound: 'supply_deal' }];
      if (t.includes('Sitdown Accepted')) return [{ sound: 'sitdown_accepted' }];
      if (/Pact|Alliance|Deal Struck|Agreement/i.test(t)) return [{ sound: 'pact_signed' }];
      if (/Tribute|Income|Payout|Collected/i.test(t)) return [{ sound: 'coin' }];
      return [{ sound: 'success' }];
    }

    case 'error': {
      if (t.includes('Arrested')) return [{ sound: 'arrest' }, { sound: 'arrest', kind: 'voice-bark' }];
      if (/Not Enough|Insufficient|Cannot Afford|Can't Afford|No Actions/i.test(t)) return [{ sound: 'deny' }];
      if (/Pact Broken|Betray|Treachery|Truce Broken/i.test(t)) return [{ sound: 'pact_broken' }];
      return [{ sound: 'danger' }];
    }

    case 'warning': {
      if (
        t.includes('Assassination Foiled') ||
        t.includes('Enemy Capo Wounded') ||
        t.includes('Capo Wounded') ||
        t.includes('Plan Hit Expired')
      ) {
        return [{ sound: 'capo_fail' }, { sound: 'hit_fail', kind: 'voice-bark' }];
      }
      if (/Heat|Investigation|RICO|Subpoena|Indict/i.test(t)) return [{ sound: 'heat_warning' }];
      if (/War Declared|At War/i.test(t)) return [{ sound: 'war_declared' }];
      if (t.includes('Sitdown Declined') || t.includes('Counter Rejected')) return [{ sound: 'sitdown_declined' }];
      return [{ sound: 'error' }];
    }

    case 'info': {
      if (t.includes('Hex Fortified')) return [{ sound: 'fortify' }];
      if (t.includes('Escort Formed')) return [{ sound: 'escort_attach' }];
      if (t.includes('Supply Line Established')) return [{ sound: 'supply_connect' }];
      if (t.includes('Sitdown Proposed')) return [{ sound: 'sitdown_proposed' }];
      if (t.includes('Sitdown Ready')) return [{ sound: 'sitdown_ready' }];
      if (/Sitdown|Negotiation|Meeting/i.test(t)) return [{ sound: 'bell' }];
      if (/Standing Order|Policy/i.test(t)) return [{ sound: 'policy_set' }];
      return [{ sound: 'notification' }];
    }

    default:
      return [{ sound: 'notification' }];
  }
}
