import { supabase } from "@/integrations/supabase/client";

const GOOGLE_MAPS_API_KEY = 'AIzaSyATgautsRC2yNJ6Ww5d6KqqxnIYDtrjJwM';

interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Function to update coordinates for existing addresses
export async function updateAddressCoordinates() {
  try {
    // Update business addresses without coordinates
    const { data: addresses } = await supabase
      .from('business_addresses')
      .select('*')
      .or('latitude.is.null,longitude.is.null');

    if (addresses) {
      for (const address of addresses) {
        const coords = await geocodeAddress(address.full_address);
        if (coords) {
          await supabase
            .from('business_addresses')
            .update({
              latitude: coords.lat,
              longitude: coords.lng
            })
            .eq('id', address.id);
        }
      }
    }

    // Update offers without coordinates
    const { data: offers } = await supabase
      .from('offers')
      .select('*')
      .or('latitude.is.null,longitude.is.null')
      .not('address', 'is', null);

    if (offers) {
      for (const offer of offers) {
        const addressToGeocode = offer.address || offer.location;
        if (addressToGeocode) {
          const coords = await geocodeAddress(addressToGeocode);
          if (coords) {
            await supabase
              .from('offers')
              .update({
                latitude: coords.lat,
                longitude: coords.lng
              })
              .eq('id', offer.id);
          }
        }
      }
    }

    console.log('Address coordinates updated successfully');
  } catch (error) {
    console.error('Error updating address coordinates:', error);
  }
}