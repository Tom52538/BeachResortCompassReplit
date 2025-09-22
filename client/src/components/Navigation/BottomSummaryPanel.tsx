import React from 'react';
import { Button } from '@/components/ui/button';
import { Square } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { coerceMeters, coerceSeconds, formatDistance, formatDuration } from '@/utils/format';

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

  const formattedTime = formatDuration(coercedSeconds);
  const formattedDistance = formatDistance(coercedMeters);

  const getFormattedETA = () => {
    if (eta instanceof Date && !isNaN(eta.getTime())) {
      return eta.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (typeof eta === 'string' && eta) {
      return eta;
    }
    return '—';
  };

  const formattedETA = getFormattedETA();

  if (debug) {
    console.log('BottomSummaryPanel Debug:', {
      inputs: { timeRemaining, distanceRemaining, eta },
      coerced: { coercedSeconds, coercedMeters },
      formatted: { formattedTime, formattedDistance, formattedETA },
    });
  }

  return (
    <div className="bg-card p-4 rounded-t-lg shadow-lg flex items-center justify-between">
      <div className="flex flex-col text-left">
        <span className="text-2xl font-bold">{formattedTime}</span>
        <span className="text-muted-foreground">
          {formattedDistance} • {t('arrival')} {formattedETA}
        </span>
      </div>
      <Button variant="destructive" onClick={onEndNavigation} className="p-4 h-auto">
        <Square className="w-6 h-6 mr-2" />
        <span className="font-bold">{t('end_navigation')}</span>
      </Button>
    </div>
  );
};
