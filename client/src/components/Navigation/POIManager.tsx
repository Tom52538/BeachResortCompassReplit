import React, { useMemo } from 'react';
import { POI } from '@/types/navigation';
import { LightweightPOIButtons } from '@/components/Navigation/LightweightPOIButtons';

// Helper function to safely normalize POI strings - extracted from Navigation.tsx
const normalizePoiString = (value: any): string => {
  if (typeof value === 'string') return value.toLowerCase().trim();
  if (typeof value === 'number') return String(value).toLowerCase().trim();
  if (value === null || value === undefined) return '';
  return String(value).toLowerCase().trim();
};

interface POIManagerProps {
  allPOIs: POI[];
  currentSite: string;
  filteredCategories: string[];
  onCategoryToggle: (category: string) => void;
  onPOISelect: (poi: POI) => void;
}

export const POIManager: React.FC<POIManagerProps> = ({
  allPOIs,
  currentSite,
  filteredCategories,
  onCategoryToggle,
  onPOISelect
}) => {
  // POI filtering logic extracted from Navigation.tsx
  const displayPOIs = useMemo(() => {
    if (filteredCategories.length === 0) {
      console.log('🔍 DISPLAY POIs: Clean map mode - no POIs shown (use search or filters to find destinations)');
      return [];
    }

    const matchesCategory = allPOIs.filter(poi => {
      return filteredCategories.some(selectedCategory => {
        const poiCategory = normalizePoiString(poi.category);
        const poiName = normalizePoiString(poi.name);
        const description = normalizePoiString(poi.description);
        const buttonCategory = selectedCategory.toLowerCase();

        // Special handling for Kamperland categories
        if (currentSite === 'kamperland') {
          const categoryMappings: Record<string, string[]> = {
            'beach_houses': ['beach house', 'strandhaus', 'beach_house'],
            'bungalows': ['bungalow'],
            'chalets': ['chalet'],
            'campgrounds': ['campground', 'camping', 'caravan', 'kamperplaats', 'comfort'],
            'lodges_water': ['lodge', 'water', 'lodge 4', 'lodge4', 'watervilla', 'lodge4'],
            'bungalows_water': ['bungalow', 'water', 'watervilla', '4a', '4b', '6a', '6b']
          };

          const mappedCategories = categoryMappings[buttonCategory] || [];
          const categoryMatch = mappedCategories.some(mapped =>
            poiCategory.includes(mapped) || mapped.includes(poiCategory)
          );
          const nameMatch = mappedCategories.some(mapped =>
            poiName.includes(mapped) || mapped.includes(poiName)
          );
          const descriptionMatch = mappedCategories.some(mapped =>
            description.includes(mapped)
          );

          // Handle special accommodation types for Kamperland
          if (buttonCategory === 'beach_houses') {
            const roompotCat = normalizePoiString(poi.roompot_category).toLowerCase();
            const safeName = normalizePoiString(poi.name).toLowerCase();
            const safeBuildingType = normalizePoiString(poi.building_type).toLowerCase();

            const hasBeachHouseBuildingType = safeBuildingType === 'beach house';
            const hasBeachHouseInName = safeName.includes('beach house') || safeName.includes('strandhaus');
            const hasBeachHouseInCategory = roompotCat.includes('beach house');

            const isActualBeachHouse = hasBeachHouseBuildingType || hasBeachHouseInName || hasBeachHouseInCategory;
            console.log(`🏖️ Beach house check for "${normalizePoiString(poi.name)}": ${isActualBeachHouse}`);
            return isActualBeachHouse;
          }

          if (buttonCategory === 'bungalows') {
            const safeBuildingType = normalizePoiString(poi.building_type).toLowerCase();
            const safeName = normalizePoiString(poi.name).toLowerCase();
            const roompotCat = normalizePoiString(poi.roompot_category).toLowerCase();

            return safeBuildingType === 'bungalow' ||
                   safeName.includes('bungalow') ||
                   roompotCat.includes('bungalow');
          }

          return categoryMatch || nameMatch || descriptionMatch;
        }

        // Special handling for accommodation types for general sites
        if (selectedCategory === 'beach_houses') {
          const roompotCat = normalizePoiString(poi.roompot_category).toLowerCase();
          const safeName = normalizePoiString(poi.name).toLowerCase();
          const safeBuildingType = normalizePoiString(poi.building_type).toLowerCase();

          const hasBeachHouseBuildingType = safeBuildingType === 'beach house';
          const hasBeachHouseInName = safeName.includes('beach house') || safeName.includes('strandhaus');
          const hasBeachHouseInCategory = roompotCat.includes('beach house');

          const isActualBeachHouse = hasBeachHouseBuildingType || hasBeachHouseInName || hasBeachHouseInCategory;
          console.log(`🏖️ Beach house check for "${normalizePoiString(poi.name)}": ${isActualBeachHouse}`);
          return isActualBeachHouse;
        }

        if (selectedCategory === 'bungalows') {
          const safeBuildingType = normalizePoiString(poi.building_type).toLowerCase();
          const safeName = normalizePoiString(poi.name).toLowerCase();
          const roompotCat = normalizePoiString(poi.roompot_category).toLowerCase();

          return safeBuildingType === 'bungalow' ||
                 safeName.includes('bungalow') ||
                 roompotCat.includes('bungalow');
        }

        if (selectedCategory === 'lodges') {
          const safeBuildingType = normalizePoiString(poi.building_type).toLowerCase();
          const safeName = normalizePoiString(poi.name).toLowerCase();
          const safeRoompotCategory = normalizePoiString(poi.roompot_category).toLowerCase();
          const isLodge = safeBuildingType === 'lodge' ||
                         safeName.includes('lodge') ||
                         safeRoompotCategory.includes('lodge');

          console.log('🏠 Lodge check: "${poi.name}" = ${isLodge}', {
            building_type: poi.building_type,
            roompot_category: poi.roompot_category,
            match: isLodge
          });

          return isLodge;
        }

        if (selectedCategory === 'bungalows_water') {
          const safeBuildingType = normalizePoiString(poi.building_type).toLowerCase();
          const safeName = normalizePoiString(poi.name).toLowerCase();
          const roompotCat = normalizePoiString(poi.roompot_category).toLowerCase();

          return (safeBuildingType === 'bungalow' ||
                  safeName.includes('bungalow') ||
                  roompotCat.includes('bungalow')) &&
                 (safeName.includes('water') || roompotCat.includes('water'));
        }

        // Fix POI filtering to work with actual OSM categories
        if (selectedCategory === 'parking') {
          return poi.amenity === 'parking' ||
                 normalizePoiString(poi.name).toLowerCase().includes('parkplatz') ||
                 normalizePoiString(poi.name).toLowerCase().includes('parking');
        }

        // Handle OSM category:value format (e.g., "amenity:parking")  
        if (selectedCategory?.includes(':')) {
          const [osmKey, osmValue] = selectedCategory!.split(':');
          if (poi[osmKey] === osmValue) {
            console.log(`✅ DIRECT OSM MATCH: ${normalizePoiString(poi.name)} matches ${selectedCategory}`);
            return true;
          }
        }

        // Handle direct OSM category matches for Zuhause
        if (currentSite === 'zuhause') {
          // Check for gastronomie category - match all restaurant-related amenities
          if (selectedCategory === 'amenity:restaurant') {
            const isGastronomie = poi.amenity === 'restaurant' ||
                                 poi.amenity === 'cafe' ||
                                 poi.amenity === 'pub' ||
                                 poi.amenity === 'fast_food' ||
                                 poi.amenity === 'biergarten';

            if (isGastronomie) {
              console.log(`✅ GASTRONOMIE MATCH: ${normalizePoiString(poi.name)} (${poi.amenity})`);
              return true;
            }
          }

          // Special handling for shop category
          if (selectedCategory === 'shop') {
            const hasShopTag = !!poi.shop;
            if (hasShopTag) {
              console.log(`✅ SHOP TAG MATCH: ${normalizePoiString(poi.name)} (shop: ${poi.shop})`);
              return true;
            }
          }

          // For Zuhause, check raw OSM properties
          if (poi.amenity && selectedCategory === 'amenity') return true;
          if (poi.leisure && selectedCategory === 'leisure') return true;
          if (poi.shop && selectedCategory === 'services') return true;
          if (poi.tourism && selectedCategory === 'accommodation') return true;
          if (poi.amenity === 'parking' && selectedCategory === 'parking') return true;

          // Additional checks for common OSM tags
          if (poi.amenity === 'place_of_worship' && selectedCategory === 'amenity') return true;
          if (poi.amenity === 'fire_station' && selectedCategory === 'amenity') return true;
          if (poi.amenity === 'school' && selectedCategory === 'amenity') return true;
          if (poi.leisure === 'playground' && selectedCategory === 'leisure') return true;
        } else {
          // Original Kamperland logic
          if (poi.amenity === selectedCategory ||
              poi.leisure === selectedCategory ||
              poi.shop === selectedCategory ||
              poi.tourism === selectedCategory ||
              poi.building === selectedCategory ||
              poi.sport === selectedCategory ||
              poi.healthcare === selectedCategory) {
            return true;
          }
        }

        // Default behavior: check if category matches any standard category
        const categoryMatch = poiCategory.includes(buttonCategory) || 
                             buttonCategory.includes(poiCategory) ||
                             poi.category === buttonCategory;
        
        const nameMatch = poiName.includes(buttonCategory) ||
                         buttonCategory.includes(poiName);
        
        const descriptionMatch = description.includes(buttonCategory) ||
                               buttonCategory.includes(description);
        
        return categoryMatch || nameMatch || descriptionMatch;
      });

      return matchesCategory;
    });

    console.log(`🔍 DISPLAY POIs: Showing ${displayPOIs.length} POIs for categories:`, filteredCategories);
    return displayPOIs;
  }, [allPOIs, filteredCategories, currentSite]);

  console.log('🔍 POI MANAGER DEBUG:', {
    totalPOIs: allPOIs.length,
    filteredCategories,
    displayedPOIs: displayPOIs.length,
    currentSite
  });

  return (
    <div className="poi-manager">
      <LightweightPOIButtons
        currentSite={currentSite}
        selectedCategories={filteredCategories}
        onCategoryToggle={onCategoryToggle}
      />
      
      {/* Debug info for POI filtering */}
      {process.env.NODE_ENV === 'development' && (
        <div className="poi-debug-info text-xs text-gray-500 p-2">
          Total POIs: {allPOIs.length} | Displayed: {displayPOIs.length} | Categories: {filteredCategories.join(', ')}
        </div>
      )}
    </div>
  );
};

// Export the display POIs for use in parent component
export const usePOIFiltering = (
  allPOIs: POI[],
  filteredCategories: string[],
  currentSite: string
) => {
  return useMemo(() => {
    if (filteredCategories.length === 0) {
      return [];
    }

    return allPOIs.filter(poi => {
      return filteredCategories.some(selectedCategory => {
        // Simplified filtering logic for hook usage
        const poiCategory = normalizePoiString(poi.category);
        const poiName = normalizePoiString(poi.name);
        const buttonCategory = selectedCategory.toLowerCase();

        const categoryMatch = poiCategory.includes(buttonCategory) || 
                             buttonCategory.includes(poiCategory) ||
                             poi.category === buttonCategory;
        
        const nameMatch = poiName.includes(buttonCategory) ||
                         buttonCategory.includes(poiName);
        
        return categoryMatch || nameMatch;
      });
    });
  }, [allPOIs, filteredCategories, currentSite]);
};