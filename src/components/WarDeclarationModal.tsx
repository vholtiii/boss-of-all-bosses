import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Swords } from 'lucide-react';
import { FAMILY_COLORS } from '@/lib/period-theme';
import { getWarDeclarationCopy, FAMILY_DISPLAY_NAMES, type FamilyId } from '@/lib/rival-narrative';
import { WAR_DURATION } from '@/types/game-mechanics';

export interface WarDeclarationPayload {
  familyA: string;
  familyB: string;
  playerInvolved: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  payload: WarDeclarationPayload | null;
  playerFamily: string;
  playSound?: (type: string) => void;
}

const WarDeclarationModal: React.FC<Props> = ({ open, onClose, payload, playerFamily, playSound }) => {
  if (!payload) return null;

  const copy = getWarDeclarationCopy(
    payload.familyA,
    payload.familyB,
    playerFamily,
    WAR_DURATION
  );

  const rivalFamily = payload.playerInvolved
    ? (payload.familyA === playerFamily ? payload.familyB : payload.familyA)
    : payload.familyA;
  const accentColor = FAMILY_COLORS[rivalFamily] || '#DC2626';

  const handleClose = () => {
    playSound?.('danger');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent
        className="max-w-lg border-0 bg-transparent p-0 shadow-none overflow-visible"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-sm overflow-hidden font-courier"
          style={{
            background: payload.playerInvolved
              ? 'linear-gradient(165deg, #1a0a0a 0%, #2d1212 45%, #1a0a0a 100%)'
              : 'linear-gradient(165deg, #141414 0%, #1f1f1f 45%, #141414 100%)',
            border: `2px solid ${payload.playerInvolved ? '#7f1d1d' : '#404040'}`,
            boxShadow: payload.playerInvolved
              ? `0 0 40px ${accentColor}44, inset 0 0 60px rgba(127, 29, 29, 0.3)`
              : '0 0 30px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
            }}
          />

          <div className="relative px-8 py-10 text-center space-y-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: `${accentColor}22`,
                border: `2px solid ${accentColor}`,
              }}
            >
              <Swords className="h-8 w-8" style={{ color: accentColor }} />
            </motion.div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-red-400/80 mb-2">
                {payload.playerInvolved ? 'Breaking News' : 'Street Intel'}
              </p>
              <h2
                className="text-3xl font-bold tracking-wider"
                style={{ color: payload.playerInvolved ? '#FCA5A5' : '#E5E5E5' }}
              >
                {copy.headline}
              </h2>
            </div>

            <p className="text-base text-gray-200 leading-relaxed px-2">
              {copy.body}
            </p>

            <p className="text-sm text-gray-400 italic leading-relaxed px-4 border-t border-b border-white/10 py-4">
              {copy.subtext}
            </p>

            {!payload.playerInvolved && (
              <p className="text-xs text-gray-500">
                {FAMILY_DISPLAY_NAMES[payload.familyA as FamilyId] || payload.familyA}
                {' vs '}
                {FAMILY_DISPLAY_NAMES[payload.familyB as FamilyId] || payload.familyB}
              </p>
            )}

            <Button
              onClick={handleClose}
              className="w-full mt-2 font-semibold tracking-wide"
              style={{
                background: payload.playerInvolved ? '#991B1B' : '#374151',
                color: '#fff',
              }}
            >
              Understood
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default WarDeclarationModal;
