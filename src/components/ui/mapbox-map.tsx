import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibG91aXNib3UiLCJhIjoiY21nZWo2dXlmMXZxODJqczhzdmF6N3BhcCJ9.4U9I3H3HJf8UKLb-71fI3g';

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

    // Create map instance with dark colorful style
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: [userLocation.lng, userLocation.lat],
      zoom: 12
    });

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

    // Check how many markers are already at this position (or very close)
    const existingMarkersAtPosition = markersRef.current.filter(m => {
      const markerLngLat = m.getLngLat();
      const distance = Math.sqrt(
        Math.pow(markerLngLat.lng - offer.longitude, 2) + 
        Math.pow(markerLngLat.lat - offer.latitude, 2)
      );
      return distance < 0.0001; // Very close proximity threshold
    });

    // Calculate slight offset for stacking (80-90% overlap)
    const stackOffset = existingMarkersAtPosition.length * 8; // 8px offset per marker
    const zIndex = 100 + existingMarkersAtPosition.length;

    // Create marker element (root handles positioning; inner handles visuals)
    const markerEl = document.createElement('div');
    markerEl.style.position = 'relative';
    markerEl.style.width = '0px';
    markerEl.style.height = '0px';
    markerEl.style.pointerEvents = 'auto';

    const bubbleEl = document.createElement('div');
    bubbleEl.style.width = '50px';
    bubbleEl.style.height = '50px';
    bubbleEl.style.borderRadius = '50%';
    bubbleEl.style.border = `3px solid ${categoryColor}`;
    bubbleEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    bubbleEl.style.cursor = 'pointer';
    bubbleEl.style.overflow = 'hidden';
    bubbleEl.style.willChange = 'transform';
    bubbleEl.style.transition = 'transform 150ms ease';

    markerEl.appendChild(bubbleEl);

    if (photoUrl) {
      // Use photo as background
      bubbleEl.style.backgroundImage = `url(${photoUrl})`;
      bubbleEl.style.backgroundSize = 'cover';
      bubbleEl.style.backgroundPosition = 'center';
    } else {
      // Fallback to emoji on colored background
      bubbleEl.style.backgroundColor = categoryColor;
      bubbleEl.style.display = 'flex';
      bubbleEl.style.alignItems = 'center';
      bubbleEl.style.justifyContent = 'center';
      bubbleEl.style.fontSize = '24px';
      bubbleEl.textContent = categoryEmoji;
    }

    // Hover effect - scale inner only (keeps geographic position exact)
    bubbleEl.addEventListener('mouseenter', () => {
      bubbleEl.style.transform = 'scale(1.08)';
    });
    bubbleEl.addEventListener('mouseleave', () => {
      bubbleEl.style.transform = 'scale(1)';
    });

    // Create enhanced popup with more information
    const businessName = offer.profiles?.business_name || 'Business';
    const description = offer.description ? offer.description.substring(0, 120) + '...' : '';
    
    const popupContent = `
      <div style="padding: 12px; min-width: 280px; max-width: 320px; background: #1a1a1a; color: #fff;">
        ${photoUrl ? `
          <div style="margin: -12px -12px 12px -12px; height: 140px; overflow: hidden; border-radius: 8px 8px 0 0;">
            <img src="${photoUrl}" alt="${offer.title}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        ` : ''}
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 28px;">${categoryEmoji}</span>
          <div>
            <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #fff; line-height: 1.2;">
              ${offer.title}
            </h3>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #999;">
              ${businessName}
            </p>
          </div>
        </div>
        ${description ? `
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #ccc; line-height: 1.4;">
            ${description}
          </p>
        ` : ''}
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; color: #999; font-size: 13px;">
          <span style="color: ${categoryColor};">●</span>
          <span>${offer.category}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 16px; color: #999; font-size: 13px;">
          <span>📍</span>
          <span>${offer.location}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button 
            onclick="window.location.href='/offer/${offer.id}'"
            style="
              flex: 1;
              padding: 10px 16px;
              background-color: ${categoryColor};
              color: white;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
              transition: all 0.2s;
            "
            onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-1px)'"
            onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'"
          >
            Voir les détails
          </button>
          <button 
            onclick="window.location.href='/booking?offer=${offer.id}'"
            style="
              flex: 1;
              padding: 10px 16px;
              background-color: #fff;
              color: ${categoryColor};
              border: 2px solid ${categoryColor};
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
              transition: all 0.2s;
            "
            onmouseover="this.style.backgroundColor='${categoryColor}'; this.style.color='#fff'"
            onmouseout="this.style.backgroundColor='#fff'; this.style.color='${categoryColor}'"
          >
            Réserver
          </button>
        </div>
      </div>
    `;

    const popup = new mapboxgl.Popup({
      offset: 30,
      closeButton: true,
      closeOnClick: false,
      maxWidth: '340px',
      className: 'mapbox-popup-dark',
      anchor: 'bottom'
    }).setHTML(popupContent);

    // Create marker with stable anchor and slight horizontal offset for stacking
    const marker = new mapboxgl.Marker({ 
      element: markerEl,
      anchor: 'center',
      offset: [stackOffset, 0]
    })
      .setLngLat([offer.longitude, offer.latitude])
      .setPopup(popup)
      .addTo(map.current);

    markersRef.current.push(marker);

    // Click to open popup - prevent map interference
    bubbleEl.addEventListener('click', (e) => {
      e.stopPropagation();
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
