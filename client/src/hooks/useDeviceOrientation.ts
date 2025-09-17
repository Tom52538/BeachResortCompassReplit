import { useState, useEffect, useCallback } from 'react';

interface DeviceOrientation {
  heading: number | null;
  error: string | null;
}

type DeviceOrientationEventiOS = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

export const useDeviceOrientation = (): {
  heading: number | null;
  error: string | null;
  requestPermission: () => Promise<void>;
} => {
  const [orientation, setOrientation] = useState<DeviceOrientation>({
    heading: null,
    error: null,
  });

  const handleOrientation = (event: DeviceOrientationEvent) => {
    const eventiOS = event as DeviceOrientationEventiOS;
    let heading: number | null = null;

    if (eventiOS.webkitCompassHeading) {
      // iOS
      heading = eventiOS.webkitCompassHeading;
    } else if (event.alpha !== null) {
      // Android
      heading = 360 - event.alpha;
    }

    setOrientation({ heading, error: null });
  };

  const requestPermission = useCallback(async () => {
    // Check if the API exists and if permission needs to be requested.
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        } else {
          setOrientation({ heading: null, error: 'Permission denied.' });
        }
      } catch (err) {
        setOrientation({ heading: null, error: (err as Error).message });
      }
    } else {
      // For browsers that don't require permission (e.g., older browsers, Android)
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }, []);

  useEffect(() => {
    // This effect only cleans up the event listener.
    // The listener is added after permission is granted.
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  return { ...orientation, requestPermission };
};
