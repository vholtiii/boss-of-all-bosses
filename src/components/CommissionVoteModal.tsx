import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, CheckCircle, XCircle } from 'lucide-react';

export interface CommissionVoteResult {
  callerFamily: string;
  isPlayerCaller: boolean;
  voteResults: Array<{ family: string; vote: boolean; reason: string }>;
  needed: number;
  won: boolean;
  yesVotes: number;
  totalVoters: number;
}

const familyColors: Record<string, string> = {
  gambino: '#42D3F2',
  genovese: '#2AA63E',
  lucchese: '#E8E847',
  bonanno: '#E85C47',
  colombo: '#B347E8',
};

const familyNames: Record<string, string> = {
  gambino: 'Gambino',
  genovese: 'Genovese',
  lucchese: 'Lucchese',
  bonanno: 'Bonanno',
  colombo: 'Colombo',
};

interface Props {
  open: boolean;
  onClose: () => void;
  result: CommissionVoteResult | null;
  playSound?: (type: string) => void;
}

const CommissionVoteModal: React.FC<Props> = ({ open, onClose, result, playSound }) => {
  const [revealedCount, setRevealedCount] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!open || !result) {
      setRevealedCount(0);
      setShowResult(false);
      return;
    }

    // Stagger reveals
    const total = result.voteResults.length;
    let current = 0;

    const revealNext = () => {
      current++;
      setRevealedCount(current);
      
      // Play sound for revealed vote
      const vote = result.voteResults[current - 1];
      if (vote && playSound) {
        playSound(vote.vote ? 'success' : 'danger');
      }

      if (current < total) {
        setTimeout(revealNext, 1200);
      } else {
        // Show final result after last reveal
        setTimeout(() => {
          setShowResult(true);
          if (playSound) {
            playSound(result.won ? 'levelup' : 'error');
          }
        }, 1000);
      }
    };

    // Start first reveal after a short delay
    const timer = setTimeout(revealNext, 800);
    return () => clearTimeout(timer);
  }, [open, result]);

  if (!result) return null;

  const callerName = familyNames[result.callerFamily] || result.callerFamily;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-amber-500/30 p-0 overflow-hidden">
        {/* Header */}
        <div className="text-center py-6 px-6 bg-gradient-to-b from-amber-900/30 to-transparent">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
          >
            <Crown className="h-10 w-10 text-amber-400 mx-auto mb-2" />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground tracking-wide">THE COMMISSION MEETS</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {result.isPlayerCaller
              ? '"I call this meeting to decide our future."'
              : `The ${callerName} family calls for a vote.`}
          </p>
        </div>

        {/* Vote Cards */}
        <div className="px-6 pb-2 space-y-2 max-h-[300px] overflow-y-auto">
          {result.voteResults.map((vote, i) => {
            const revealed = i < revealedCount;
            const color = familyColors[vote.family] || '#888';
            const name = familyNames[vote.family] || vote.family;

            return (
              <AnimatePresence key={vote.family}>
                {revealed ? (
                  <motion.div
                    initial={{ opacity: 0, x: -30, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="flex items-center gap-3 rounded-lg border p-3"
                    style={{ borderColor: `${color}40`, backgroundColor: `${color}08` }}
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-foreground">{name}</span>
                      <p className="text-xs text-muted-foreground truncate">{vote.reason}</p>
                    </div>
                    {vote.vote ? (
                      <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                    )}
                    <span className={`text-sm font-bold shrink-0 ${vote.vote ? 'text-green-400' : 'text-red-400'}`}>
                      {vote.vote ? 'YES' : 'NO'}
                    </span>
                  </motion.div>
                ) : i === revealedCount ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="flex items-center gap-3 rounded-lg border border-muted p-3"
                  >
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/30 shrink-0" />
                    <span className="text-sm text-muted-foreground">Revealing vote...</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            );
          })}
        </div>

        {/* Result Banner */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`mx-6 mb-4 rounded-lg p-4 text-center border ${
                result.won
                  ? 'bg-amber-900/20 border-amber-500/50'
                  : 'bg-red-900/20 border-red-500/50'
              }`}
            >
              <p className="text-lg font-bold text-foreground">
                {result.won
                  ? result.isPlayerCaller
                    ? '👑 You are the Boss of All Bosses!'
                    : `👑 ${callerName} is Boss of All Bosses!`
                  : '❌ Vote Failed'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {result.yesVotes}/{result.totalVoters} votes ({result.needed} needed)
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue Button */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-6 pb-6"
            >
              <Button onClick={onClose} className="w-full">
                Continue
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default CommissionVoteModal;
