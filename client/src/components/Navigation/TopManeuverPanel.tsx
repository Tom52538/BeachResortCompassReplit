import React from 'react';
import { Navigation, ArrowRight, ArrowLeft, ArrowUp } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { coerceMeters, formatDistance } from '@/utils/format';

interface TopManeuverPanelProps {
  instruction: string;
  distance: number | string | null;
  distanceToNext?: number | string | null; // Optional fallback
  maneuverType?: string;
}

const ManeuverIcon: React.FC<{ type?: string }> = ({ type }) => {
  // Simple example, can be expanded with more maneuver types
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

  // Coerce primary distance. If it's invalid (null), try coercing the fallback.
  let coercedMeters = coerceMeters(distance);
  if (coercedMeters === null) {
    coercedMeters = coerceMeters(distanceToNext);
  }

  const formattedDistance = formatDistance(coercedMeters);

  // Manually construct the distance text using translated parts, e.g., "Abbiegen in 100 m"
  const distanceText = `${t('navigation.approaching')} ${formattedDistance}`;

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-card p-4 rounded-b-lg shadow-lg flex items-center space-x-4">
      <div className="flex-shrink-0 text-primary">
        <ManeuverIcon type={maneuverType} />
      </div>
      <div className="flex flex-col text-left flex-grow">
        <span className="text-xl font-bold">{instruction}</span>
        {/* Only show distance if it's valid to avoid showing "in —" */}
        {coercedMeters !== null && (
          <span className="text-muted-foreground text-lg">{distanceText}</span>
        )}
      </div>
    </div>
  );
};
