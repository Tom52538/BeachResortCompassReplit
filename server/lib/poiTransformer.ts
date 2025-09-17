import { POI as DatabasePOI } from '../../shared/schema';
import { Coordinates, POICategory, POI } from '../../client/src/types/navigation';
import * as turf from '@turf/turf';

export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    [key: string]: any;
    name?: string;
    amenity?: string;
    leisure?: string;
    tourism?: string;
    shop?: string;
    sport?: string;
    cuisine?: string;
    phone?: string;
    website?: string;
    opening_hours?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
  };
  geometry: {
    type: 'Point' | 'Polygon' | 'LineString';
    coordinates: number[] | number[][] | number[][][];
  };
  id?: string;
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// OSM tag to POI category mapping for campsite context
const categoryMapping: Record<string, POICategory> = {
  // Food & Drink - ensure restaurant maps properly
  'restaurant': 'gastronomie',  // Direct mapping to button category
  'cafe': 'gastronomie',
  'bar': 'gastronomie', 
  'pub': 'gastronomie',
  'fast_food': 'gastronomie',
  'food_court': 'gastronomie',
  'ice_cream': 'gastronomie',
  'biergarten': 'gastronomie',

  // Essential Services
  'shop': 'services',
  'pharmacy': 'services',
  'bank': 'services',
  'atm': 'services',
  'information': 'services',
  'reception': 'services',
  'hospital': 'services',
  'clinic': 'services',
  'post_office': 'services',
  'fuel': 'services',
  'supermarket': 'services',
  'convenience': 'services',
  'retail': 'services',
  'commercial': 'services',

  // Leisure & Recreation Activities
  'swimming_pool': 'leisure',
  'playground': 'leisure',
  'sports_centre': 'leisure',
  'fitness_centre': 'leisure',
  'tennis': 'leisure',
  'mini_golf': 'leisure',
  'golf_course': 'leisure',
  'beach_volleyball': 'leisure',
  'attraction': 'leisure',
  'viewpoint': 'leisure',
  'picnic_table': 'leisure',
  'bbq': 'leisure',
  'bird_hide': 'leisure',
  'marina': 'leisure',

  // Practical Facilities
  'parking': 'parking',
  'toilets': 'toilets',
  'shower': 'facilities',
  'waste_disposal': 'facilities',
  'recycling': 'facilities',
  'drinking_water': 'facilities',
  'bicycle_parking': 'facilities',
  'car_wash': 'facilities',
  'charging_station': 'facilities',
  'laundry': 'facilities',

  // Accommodation Types
  'accommodation': 'accommodation',
  'hotel': 'accommodation',
  'guest_house': 'accommodation',
  'apartment': 'accommodation',
  'cabin': 'accommodation',
  'chalet': 'accommodation',
  'camp_site': 'accommodation',
  'caravan_site': 'accommodation',

  // Building Types
  'house': 'accommodation',
  'detached': 'accommodation',
  'semidetached_house': 'accommodation',
  'bungalow': 'accommodation',
  'static_caravan': 'accommodation',
  'beach_house': 'accommodation',
  'strandhaus': 'accommodation'
};

function isValidCoordinate(lat: number, lng: number): boolean {
  return !isNaN(lat) &&
         !isNaN(lng) &&
         Math.abs(lat) <= 90 &&
         Math.abs(lng) <= 180;
}

function getPoiCoordinates(geometry: GeoJSONFeature['geometry'], poiName: string = 'Unknown'): Coordinates | null {
  try {
    if (!geometry || !geometry.coordinates) {
      console.warn(`${poiName}: Geometry or coordinates missing`);
      return null;
    }

    if (geometry.type === 'Point') {
      const coords = geometry.coordinates as number[];
      if (!Array.isArray(coords) || coords.length < 2) {
        console.warn(`${poiName}: Invalid Point coordinates structure:`, coords);
        return null;
      }

      const lng = Number(coords[0]);
      const lat = Number(coords[1]);

      if (!isValidCoordinate(lat, lng)) {
        console.warn(`${poiName}: Invalid Point coordinate values: lat=${lat}, lng=${lng}`);
        return null;
      }

      return { lat, lng };
    } else if (geometry.type === 'Polygon') {
      // Use Turf.js to calculate centroid for polygon POIs
      try {
        const centroid = turf.centroid({ type: 'Feature', geometry: geometry as any, properties: {} });
        const [lng, lat] = centroid.geometry.coordinates;

        if (!isValidCoordinate(lat, lng)) {
          console.warn(`${poiName}: Invalid Polygon centroid values: lat=${lat}, lng=${lng}`);
          return null;
        }

        console.log(`✅ Polygon POI ${poiName}: Successfully converted to centroid [${lng.toFixed(6)}, ${lat.toFixed(6)}] using Turf.js`);
        return { lat, lng };
      } catch (turfError) {
        console.error(`${poiName}: Turf.js centroid calculation failed:`, (turfError as Error).message);
        return null;
      }
    } else if (geometry.type === 'LineString') {
      const coords = geometry.coordinates as number[][];
      if (!Array.isArray(coords) || coords.length === 0) {
        console.warn(`${poiName}: Invalid LineString coordinates structure`);
        return null;
      }

      // Use the middle point of the line
      const midIndex = Math.floor(coords.length / 2);
      const midPoint = coords[midIndex];

      if (!Array.isArray(midPoint) || midPoint.length < 2) {
        console.warn(`${poiName}: Invalid LineString midpoint`);
        return null;
      }

      const lng = Number(midPoint[0]);
      const lat = Number(midPoint[1]);

      if (!isValidCoordinate(lat, lng)) {
        console.warn(`${poiName}: Invalid LineString coordinate values: lat=${lat}, lng=${lng}`);
        return null;
      }

      return { lat, lng };
    }

    throw new Error(`Unsupported geometry type: ${geometry.type}`);
  } catch (error) {
    console.error(`${poiName}: Error extracting coordinates from geometry:`, (error as Error).message);
    return null;
  }
}

function categorizeFeature(properties: GeoJSONFeature['properties']): POICategory {
  // PRIORITIZE RESTAURANTS - check amenity first for food establishments
  if (properties.amenity) {
    // Direct restaurant/food mapping
    if (['restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'biergarten'].includes(properties.amenity)) {
      return 'gastronomie';
    }
    // Other amenities
    if (categoryMapping[properties.amenity]) {
      return categoryMapping[properties.amenity];
    }
  }

  // Check leisure (for playgrounds, swimming pools, etc.)
  if (properties.leisure && categoryMapping[properties.leisure]) {
    return categoryMapping[properties.leisure];
  }

  // Check tourism
  if (properties.tourism && categoryMapping[properties.tourism]) {
    return categoryMapping[properties.tourism];
  }

  // Check shop types
  if (properties.shop && categoryMapping[properties.shop]) {
    return categoryMapping[properties.shop];
  }

  // Check sport
  if (properties.sport && categoryMapping[properties.sport]) {
    return categoryMapping[properties.sport];
  }

  // Check building types
  if (properties.building_type && categoryMapping[properties.building_type]) {
    return categoryMapping[properties.building_type];
  }

  // Default based on roompot_category
  if (properties.roompot_category) {
    switch (properties.roompot_category) {
      case 'Food & Drinks':
        return 'food-drink';
      case 'Shopping':
      case 'Necessities':
        return 'services';
      case 'Leisure & Entertainment':
        return 'leisure';
      case 'Beach House 4':
      case 'Beach House 6a':
      case 'Beach House 6b':
      case 'Bungalows - Standard':
      case 'Chalets/Lodges':
        return 'accommodation';
      default:
        return 'other';
    }
  }

  return 'other';
}

function extractAmenities(properties: GeoJSONFeature['properties']): string[] {
  const amenities: string[] = [];

  // Sports and activities
  if (properties.sport) {
    amenities.push(`Sport: ${properties.sport.replace(/_/g, ' ')}`);
  }

  // Contact information
  if (properties.phone) {
    amenities.push(`Phone: ${properties.phone}`);
  }

  if (properties.email) {
    amenities.push(`Email: ${properties.email}`);
  }

  if (properties.website || properties.url) {
    const website = properties.website || properties.url;
    amenities.push(`Website: ${website}`);
  }

  // Cuisine for restaurants
  if (properties.cuisine) {
    amenities.push(`Cuisine: ${properties.cuisine}`);
  }

  // Opening hours
  if (properties.opening_hours || properties['opening_hours:restaurant']) {
    const hours = properties.opening_hours || properties['opening_hours:restaurant'];
    amenities.push(`Hours: ${hours}`);
  }

  // Address information
  if (properties['addr:street'] && properties['addr:housenumber']) {
    const address = `${properties['addr:housenumber']} ${properties['addr:street']}`;
    if (properties['addr:city']) {
      amenities.push(`Address: ${address}, ${properties['addr:city']}`);
    } else {
      amenities.push(`Address: ${address}`);
    }
  } else if (properties['addr:street']) {
    amenities.push(`Address: ${properties['addr:street']}`);
  }

  return amenities;
}

function generateDescription(properties: GeoJSONFeature['properties']): string {
  const parts: string[] = [];

  // Use existing description if available
  if (properties.description && typeof properties.description === 'string') {
    return properties.description;
  }

  // Generate description from properties
  if (properties.amenity) {
    parts.push(properties.amenity.replace(/_/g, ' '));
  } else if (properties.leisure) {
    parts.push(properties.leisure.replace(/_/g, ' '));
  } else if (properties.tourism) {
    parts.push(properties.tourism.replace(/_/g, ' '));
  } else if (properties.shop) {
    parts.push(`${properties.shop.replace(/_/g, ' ')} shop`);
  }

  if (properties.sport) {
    const sports = properties.sport.split(';').map(s => s.trim().replace(/_/g, ' '));
    parts.push(`Sports: ${sports.join(', ')}`);
  }

  return parts.length > 0 ? parts.join(' - ') : '';
}

export function transformGeoJSONToPOIs(
  geoJsonData: GeoJSONCollection,
  site: string
): POI[] {
  console.log(`🔍 POI Transformer: Processing ${geoJsonData.features.length} raw features for site ${site}`);

  if (!geoJsonData?.features || !Array.isArray(geoJsonData.features)) {
    console.warn('No valid features array found in GeoJSON data');
    return [];
  }

  const pois: POI[] = [];
  let processedCount = 0;
  let validCount = 0;
  let invalidCoordinatesCount = 0;
  let skippedNoNameCount = 0;

  geoJsonData.features.forEach((feature, index) => {
    try {
      processedCount++;

      if (!feature || !feature.properties || !feature.geometry) {
        console.warn(`Feature ${index} missing required properties or geometry`);
        return;
      }

      const properties = feature.properties;
      
      // Create name from multiple sources - prioritize actual names but allow category-based names
      let name = properties['name:en'] || properties['name:nl'] || properties.name;
      
      // If no name but has amenity, use amenity as name
      if (!name && properties.amenity) {
        name = properties.amenity.charAt(0).toUpperCase() + properties.amenity.slice(1).replace(/_/g, ' ');
      }
      
      // If no name but has shop, use shop as name  
      if (!name && properties.shop) {
        name = properties.shop.charAt(0).toUpperCase() + properties.shop.slice(1).replace(/_/g, ' ');
      }
      
      // If no name but has leisure, use leisure as name
      if (!name && properties.leisure) {
        name = properties.leisure.charAt(0).toUpperCase() + properties.leisure.slice(1).replace(/_/g, ' ');
      }
      
      // If no name but has tourism, use tourism as name
      if (!name && properties.tourism) {
        name = properties.tourism.charAt(0).toUpperCase() + properties.tourism.slice(1).replace(/_/g, ' ');
      }
      
      // Skip only if really no usable data
      if (!name || typeof name !== 'string' || name.trim() === '') {
        skippedNoNameCount++;
        return;
      }

      // CRITICAL FIX: Pass the POI name to coordinate extraction for better error logging
      const coordinates = getPoiCoordinates(feature.geometry, name);
      if (!coordinates) {
        invalidCoordinatesCount++;
        // Don't create the POI if coordinates are invalid
        return;
      }

      const category = categorizeFeature(properties);
      const amenities = extractAmenities(properties);
      const description = generateDescription(properties);

      // Create a temporary POI object to apply categorization logic that might add subcategory
      let enrichedPOI: POI = {
        id: properties['@id'] || feature.id?.toString() || `poi_${index + 1}`,
        name: name.trim(),
        category: category, // Default category
        coordinates: coordinates,
        description: description || undefined,
        amenities: amenities.length > 0 ? amenities : undefined,
        openingHours: properties.opening_hours || properties['opening_hours:restaurant'] || null,

        // PRESERVE CRITICAL ACCOMMODATION PROPERTIES
        roompot_category: properties.roompot_category,
        lodge_number: properties.lodge_number,
        building_type: properties.building_type,
        enrichment_key: properties.enrichment_key,

        // Include other original properties that might be useful for enrichment
        ...properties
      };

      // Apply enhanced categorization logic
      if (properties.roompot_category) {
        const roompotCategory = properties.roompot_category.toLowerCase();

        // Lodge mapping - FIRST AND MOST IMPORTANT
        if (roompotCategory.includes('lodge')) {
          enrichedPOI.category = 'lodge';
          enrichedPOI.subcategory = properties.building_type || 'lodge';
        }
        // Beach house mapping
        else if (roompotCategory.includes('beach house') || roompotCategory.includes('strandhaus')) {
          enrichedPOI.category = 'beach_houses';
          enrichedPOI.subcategory = properties.building_type || 'beach_house';
        }
        // Bungalow mapping (including water bungalows)
        else if (roompotCategory.includes('bungalow')) {
          if (properties.park_id === 'water-village' || roompotCategory.includes('water')) {
            enrichedPOI.category = 'bungalows_water';
          } else {
            enrichedPOI.category = 'bungalows';
          }
          enrichedPOI.subcategory = properties.building_type || 'bungalow';
        }
        // Chalet mapping
        else if (roompotCategory.includes('chalet')) {
          enrichedPOI.category = 'chalets';
          enrichedPOI.subcategory = properties.building_type || 'chalet';
        }
        // Caravan/Camping mapping
        else if (roompotCategory.includes('caravan') || roompotCategory.includes('camping')) {
          enrichedPOI.category = 'campgrounds';
          enrichedPOI.subcategory = properties.building_type || 'camping';
        }
      }

      // Additional check for Lodge names (fallback)
      if (properties.name && properties.name.toLowerCase().includes('lodge') && enrichedPOI.category !== 'lodge') {
        enrichedPOI.category = 'lodge';
        enrichedPOI.subcategory = 'lodge';
      }

      // If the category is still 'accommodation' and a building_type is present, use it as category
      if (enrichedPOI.category === 'accommodation' && properties.building_type) {
        enrichedPOI.category = properties.building_type.toLowerCase();
      }

      // If category is still 'accommodation' and it's a 'house', 'detached' or 'semidetached_house'
      if (enrichedPOI.category === 'accommodation' && ['house', 'detached', 'semidetached_house'].includes(properties.building_type?.toLowerCase())) {
        enrichedPOI.category = 'houses';
      }

      // If category is still 'accommodation' and it's a 'bungalow'
      if (enrichedPOI.category === 'accommodation' && properties.building_type?.toLowerCase() === 'bungalow') {
        enrichedPOI.category = 'bungalows';
      }


      pois.push(enrichedPOI);
      validCount++;

    } catch (error) {
      const poiName = properties.name || `Feature ${index}`;
      console.error(`❌ Failed to transform POI "${poiName}":`, (error as Error).message);
    }
  });

  console.log(`✅ POI Processing Summary:`);
  console.log(`   - Processed: ${processedCount} features`);
  console.log(`   - Valid POIs: ${validCount}`);
  console.log(`   - Invalid coordinates: ${invalidCoordinatesCount}`);
  console.log(`   - Skipped (no name): ${skippedNoNameCount}`);
  console.log(`   - Total skipped: ${processedCount - validCount}`);

  return pois;
}

export function searchPOIs(pois: POI[], query: string): POI[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return pois;

  return pois.filter(poi => {
    if (poi.name.toLowerCase().includes(searchTerm)) return true;
    if (poi.description?.toLowerCase().includes(searchTerm)) return true;
    if (poi.amenities?.some(amenity => amenity.toLowerCase().includes(searchTerm))) return true;
    if (poi.category.toLowerCase().includes(searchTerm)) return true;
    return false;
  });
}

export function filterPOIsByCategory(
  pois: POI[],
  categories: string[]
): POI[] {
  if (categories.length === 0) return pois;
  return pois.filter(poi => categories.includes(poi.category));
}

export class POITransformer {
  transformPOIs(features: GeoJSONFeature[]): POI[] {
    return transformGeoJSONToPOIs({ type: 'FeatureCollection', features }, 'kamperland');
  }
}