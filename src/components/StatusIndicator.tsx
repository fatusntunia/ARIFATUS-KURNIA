import React from 'react';
import { CalendarOff, CheckCircle2, Clock, Lock } from 'lucide-react';
import { SLOT_STATUS_CONFIG } from '../config/sirkusConfig';
import { SlotStatus } from '../types/sirkus';

interface StatusIndicatorProps {
  status: SlotStatus;
  compact?: boolean;
  showColorName?: boolean;
}

export const StatusIcon: React.FC<{ status: SlotStatus; className?: string }> = ({
  status,
  className = 'w-3.5 h-3.5',
}) => {
  switch (status) {
    case SlotStatus.AVAILABLE:
      return <CheckCircle2 className={className} aria-hidden="true" />;
    case SlotStatus.KEEP:
      return <Clock className={className} aria-hidden="true" />;
    case SlotStatus.BOOKED:
      return <Lock className={className} aria-hidden="true" />;
    case SlotStatus.HOLIDAY:
      return <CalendarOff className={className} aria-hidden="true" />;
  }
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  compact = false,
  showColorName = false,
}) => {
  const meta = SLOT_STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.08em] font-bold whitespace-nowrap ${
        compact ? 'text-[10px]' : 'text-[11px] px-2.5 py-1 border rounded-none'
      } ${compact ? meta.textClass : meta.badgeClass}`}
    >
      <StatusIcon status={status} className="w-3.5 h-3.5 shrink-0" />
      <span>
        {meta.label}
        {showColorName ? ` (${meta.colorName})` : ''}
      </span>
    </span>
  );
};
