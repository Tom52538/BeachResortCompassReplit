const fs = require('fs');
const path = require('path');

const geojsonPath = path.join(__dirname, 'server/data/sittard_poi.geojson');
const outputPath = path.join(__dirname, 'server/data/sittard_poi_categorized.geojson');

if (!fs.existsSync(geojsonPath)) {
  console.error('❌ GeoJSON file not found at:', geojsonPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));

const категории = {
    'mobilität-verkehr': 'Mobilität & Verkehr',
    'freizeit-erholung': 'Freizeit & Erholung',
    'gastronomie': 'Gastronomie',
    'einzelhandel-dienstleistungen': 'Einzelhandel & Dienstleistungen',
    'bildung': 'Bildung',
    'öffentliche-einrichtung': 'Öffentliche Einrichtung',
    'religion': 'Religion',
    'gesundheit': 'Gesundheit'
};

const assignCategory = (properties) => {
    const { amenity, leisure, shop, tourism, historic, building, sport, healthcare } = properties;

    if (amenity === 'parking' || amenity === 'bicycle_parking' || amenity === 'fuel') {
        return категории['mobilität-verkehr'];
    }
    if (leisure && ['park', 'playground', 'sports_centre', 'swimming_pool', 'pitch', 'fitness'].includes(leisure)) {
        return категории['freizeit-erholung'];
    }
    if (amenity && ['restaurant', 'cafe', 'bar', 'pub', 'fast_food', 'biergarten', 'ice_cream'].includes(amenity)) {
        return категории['gastronomie'];
    }
    if (shop || (amenity && ['bank', 'post_office', 'pharmacy', 'hairdresser'].includes(amenity))) {
        return категории['einzelhandel-dienstleistungen'];
    }
    if (amenity && ['school', 'university'].includes(amenity)) {
        return категории['bildung'];
    }
    if (amenity && ['townhall', 'community_centre', 'fire_station', 'police'].includes(amenity)) {
        return категории['öffentliche-einrichtung'];
    }
    if (amenity === 'place_of_worship') {
        return категории['religion'];
    }
    if (amenity === 'hospital' || amenity === 'clinic' || amenity === 'doctors' || healthcare) {
        return категории['gesundheit'];
    }
    // Fallback for other tourism-related features
    if (tourism && ['hotel', 'guest_house', 'museum', 'information', 'artwork'].includes(tourism)) {
        return категории['freizeit-erholung'];
    }
    return null; // No category assigned
};

data.features.forEach(feature => {
    feature.properties.display_category = assignCategory(feature.properties);
});

const categorizedCount = data.features.filter(f => f.properties.display_category).length;

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

console.log('✅ Categorization complete!');
console.log(`📝 ${data.features.length} total POIs processed.`);
console.log(`👍 ${categorizedCount} POIs were assigned a display category.`);
console.log(`💾 Categorized GeoJSON saved to: ${outputPath}`);