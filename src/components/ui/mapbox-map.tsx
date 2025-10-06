import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface MapboxMapProps {
  filteredOffers?: any[];
  selectedBusiness?: any;
  onLocationUpdate?: (lat: number, lng: number) => void;
  onMapLoad?: () => void;
}

// Category colors (same as Google Maps)
const CATEGORY_COLORS: Record<string, string> = {
  'Bowling': '#9b87f5',
  'Billard': '#7E69AB',
  'Ping-pong': '#6E59A5',
  'Laser-game': '#D946EF',
  'Escape-game': '#F97316',
  'Karting': '#0EA5E9',
  'default': '#8B5CF6'
};

// Category emojis
const CATEGORY_EMOJIS: Record<string, string> = {
  'Bowling': '🎳',
  'Billard': '🎱',
  'Ping-pong': '🏓',
  'Laser-game': '🎯',
  'Escape-game': '🧩',
  'Karting': '🎪',
  'default': '🎯'
};

export function MapboxMap({ 
  filteredOffers = [], 
  selectedBusiness,
  onLocationUpdate,
  onMapLoad 
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user's geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          onLocationUpdate?.(location.lat, location.lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Paris if geolocation fails
          const defaultLocation = { lat: 48.8566, lng: 2.3522 };
          setUserLocation(defaultLocation);
          onLocationUpdate?.(defaultLocation.lat, defaultLocation.lng);
        }
      );
    } else {
      // Default to Paris if geolocation not supported
      const defaultLocation = { lat: 48.8566, lng: 2.3522 };
      setUserLocation(defaultLocation);
      onLocationUpdate?.(defaultLocation.lat, defaultLocation.lng);
    }
  }, [onLocationUpdate]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !userLocation || map.current) return;

    // Create map instance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [userLocation.lng, userLocation.lat],
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Add user location marker (blue circle)
    const userMarkerEl = document.createElement('div');
    userMarkerEl.style.width = '20px';
    userMarkerEl.style.height = '20px';
    userMarkerEl.style.borderRadius = '50%';
    userMarkerEl.style.backgroundColor = '#4285F4';
    userMarkerEl.style.border = '3px solid white';
    userMarkerEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

    userMarkerRef.current = new mapboxgl.Marker({ element: userMarkerEl })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);

    map.current.on('load', () => {
      onMapLoad?.();
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [userLocation, onMapLoad]);

  // Update markers when offers change
  useEffect(() => {
    if (!map.current || !filteredOffers) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create markers for each offer
    filteredOffers.forEach(offer => {
      if (offer.latitude && offer.longitude) {
        createOfferMarker(offer);
      }
    });
  }, [filteredOffers]);

  // Handle selected business
  useEffect(() => {
    if (!map.current || !selectedBusiness) return;

    if (selectedBusiness.latitude && selectedBusiness.longitude) {
      map.current.flyTo({
        center: [selectedBusiness.longitude, selectedBusiness.latitude],
        zoom: 15,
        duration: 1500
      });
    }
  }, [selectedBusiness]);

  // Create circular photo marker for an offer
  const createOfferMarker = (offer: any) => {
    if (!map.current) return;

    const categoryColor = CATEGORY_COLORS[offer.category] || CATEGORY_COLORS.default;
    const categoryEmoji = CATEGORY_EMOJIS[offer.category] || CATEGORY_EMOJIS.default;

    // Get photo URL (priority: avatar_url > image_url > emoji fallback)
    const photoUrl = offer.profiles?.avatar_url || offer.image_url;

    // Create marker element
    const markerEl = document.createElement('div');
    markerEl.style.width = '50px';
    markerEl.style.height = '50px';
    markerEl.style.borderRadius = '50%';
    markerEl.style.border = `3px solid ${categoryColor}`;
    markerEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    markerEl.style.cursor = 'pointer';
    markerEl.style.transition = 'transform 0.2s';
    markerEl.style.overflow = 'hidden';

    if (photoUrl) {
      // Use photo as background
      markerEl.style.backgroundImage = `url(${photoUrl})`;
      markerEl.style.backgroundSize = 'cover';
      markerEl.style.backgroundPosition = 'center';
    } else {
      // Fallback to emoji on colored background
      markerEl.style.backgroundColor = categoryColor;
      markerEl.style.display = 'flex';
      markerEl.style.alignItems = 'center';
      markerEl.style.justifyContent = 'center';
      markerEl.style.fontSize = '24px';
      markerEl.textContent = categoryEmoji;
    }

    // Hover effect
    markerEl.addEventListener('mouseenter', () => {
      markerEl.style.transform = 'scale(1.1)';
    });
    markerEl.addEventListener('mouseleave', () => {
      markerEl.style.transform = 'scale(1)';
    });

    // Create popup
    const popupContent = `
      <div style="padding: 8px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">
          ${offer.title}
        </h3>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; color: #666; font-size: 14px;">
          <span>${categoryEmoji}</span>
          <span>${offer.category}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 12px; color: #666; font-size: 14px;">
          <span>📍</span>
          <span>${offer.location}</span>
        </div>
        <button 
          onclick="window.location.href='/offer/${offer.id}'"
          style="
            width: 100%;
            padding: 8px 16px;
            background-color: ${categoryColor};
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
          "
        >
          Voir l'offre
        </button>
      </div>
    `;

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false
    }).setHTML(popupContent);

    // Create marker
    const marker = new mapboxgl.Marker({ element: markerEl })
      .setLngLat([offer.longitude, offer.latitude])
      .setPopup(popup)
      .addTo(map.current);

    markersRef.current.push(marker);

    // Click to open popup
    markerEl.addEventListener('click', () => {
      marker.togglePopup();
    });
  };

  if (!userLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
