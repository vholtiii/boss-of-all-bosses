import React from 'react';
import { cn } from '@/lib/utils';
import type { ActionPreview, PreviewDelta } from '@/lib/action-previews';

/**
 * Renders an ActionPreview: success chance with itemized modifiers,
 * costs, success/failure consequences, and threshold warnings.
 * Used inside action dialogs and as hover content on action buttons.
 */

const toneClass: Record<PreviewDelta['tone'], string> = {
  good: 'text-green-400',
  bad: 'text-red-400',
  neutral: 'text-muted-foreground',
};

const chanceColor = (c: number): string =>
  c >= 0.7 ? 'text-green-400' : c >= 0.45 ? 'text-yellow-400' : 'text-red-400';

const DeltaRow: React.FC<{ delta: PreviewDelta }> = ({ delta }) => (
  <div className="flex items-baseline justify-between gap-2 text-[11px] leading-tight">
    <span className="text-muted-foreground shrink-0">{delta.label}</span>
    <span className={cn('text-right', toneClass[delta.tone])}>{delta.value}</span>
  </div>
);

interface ActionPreviewCardProps {
  preview: ActionPreview;
  /** Compact mode omits the title (when embedded under an existing button). */
  compact?: boolean;
  className?: string;
}

const ActionPreviewCard: React.FC<ActionPreviewCardProps> = ({ preview, compact, className }) => {
  if (!preview.valid && preview.blockedReason) {
    return (
      <div className={cn('rounded-md border border-border bg-muted/40 px-3 py-2', className)}>
        {!compact && <div className="text-xs font-semibold mb-0.5">{preview.title}</div>}
        <div className="text-[11px] text-yellow-500">🚫 {preview.blockedReason}</div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-md border border-border bg-card/95 px-3 py-2 space-y-1.5', className)}>
      {!compact && <div className="text-xs font-semibold">{preview.title}</div>}

      {typeof preview.successChance === 'number' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Success chance</span>
            <span className={cn('text-sm font-bold tabular-nums', chanceColor(preview.successChance))}>
              {Math.round(preview.successChance * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all',
                preview.successChance >= 0.7 ? 'bg-green-500' : preview.successChance >= 0.45 ? 'bg-yellow-500' : 'bg-red-500')}
              style={{ width: `${Math.round(preview.successChance * 100)}%` }}
            />
          </div>
          {preview.modifiers.length > 0 && (
            <div className="grid grid-cols-1 gap-x-3 pt-0.5">
              {preview.modifiers.map((m, i) => (
                <div key={i} className="flex items-baseline justify-between text-[10px] leading-tight">
                  <span className="text-muted-foreground/80">{m.label}</span>
                  <span className={cn('tabular-nums', m.delta >= 0 ? 'text-green-400/90' : 'text-red-400/90')}>
                    {m.delta >= 0 ? '+' : ''}{Math.round(m.delta * 10) / 10}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {preview.costs.length > 0 && (
        <div className="border-t border-border/60 pt-1 space-y-0.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Cost</div>
          {preview.costs.map((d, i) => <DeltaRow key={i} delta={d} />)}
        </div>
      )}

      {preview.onSuccess.length > 0 && (
        <div className="border-t border-border/60 pt-1 space-y-0.5">
          <div className="text-[10px] uppercase tracking-wide text-green-500/80">On success</div>
          {preview.onSuccess.map((d, i) => <DeltaRow key={i} delta={d} />)}
        </div>
      )}

      {preview.onFailure.length > 0 && (
        <div className="border-t border-border/60 pt-1 space-y-0.5">
          <div className="text-[10px] uppercase tracking-wide text-red-500/80">On failure</div>
          {preview.onFailure.map((d, i) => <DeltaRow key={i} delta={d} />)}
        </div>
      )}

      {preview.warnings.length > 0 && (
        <div className="border-t border-border/60 pt-1 space-y-1">
          {preview.warnings.map((w, i) => (
            <div key={i} className="text-[10px] leading-snug text-yellow-500/90 flex gap-1">
              <span className="shrink-0">⚠️</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionPreviewCard;
