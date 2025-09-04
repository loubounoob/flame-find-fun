import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Navigation, Layers, MapPin, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDistance } from '@/hooks/useDistance';

declare global {
  interface Window {
    google: any;
    viewBusiness?: (offerId: string) => void;
    getDirections?: (lat: number, lng: number) => void;
  }
}

interface UltraGoogleMapProps {
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  onMapLoad?: (map: any) => void;
  filteredOffers?: any[];
  selectedBusiness?: any;
}

const ULTRA_MAP_STYLES = {
  dark: [
    { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }]
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }]
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }]
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }]
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }]
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }]
    }
  ],
  light: [
    {
      featureType: "poi",
      elementType: "all",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [{ visibility: "simplified" }]
    },
    {
      featureType: "road",
      elementType: "labels.text",
      stylers: [{ visibility: "simplified" }]
    },
    {
      featureType: "water",
      elementType: "geometry.fill",
      stylers: [{ color: "#4a90e2" }]
    },
    {
      featureType: "landscape.natural",
      elementType: "geometry.fill",
      stylers: [{ color: "#f0f8ff" }]
    }
  ]
};

export function UltraGoogleMap({ 
  onLocationUpdate, 
  onMapLoad, 
  filteredOffers = [],
  selectedBusiness 
}: UltraGoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const proximityCircleRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  
  const [apiKey] = useState('AIzaSyATgautsRC2yNJ6Ww5d6KqqxnIYDtrjJwM');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [trafficLayer, setTrafficLayer] = useState<any>(null);
  
  const { position, isLoading: locationLoading, getCurrentPosition } = useGeolocation();
  const { getDistance } = useDistance();

  // Fetch businesses with enriched data
  const { data: businesses = [] } = useQuery({
    queryKey: ["ultra-businesses-map", filteredOffers],
    queryFn: async () => {
      if (filteredOffers && filteredOffers.length > 0) {
        return filteredOffers.filter(offer => offer.latitude && offer.longitude);
      }
      
      const { data, error } = await supabase
        .from("offers")
        .select(`
          *, 
          business_pricing(*),
          offer_pricing_options(*),
          business_addresses(*)
        `)
        .eq("status", "active")
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Initialize ultra-customized Google Maps
  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry', 'visualization']
      });

      await loader.load();
      const google = (window as any).google;

      const defaultCenter = position || { lat: 45.7640, lng: 4.8357 };

      const map = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 14,
        mapTypeId: google.maps.MapTypeId[mapType.toUpperCase()],
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        styles: isDarkMode ? ULTRA_MAP_STYLES.dark : ULTRA_MAP_STYLES.light,
        minZoom: 10,
        maxZoom: 20,
        restriction: {
          latLngBounds: {
            north: 51.1,
            south: 41.3,
            west: -5.1,
            east: 9.6
          }
        }
      });

      mapInstanceRef.current = map;
      onMapLoad?.(map);

      // Add traffic layer
      const traffic = new google.maps.TrafficLayer();
      setTrafficLayer(traffic);
      if (showTraffic) {
        traffic.setMap(map);
      }

      // Add proximity circle around user
      if (position) {
        const proximityCircle = new google.maps.Circle({
          strokeColor: '#ff6b35',
          strokeOpacity: 0.3,
          strokeWeight: 2,
          fillColor: '#ff6b35',
          fillOpacity: 0.1,
          map: map,
          center: position,
          radius: 2000, // 2km radius
        });
        proximityCircleRef.current = proximityCircle;
      }

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Create ultra-custom markers for businesses
      for (const offer of businesses) {
        if (offer.latitude && offer.longitude) {
          await createUltraMarker(offer, map, google);
        }
      }

      // Add user location marker with animation
      if (position) {
        const userMarker = new google.maps.Marker({
          position: position,
          map: map,
          title: 'Votre position',
          animation: google.maps.Animation.BOUNCE,
          icon: {
            url: createUserLocationIcon(),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
          }
        });

        // Stop bouncing after 3 seconds
        setTimeout(() => {
          userMarker.setAnimation(null);
        }, 3000);

        onLocationUpdate?.(position);
      }

    } catch (error) {
      console.error('Error loading Ultra Google Maps:', error);
    }
  };

  // Create ultra-customized markers
  const createUltraMarker = async (offer: any, map: any, google: any) => {
    // Fetch business profile for enhanced marker
    let profileData = null;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, business_name, first_name, last_name")
        .eq("user_id", offer.business_user_id)
        .single();
      profileData = data;
    } catch (error) {
      console.log("Could not fetch profile for", offer.business_user_id);
    }

    const businessName = profileData?.business_name || 
                        `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim() || 
                        "Entreprise";

    // Create custom marker with business branding
    const markerIcon = {
      url: createCustomMarkerIcon(offer, profileData),
      scaledSize: new google.maps.Size(60, 75),
      anchor: new google.maps.Point(30, 75),
      origin: new google.maps.Point(0, 0),
      labelOrigin: new google.maps.Point(30, 20)
    };

    const marker = new google.maps.Marker({
      position: { 
        lat: Number(offer.latitude), 
        lng: Number(offer.longitude) 
      },
      map: map,
      title: offer.title,
      icon: markerIcon,
      animation: google.maps.Animation.DROP,
      label: {
        text: businessName.charAt(0).toUpperCase(),
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '14px'
      }
    });

    // Create ultra-rich InfoWindow
    const infoWindow = new google.maps.InfoWindow({
      content: createUltraInfoWindowContent(offer, profileData, businessName),
      maxWidth: 350,
      pixelOffset: new google.maps.Size(0, -10)
    });

    // Add hover and click interactions
    marker.addListener('mouseover', () => {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => marker.setAnimation(null), 700);
    });

    marker.addListener('click', () => {
      // Close other InfoWindows
      markersRef.current.forEach(m => {
        if ((m as any).infoWindow) {
          (m as any).infoWindow.close();
        }
      });
      
      infoWindow.open(map, marker);
      
      // Smooth pan to marker
      map.panTo(marker.getPosition());
    });

    (marker as any).infoWindow = infoWindow;
    markersRef.current.push(marker);

    // Highlight selected business
    if (selectedBusiness && selectedBusiness.id === offer.id) {
      infoWindow.open(map, marker);
      map.setCenter(marker.getPosition());
      map.setZoom(16);
    }
  };

  // Create custom marker SVG with business branding
  const createCustomMarkerIcon = (offer: any, profileData: any) => {
    const categoryColors = {
      bowling: '#ff6b35',
      billard: '#4a90e2',
      padel: '#50c878',
      'escape-game': '#9b59b6',
      karting: '#e74c3c',
      'laser-game': '#f39c12',
      tennis: '#2ecc71',
      restaurant: '#e67e22',
      bar: '#34495e'
    };

    const color = categoryColors[offer.category as keyof typeof categoryColors] || '#ff6b35';
    const avatarUrl = profileData?.avatar_url;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="60" height="75" viewBox="0 0 60 75" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Marker body -->
        <path d="M30 5C18.954 5 10 13.954 10 25C10 35 30 65 30 65S50 35 50 25C50 13.954 41.046 5 30 5Z" 
              fill="url(#gradient)" stroke="white" stroke-width="2" filter="url(#shadow)"/>
        
        <!-- Inner circle for avatar or icon -->
        <circle cx="30" cy="25" r="15" fill="white" stroke="${color}" stroke-width="2"/>
        
        ${avatarUrl ? `
          <!-- Business avatar -->
          <defs>
            <clipPath id="avatar-clip">
              <circle cx="30" cy="25" r="13"/>
            </clipPath>
          </defs>
          <image href="${avatarUrl}" x="17" y="12" width="26" height="26" clip-path="url(#avatar-clip)"/>
        ` : `
          <!-- Category icon -->
          <circle cx="30" cy="25" r="10" fill="${color}"/>
          <text x="30" y="30" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
            ${offer.category.charAt(0).toUpperCase()}
          </text>
        `}
        
        <!-- Price badge -->
        ${offer.price ? `
          <rect x="5" y="45" width="50" height="18" rx="9" fill="white" stroke="${color}" stroke-width="1"/>
          <text x="30" y="56" text-anchor="middle" fill="${color}" font-size="10" font-weight="bold">
            ${offer.price}
          </text>
        ` : ''}
      </svg>
    `)}`;
  };

  // Create user location icon
  const createUserLocationIcon = () => {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="pulse" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
            <feOffset dx="0" dy="0" result="offset"/>
            <feFlood flood-color="#1a73e8" flood-opacity="0.4"/>
            <feComposite in2="offset" operator="in"/>
          </filter>
          <animateTransform attributeName="transform" type="scale" 
                          values="1;1.2;1" dur="2s" repeatCount="indefinite"/>
        </defs>
        
        <!-- Pulsing ring -->
        <circle cx="20" cy="20" r="18" fill="#1a73e8" fill-opacity="0.2" filter="url(#pulse)">
          <animate attributeName="r" values="15;25;15" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Main location dot -->
        <circle cx="20" cy="20" r="12" fill="#1a73e8" stroke="white" stroke-width="3"/>
        <circle cx="20" cy="20" r="6" fill="white"/>
        <circle cx="20" cy="20" r="2" fill="#1a73e8"/>
      </svg>
    `)}`;
  };

  // Create ultra-rich InfoWindow content
  const createUltraInfoWindowContent = (offer: any, profileData: any, businessName: string) => {
    const distance = position ? getDistance(Number(offer.latitude), Number(offer.longitude)) : '';
    const priceRange = offer.business_pricing?.length > 0 ? 
      `${Math.min(...offer.business_pricing.map((p: any) => p.price_amount))}€ - ${Math.max(...offer.business_pricing.map((p: any) => p.price_amount))}€` :
      offer.price || 'Prix sur demande';

    return `
      <div style="
        padding: 0; 
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 320px;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      ">
        <!-- Header with avatar and business info -->
        <div style="
          background: linear-gradient(135deg, #ff6b35 0%, #f56500 100%);
          color: white;
          padding: 16px;
          position: relative;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${profileData?.avatar_url ? `
              <div style="
                width: 48px; 
                height: 48px; 
                border-radius: 50%; 
                overflow: hidden;
                border: 3px solid rgba(255,255,255,0.3);
                background: white;
              ">
                <img src="${profileData.avatar_url}" alt="Business" style="
                  width: 100%; 
                  height: 100%; 
                  object-fit: cover;
                "/>
              </div>
            ` : `
              <div style="
                width: 48px; 
                height: 48px; 
                border-radius: 50%; 
                background: rgba(255,255,255,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: bold;
              ">
                ${businessName.charAt(0)}
              </div>
            `}
            
            <div style="flex: 1;">
              <h3 style="
                margin: 0 0 4px 0; 
                font-size: 16px; 
                font-weight: 700;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
              ">
                ${offer.title}
              </h3>
              <p style="
                margin: 0; 
                font-size: 12px; 
                opacity: 0.9;
              ">
                ${businessName} ${distance ? `• ${distance}` : ''}
              </p>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div style="padding: 16px;">
          <!-- Category and rating -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span style="
              background: linear-gradient(135deg, #ff6b35, #f56500);
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 600;
              text-transform: capitalize;
            ">
              ${offer.category}
            </span>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="color: #fbbf24; font-size: 14px;">★</span>
              <span style="font-size: 12px; color: #64748b; font-weight: 500;">
                ${offer.rating || '4.5'} (${offer.reviews_count || '12'})
              </span>
            </div>
          </div>

          <!-- Price -->
          <div style="
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 12px;
            border: 1px solid #0ea5e9;
          ">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 12px; color: #0369a1; font-weight: 500;">À partir de</span>
              <span style="font-size: 18px; font-weight: 700; color: #0c4a6e;">
                ${priceRange}
              </span>
            </div>
          </div>

          <!-- Location -->
          ${offer.location ? `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
              <span style="color: #64748b; font-size: 12px;">📍</span>
              <span style="font-size: 12px; color: #475569;">${offer.location}</span>
            </div>
          ` : ''}

          <!-- Action buttons -->
          <div style="display: flex; gap: 8px;">
            <button onclick="window.viewBusiness && window.viewBusiness('${offer.id}')" style="
              flex: 1;
              background: linear-gradient(135deg, #ff6b35 0%, #f56500 100%);
              color: white;
              border: none;
              padding: 12px 16px;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 2px 8px rgba(245, 101, 0, 0.3);
            " onmouseover="
              this.style.transform='translateY(-1px)';
              this.style.boxShadow='0 4px 12px rgba(245, 101, 0, 0.4)';
            " onmouseout="
              this.style.transform='translateY(0)';
              this.style.boxShadow='0 2px 8px rgba(245, 101, 0, 0.3)';
            ">
              Voir & Réserver
            </button>
            
            <button onclick="window.getDirections && window.getDirections(${offer.latitude}, ${offer.longitude})" style="
              background: white;
              color: #ff6b35;
              border: 2px solid #ff6b35;
              padding: 12px;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              min-width: 44px;
            " onmouseover="
              this.style.background='#ff6b35';
              this.style.color='white';
            " onmouseout="
              this.style.background='white';
              this.style.color='#ff6b35';
            ">
              🗺️
            </button>
          </div>
        </div>
      </div>
    `;
  };

  // Map controls
  const recenterMap = () => {
    if (position && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(position);
      mapInstanceRef.current.setZoom(16);
      
      // Animate proximity circle
      if (proximityCircleRef.current) {
        proximityCircleRef.current.setCenter(position);
        proximityCircleRef.current.setRadius(1000);
        setTimeout(() => {
          proximityCircleRef.current?.setRadius(2000);
        }, 300);
      }
    } else {
      getCurrentPosition();
    }
  };

  const toggleMapType = () => {
    const types: ('roadmap' | 'satellite' | 'hybrid')[] = ['roadmap', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextType = types[(currentIndex + 1) % types.length];
    setMapType(nextType);
    
    if (mapInstanceRef.current) {
      const google = (window as any).google;
      mapInstanceRef.current.setMapTypeId(google.maps.MapTypeId[nextType.toUpperCase()]);
    }
  };

  const toggleTraffic = () => {
    setShowTraffic(!showTraffic);
    if (trafficLayer && mapInstanceRef.current) {
      trafficLayer.setMap(showTraffic ? null : mapInstanceRef.current);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({
        styles: !isDarkMode ? ULTRA_MAP_STYLES.dark : ULTRA_MAP_STYLES.light
      });
    }
  };

  // Effects
  useEffect(() => {
    if (apiKey && businesses.length >= 0) {
      initializeMap();
    }
  }, [businesses, position, mapType, isDarkMode]);

  useEffect(() => {
    getCurrentPosition();
  }, []);

  // Update markers when filtered offers change
  useEffect(() => {
    if (mapInstanceRef.current && businesses.length > 0) {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      // Add new markers
      businesses.forEach(offer => {
        if (offer.latitude && offer.longitude) {
          createUltraMarker(offer, mapInstanceRef.current!, (window as any).google);
        }
      });
    }
  }, [filteredOffers]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />
      
      {/* Ultra Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Recenter Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={recenterMap}
          disabled={locationLoading}
          className="bg-background/95 backdrop-blur-sm shadow-lg hover-scale"
          title="Recentrer sur ma position"
        >
          <Navigation size={20} />
        </Button>

        {/* Map Type Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMapType}
          className="bg-background/95 backdrop-blur-sm shadow-lg hover-scale"
          title={`Mode: ${mapType}`}
        >
          <Layers size={20} />
        </Button>

        {/* Traffic Toggle */}
        <Button
          variant={showTraffic ? "default" : "outline"}
          size="icon"
          onClick={toggleTraffic}
          className="bg-background/95 backdrop-blur-sm shadow-lg hover-scale"
          title="Trafic en temps réel"
        >
          <Zap size={20} />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant={isDarkMode ? "default" : "outline"}
          size="icon"
          onClick={toggleTheme}
          className="bg-background/95 backdrop-blur-sm shadow-lg hover-scale"
          title={`Mode ${isDarkMode ? 'sombre' : 'clair'}`}
        >
          🌙
        </Button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
        <h4 className="font-semibold text-sm mb-2 text-foreground">Légende</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-muted-foreground">Votre position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-primary"></div>
            <span className="text-muted-foreground">Entreprises disponibles</span>
          </div>
          {businesses.length > 0 && (
            <div className="text-xs text-muted-foreground pt-1">
              {businesses.length} résultat{businesses.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}