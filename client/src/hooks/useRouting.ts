import { useMutation } from '@tanstack/react-query';
import { NavigationRoute } from '@/types/navigation';

// Local helpers for formatting and safety without adding new files.
function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '0 m';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDurationShort(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0 min';
  if (seconds < 60) return '1 min';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hours}h ${rem} min`;
}

interface RouteRequest {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  mode?: 'walking' | 'cycling' | 'driving';
  options?: {
    avoidSteps?: boolean;
    preferPaved?: boolean;
    alternativeCount?: number;
  };
}

async function getRouteService(request: RouteRequest): Promise<NavigationRoute> {
  console.log('🗺️ ROUTING REQUEST DEBUG:', {
    from: request.from,
    to: request.to,
    mode: request.mode,
    hasValidFrom: !!(request.from?.lat && request.from?.lng),
    hasValidTo: !!(request.to?.lat && request.to?.lng)
  });

  // Validate coordinates
  if (!request.from?.lat || !request.from?.lng || !request.to?.lat || !request.to?.lng) {
    console.error('❌ ROUTING: Invalid coordinates:', { from: request.from, to: request.to });
    throw new Error('Invalid coordinates provided');
  }

  // Ensure coordinates are numbers
  const fromLat = Number(request.from.lat);
  const fromLng = Number(request.from.lng);
  const toLat = Number(request.to.lat);
  const toLng = Number(request.to.lng);

  if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
    console.error('❌ ROUTING: Non-numeric coordinates:', { from: request.from, to: request.to });
    throw new Error('Coordinates must be numeric');
  }

  const requestBody = {
    from: {
      lat: fromLat,
      lng: fromLng
    },
    to: {
      lat: toLat,
      lng: toLng
    },
    profile: request.mode || 'walking'
  };

  console.log('🗺️ SENDING ROUTING REQUEST:', requestBody);

  const response = await fetch('/api/route/enhanced', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('🗺️ ROUTING ERROR RESPONSE:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Routing failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log('🗺️ ROUTING RESPONSE:', data);

  if (!data.success) {
    throw new Error(data.error || 'Routing failed');
  }

  // Prefer numeric fields if present; keep BC fallbacks.
  const durationSeconds: number =
    typeof data.durationSeconds === 'number'
      ? data.durationSeconds
      : Number(data.durationSeconds) || 0;

  const distanceMeters: number =
    typeof data.distanceMeters === 'number'
      ? data.distanceMeters
      : (typeof data.totalDistance === 'number' ? data.totalDistance : 0);

  const estimatedTimeStr =
    durationSeconds > 0
      ? formatDurationShort(durationSeconds)
      : (typeof data.estimatedTime === 'string' ? data.estimatedTime : '0 min');

  const totalDistanceNumeric =
    Number.isFinite(distanceMeters) && distanceMeters >= 0
      ? distanceMeters
      : (typeof data.totalDistance === 'number' ? data.totalDistance : 0);

  const route: NavigationRoute = {
    totalDistance: totalDistanceNumeric,
    estimatedTime: estimatedTimeStr,
    durationSeconds: durationSeconds || 0,
    instructions: data.instructions?.map((instruction: any) => ({
      instruction: instruction.instruction || instruction,
      distance: instruction.distance || '0 m',
      duration: instruction.duration || '0 s',
      type: instruction.maneuverType === 'arrive' ? 1 : 0
    })) || [],
    geometry: data.geometry || [],
    nextInstruction: null,
    arrivalTime: calculateArrivalTime(durationSeconds || 0)
  };

  console.log('🗺️ ROUTING NORMALIZED:', {
    totalDistance: route.totalDistance,
    totalDistanceFormatted: formatDistance(route.totalDistance as number),
    estimatedTime: route.estimatedTime,
    durationSeconds: route.durationSeconds
  });

  return route;
}

export const useRouting = () => {
  const getRoute = useMutation<NavigationRoute, Error, RouteRequest>({
    mutationFn: async (request: RouteRequest) => {
      console.log('🗺️ OSM-ONLY ROUTING: No fallbacks, no bird routes');
      return await getRouteService(request);
    },
    retry: 1,
    retryDelay: 1000,
  });

  return {
    getRoute,
    isLoading: getRoute.isPending,
    error: getRoute.error,
    data: getRoute.data
  };
};

function calculateArrivalTime(durationSeconds: number): string {
  const now = new Date();
  const arrival = new Date(now.getTime() + durationSeconds * 1000);

  return arrival.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
