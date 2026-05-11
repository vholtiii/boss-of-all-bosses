/**
 * Cloud save adapter — mirrors local save slots to the `cloud_saves` table
 * for the currently authenticated user. All ops degrade gracefully: a
 * failed cloud call never throws into game flow.
 */

import { supabase } from '@/integrations/supabase/client';
import type { SaveGameData } from '@/hooks/useGameSaveLoad';
import type { SlotId } from '@/lib/gameStorage';
import { CURRENT_SCHEMA_VERSION } from '@/lib/saveMigrations';

export interface CloudSlotEntry {
  slot: SlotId;
  saveData: SaveGameData;
  schemaVersion: number;
  saveDate: string; // ISO
}

const slotToText = (slot: SlotId) => String(slot);
const textToSlot = (s: string): SlotId => (s === 'auto' ? 'auto' : Number(s));

export async function cloudListSlots(userId: string): Promise<CloudSlotEntry[]> {
  const { data, error } = await supabase
    .from('cloud_saves')
    .select('slot, save_data, schema_version, save_date')
    .eq('user_id', userId);
  if (error) {
    console.warn('[cloud] list failed', error);
    return [];
  }
  return (data ?? []).map(row => ({
    slot: textToSlot(row.slot as string),
    saveData: row.save_data as unknown as SaveGameData,
    schemaVersion: row.schema_version as number,
    saveDate: row.save_date as string,
  }));
}

export async function cloudWriteSlot(
  userId: string,
  slot: SlotId,
  data: SaveGameData,
  schemaVersion: number = CURRENT_SCHEMA_VERSION,
): Promise<{ success: boolean; error?: string }> {
  const row = {
    user_id: userId,
    slot: slotToText(slot),
    save_data: data as any,
    game_version: data.gameVersion,
    schema_version: schemaVersion,
    save_date: data.saveDate,
  };
  const { error } = await supabase
    .from('cloud_saves')
    .upsert(row, { onConflict: 'user_id,slot' });
  if (error) {
    console.warn('[cloud] write failed', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function cloudDeleteSlot(userId: string, slot: SlotId): Promise<void> {
  const { error } = await supabase
    .from('cloud_saves')
    .delete()
    .eq('user_id', userId)
    .eq('slot', slotToText(slot));
  if (error) console.warn('[cloud] delete failed', error);
}

export async function cloudReadSlot(
  userId: string,
  slot: SlotId,
): Promise<CloudSlotEntry | null> {
  const { data, error } = await supabase
    .from('cloud_saves')
    .select('slot, save_data, schema_version, save_date')
    .eq('user_id', userId)
    .eq('slot', slotToText(slot))
    .maybeSingle();
  if (error || !data) return null;
  return {
    slot: textToSlot(data.slot as string),
    saveData: data.save_data as unknown as SaveGameData,
    schemaVersion: data.schema_version as number,
    saveDate: data.save_date as string,
  };
}
