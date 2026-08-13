import { describe, it, expect } from 'vitest';
import { getSoundsForNotification } from '@/lib/sound-mapping';

describe('new sound event mapping', () => {
  it('maps supply line connection', () => {
    const sounds = getSoundsForNotification('📡 Supply Line Established', 'info');
    expect(sounds.map(s => s.sound)).toContain('supply_connect');
  });

  it('maps supply deal agreement', () => {
    const sounds = getSoundsForNotification('💰 Supply Deal Active', 'success');
    expect(sounds.map(s => s.sound)).toContain('supply_deal');
  });

  it('maps escort formation', () => {
    const sounds = getSoundsForNotification('🚗 Escort Formed', 'info');
    expect(sounds.map(s => s.sound)).toContain('escort_attach');
  });

  it('maps sitdown proposal', () => {
    const sounds = getSoundsForNotification('📩 Sitdown Proposed — Gambino', 'info');
    expect(sounds.map(s => s.sound)).toContain('sitdown_proposed');
  });

  it('maps sitdown ready', () => {
    const sounds = getSoundsForNotification('⏳ Sitdown Ready — Bonanno', 'info');
    expect(sounds.map(s => s.sound)).toContain('sitdown_ready');
  });

  it('maps sitdown accepted', () => {
    const sounds = getSoundsForNotification('🤝 Sitdown Accepted — Ceasefire Agreed!', 'success');
    expect(sounds.map(s => s.sound)).toContain('sitdown_accepted');
  });

  it('maps sitdown declined', () => {
    const sounds = getSoundsForNotification('❌ Sitdown Declined — Counter Rejected', 'warning');
    expect(sounds.map(s => s.sound)).toContain('sitdown_declined');
  });
});
