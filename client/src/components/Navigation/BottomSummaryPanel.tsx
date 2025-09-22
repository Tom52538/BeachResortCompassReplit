import React from 'react';
import { Button } from '@/components/ui/button';
import { Square } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { coerceMeters, coerceSeconds, formatDistance, formatDurationShort, formatETA } from '@/utils/format';

interface BottomSummaryPanelProps {
  timeRemaining: number | string | null;
  distanceRemaining: number | string | null;
  eta: Date | string | null;
  onEndNavigation: () => void;
  debug?: boolean;
}

export const BottomSummaryPanel: React.FC<BottomSummaryPanelProps> = ({
  timeRemaining,
  distanceRemaining,
  eta,
  onEndNavigation,
  debug = false,
}) => {
  const { t } = useLanguage();

  const coercedSeconds = coerceSeconds(timeRemaining);
  const coercedMeters = coerceMeters(distanceRemaining);

  const durationText = formatDurationShort(coercedSeconds);
  const distanceText = formatDistance(coercedMeters);

  const etaText = eta instanceof Date ? formatETA(eta) : typeof eta === 'string' ? eta : '–';

  if (debug) {
    console.log('BottomSummaryPanel Debug:', {
      inputs: { timeRemaining, distanceRemaining, eta },
      coerced: { coercedSeconds, coercedMeters },
      formatted: { durationText, distanceText, etaText },
    });
  }

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-col text-left">
        <span className="text-lg font-semibold">{durationText}</span>
        <span className="text-sm text-muted-foreground">
          {distanceText} • {t('navigation.eta')} {etaText}
        </span>
      </div>
      <Button variant="destructive" onClick={onEndNavigation} className="p-4 h-auto whitespace-nowrap">
        <Square className="w-5 h-5 mr-2" />
        <span className="font-bold text-sm">{t('navigation.endNavigation')}</span>
      </Button>
    </div>
  );
};
