import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Flame, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface BusinessLocation {
  id: string;
  business_name: string;
  address: string;
  latitude: number;
  longitude: number;
  business_type: string;
  total_offers: number;
  total_flames: number;
}

interface BusinessMapMarkersProps {
  onMarkerClick?: (business: BusinessLocation) => void;
  map?: google.maps.Map;
  isLoaded?: boolean;
}

export function BusinessMapMarkers({ onMarkerClick, map, isLoaded }: BusinessMapMarkersProps) {
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindows, setInfoWindows] = useState<google.maps.InfoWindow[]>([]);

  // Fetch business locations with aggregated data
  const { data: businesses = [] } = useQuery({
    queryKey: ["business-locations"],
    queryFn: async () => {
      // Fetch profiles with business information
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          business_name,
          address,
          latitude,
          longitude,
          business_type,
          account_type
        `)
        .eq('account_type', 'business')
        .not('business_name', 'is', null)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (profilesError) throw profilesError;

      // Fetch offer counts and flames for each business
      const businessData = await Promise.all(
        profiles.map(async (profile) => {
          // Count offers
          const { count: offerCount } = await supabase
            .from('offers')
            .select('*', { count: 'exact', head: true })
            .eq('business_user_id', profile.user_id)
            .eq('status', 'active');

          // Get offer IDs for this business
          const { data: offers } = await supabase
            .from('offers')
            .select('id')
            .eq('business_user_id', profile.user_id)
            .eq('status', 'active');

          const offerIds = offers?.map(o => o.id) || [];

          // Count flames for this business's offers
          let flameCount = 0;
          if (offerIds.length > 0) {
            const { count } = await supabase
              .from('flames')
              .select('*', { count: 'exact', head: true })
              .in('offer_id', offerIds);
            flameCount = count || 0;
          }

          return {
            id: profile.id,
            business_name: profile.business_name,
            address: profile.address,
            latitude: parseFloat(profile.latitude.toString()),
            longitude: parseFloat(profile.longitude.toString()),
            business_type: profile.business_type || 'Autre',
            total_offers: offerCount || 0,
            total_flames: flameCount
          };
        })
      );

      return businessData.filter(b => b.latitude && b.longitude);
    },
    enabled: isLoaded,
  });

  useEffect(() => {
    if (!map || !isLoaded || !businesses.length) return;

      // Clear existing markers
      markers.forEach(marker => (marker as any).setMap(null));
      infoWindows.forEach(infoWindow => (infoWindow as any).close());

    const newMarkers: google.maps.Marker[] = [];
    const newInfoWindows: google.maps.InfoWindow[] = [];

    businesses.forEach((business) => {
      // Check if business has special offers (promotions)
      const hasSpecialOffers = business.total_offers > 0; // You can add more complex logic here
      const markerColor = hasSpecialOffers ? "#ef4444" : "#3b82f6"; // Red for special, blue for normal
      const animationClass = hasSpecialOffers ? 'animate-pulse' : '';
      
      // Create custom marker icon
      const markerIcon = {
        url: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg" class="${animationClass}">
            <circle cx="20" cy="20" r="18" fill="${markerColor}" stroke="white" stroke-width="2"/>
            <circle cx="20" cy="20" r="12" fill="white"/>
            <text x="20" y="25" text-anchor="middle" font-size="12" fill="${markerColor}" font-weight="bold">${business.total_offers}</text>
          </svg>
        `),
        scaledSize: new (window as any).google.maps.Size(40, 40),
        anchor: new (window as any).google.maps.Point(20, 20),
      };

      const marker = new (window as any).google.maps.Marker({
        position: { lat: business.latitude, lng: business.longitude },
        map: map,
        title: business.business_name,
        icon: markerIcon,
      });

      // Create info window content
      const infoWindowContent = `
        <div style="padding: 12px; max-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">
            ${business.business_name}
          </h3>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
            📍 ${business.address}
          </p>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
              ${business.business_type}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>🔥</span>
              <span>${business.total_flames} flames</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>📋</span>
              <span>${business.total_offers} offres</span>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="window.viewBusiness('${business.id}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
              Voir l'offre
            </button>
            <button onclick="window.getDirections(${business.latitude}, ${business.longitude})" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
              Itinéraire
            </button>
          </div>
        </div>
      `;

      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: infoWindowContent,
      });

      marker.addListener('click', () => {
        // Close all other info windows
        newInfoWindows.forEach(iw => (iw as any).close());
        infoWindow.open(map, marker);
        
        if (onMarkerClick) {
          onMarkerClick(business);
        }
      });

      newMarkers.push(marker);
      newInfoWindows.push(infoWindow);
    });

    setMarkers(newMarkers);
    setInfoWindows(newInfoWindows);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        const position = (marker as any).getPosition();
        if (position) bounds.extend(position);
      });
      (map as any).fitBounds(bounds);
    }

    return () => {
      newMarkers.forEach(marker => (marker as any).setMap(null));
      newInfoWindows.forEach(infoWindow => (infoWindow as any).close());
    };
  }, [map, isLoaded, businesses, onMarkerClick]);

  return null;
}