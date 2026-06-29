import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlertEntry, AlertCategory } from '@/types/game-mechanics';
import { deriveTurnEventsFeed, type FeedItem } from '@/lib/turn-events-feed';
import {
  derivePostureTransitions,
  type PostureReason,
} from '@/lib/ai-posture-reasoner';

interface Props {
  alerts: AlertEntry[];
  currentTurn: number;
  gameState: any;
  onJumpHex?: (hex: { q: number; r: number; s: number }) => void;
  onJumpUnit?: (unit: { type: 'soldier' | 'capo'; q: number; r: number; s: number }) => void;
}

const CAT_ICON: Record<AlertCategory, string> = {
  combat: '⚔️',
  territory: '🗺️',
  diplomacy: '🤝',
  economy: '💵',
  intel: '👁️',
  phase: '🆙',
  system: '⚙️',
};

const CAT_RING: Record<AlertCategory, string> = {
  combat: 'border-l-rose-500',
  territory: 'border-l-emerald-500',
  diplomacy: 'border-l-mafia-gold',
  economy: 'border-l-yellow-500',
  intel: 'border-l-sky-500',
  phase: 'border-l-purple-500',
  system: 'border-l-muted',
};

const FAMILY_HUE: Record<string, string> = {
  gambino: 'text-red-400',
  genovese: 'text-blue-400',
  lucchese: 'text-emerald-400',
  bonanno: 'text-purple-400',
  colombo: 'text-amber-400',
};

const MAX_VISIBLE = 5;
const AUTO_DISMISS_MS = 25_000;

/**
 * Civ-style "Just Happened" feed — slides in at start of each player turn,
 * stacks recent events as dismissible cards. Purely surfaces existing
 * alertsLog data, no new mechanics.
 */
const JustHappenedFeed: React.FC<Props> = ({
  alerts,
  currentTurn,
  gameState,
  onJumpHex,
  onJumpUnit,
}) => {
  const feedItems = useMemo(
    () => deriveTurnEventsFeed(alerts, currentTurn, 20),
    [alerts, currentTurn]
  );
  const postureReasons = useMemo<PostureReason[]>(
    () => derivePostureTransitions(gameState),
    [gameState]
  );

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);
  const [turnKey, setTurnKey] = useState(currentTurn);

  // Reset dismissed list and collapse state on turn change
  useEffect(() => {
    if (currentTurn !== turnKey) {
      setDismissed(new Set());
      setCollapsed(false);
      setTurnKey(currentTurn);
    }
  }, [currentTurn, turnKey]);

  // Auto-dismiss after timeout
  useEffect(() => {
    if (collapsed) return;
    const id = window.setTimeout(() => setCollapsed(true), AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [collapsed, turnKey]);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const visible = feedItems.filter((f) => !dismissed.has(f.id));
  const postureVisible = postureReasons.filter(
    (p) => !dismissed.has(`posture:${p.family}`)
  );
  const totalCount = visible.length + postureVisible.length;

  if (totalCount === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-[120px] right-4 z-30 w-[320px] max-w-[90vw]"
      role="region"
      aria-label="Recent events"
    >
      <div className="pointer-events-auto flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-mafia-gold/80 font-bold font-playfair">
          <span>📜</span>
          <span>Just Happened</span>
          <span className="text-muted-foreground/70">· {totalCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-noir-light bg-background/60"
          >
            {collapsed ? 'Show' : 'Hide'}
          </button>
          {!collapsed && totalCount > 0 && (
            <button
              type="button"
              onClick={() => {
                const ids = new Set(dismissed);
                visible.forEach((v) => ids.add(v.id));
                postureVisible.forEach((p) => ids.add(`posture:${p.family}`));
                setDismissed(ids);
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-noir-light bg-background/60"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="feed-stack"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="pointer-events-auto space-y-1.5 max-h-[60vh] overflow-y-auto pr-1"
          >
            {/* Posture transition cards first */}
            {postureVisible.slice(0, 3).map((p) => (
              <PostureCard
                key={`posture:${p.family}`}
                reason={p}
                onDismiss={() => dismiss(`posture:${p.family}`)}
              />
            ))}

            {/* Event cards */}
            {visible.slice(0, MAX_VISIBLE).map((item) => (
              <EventCard
                key={item.id}
                item={item}
                onDismiss={() => dismiss(item.id)}
                onJumpHex={onJumpHex}
                onJumpUnit={onJumpUnit}
              />
            ))}

            {visible.length > MAX_VISIBLE && (
              <div className="text-[10px] text-center text-muted-foreground italic py-1">
                +{visible.length - MAX_VISIBLE} more (open Alerts Log)
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EventCard: React.FC<{
  item: FeedItem;
  onDismiss: () => void;
  onJumpHex?: (hex: { q: number; r: number; s: number }) => void;
  onJumpUnit?: (unit: { type: 'soldier' | 'capo'; q: number; r: number; s: number }) => void;
}> = ({ item, onDismiss, onJumpHex, onJumpUnit }) => {
  const canJump = !!(item.hex && onJumpHex) || !!(item.unit && onJumpUnit);

  const handleJump = () => {
    if (item.unit && onJumpUnit) onJumpUnit(item.unit);
    else if (item.hex && onJumpHex) onJumpHex(item.hex);
    onDismiss();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative rounded-md border border-noir-light border-l-4 bg-background/95 shadow-lg backdrop-blur',
        CAT_RING[item.category],
        item.type === 'error' && 'ring-1 ring-destructive/30'
      )}
    >
      <div className="flex items-start gap-2 p-2">
        <span className="text-base leading-none mt-0.5" aria-hidden>
          {CAT_ICON[item.category]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-foreground truncate" title={item.title}>
            {item.title}
          </div>
          {item.message && (
            <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
              {item.message}
            </div>
          )}
          {canJump && (
            <button
              type="button"
              onClick={handleJump}
              className="mt-1 inline-flex items-center gap-1 text-[10px] text-mafia-gold hover:text-mafia-gold/80 font-medium"
            >
              <MapPin className="h-3 w-3" />
              Jump to {item.unit ? 'unit' : 'hex'}
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground/60 hover:text-foreground -mr-1 -mt-1 p-1"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
};

const PostureCard: React.FC<{
  reason: PostureReason;
  onDismiss: () => void;
}> = ({ reason, onDismiss }) => {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const famClass = FAMILY_HUE[reason.family.toLowerCase()] || 'text-foreground';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-md border border-noir-light border-l-4 border-l-mafia-gold/60 bg-background/95 shadow-lg backdrop-blur"
    >
      <div className="flex items-start gap-2 p-2">
        <span className="text-base leading-none mt-0.5">🎯</span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold">
            <span className={famClass}>{cap(reason.family)}</span>
            <span className="text-muted-foreground"> · </span>
            <span className="text-foreground">{reason.posture}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{reason.cause}</div>
          {reason.implication && (
            <div className="text-[10px] text-mafia-gold/80 mt-0.5 italic">
              {reason.implication}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground/60 hover:text-foreground -mr-1 -mt-1 p-1"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
};

export default JustHappenedFeed;
