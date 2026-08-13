import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Chip } from '@/types/negotiation';
import { CHIP_META, describeChip, valueChip } from '@/lib/sitdown-valuation';

interface ChipCardProps {
  chip: Chip;
  /** Editable numeric field (cash amount / turns) */
  onChange?: (patch: Partial<Chip>) => void;
  onRemove?: () => void;
  locked?: boolean;
}

const ChipCard: React.FC<ChipCardProps> = ({ chip, onChange, onRemove, locked }) => {
  const meta = CHIP_META[chip.kind];
  const mine = chip.from === 'player';

  return (
    <div
      className={cn(
        'rounded-md border px-2.5 py-2 text-xs backdrop-blur-sm transition-colors',
        mine
          ? 'border-primary/40 bg-primary/10 hover:border-primary/70'
          : 'border-destructive/40 bg-destructive/10 hover:border-destructive/70',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold tracking-wide">
            <span className="mr-1">{meta.icon}</span>{meta.label}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">{describeChip(chip)}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            ≈${valueChip(chip).toLocaleString()}
          </span>
          {!locked && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded p-0.5 text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${meta.label}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {!locked && onChange && chip.kind === 'cash' && (
        <input
          type="range"
          min={1000}
          max={80000}
          step={500}
          value={chip.amount || 0}
          onChange={(e) => onChange({ amount: Number(e.target.value) })}
          className="mt-1.5 w-full accent-primary"
          aria-label="Cash amount"
        />
      )}

      {!locked && onChange && chip.turns !== undefined && (
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={chip.turns}
          onChange={(e) => onChange({ turns: Number(e.target.value) })}
          className="mt-1.5 w-full accent-primary"
          aria-label="Duration in turns"
        />
      )}

      {!locked && onChange && chip.kind === 'tribute' && (
        <input
          type="range"
          min={10}
          max={60}
          step={5}
          value={Math.round((chip.pct ?? 0.3) * 100)}
          onChange={(e) => onChange({ pct: Number(e.target.value) / 100 })}
          className="mt-1 w-full accent-primary"
          aria-label="Tribute share"
        />
      )}
    </div>
  );
};

export default ChipCard;
