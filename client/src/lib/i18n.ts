export type SupportedLanguage = 'en' | 'de' | 'fr' | 'nl' | 'it' | 'es';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  nl: 'Nederlands',
  it: 'Italiano',
  es: 'Español'
};

export const detectBrowserLanguage = (): SupportedLanguage => {
  // Check multiple language sources for better detection
  const languages = [
    navigator.language,
    ...navigator.languages,
    (navigator as any).userLanguage,
    (navigator as any).browserLanguage,
    (navigator as any).systemLanguage
  ].filter(Boolean);

  console.log('Detected languages:', languages);

  for (const lang of languages) {
    const lowerLang = lang.toLowerCase();

    // Check for German variants
    if (lowerLang.startsWith('de') || lowerLang.includes('german')) {
      console.log('German detected:', lang);
      return 'de';
    }
    if (lowerLang.startsWith('fr') || lowerLang.includes('french')) return 'fr';
    if (lowerLang.startsWith('nl') || lowerLang.includes('dutch')) return 'nl';
    if (lowerLang.startsWith('it') || lowerLang.includes('italian')) return 'it';
    if (lowerLang.startsWith('es') || lowerLang.includes('spanish')) return 'es';
  }

  // Default to English
  console.log('Defaulting to English');
  return 'en';
};

// Voice guidance translations for navigation instructions
export const voiceInstructions = {
  en: {
    turnLeft: 'Turn left',
    turnRight: 'Turn right',
    turnSlightLeft: 'Turn slight left',
    turnSlightRight: 'Turn slight right',
    turnSharpLeft: 'Turn sharp left',
    turnSharpRight: 'Turn sharp right',
    continueAhead: 'Continue ahead',
    continueStraight: 'Continue straight',
    keepLeft: 'Keep left',
    keepRight: 'Keep right',
    headNorth: 'Head north',
    headSouth: 'Head south',
    headEast: 'Head east',
    headWest: 'Head west',
    headNortheast: 'Head northeast',
    headNorthwest: 'Head northwest',
    headSoutheast: 'Head southeast',
    headSouthwest: 'Head southwest',
    arrive: 'Arrive at your destination',
    inMeters: 'In {distance} meters',
    inKilometers: 'In {distance} kilometers',
    voiceEnabled: 'Voice navigation enabled',
    routeRecalculated: 'Route recalculated',
    offRoute: 'You are off route',
    rerouting: 'Recalculating route',
    destinationReached: 'You have arrived at your destination'
  },
  de: {
    turnLeft: 'Links abbiegen',
    turnRight: 'Rechts abbiegen',
    turnSlightLeft: 'Leicht links abbiegen',
    turnSlightRight: 'Leicht rechts abbiegen',
    turnSharpLeft: 'Scharf links abbiegen',
    turnSharpRight: 'Scharf rechts abbiegen',
    continueAhead: 'Geradeaus weiterfahren',
    continueStraight: 'Geradeaus weiterfahren',
    keepLeft: 'Links halten',
    keepRight: 'Rechts halten',
    headNorth: 'Geradeaus Richtung Norden',
    headSouth: 'Geradeaus Richtung Süden',
    headEast: 'Geradeaus Richtung Osten',
    headWest: 'Geradeaus Richtung Westen',
    headNortheast: 'Geradeaus Richtung Nordosten',
    headNorthwest: 'Geradeaus Richtung Nordwesten',
    headSoutheast: 'Geradeaus Richtung Südosten',
    headSouthwest: 'Geradeaus Richtung Südwesten',
    arrive: 'Sie haben Ihr Ziel erreicht',
    inMeters: 'In {distance} Metern',
    inKilometers: 'In {distance} Kilometern',
    voiceEnabled: 'Sprachnavigation aktiviert',
    routeRecalculated: 'Route neu berechnet',
    offRoute: 'Sie sind von der Route abgewichen',
    rerouting: 'Route wird neu berechnet',
    destinationReached: 'Sie haben Ihr Ziel erreicht',
    walk: 'Gehen Sie',
    walkTo: 'zu Fuß zum Ziel',
    toDestination: 'zum Ziel'
  },
  fr: {
    turnLeft: 'Tournez à gauche',
    turnRight: 'Tournez à droite',
    turnSlightLeft: 'Tournez légèrement à gauche',
    turnSlightRight: 'Tournez légèrement à droite',
    turnSharpLeft: 'Tournez nettement à gauche',
    turnSharpRight: 'Tournez nettement à droite',
    continueAhead: 'Continuez tout droit',
    continueStraight: 'Continuez tout droit',
    keepLeft: 'Restez à gauche',
    keepRight: 'Restez à droite',
    headNorth: 'Direction nord',
    headSouth: 'Direction sud',
    headEast: 'Direction est',
    headWest: 'Direction ouest',
    headNortheast: 'Direction nord-est',
    headNorthwest: 'Direction nord-ouest',
    headSoutheast: 'Direction sud-est',
    headSouthwest: 'Direction sud-ouest',
    arrive: 'Vous êtes arrivé à destination',
    inMeters: 'Dans {distance} mètres',
    inKilometers: 'Dans {distance} kilomètres',
    voiceEnabled: 'Navigation vocale activée',
    routeRecalculated: 'Itinéraire recalculé',
    offRoute: 'Vous avez dévié de l\'itinéraire',
    rerouting: 'Recalcul de l\'itinéraire',
    destinationReached: 'Vous êtes arrivé à destination'
  },
  nl: {
    turnLeft: 'Ga linksaf',
    turnRight: 'Ga rechtsaf',
    turnSlightLeft: 'Ga licht linksaf',
    turnSlightRight: 'Ga licht rechtsaf',
    turnSharpLeft: 'Ga scherp linksaf',
    turnSharpRight: 'Ga scherp rechtsaf',
    continueAhead: 'Ga rechtdoor',
    continueStraight: 'Go rechtdoor',
    keepLeft: 'Blijf links',
    keepRight: 'Blijf rechts',
    headNorth: 'Richting het noorden',
    headSouth: 'Richting het zuiden',
    headEast: 'Richting het oosten',
    headWest: 'Richting het westen',
    headNortheast: 'Richting het noordoosten',
    headNorthwest: 'Richting het noordwesten',
    headSoutheast: 'Richting het zuidoosten',
    headSouthwest: 'Richting het zuidwesten',
    arrive: 'U bent aangekomen op uw bestemming',
    inMeters: 'Over {distance} meter',
    inKilometers: 'Over {distance} kilometer',
    voiceEnabled: 'Spraaknavigatie ingeschakeld',
    routeRecalculated: 'Route herberekend',
    offRoute: 'U bent van de route afgeweken',
    rerouting: 'Route wordt herberekend',
    destinationReached: 'U bent aangekomen op uw bestemming'
  },
  it: {
    turnLeft: 'Gira a sinistra',
    turnRight: 'Gira a destra',
    turnSlightLeft: 'Gira leggermente a sinistra',
    turnSlightRight: 'Gira leggermente a destra',
    turnSharpLeft: 'Gira decisamente a sinistra',
    turnSharpRight: 'Gira decisamente a destra',
    continueAhead: 'Continua dritto',
    continueStraight: 'Continua dritto',
    keepLeft: 'Mantieni la sinistra',
    keepRight: 'Mantieni la destra',
    headNorth: 'Direzione nord',
    headSouth: 'Direzione sud',
    headEast: 'Direzione est',
    headWest: 'Direzione ovest',
    headNortheast: 'Direzione nord-est',
    headNorthwest: 'Direzione nord-ovest',
    headSoutheast: 'Direzione sud-est',
    headSouthwest: 'Direzione sud-ovest',
    arrive: 'Sei arrivato a destinazione',
    inMeters: 'Tra {distance} metri',
    inKilometers: 'Tra {distance} chilometri',
    voiceEnabled: 'Navigazione vocale attivata',
    routeRecalculated: 'Percorso ricalcolato',
    offRoute: 'Sei fuori percorso',
    rerouting: 'Ricalcolo del percorso',
    destinationReached: 'Sei arrivato a destinazione'
  },
  es: {
    turnLeft: 'Gira a la izquierda',
    turnRight: 'Gira a la derecha',
    turnSlightLeft: 'Gira ligeramente a la izquierda',
    turnSlightRight: 'Gira ligeramente a la derecha',
    turnSharpLeft: 'Gira bruscamente a la izquierda',
    turnSharpRight: 'Gira bruscamente a la derecha',
    continueAhead: 'Continúa recto',
    continueStraight: 'Continúa recto',
    keepLeft: 'Mantente a la izquierda',
    keepRight: 'Mantente a la derecha',
    headNorth: 'Dirección norte',
    headSouth: 'Dirección sur',
    headEast: 'Dirección este',
    headWest: 'Dirección oeste',
    headNortheast: 'Dirección noreste',
    headNorthwest: 'Dirección noroeste',
    headSoutheast: 'Dirección sureste',
    headSouthwest: 'Dirección suroeste',
    arrive: 'Has llegado a tu destino',
    inMeters: 'En {distance} metros',
    inKilometers: 'En {distance} kilómetros',
    voiceEnabled: 'Navegación por voz activada',
    routeRecalculated: 'Ruta recalculada',
    offRoute: 'Te has desviado de la ruta',
    rerouting: 'Recalculando ruta',
    destinationReached: 'Has llegado a tu destino'
  }
};

// Enhanced translation function with automatic text detection and translation
export const translateText = (text: string, lang: SupportedLanguage): string => {
  if (!text || lang === 'en') return text;

  // Common English-to-target language mappings for dynamic content
  const commonTranslations: Record<SupportedLanguage, Record<string, string>> = {
    de: {
      // Basic UI elements
      'Operational Info': 'Betriebszeiten',
      'Hours': 'Öffnungszeiten',
      'away': 'entfernt',
      'Website': 'Website',
      'Phone': 'Telefon',
      'Description': 'Beschreibung',
      'Amenities': 'Ausstattung',
      'No additional information available': 'Keine weiteren Informationen verfügbar',

      // Accommodation specific
      'Up to': 'Bis zu',
      'guests': 'Gäste',
      'from': 'ab',
      'per night': 'pro Nacht',
      'Visit website': 'Website besuchen',
      'Navigate here': 'Hier navigieren',
      'WiFi': 'WLAN',
      'Water View': 'Wasserblick',
      'Modern Kitchen': 'Moderne Küche',
      'TV': 'Fernseher',
      'Parking': 'Parkplatz',
      'Waterfront Access': 'Wasserzugang',
      'Book Now': 'Jetzt buchen',
      'View Details': 'Details anzeigen',
      'Features': 'Ausstattung',
      'About this accommodation': 'Über diese Unterkunft',

      // POI specific
      'POI': 'Sehenswürdigkeit',
      'lodge': 'Lodge',
      'Lodge': 'Lodge',
      'Lodge 4': 'Lodge 4',
      
      // Accommodation descriptions and pricing
      'Comfortable lodge accommodation in Water Village, perfect for families seeking a unique water-based camping experience.': 'Komfortable Lodge-Unterkunft im Water Village, perfekt für Familien, die ein einzigartiges wasserbasiertes Camping-Erlebnis suchen.',
      'from €149 per night': 'ab €149 pro Nacht',
      '€149': '€149',

      // Categories and subcategories
      'Food & Drinks': 'Essen & Getränke',
      'food-drink': 'Essen & Getränke',
      'Restaurant': 'Restaurant',
      'Bar': 'Bar',
      'Cafe': 'Café',
      'Beach Club': 'Strandclub',
      'entertainment': 'Unterhaltung',
      'leisure': 'Freizeit',
      'services': 'Dienstleistungen',
      'essential': 'Grundversorgung',
      'camping': 'Camping',
      'facilities': 'Einrichtungen',
      'toilets': 'Toiletten',
      'parking': 'Parkplatz',
      'beach_houses': 'Strandhäuser',
      'bungalows': 'Bungalows',
      'chalets': 'Chalets',
      'accommodations': 'Unterkünfte',
      'accommodations_rolling': 'Alle Unterkünfte',
      
      // Common UI elements
      'Loading...': 'Wird geladen...',
      'Error': 'Fehler',
      'Close': 'Schließen',
      'Open': 'Öffnen',
      'Save': 'Speichern',
      'Cancel': 'Abbrechen',
      'Search': 'Suchen',
      'Filter': 'Filter',
      'Show all': 'Alle anzeigen',
      'Hide': 'Ausblenden',

      // Time expressions
      'Mo-Th': 'Mo-Do',
      'Fr-Su': 'Fr-So',
      'Mo-Fr': 'Mo-Fr',
      'Sa-Su': 'Sa-So',
      'Mon': 'Mo',
      'Tue': 'Di',
      'Wed': 'Mi',
      'Thu': 'Do',
      'Fri': 'Fr',
      'Sat': 'Sa',
      'Sun': 'So',
      'Monday': 'Montag',
      'Tuesday': 'Dienstag',
      'Wednesday': 'Mittwoch',
      'Thursday': 'Donnerstag',
      'Friday': 'Freitag',
      'Saturday': 'Samstag',
      'Sunday': 'Sonntag',

      // Common venue types
      'Swimming Pool': 'Schwimmbad',
      'Reception': 'Rezeption',
      'Beach': 'Strand',
      'Shop': 'Geschäft',
      'Supermarket': 'Supermarkt',
      'Playground': 'Spielplatz',
      'Sports': 'Sport'
    },
    fr: {
      'Operational Info': 'Informations opérationnelles',
      'Hours': 'Heures',
      'away': 'de distance',
      'Website': 'Site web',
      'Phone': 'Téléphone',
      'Description': 'Description',
      'Amenities': 'Équipements',
      'No additional information available': 'Aucune information supplémentaire disponible',
      'Food & Drinks': 'Nourriture et boissons',
      'food-drink': 'Nourriture et boissons',
      'entertainment': 'Divertissement',
      'leisure': 'Loisirs',
      'services': 'Services',
      'essential': 'Essentiel',
      'Restaurant': 'Restaurant',
      'Bar': 'Bar',
      'Beach Club': 'Club de plage'
    },
    nl: {
      'Operational Info': 'Operationele informatie',
      'Hours': 'Openingstijden',
      'away': 'weg',
      'Website': 'Website',
      'Phone': 'Telefoon',
      'Description': 'Beschrijving',
      'Amenities': 'Voorzieningen',
      'No additional information available': 'Geen aanvullende informatie beschikbaar',
      'Food & Drinks': 'Eten & Drinken',
      'food-drink': 'Eten & Drinken',
      'entertainment': 'Entertainment',
      'leisure': 'Recreatie',
      'services': 'Diensten',
      'essential': 'Essentieel',
      'Restaurant': 'Restaurant',
      'Bar': 'Bar',
      'Beach Club': 'Strandclub'
    },
    it: {
      'Operational Info': 'Informazioni operative',
      'Hours': 'Orari',
      'away': 'di distanza',
      'Website': 'Sito web',
      'Phone': 'Telefono',
      'Description': 'Descrizione',
      'Amenities': 'Servizi',
      'No additional information available': 'Nessuna informazione aggiuntiva disponibile',
      'Food & Drinks': 'Cibo e bevande',
      'food-drink': 'Cibo e bevande',
      'entertainment': 'Intrattenimento',
      'leisure': 'Tempo libero',
      'services': 'Servizi',
      'essential': 'Essenziale',
      'Restaurant': 'Ristorante',
      'Bar': 'Bar',
      'Beach Club': 'Beach Club'
    },
    es: {
      'Operational Info': 'Información operativa',
      'Hours': 'Horarios',
      'away': 'de distancia',
      'Website': 'Sitio web',
      'Phone': 'Teléfono',
      'Description': 'Descripción',
      'Amenities': 'Servicios',
      'No additional information available': 'No hay información adicional disponible',
      'Food & Drinks': 'Comida y bebidas',
      'food-drink': 'Comida y bebidas',
      'entertainment': 'Entretenimiento',
      'leisure': 'Ocio',
      'services': 'Servicios',
      'essential': 'Esencial',
      'Restaurant': 'Restaurante',
      'Bar': 'Bar',
      'Beach Club': 'Club de playa'
    },
    en: {} // No translation needed for English
  };

  // Check if we have a direct translation for this text
  const langTranslations = commonTranslations[lang];
  if (langTranslations && langTranslations[text]) {
    return langTranslations[text];
  }

  // For complex strings, try to translate parts
  let translatedText = text;
  if (langTranslations) {
    Object.entries(langTranslations).forEach(([english, translated]) => {
      const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      translatedText = translatedText.replace(regex, translated);
    });
  }

  return translatedText;
};

export const translations = {
  en: {
    navigation: {
      search: 'Search',
      kamperland: 'Kamperland',
      zuhause: 'Zuhause',
      clearPOIs: 'Clear POIs',
      filter: 'Filter',
      map: 'Map',
      navigate: 'Navigation',
      settings: 'Settings',
      startNavigation: 'Start Navigation',
      endNavigation: 'End Navigation',
      voiceOn: 'Voice On',
      voiceOff: 'Voice Off',
      rerouting: 'Rerouting...',
      offRoute: 'Off Route',
      complete: 'complete',
      eta: 'ETA',
      next: 'Next',
      speed: 'Speed',
      avg: 'Avg',
      navigateHere: 'Navigate Here'
    },
    categories: {
      'campsites': 'Campsites',
      'restrooms': 'Restrooms',
      'fire-pits': 'Fire Pits',
      'trails': 'Trails',
      'services': 'Services',
      'waste': 'Waste Disposal',
      'beach_houses': 'Beach Houses'
    },
    weather: {
      condition: 'Condition',
      humidity: 'Humidity',
      windSpeed: 'Wind Speed',
      loading: 'Loading weather...',
      conditions: {
        'Clear': 'Clear',
        'Clouds': 'Clouds',
        'Rain': 'Rain',
        'Snow': 'Snow',
        'Thunderstorm': 'Thunderstorm',
        'Drizzle': 'Drizzle',
        'Mist': 'Mist',
        'Fog': 'Fog',
        'Haze': 'Haze'
      },
      alerts: {
        cold: 'Cold weather - check gear',
        rain: 'Rain expected - secure equipment',
        wind: 'High winds - secure tents',
        heat: 'Hot weather - stay hydrated',
        coldTitle: 'Cold Weather Alert',
        rainTitle: 'Rain Expected',
        windTitle: 'High Wind Alert',
        heatTitle: 'High Temperature Alert'
      }
    },
    search: {
      placeholder: 'Search facilities, restaurants, activities...'
    },
    poi: {
      navigate: 'Navigate',
      close: 'Close',
      distance: 'Distance',
      category: 'Category',
      operationalInfo: 'Operational Info',
      hours: 'Hours',
      away: 'away',
      website: 'Website',
      phone: 'Phone',
      description: 'Description',
      amenities: 'Amenities',
      noInfo: 'No additional information available'
    },
    status: {
      loading: 'Loading campground map...',
      gpsAccuracy: 'GPS Accuracy',
      simulatedGPS: 'Simulated GPS',
      realGPS: 'Real GPS'
    },
    alerts: {
      siteChanged: 'Site Changed',
      siteSwitched: 'Switched to',
      poisCleared: 'POIs Cleared',
      poisHidden: 'All POI markers have been hidden',
      routeStarted: 'Navigation Started',
      routeEnded: 'Navigation Ended',
      destinationSet: 'Destination Set'
    },
    accommodation: {
      capacity: 'Up to',
      guests: 'guests',
      from: 'from',
      per_night: 'per night',
      features: 'Features',
      no_additional_info: 'No additional information available',
      upTo: 'Up to',
      guestsCount: 'guests',
      website: 'Visit website',
      priceFrom: 'from',
      perNight: 'per night',
      viewDetails: 'View Details',
      bookNow: 'Book Now'
    }
  },
  de: {
    navigation: {
      search: 'Suchen',
      kamperland: 'Kamperland',
      zuhause: 'Zuhause',
      clearPOIs: 'POIs löschen',
      filter: 'Filter',
      map: 'Karte',
      navigate: 'Navigation',
      settings: 'Einstellungen',
      startNavigation: 'Navigation starten',
      endNavigation: 'Navigation beenden',
      voiceOn: 'Sprache ein',
      voiceOff: 'Sprache aus',
      rerouting: 'Neuberechnung...',
      offRoute: 'Abseits der Route',
      complete: 'abgeschlossen',
      eta: 'Ankunft',
      endNavigation: 'Navigation beenden',
      approaching: 'Abbiegen in',
      next: 'Nächste',
      speed: 'Geschwindigkeit',
      avg: 'Durchschn.',
      distance: 'Entfernung',
      duration: 'Dauer',
      approaching: 'Abbiegen in',
      meters: 'm',
      minutes: 'Min',
      headNorthOn: 'Richtung Norden auf',
      headSouthOn: 'Richtung Süden auf',
      headEastOn: 'Richtung Osten auf',
      headWestOn: 'Richtung Westen auf',
      turnLeftOn: 'Links abbiegen auf',
      turnRightOn: 'Rechts abbiegen auf',
      continueOn: 'Weiter auf',
      end: 'Beenden',
      navigateHere: 'Hier navigieren'
    },
    categories: {
      'campsites': 'Campingplätze',
      'restrooms': 'Sanitäranlagen',
      'fire-pits': 'Feuerstellen',
      'trails': 'Wanderwege',
      'services': 'Dienstleistungen',
      'waste': 'Abfallentsorgung',
      'beach_houses': 'Strandhäuser',
      'bungalows': 'Bungalows',
      'bungalows_water': 'Water Village Bungalows',
      'food-drink': 'Essen & Getränke',
      'toilets': 'Toiletten',
      'parking': 'Parkplatz',
      'leisure': 'Freizeit',
      'chalets': 'Chalets',
      'campgrounds': 'Camping',
      'lodge': 'Lodges Water Village',
      'accommodations_rolling': 'Alle Unterkünfte',
      'accommodations': 'Unterkünfte',
      'entertainment': 'Unterhaltung',
      'essential': 'Grundversorgung',
      'facilities': 'Einrichtungen'
    },
    weather: {
      condition: 'Bedingung',
      humidity: 'Luftfeuchtigkeit',
      windSpeed: 'Windgeschwindigkeit',
      loading: 'Wetter wird geladen...',
      conditions: {
        'Clear': 'Klar',
        'Clouds': 'Wolken',
        'Rain': 'Regen',
        'Snow': 'Schnee',
        'Thunderstorm': 'Gewitter',
        'Drizzle': 'Nieselregen',
        'Mist': 'Nebel',
        'Fog': 'Nebel',
        'Haze': 'Dunst'
      },
      alerts: {
        cold: 'Kaltes Wetter - Ausrüstung prüfen',
        rain: 'Regen erwartet - Ausrüstung sichern',
        wind: 'Starke Winde - Zelte sichern',
        heat: 'Heißes Wetter - viel trinken',
        coldTitle: 'Kältealarm',
        rainTitle: 'Regen erwartet',
        windTitle: 'Starker Wind',
        heatTitle: 'Hitzewarnung'
      }
    },
    search: {
      placeholder: 'Einrichtungen, Restaurants, Aktivitäten suchen...'
    },
    poi: {
      navigate: 'Navigieren',
      close: 'Schließen',
      distance: 'Entfernung',
      category: 'Kategorie',
      operationalInfo: 'Betriebszeiten',
      hours: 'Öffnungszeiten',
      away: 'entfernt',
      website: 'Website',
      phone: 'Telefon',
      description: 'Beschreibung',
      amenities: 'Ausstattung',
      noInfo: 'Keine weiteren Informationen verfügbar',
      address: 'Adresse',
      contactInformation: 'Kontaktinformationen',
      email: 'E-Mail',
      navigateHere: 'Hier navigieren',
      categoryDetails: 'Kategorie-Details',
      type: 'Typ',
      roompot: 'Roompot',
      operator: 'Betreiber',
      websiteButton: 'Website besuchen',
      loadingWebsite: 'Website-Informationen werden geladen...',
      websiteNotAvailable: 'Website nicht verfügbar'
    },
    status: {
      loading: 'Campingplatz-Karte wird geladen...',
      gpsAccuracy: 'GPS-Genauigkeit',
      simulatedGPS: 'Simuliertes GPS',
      realGPS: 'Echtes GPS'
    },
    alerts: {
      siteChanged: 'Standort geändert',
      siteSwitched: 'Gewechselt zu',
      poisCleared: 'POIs gelöscht',
      poisHidden: 'Alle POI-Markierungen wurden ausgeblendet',
      routeStarted: 'Navigation gestartet',
      routeEnded: 'Navigation beendet',
      destinationSet: 'Ziel festgelegt'
    },
    accommodation: {
      capacity: 'Bis zu',
      guests: 'Gäste',
      from: 'ab',
      per_night: 'pro Nacht',
      features: 'Ausstattung',
      no_additional_info: 'Keine weiteren Details verfügbar',
      upTo: 'Bis zu',
      guestsCount: 'Gäste',
      website: 'Website besuchen',
      about: 'Über diese Unterkunft',
      details: 'Details',
      images: 'Bilder',
      priceFrom: 'ab',
      perNight: 'pro Nacht',
      viewDetails: 'Details anzeigen',
      bookNow: 'Jetzt buchen',
      maxPersons: 'Personen',
      websiteVisit: 'Website besuchen',
      loadingDetails: 'Details werden geladen...'
    }
  },
  fr: {
    navigation: {
      search: 'Rechercher',
      kamperland: 'Kamperland',
      zuhause: 'Zuhause',
      clearPOIs: 'Effacer POIs',
      filter: 'Filtrer',
      map: 'Carte',
      navigate: 'Navigation',
      settings: 'Paramètres'
    },
    categories: {
      'campsites': 'Campings',
      'restrooms': 'Sanitaires',
      'fire-pits': 'Foyers',
      'trails': 'Sentiers',
      'services': 'Services',
      'waste': 'Déchets'
    },
    weather: {
      condition: 'Condition',
      humidity: 'Humidité',
      windSpeed: 'Vitesse du vent',
      loading: 'Chargement météo...',
      alerts: {
        cold: 'Temps froid - vérifier équipement',
        rain: 'Pluie attendue - sécuriser équipement',
        wind: 'Vents forts - sécuriser tentes',
        heat: 'Temps chaud - rester hydraté',
        coldTitle: 'Alerte froid',
        rainTitle: 'Pluie attendue',
        windTitle: 'Vents forts',
        heatTitle: 'Alerte chaleur'
      }
    },
    search: {
      placeholder: 'Rechercher installations, restaurants, activités...'
    },
    poi: {
      navigate: 'Naviguer',
      close: 'Fermer',
      distance: 'Distance',
      category: 'Catégorie',
      operationalInfo: 'Informations opérationnelles',
      hours: 'Heures',
      away: 'de distance',
      website: 'Site web',
      phone: 'Téléphone',
      description: 'Description',
      amenities: 'Équipements',
      noInfo: 'Aucune information supplémentaire disponible'
    },
    status: {
      loading: 'Chargement de la carte du camping...',
      gpsAccuracy: 'Précision GPS',
      simulatedGPS: 'GPS simulé',
      realGPS: 'GPS réel'
    },
    alerts: {
      siteChanged: 'Site changé',
      siteSwitched: 'Basculé vers',
      poisCleared: 'POIs effacés',
      poisHidden: 'Tous les marqueurs POI ont été masqués',
      routeStarted: 'Navigation démarrée',
      routeEnded: 'Navigation terminée'
    },
    accommodation: {
      capacity: 'Jusqu\'à',
      guests: 'invités',
      from: 'à partir de',
      per_night: 'par nuit',
      features: 'Équipements',
      no_additional_info: 'Aucun détail supplémentaire disponible',
      upTo: 'Jusqu\'à',
      guestsCount: 'invités',
      website: 'Visiter le site web',
      priceFrom: 'à partir de',
      perNight: 'par nuit',
      viewDetails: 'Voir détails',
      bookNow: 'Réserver maintenant'
    }
  },
  nl: {
    navigation: {
      search: 'Zoeken',
      kamperland: 'Kamperland',
      zuhause: 'Zuhause',
      clearPOIs: 'POIs wissen',
      filter: 'Filter',
      map: 'Kaart',
      navigate: 'Navigatie',
      settings: 'Instellingen'
    },
    categories: {
      'campsites': 'Campings',
      'restrooms': 'Sanitair',
      'fire-pits': 'Vuurplaatsen',
      'trails': 'Wandelpaden',
      'services': 'Diensten',
      'waste': 'Afvalverwijdering'
    },
    weather: {
      condition: 'Conditie',
      humidity: 'Luchtvochtigheid',
      windSpeed: 'Windsnelheid',
      loading: 'Weer laden...',
      alerts: {
        cold: 'Koud weer - uitrusting controleren',
        rain: 'Regen verwacht - spullen vastzetten',
        wind: 'Harde wind - tenten beveiligen',
        heat: 'Heet weer - gehydrateerd blijven',
        coldTitle: 'Koudewaarschuwing',
        rainTitle: 'Regen verwacht',
        windTitle: 'Harde wind',
        heatTitle: 'Hittewaarschuwing'
      }
    },
    search: {
      placeholder: 'Zoek faciliteiten, restaurants, activiteiten...'
    },
    poi: {
      navigate: 'Navigeren',
      close: 'Sluiten',
      distance: 'Afstand',
      category: 'Categorie',
      operationalInfo: 'Operationele informatie',
      hours: 'Openingstijden',
      away: 'weg',
      website: 'Website',
      phone: 'Telefoon',
      description: 'Beschrijving',
      amenities: 'Voorzieningen',
      noInfo: 'Geen aanvullende informatie beschikbaar'
    },
    status: {
      loading: 'Campingkaart laden...',
      gpsAccuracy: 'GPS-nauwkeurigheid',
      simulatedGPS: 'Gesimuleerde GPS',
      realGPS: 'Echte GPS'
    },
    alerts: {
      siteChanged: 'Locatie gewijzigd',
      siteSwitched: 'Overgeschakeld naar',
      poisCleared: 'POIs gewist',
      poisHidden: 'Alle POI-markeringen zijn verborgen',
      routeStarted: 'Navigatie gestart',
      routeEnded: 'Navigatie beëindigd'
    },
    accommodation: {
      features: 'Voorzieningen',
      priceFrom: 'vanaf',
      perNight: 'per nacht',
      viewDetails: 'Details bekijken',
      bookNow: 'Nu boeken',
      upTo: 'Tot',
      guests: 'gasten',
      website: 'Website bezoeken'
    }
  },
  it: {
    navigation: {
      search: 'Trova campeggi, sentieri, servizi...',
      kamperland: 'Kamperland',
      zuhause: 'Zuhause',
      clearPOIs: 'Cancella POI',
      filter: 'Filtro',
      map: 'Mappa',
      navigation: 'Navigazione',
      settings: 'Impostazioni'
    },
    categories: {
      'campsites': 'Campeggi',
      'restrooms': 'Servizi igienici',
      'fire-pits': 'Focolari',
      'trails': 'Sentieri',
      'services': 'Servizi',
      'waste': 'Smaltimento rifiuti'
    },
    weather: {
      condition: 'Condizione',
      humidity: 'Umidità',
      windSpeed: 'Velocità del vento',
      alerts: 'avviso',
      alertsPlural: 'avvisi'
    },
    poi: {
      navigate: 'Naviga',
      close: 'Chiudi',
      distance: 'Distanza',
      category: 'Categoria',
      operationalInfo: 'Informazioni operative',
      hours: 'Orari',
      away: 'di distanza',
      website: 'Sito web',
      phone: 'Telefono',
      description: 'Descrizione',
      amenities: 'Servizi',
      noInfo: 'Nessuna informazione aggiuntiva disponibile'
    },
    status: {
      loading: 'Caricamento mappa campeggio...',
      gpsAccuracy: 'Precisione GPS',
      simulatedGPS: 'GPS simulato',
      realGPS: 'GPS reale'
    },
    alerts: {
      siteChanged: 'Sito cambiato',
      siteSwitched: 'Passato a',
      poisCleared: 'POI cancellati',
      poisHidden: 'Tutti i marcatori POI sono stati nascosti',
      routeStarted: 'Navigazione avviata',
      routeEnded: 'Navigazione terminata'
    },
    accommodation: {
      features: 'Servizi',
      priceFrom: 'da',
      perNight: 'a notte',
      viewDetails: 'Vedi dettagli',
      bookNow: 'Prenota ora',
      upTo: 'Fino a',
      guests: 'ospiti',
      website: 'Visita il sito web'
    }
  },
  es: {
    navigation: {
      search: 'Buscar campings, senderos, servicios...',
      kamperland: 'Kamperland',
      zuhause: 'Zuhause',
      clearPOIs: 'Limpiar POIs',
      filter: 'Filtro',
      map: 'Mapa',
      navigation: 'Navegación',
      settings: 'Ajustes'
    },
    categories: {
      'campsites': 'Campings',
      'restrooms': 'Aseos',
      'fire-pits': 'Fogatas',
      'trails': 'Senderos',
      'services': 'Servicios',
      'waste': 'Eliminación de residuos'
    },
    weather: {
      condition: 'Condición',
      humidity: 'Humedad',
      windSpeed: 'Velocidad del viento',
      alerts: 'alerta',
      alertsPlural: 'alertas'
    },
    poi: {
      navigate: 'Navegar',
      close: 'Cerrar',
      distance: 'Distancia',
      category: 'Categoría',
      operationalInfo: 'Información operativa',
      hours: 'Horarios',
      away: 'de distancia',
      website: 'Sitio web',
      phone: 'Teléfono',
      description: 'Descripción',
      amenities: 'Servicios',
      noInfo: 'No hay información adicional disponible'
    },
    status: {
      loading: 'Cargando mapa del camping...',
      gpsAccuracy: 'Precisión GPS',
      simulatedGPS: 'GPS simulado',
      realGPS: 'GPS real'
    },
    alerts: {
      siteChanged: 'Sitio cambiado',
      siteSwitched: 'Cambiado a',
      poisCleared: 'POIs limpiados',
      poisHidden: 'Todos los marcadores POI han sido ocultados',
      routeStarted: 'Navegación iniciada',
      routeEnded: 'Navegación terminada'
    },
    accommodation: {
      capacity: 'Hasta',
      guests: 'huéspedes',
      from: 'desde',
      per_night: 'por noche',
      features: 'Servicios',
      no_additional_info: 'No hay detalles adicionales disponibles',
      upTo: 'Hasta',
      guestsCount: 'huéspedes',
      website: 'Visitar sitio web',
      priceFrom: 'desde',
      perNight: 'por noche',
      viewDetails: 'Ver detalles',
      bookNow: 'Reservar ahora'
    }
  }
};

export const getTranslation = (lang: SupportedLanguage, key: string): string => {
  const keys = key.split('.');
  let current: any = translations[lang];

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Fallback to English
      current = translations.en;
      for (const fallbackKey of keys) {
        if (current && typeof current === 'object' && fallbackKey in current) {
          current = current[fallbackKey];
        } else {
          return key; // Return key if translation not found
        }
      }
      break;
    }
  }

  return typeof current === 'string' ? current : key;
};

// Function to translate routing instructions from English to German
export const translateInstruction = (instruction: string, lang: SupportedLanguage): string => {
  if (lang === 'en') return instruction;
  if (lang !== 'de') return instruction; // Only German translation implemented

  // German translation mappings - ordered by specificity (longer phrases first)
  const translations: Record<string, string> = {
    // Walking instructions (most specific first)
    'Walk 396m to destination!': '396m zu Fuß zum Ziel!',
    'Walk to destination': 'Zu Fuß zum Ziel',
    'to destination': 'zum Ziel',
    'destination': 'Ziel',

    // Distance patterns
    'Walk (\\d+)m to destination!': '$1m zu Fuß zum Ziel!',
    'Walk (\\d+)m': '$1m zu Fuß',

    // Roundabout instructions
    'Enter the roundabout and take the 1st exit': 'In den Kreisverkehr einfahren und die 1. Ausfahrt nehmen',
    'Enter the roundabout and take the 2nd exit': 'In den Kreisverkehr einfahren und die 2. Ausfahrt nehmen',
    'Enter the roundabout and take the 3rd exit': 'In den Kreisverkehr einfahren und die 3. Ausfahrt nehmen',
    'Enter the roundabout and take the 4th exit': 'In den Kreisverkehr einfahren und die 4. Ausfahrt nehmen',
    'Enter the roundabout and take the 5th exit': 'In den Kreisverkehr einfahren und die 5. Ausfahrt nehmen',
    'take the 1st exit': 'die 1. Ausfahrt nehmen',
    'take the 2nd exit': 'die 2. Ausfahrt nehmen',
    'take the 3rd exit': 'die 3. Ausfahrt nehmen',
    'take the 4th exit': 'die 4. Ausfahrt nehmen',
    'take the 5th exit': 'die 5. Ausfahrt nehmen',
    'Enter the roundabout': 'In den Kreisverkehr einfahren',

    // Basic directions
    'Turn left': 'Links abbiegen',
    'Turn right': 'Rechts abbiegen',
    'Turn slight left': 'Leicht links abbiegen',
    'Turn slight right': 'Leicht rechts abbiegen',
    'Turn sharp left': 'Scharf links abbiegen',
    'Turn sharp right': 'Scharf rechts abbiegen',
    'Continue straight': 'Geradeaus weiterfahren',
    'Continue ahead': 'Geradeaus weiterfahren',
    'Keep left': 'Links halten',
    'Keep right': 'Rechts halten',

    // Directions and prepositions - Natural German phrasing - MOST SPECIFIC FIRST
    'Head north toward': 'Geradeaus Richtung Norden zum',
    'Head south toward': 'Geradeaus Richtung Süden zum', 
    'Head east toward': 'Geradeaus Richtung Osten zum',
    'Head west toward': 'Geradeaus Richtung Westen zum',
    'Head northeast toward': 'Geradeaus Richtung Nordosten zum',
    'Head northwest toward': 'Geradeaus Richtung Nordwesten zum',
    'Head southeast toward': 'Geradeaus Richtung Südosten zum',
    'Head southwest toward': 'Geradeaus Richtung Südwesten zum',
    'Head north towards': 'Geradeaus Richtung Norden zum',
    'Head south towards': 'Geradeaus Richtung Süden zum',
    'Head east towards': 'Geradeaus Richtung Osten zum',
    'Head west towards': 'Geradeaus Richtung Westen zum',
    'Head northeast towards': 'Geradeaus Richtung Nordosten zum',
    'Head northwest towards': 'Geradeaus Richtung Nordwesten zum',
    'Head southeast towards': 'Geradeaus Richtung Südosten zum',
    'Head southwest towards': 'Geradeaus Richtung Südwesten zum',
    'Head north': 'Geradeaus Richtung Norden',
    'Head south': 'Geradeaus Richtung Süden', 
    'Head east': 'Geradeaus Richtung Osten',
    'Head west': 'Geradeaus Richtung Westen',
    'Head northeast': 'Geradeaus Richtung Nordosten',
    'Head northwest': 'Geradeaus Richtung Nordwesten',
    'Head southeast': 'Geradeaus Richtung Südosten',
    'Head southwest': 'Geradeaus Richtung Südwesten',
    'Head towards': 'Fahren Sie Richtung',
    'Head toward': 'Fahren Sie Richtung',
    // Fix problematic combinations that create confusion
    'fahrenwest': 'fahren',
    'fahreneast': 'fahren',
    'fahrennorth': 'fahren',
    'fahrensouth': 'fahren',
    'onto': 'auf',
    'on': 'auf', 
    'towards': 'zum',
    'toward': 'zum',

    // Arrival
    'Arrive at your destination': 'Sie haben Ihr Ziel erreicht',
    'You have arrived': 'Sie sind angekommen',
    'at your destination': 'an Ihrem Ziel',

    // Common words
    'Walk': 'Gehen Sie',
    'and': 'und',
    'the': 'die',
    'exit': 'Ausfahrt'
  };

  let translatedInstruction = instruction;

  // Apply translations in order of specificity (longest phrases first)
  const sortedTranslations = Object.entries(translations)
    .sort(([a], [b]) => b.length - a.length);

  for (const [english, german] of sortedTranslations) {
    const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    translatedInstruction = translatedInstruction.replace(regex, german);
  }

  // Post-processing: Fix problematic word combinations that create confusion
  translatedInstruction = translatedInstruction
    .replace(/fahrenwest/gi, 'fahren')
    .replace(/fahreneast/gi, 'fahren')
    .replace(/fahrennorth/gi, 'fahren')
    .replace(/fahrensouth/gi, 'fahren')
    .replace(/Richtung\s+(\w+)\s+fahren(\w+)/gi, 'Richtung $1 fahren')
    .replace(/fahren\s+west/gi, 'Richtung Westen fahren')
    .replace(/fahren\s+east/gi, 'Richtung Osten fahren')
    .replace(/fahren\s+north/gi, 'Richtung Norden fahren')
    .replace(/fahren\s+south/gi, 'Richtung Süden fahren');

  return translatedInstruction;
};