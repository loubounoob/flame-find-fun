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
  const currentPopupRef = useRef<mapboxgl.Popup | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(12);

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

    // Create map instance with evening/twilight style
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
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

    // Close popup when user starts dragging the map
    map.current.on('dragstart', () => {
      if (currentPopupRef.current) {
        currentPopupRef.current.remove();
        currentPopupRef.current = null;
      }
    });

    // Track zoom level for dynamic marker spacing
    map.current.on('zoom', () => {
      if (map.current) {
        setCurrentZoom(map.current.getZoom());
      }
    });

    map.current.on('load', () => {
      onMapLoad?.();
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [userLocation, onMapLoad]);

  // Update markers when offers change or zoom changes
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
  }, [filteredOffers, currentZoom]);

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
    if (!map.current || !userLocation) return;

    const categoryColor = CATEGORY_COLORS[offer.category] || CATEGORY_COLORS.default;
    const categoryEmoji = CATEGORY_EMOJIS[offer.category] || CATEGORY_EMOJIS.default;

    // Get photo URL (priority: image_urls[0] > image_url > avatar_url > emoji fallback)
    const photoUrl = (Array.isArray(offer.image_urls) && typeof offer.image_urls[0] === 'string' ? offer.image_urls[0] : offer.image_url) || offer.profiles?.avatar_url;

    // Calculate distance between user and offer
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      offer.latitude,
      offer.longitude
    );

    // Check how many markers are already at this position (or very close)
    const existingMarkersAtPosition = markersRef.current.filter(m => {
      const markerLngLat = m.getLngLat();
      const distance = Math.sqrt(
        Math.pow(markerLngLat.lng - offer.longitude, 2) + 
        Math.pow(markerLngLat.lat - offer.latitude, 2)
      );
      return distance < 0.0001; // Very close proximity threshold
    });

    // Calculate dynamic offset based on zoom level (stronger/faster separation)
    // At zoom 12: 8px, at zoom 14: 32px, at zoom 16+: 72px+
    const baseOffset = 8;
    const zoomFactor = Math.max(1, Math.min(9, (currentZoom - 12) * 2));
    const stackOffset = existingMarkersAtPosition.length * baseOffset * zoomFactor;
    const zIndex = 100 + existingMarkersAtPosition.length;

    // Check if offer is promotional (from recurring promotions or regular promotions)
    const isPromotional = offer.activePromotion?.discount_percentage > 0;
    const discountPercentage = offer.activePromotion?.discount_percentage || 0;
    const borderColor = isPromotional ? '#F97316' : categoryColor; // Orange for promos

    // Create marker element (root handles positioning; inner handles visuals)
    const markerEl = document.createElement('div');
    markerEl.style.position = 'relative';
    markerEl.style.width = '0px';
    markerEl.style.height = '0px';
    markerEl.style.pointerEvents = 'auto';

    const bubbleEl = document.createElement('div');
    bubbleEl.style.position = 'absolute';
    bubbleEl.style.left = '-25px'; // Center the 50px bubble
    bubbleEl.style.top = '-25px';
    bubbleEl.style.width = '50px';
    bubbleEl.style.height = '50px';
    bubbleEl.style.borderRadius = '50%';
    bubbleEl.style.border = `3px solid ${borderColor}`;
    bubbleEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    bubbleEl.style.cursor = 'pointer';
    bubbleEl.style.overflow = 'hidden';
    bubbleEl.style.willChange = 'transform';
    bubbleEl.style.transition = 'transform 150ms ease';

    // Discount badge for promotional offers (smaller, 65% inside / 35% outside)
    let discountBadgeEl: HTMLDivElement | null = null;
    if (isPromotional) {
      discountBadgeEl = document.createElement('div');
      discountBadgeEl.style.position = 'absolute';
      discountBadgeEl.style.top = '-3px';
      discountBadgeEl.style.right = '-3px';
      discountBadgeEl.style.backgroundColor = '#F97316';
      discountBadgeEl.style.color = 'white';
      discountBadgeEl.style.padding = '2px 5px';
      discountBadgeEl.style.borderRadius = '8px';
      discountBadgeEl.style.fontSize = '9px';
      discountBadgeEl.style.fontWeight = '700';
      discountBadgeEl.style.whiteSpace = 'nowrap';
      discountBadgeEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.4)';
      discountBadgeEl.style.zIndex = '10';
      discountBadgeEl.style.lineHeight = '1';
      discountBadgeEl.textContent = `-${discountPercentage}%`;
    }

    // Distance label below bubble - centered
    const distanceEl = document.createElement('div');
    distanceEl.style.position = 'absolute';
    distanceEl.style.top = '31px'; // 25px (bubble center) + 6px spacing
    distanceEl.style.left = '0';
    distanceEl.style.transform = 'translateX(-50%)';
    distanceEl.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    distanceEl.style.color = 'rgba(255, 255, 255, 0.9)';
    distanceEl.style.padding = '1px 5px';
    distanceEl.style.borderRadius = '3px';
    distanceEl.style.fontSize = '9px';
    distanceEl.style.fontWeight = '500';
    distanceEl.style.whiteSpace = 'nowrap';
    distanceEl.style.pointerEvents = 'none';
    distanceEl.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
    distanceEl.textContent = distance;

    markerEl.appendChild(bubbleEl);
    if (discountBadgeEl) {
      markerEl.appendChild(discountBadgeEl);
    }
    markerEl.appendChild(distanceEl);

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

    // Create compact popup
    const businessName = offer.profiles?.business_name || 'Business';
    const description = offer.description ? offer.description.substring(0, 80) + '...' : '';
    
    const popupContent = `
      <div style="background: #1a1a2e; color: #fff; border-radius: 12px; overflow: hidden; min-width: 240px; max-width: 260px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
        ${photoUrl ? `
          <div style="height: 120px; overflow: hidden;">
            <img src="${photoUrl}" alt="${offer.title}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        ` : ''}
        <div style="padding: 12px;">
          <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 24px; flex-shrink: 0;">${categoryEmoji}</span>
            <div style="flex: 1; min-width: 0;">
              <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: #fff; line-height: 1.3;">
                ${offer.title}
              </h3>
            </div>
          </div>
          ${description ? `
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #d1d5db; line-height: 1.4;">
              ${description}
            </p>
          ` : ''}
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 12px; color: #9ca3af; font-size: 11px;">
            <span style="color: ${categoryColor};">●</span>
            <span>${offer.category}</span>
            <span style="margin-left: 4px;">📍</span>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${offer.location}</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button 
              onclick="window.location.href='/offer/${offer.id}'"
              style="
                flex: 1;
                padding: 8px 12px;
                background-color: ${categoryColor};
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
              "
              onmouseover="this.style.opacity='0.9'"
              onmouseout="this.style.opacity='1'"
            >
              Voir détails
            </button>
            <button 
              onclick="window.location.href='/booking?offer=${offer.id}'"
              style="
                flex: 1;
                padding: 8px 12px;
                background-color: rgba(255, 255, 255, 0.1);
                color: #fff;
                border: 1px solid ${categoryColor};
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
              "
              onmouseover="this.style.backgroundColor='${categoryColor}'"
              onmouseout="this.style.backgroundColor='rgba(255, 255, 255, 0.1)'"
            >
              Réserver
            </button>
          </div>
        </div>
      </div>
    `;

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      closeOnClick: false,
      maxWidth: '260px',
      className: 'mapbox-popup-compact',
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

    // Click to open popup - close any existing popup first and center popup on screen
    bubbleEl.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Close any existing popup
      if (currentPopupRef.current) {
        currentPopupRef.current.remove();
      }
      
      // Open new popup
      marker.togglePopup();
      
      if (marker.getPopup().isOpen()) {
        currentPopupRef.current = marker.getPopup();
        
        // Pan map so popup appears centered on screen
        // We move the map center down by ~150px (popup height / 2) to center the popup
        if (map.current) {
          const targetPoint = map.current.project([offer.longitude, offer.latitude]);
          targetPoint.y -= 150; // Shift up to center popup on screen
          const targetLatLng = map.current.unproject(targetPoint);
          
          map.current.easeTo({
            center: targetLatLng,
            duration: 400
          });
        }
      } else {
        currentPopupRef.current = null;
      }
    });
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
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
    <>
      <style>{`
        .mapbox-popup-compact .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .mapbox-popup-compact .mapboxgl-popup-tip {
          display: none !important;
        }
        .mapbox-popup-compact {
          max-width: none !important;
        }
      `}</style>
      <div ref={mapContainer} className="w-full h-full" />
    </>
  );
}
