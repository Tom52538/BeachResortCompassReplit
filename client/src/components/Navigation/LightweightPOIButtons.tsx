import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { usePOICategories } from '@/hooks/usePOICategories';
import { usePOI } from '@/hooks/usePOI';
import { useSiteManager } from '@/lib/siteManager';

interface LightweightPOIButtonsProps {
  onCategorySelect: (category: string) => void;
  activeCategories?: string[]; // Changed to array for multiple selections
  selectedPOI?: boolean; // Add prop to know when POI is selected
}



// POI categories for Kamperland location - camping/recreation focused
const KAMPERLAND_POI_BUTTONS = [
  { category: 'toilets', icon: '🚽', label: 'Toiletten', color: 'bg-blue-500' },
  { category: 'food-drink', icon: '🍽️', label: 'Gastronomie', color: 'bg-orange-500' },
  { category: 'parking', icon: '🅿️', label: 'Parkplätze', color: 'bg-gray-500' },
  { category: 'leisure', icon: '🏊', label: 'Freizeit', color: 'bg-green-500' },
  { category: 'bungalows', icon: '🏘️', label: 'Bungalows', color: 'bg-green-600' },
  { category: 'beach_houses', icon: '🏖️', label: 'Strandhäuser', color: 'bg-cyan-500' },
  { category: 'lodge', icon: '🏝️', label: 'Water Village Lodges', color: 'bg-teal-500' },
  { category: 'bungalows_water', icon: '🏝️', label: 'Water Village Bungalows', color: 'bg-teal-600' }
];

// POI categories for Zuhause location - EXACT implementation of analyzed concept
const ZUHAUSE_POI_BUTTONS = [
  { category: 'parking', icon: '🚗', label: 'Verkehr & Parken', color: 'bg-blue-500' }, // 580 POIs - 45%
  { category: 'gastronomie', icon: '🍽️', label: 'Gastronomie', color: 'bg-orange-500' }, // 25 POIs - 2%
  { category: 'accommodation', icon: '🏨', label: 'Übernachten', color: 'bg-green-600' }, // 58 POIs - 4%
  { category: 'services', icon: 'ℹ️', label: 'Info & Services', color: 'bg-purple-500' }, // 80 POIs - 6%
  { category: 'kultur', icon: '⛪', label: 'Kultur & Religion', color: 'bg-amber-800' }, // 36 POIs - 3%
  { category: 'sport', icon: '🏃', label: 'Sport & Freizeit', color: 'bg-red-500' }, // 120 POIs - 9%
  { category: 'shopping', icon: '🛒', label: 'Einkaufen', color: 'bg-yellow-500' }, // 50 POIs - 4%
  { category: 'gesundheit', icon: '🏥', label: 'Gesundheit & Bildung', color: 'bg-teal-600' } // 28 POIs - 2%
];

export const LightweightPOIButtons = ({ onCategorySelect, activeCategories = [], selectedPOI }: LightweightPOIButtonsProps) => {
  const [visibleTooltip, setVisibleTooltip] = useState<string | null>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);
  const { t, currentLanguage } = useLanguage(); // Assuming currentLanguage is available from useLanguage hook

  // SiteManager - Single Source of Truth! No more localStorage polling!
  const { config: siteConfig } = useSiteManager();
  const currentSite = siteConfig.site;

  console.log('🎯 POI BUTTONS: Using SiteManager:', { currentSite, isValid: siteConfig.isValid });

  // No POI fetching needed - buttons are hardcoded, dynamic categories disabled

  // SiteManager handles all site changes automatically - no polling needed!

  // Always use hardcoded buttons - dynamic categories are disabled
  const POI_BUTTONS = currentSite === 'zuhause' ? ZUHAUSE_POI_BUTTONS : KAMPERLAND_POI_BUTTONS;

  console.log(`🔍 POI BUTTON DEBUG: Erkannte Site: "${currentSite}", verwende ${POI_BUTTONS.length} Buttons für ${currentSite}`);

  const handleCategoryClick = useCallback((category: string) => {
    console.log(`🔍 POI BUTTON DEBUG: ===========================================`);
    console.log(`🔍 POI BUTTON DEBUG: Category button clicked: "${category}" for site: ${currentSite}`);
    console.log(`🔍 POI BUTTON DEBUG: Previous active categories:`, activeCategories);

    // For Zuhause location, map to exact OSM categories based on analyzed data
    let mappedCategory = category;
    if (currentSite === 'zuhause') {
      const categoryMapping = {
        'parking': 'parking', // Direct: amenity=parking (575 POIs)
        'gastronomie': 'gastronomie', // Direct mapping to gastronomie filter (25 POIs)
        'accommodation': 'tourism', // tourism=camp_pitch,apartment,guest_house,chalet (58 POIs)
        'services': 'information', // tourism=information,amenity=post_box,atm,post_office,townhall,police (80 POIs)
        'kultur': 'place_of_worship', // amenity=place_of_worship (36 POIs)
        'sport': 'leisure', // leisure=pitch,playground,stadium,swimming_pool + sport=* (120 POIs)
        'shopping': 'shop', // shop=supermarket,bakery,hairdresser,etc (50 POIs)
        'gesundheit': 'healthcare' // amenity=doctors,pharmacy,dentist + amenity=school,kindergarten (28 POIs)
      };
      mappedCategory = categoryMapping[category] || category;
      console.log(`🔍 POI BUTTON DEBUG: Mapped "${category}" to "${mappedCategory}" for ${currentSite}`);
    }

    console.log(`🔍 POI BUTTON DEBUG: Calling onCategorySelect with: "${mappedCategory}"`);
    onCategorySelect(mappedCategory);
    setVisibleTooltip(category);

    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    tooltipTimeoutRef.current = window.setTimeout(() => {
      setVisibleTooltip(null);
      console.log(`🔍 POI BUTTON DEBUG: Cleared visible tooltip`);
    }, 2000);
  }, [onCategorySelect, activeCategories, currentSite]);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to translate text
  const translateText = (text: string, language: string): string => {
    // In a real app, this would involve a more robust translation mechanism
    // For now, we'll just return the text with a placeholder for the language
    // This simulates fetching translated text
    if (language === 'en') return text; // Default to English if no specific translation found
    return `${text} (translated to ${language})`;
  };

  const renderVerticalButton = (poi: any, index: number) => {
    const isButtonActive = activeCategories.includes(poi.category);
    const displayIcon = poi.icon;
    const displayLabel = poi.label; // Use German labels directly from button definition

    return (
      <div key={poi.category || index} className="relative mb-1">
        <button
          onClick={() => handleCategoryClick(poi.category as string)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 focus:outline-none
            ${isButtonActive ? 'poi-button--active' : 'poi-button--inactive'}
            hover:scale-105 active:scale-95`}
          style={{
            background: isButtonActive
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.7), rgba(59, 130, 246, 0.7))'
              : 'rgba(255, 255, 255, 0.2)',
            border: isButtonActive ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: isButtonActive ? '0 3px 12px rgba(34, 197, 94, 0.3)' : 'none',
          }}
          aria-label={displayLabel}
          onMouseEnter={() => {
            console.log(`🔍 POI BUTTON DEBUG: Zeige ${poi.category?.toLowerCase() || 'unbekannte Kategorie'}: ${displayLabel}`);
            setVisibleTooltip(poi.category);
          }}
          onMouseLeave={() => {
            if (tooltipTimeoutRef.current) {
              clearTimeout(tooltipTimeoutRef.current);
            }
            setVisibleTooltip(null);
            console.log(`🔍 POI BUTTON DEBUG: Mouse left ${poi.category}`);
          }}
        >
          <span className="text-sm">{displayIcon}</span>
        </button>
        {visibleTooltip === poi.category && createPortal(
          <div style={{
            position: 'fixed',
            left: '70px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 999999,
            padding: '6px 10px',
            background: 'rgba(17, 24, 39, 0.95)',
            color: 'white',
            borderRadius: '6px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontSize: '11px',
            fontWeight: '500'
          }}>
            {displayLabel}
          </div>,
          document.body
        )}
      </div>
    );
  };

  return (
    <div
      className="poi-left-panel"
      style={{
        position: 'fixed',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        padding: '8px',
        opacity: selectedPOI ? 0.3 : 1,
        transition: 'opacity 0.3s ease-in-out',
        pointerEvents: selectedPOI ? 'none' : 'auto',
      }}
    >
      <div className="flex flex-col">
        {/* Render all POI category buttons (including the rolling accommodation button) */}
        {POI_BUTTONS.map((poi, index) => renderVerticalButton(poi, index))}
      </div>
      <style>{`
        .poi-left-panel {
          animation: slideInFromLeft 0.3s ease-out;
        }
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .poi-button--inactive:hover {
          background: rgba(255, 255, 255, 0.3) !important;
        }
      `}</style>
    </div>
  );
};