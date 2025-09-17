import { Coordinates } from '@/types/navigation';
import { calculateDistance as calcDistanceMeters, toRadians } from '../../../shared/utils';
import { point } from '@turf/helpers';
import bearing from '@turf/bearing';

export const calculateDistance = (point1: Coordinates, point2: Coordinates): number => {
  // Convert from meters to kilometers for backward compatibility
  return calcDistanceMeters(point1.lat, point1.lng, point2.lat, point2.lng) / 1000;
};

/**
 * Formats a distance in meters into a readable string.
 * e.g., 950 -> "950 m", 1250 -> "1.3 km"
 * @param distanceInMeters The distance in meters.
 * @returns A formatted string.
 */
export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)} m`;
  }
  const kilometers = distanceInMeters / 1000;
  if (kilometers < 10) {
    return `${kilometers.toFixed(1)} km`;
  }
  return `${Math.round(kilometers)} km`;
};

export { toRadians };

export const getBounds = (coordinates: Coordinates[]): [[number, number], [number, number]] => {
  if (coordinates.length === 0) {
    return [[0, 0], [0, 0]];
  }

  let minLat = coordinates[0].lat;
  let maxLat = coordinates[0].lat;
  let minLng = coordinates[0].lng;
  let maxLng = coordinates[0].lng;

  coordinates.forEach(coord => {
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
  });

  return [[minLat, minLng], [maxLat, maxLng]];
};

/**
 * Calculates the bearing (direction) from one coordinate to another using Turf.js.
 * @param from The starting coordinate.
 * @param to The destination coordinate.
 * @returns The bearing in degrees (from -180 to 180).
 */
export const calculateBearing = (from: Coordinates, to: Coordinates): number => {
  const fromPoint = point([from.lng, from.lat]);
  const toPoint = point([to.lng, to.lat]);
  return bearing(fromPoint, toPoint);
};

export const decodePolyline = (encoded: string): number[][] => {
  const coordinates: number[][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += deltaLng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
};