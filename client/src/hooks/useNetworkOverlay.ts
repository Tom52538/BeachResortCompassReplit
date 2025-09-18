import { useQuery } from '@tanstack/react-query';
import { useSiteManager } from '@/lib/siteManager';
import { Site } from '@/types/navigation';

// Define the structure of the network overlay data
interface NetworkOverlayData {
  nodes: Array<{
    id: string;
    coordinates: [number, number];
    connectionCount: number;
    type: 'isolated' | 'endpoint' | 'junction';
  }>;
  edges: Array<{
    id:string;
    coordinates: Array<[number, number]>;
    pathType: string;
    distance: number;
  }>;
  stats: {
    totalNodes: number;
    totalEdges: number;
    components: number;
    coverage: string;
  };
}

// Async function to fetch the network overlay data
async function fetchNetworkOverlay(site: Site): Promise<NetworkOverlayData> {
  const response = await fetch(`/api/network-overlay?site=${site}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data.data;
}

// Custom hook to use the network overlay data
export const useNetworkOverlay = (enabled: boolean) => {
  const { config } = useSiteManager();
  const site = config.site;

  return useQuery<NetworkOverlayData, Error>({
    queryKey: ['networkOverlay', site],
    queryFn: () => fetchNetworkOverlay(site),
    enabled: enabled, // Only fetch when the overlay is shown
  });
};
