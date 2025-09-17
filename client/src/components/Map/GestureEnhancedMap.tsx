import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

interface GestureEnhancedMapProps {
  onDoubleTap?: (latlng: any) => void;
  onLongPress?: (latlng: any) => void;
  onSingleTap?: (latlng: any) => void;
  onRotate?: (rotation: number) => void;
  onRotateStart?: () => void;
  rotation?: number;
}

const GestureEnhancedMapInner = ({
  onDoubleTap,
  onLongPress,
  onSingleTap,
  onRotate,
  onRotateStart,
  rotation = 0,
}: GestureEnhancedMapProps) => {
  const map = useMap();
  const touchStart = useRef<{ time: number; pos: { x: number; y: number } } | null>(null);
  const rotationStart = useRef<{ angle: number; rotation: number } | null>(null);
  const lastTapTime = useRef<number>(0);
  const tapTimeoutId = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStart.current = {
        time: Date.now(),
        pos: { x: touch.clientX, y: touch.clientY },
      };
    } else if (e.touches.length === 2) {
      // Clear single-touch data to prevent tap events during multi-touch
      touchStart.current = null;
      if (tapTimeoutId.current) {
        clearTimeout(tapTimeoutId.current);
        tapTimeoutId.current = null;
      }

      // Notify parent that rotation is starting
      onRotateStart?.();

      // Capture initial state for rotation
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);
      rotationStart.current = {
        angle,
        rotation,
      };
    } else {
      // More than 2 touches, clear all gesture data
      touchStart.current = null;
      rotationStart.current = null;
      if (tapTimeoutId.current) {
        clearTimeout(tapTimeoutId.current);
        tapTimeoutId.current = null;
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && rotationStart.current && onRotate) {
      // Prevent default browser actions like scrolling when rotating
      e.preventDefault();

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);

      const deltaAngle = currentAngle - rotationStart.current.angle;
      let newRotation = rotationStart.current.rotation + deltaAngle;

      // Normalize rotation to be within -180 and 180
      newRotation = newRotation % 360;
      if (newRotation > 180) newRotation -= 360;
      if (newRotation < -180) newRotation += 360;

      onRotate(newRotation);
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    // Reset rotation tracking when multi-touch ends
    if (e.touches.length < 2) {
      rotationStart.current = null;
    }

    // If no touches remain, process tap gestures
    if (e.touches.length > 0) {
      return;
    }

    if (!touchStart.current) {
      return;
    }

    const touchEnd = Date.now();
    const duration = touchEnd - touchStart.current.time;
    const timeSinceLastTap = touchEnd - lastTapTime.current;

    if (duration > 500) { // Long press
      const containerPoint = [touchStart.current.pos.x, touchStart.current.pos.y];
      const latlng = map.containerPointToLatLng(containerPoint);
      onLongPress?.(latlng);
    } else { // Tap gesture
      if (tapTimeoutId.current) {
        clearTimeout(tapTimeoutId.current);
        tapTimeoutId.current = null;
        // Double tap
        const containerPoint = [touchStart.current.pos.x, touchStart.current.pos.y];
        const latlng = map.containerPointToLatLng(containerPoint);
        onDoubleTap?.(latlng);
        lastTapTime.current = 0;
      } else {
        // Single tap - wait for potential double tap
        const currentTouchPos = { ...touchStart.current.pos };
        tapTimeoutId.current = setTimeout(() => {
          const containerPoint = [currentTouchPos.x, currentTouchPos.y];
          const latlng = map.containerPointToLatLng(containerPoint);
          onSingleTap?.(latlng);
          tapTimeoutId.current = null;
        }, 250);
        lastTapTime.current = touchEnd;
      }
    }

    touchStart.current = null;
  };

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const handlers = {
      touchstart: handleTouchStart,
      touchmove: handleTouchMove,
      touchend: handleTouchEnd,
    };

    container.addEventListener('touchstart', handlers.touchstart, { passive: false });
    container.addEventListener('touchmove', handlers.touchmove, { passive: false });
    container.addEventListener('touchend', handlers.touchend, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handlers.touchstart);
      container.removeEventListener('touchmove', handlers.touchmove);
      container.removeEventListener('touchend', handlers.touchend);
    };
  }, [map, rotation, onRotate, onRotateStart]); // Add dependencies to re-bind if they change

  return null;
};

export const GestureEnhancedMap = (props: GestureEnhancedMapProps) => {
  return <GestureEnhancedMapInner {...props} />;
};