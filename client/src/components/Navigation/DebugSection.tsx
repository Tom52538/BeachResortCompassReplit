import React from 'react';
import { DebugOverlay } from '@/components/Navigation/DebugOverlay';
import { DebugInfoPanel } from '@/components/Navigation/DebugInfoPanel';
import { POILocalizationDebugger } from '@/components/Navigation/POILocalizationDebugger';
import { POILocalizationTestPanel } from '@/components/Navigation/POILocalizationTestPanel';
import { VoiceControlPanel } from '@/components/Navigation/VoiceControlPanel';
import { Button } from '@/components/ui/button';

interface DebugSectionProps {
  isDebugMode: boolean;
  isNavigating: boolean;
  showNetworkDebug: boolean;
  showNetworkOverlay: boolean;
  voiceEnabled: boolean;
  currentSite: string;
  networkOverlayUrl?: string;
  debugInfo?: {
    reroutingCooldown: boolean;
    [key: string]: any;
  };
  onToggleDebugMode: () => void;
  onToggleNetworkDebug: () => void;
  onToggleNetworkOverlay: () => void;
  onVoiceToggle: () => void;
}

export const DebugSection: React.FC<DebugSectionProps> = ({
  isDebugMode,
  isNavigating,
  showNetworkDebug,
  showNetworkOverlay,
  voiceEnabled,
  currentSite,
  networkOverlayUrl,
  debugInfo,
  onToggleDebugMode,
  onToggleNetworkDebug,
  onToggleNetworkOverlay,
  onVoiceToggle
}) => {
  // Only show in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  console.log('🐛 DEBUG SECTION DEBUG:', {
    isDebugMode,
    isNavigating,
    showNetworkDebug,
    showNetworkOverlay,
    voiceEnabled,
    currentSite,
    hasDebugInfo: !!debugInfo
  });

  return (
    <div className="debug-section">
      {/* Debug Mode Toggle */}
      <div className="debug-controls fixed bottom-4 left-4 z-[1001] space-y-2">
        <Button
          onClick={onToggleDebugMode}
          variant={isDebugMode ? "default" : "outline"}
          size="sm"
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          🐛 Debug {isDebugMode ? 'ON' : 'OFF'}
        </Button>
        
        {isDebugMode && (
          <>
            <Button
              onClick={onToggleNetworkDebug}
              variant={showNetworkDebug ? "default" : "outline"}
              size="sm"
              className="block w-full"
            >
              🔍 Network Debug
            </Button>
            
            <Button
              onClick={onToggleNetworkOverlay}
              variant={showNetworkOverlay ? "default" : "outline"}
              size="sm"
              className="block w-full"
            >
              🗺️ Network Overlay
            </Button>
          </>
        )}
      </div>

      {/* Debug Overlays */}
      {isDebugMode && (
        <>
          {/* POI Localization Debugger */}
          <div className="fixed top-4 left-4 z-[1000] max-w-sm">
            <POILocalizationDebugger currentSite={currentSite} />
          </div>

          {/* POI Localization Test Panel */}
          <div className="fixed top-4 right-4 z-[1000] max-w-sm">
            <POILocalizationTestPanel />
          </div>

          {/* Voice Control Panel */}
          <div className="fixed bottom-4 right-4 z-[1000]">
            <VoiceControlPanel
              voiceEnabled={voiceEnabled}
              onVoiceToggle={onVoiceToggle}
            />
          </div>

          {/* Network Debug Overlay */}
          {showNetworkOverlay && networkOverlayUrl && (
            <DebugOverlay
              title="Network Routing Debug"
              overlayUrl={networkOverlayUrl}
              onClose={() => onToggleNetworkOverlay()}
            />
          )}

          {/* Navigation Debug Info Panel */}
          {isNavigating && debugInfo && (
            <div className="fixed top-1/2 left-4 z-[1000] transform -translate-y-1/2">
              <DebugInfoPanel 
                debugInfo={debugInfo} 
                reroutingCooldown={debugInfo.reroutingCooldown}
              />
            </div>
          )}
        </>
      )}

      {/* Development indicators */}
      <div className="dev-indicators fixed top-2 left-2 z-[999] text-xs text-gray-500 bg-black/50 text-white px-2 py-1 rounded">
        <div>ENV: {process.env.NODE_ENV}</div>
        <div>SITE: {currentSite}</div>
        {isDebugMode && <div>DEBUG: ACTIVE</div>}
        {showNetworkDebug && <div>NETWORK: DEBUG</div>}
        {voiceEnabled && <div>VOICE: ON</div>}
      </div>
    </div>
  );
};