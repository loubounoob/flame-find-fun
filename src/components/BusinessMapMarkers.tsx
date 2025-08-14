import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  offers: number;
  flames: number;
  avatar_url?: string;
}

interface BusinessMapMarkersProps {
  onMarkerClick?: (business: BusinessLocation) => void;
  map: google.maps.Map | null;
  isLoaded: boolean;
}

export function BusinessMapMarkers({ onMarkerClick, map, isLoaded }: BusinessMapMarkersProps) {
  const { data: businesses = [] } = useQuery({
    queryKey: ["businessLocations"],
    queryFn: async () => {
      // Fetch business profiles with location data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, business_name, business_type, avatar_url, latitude, longitude, address')
        .eq('account_type', 'business')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (profilesError) throw profilesError;

      // Fetch offers count for each business
      const businessIds = profilesData?.map(p => p.user_id) || [];
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select('business_user_id')
        .in('business_user_id', businessIds)
        .eq('status', 'active');

      if (offersError) throw offersError;

      // Count offers per business
      const offersCounts = offersData?.reduce((acc, offer) => {
        acc[offer.business_user_id] = (acc[offer.business_user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Fetch flames count for each business
      const { data: flamesData, error: flamesError } = await supabase
        .from('flames')
        .select('offer_id, offers!inner(business_user_id)')
        .in('offers.business_user_id', businessIds);

      if (flamesError) throw flamesError;

      // Count flames per business
      const flamesCounts = flamesData?.reduce((acc, flame) => {
        const businessId = (flame as any).offers?.business_user_id;
        if (businessId) {
          acc[businessId] = (acc[businessId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      return profilesData?.map(profile => ({
        id: profile.user_id,
        name: profile.business_name || `${profile.first_name} ${profile.last_name}`,
        address: profile.address || '',
        latitude: Number(profile.latitude),
        longitude: Number(profile.longitude),
        type: profile.business_type || 'business',
        offers: offersCounts[profile.user_id] || 0,
        flames: flamesCounts[profile.user_id] || 0,
        avatar_url: profile.avatar_url
      })) || [];
    },
  });

  useEffect(() => {
    if (!map || !isLoaded || businesses.length === 0) return;

    const markers: google.maps.Marker[] = [];
    const infoWindows: google.maps.InfoWindow[] = [];

    businesses.forEach((business) => {
      // Create custom marker with avatar or initials
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      markerElement.style.cssText = `
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        cursor: pointer;
        transition: transform 0.2s ease;
        position: relative;
        overflow: hidden;
      `;

      if (business.avatar_url) {
        markerElement.innerHTML = `<img src="${business.avatar_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
      } else {
        markerElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        markerElement.innerHTML = business.name.charAt(0).toUpperCase();
      }

      // Add offer indicator if business has offers
      if (business.offers > 0) {
        const offerBadge = document.createElement('div');
        offerBadge.style.cssText = `
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ff6b35;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          animation: pulse 2s infinite;
        `;
        offerBadge.textContent = business.offers.toString();
        markerElement.appendChild(offerBadge);
      }

      // Create marker with custom overlay
      const marker = new google.maps.Marker({
        position: { lat: business.latitude, lng: business.longitude },
        map,
        title: business.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">
              <rect width="1" height="1" fill="transparent"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(1, 1),
          anchor: new google.maps.Point(0, 0)
        }
      });

      // Create overlay for custom marker
      const overlay = new (google.maps as any).OverlayView();
      overlay.onAdd = function() {
        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(markerElement);
      };

      overlay.draw = function() {
        const projection = this.getProjection();
        const position = projection.fromLatLngToDivPixel(
          new (google.maps as any).LatLng(business.latitude, business.longitude)
        );
        if (position) {
          markerElement.style.left = (position.x - 25) + 'px';
          markerElement.style.top = (position.y - 25) + 'px';
          markerElement.style.position = 'absolute';
        }
      };

      overlay.onRemove = function() {
        if (markerElement.parentNode) {
          markerElement.parentNode.removeChild(markerElement);
        }
      };

      overlay.setMap(map);

      // Create info window with enhanced styling
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0;">
                ${business.avatar_url 
                  ? `<img src="${business.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />` 
                  : `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${business.name.charAt(0)}</div>`
                }
              </div>
              <div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">${business.name}</h3>
                <p style="margin: 2px 0 0; font-size: 12px; color: #666;">${business.type}</p>
              </div>
            </div>
            
            <div style="margin-bottom: 12px;">
              <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.4;">
                📍 ${business.address}
              </p>
            </div>
            
            <div style="display: flex; gap: 12px; margin-bottom: 12px; font-size: 12px;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="color: #ff6b35;">🔥</span>
                <span style="color: #666;">${business.flames} flammes</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="color: #4f46e5;">📋</span>
                <span style="color: #666;">${business.offers} offres</span>
              </div>
            </div>
            
            <div style="display: flex; gap: 8px;">
              <button onclick="viewOffers('${business.id}')" 
                      style="flex: 1; padding: 8px 12px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 0.2s;">
                Voir les offres
              </button>
              <button onclick="getDirections(${business.latitude}, ${business.longitude})" 
                      style="padding: 8px 12px; background: #f3f4f6; color: #374151; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: background 0.2s;">
                🧭 Itinéraire
              </button>
            </div>
          </div>
        `,
        maxWidth: 300
      });

      // Add click listeners
      markerElement.addEventListener('click', () => {
        // Close all other info windows
        infoWindows.forEach(iw => (iw as any).close());
        
        // Open this info window
        infoWindow.open(map, marker);
        
        // Call onMarkerClick if provided
        if (onMarkerClick) {
          onMarkerClick(business);
        }
      });

      // Hover effects
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.1)';
        markerElement.style.zIndex = '1000';
      });

      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
        markerElement.style.zIndex = '1';
      });

      markers.push(marker);
      infoWindows.push(infoWindow);
    });

    // Global functions for info window buttons
    (window as any).viewOffers = (businessId: string) => {
      // Navigate to business offers or profile
      window.location.href = `/business/${businessId}`;
    };

    (window as any).getDirections = (lat: number, lng: number) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const origin = `${position.coords.latitude},${position.coords.longitude}`;
          const destination = `${lat},${lng}`;
          const url = `https://www.google.com/maps/dir/${origin}/${destination}`;
          window.open(url, '_blank');
        });
      } else {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
      }
    };

    // Add user location marker
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userMarker = document.createElement('div');
        userMarker.style.cssText = `
          width: 20px;
          height: 20px;
          background: #4f46e5;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 6px rgba(79, 70, 229, 0.2);
          animation: pulse-user 2s infinite;
        `;

        const userOverlay = new (google.maps as any).OverlayView();
        userOverlay.onAdd = function() {
          const panes = this.getPanes();
          panes?.overlayMouseTarget.appendChild(userMarker);
        };

        userOverlay.draw = function() {
          const projection = this.getProjection();
          const pos = projection.fromLatLngToDivPixel(
            new (google.maps as any).LatLng(position.coords.latitude, position.coords.longitude)
          );
          if (pos) {
            userMarker.style.left = (pos.x - 10) + 'px';
            userMarker.style.top = (pos.y - 10) + 'px';
            userMarker.style.position = 'absolute';
          }
        };

        userOverlay.setMap(map);
      });
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      @keyframes pulse-user {
        0% { box-shadow: 0 0 0 6px rgba(79, 70, 229, 0.2); }
        50% { box-shadow: 0 0 0 12px rgba(79, 70, 229, 0.1); }
        100% { box-shadow: 0 0 0 6px rgba(79, 70, 229, 0.2); }
      }
    `;
    document.head.appendChild(style);

    // Cleanup function
    return () => {
      markers.forEach(marker => {
        (marker as any).setMap(null);
      });
      infoWindows.forEach(infoWindow => {
        (infoWindow as any).close();
      });
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [map, isLoaded, businesses, onMarkerClick]);

  return null;
}