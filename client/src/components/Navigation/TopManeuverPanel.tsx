import React from 'react';
import { Navigation, ArrowRight, ArrowLeft, ArrowUp } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { coerceMeters, formatDistance } from '@/utils/format';

interface TopManeuverPanelProps {
  instruction: string;
  distance: number | string | null;
  distanceToNext?: number | string | null;
  maneuverType?: string;
}

const ManeuverIcon: React.FC<{ type?: string }> = ({ type }) => {
  switch (type) {
    case 'turn-right':
      return <ArrowRight className="w-8 h-8" />;
    case 'turn-left':
      return <ArrowLeft className="w-8 h-8" />;
    case 'straight':
    case 'continue':
      return <ArrowUp className="w-8 h-8" />;
    default:
      return <Navigation className="w-8 h-8" />;
  }
};

export const TopManeuverPanel: React.FC<TopManeuverPanelProps> = ({
  instruction,
  distance,
  distanceToNext,
  maneuverType,
}) => {
  const { t } = useLanguage();

  let coercedMeters = coerceMeters(distance);
  if (coercedMeters === null) {
    coercedMeters = coerceMeters(distanceToNext);
  }

  const formattedDistance = formatDistance(coercedMeters);
  const distanceText = `${t('navigation.approaching')} ${formattedDistance}`;

  return (
    <div className="flex items-center space-x-4 w-full">
      <div className="flex-shrink-0 text-primary">
        <ManeuverIcon type={maneuverType} />
      </div>
      <div className="flex flex-col text-left flex-grow min-w-0">
        <span className="text-xl font-bold truncate" title={instruction}>
          {instruction}
        </span>
        {coercedMeters !== null && (
          <span className="text-muted-foreground text-lg">{distanceText}</span>
        )}
      </div>
    </div>
  );
};
