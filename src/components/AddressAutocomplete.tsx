import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

declare global {
  namespace google {
    namespace maps {
      namespace places {
        class AutocompleteService {
          getPlacePredictions(request: any, callback: (predictions: any[], status: any) => void): void;
        }
        class PlacesService {
          constructor(map: HTMLDivElement);
          getDetails(request: any, callback: (place: any, status: any) => void): void;
        }
        enum PlacesServiceStatus {
          OK = 'OK'
        }
      }
    }
  }
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: string, location: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ 
  value, 
  onChange, 
  onAddressSelect, 
  placeholder = "Saisissez une adresse...",
  className 
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Google Places services
    const initializeServices = async () => {
      if (typeof google === 'undefined') {
        // Load Google Maps API if not already loaded
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyATgautsRC2yNJ6Ww5d6KqqxnIYDtrjJwM&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          autocompleteService.current = new google.maps.places.AutocompleteService();
          if (mapRef.current) {
            placesService.current = new google.maps.places.PlacesService(mapRef.current);
          }
        };
        
        document.head.appendChild(script);
      } else {
        autocompleteService.current = new google.maps.places.AutocompleteService();
        if (mapRef.current) {
          placesService.current = new google.maps.places.PlacesService(mapRef.current);
        }
      }
    };

    initializeServices();
  }, []);

  const searchPlaces = async (query: string) => {
    if (!autocompleteService.current || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    const request = {
      input: query,
      componentRestrictions: { country: 'fr' }, // Restrict to France
      types: ['establishment', 'geocode']
    };

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      setIsLoading(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    searchPlaces(newValue);
  };

  const handleSuggestionClick = (suggestion: any) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    // Get place details to extract coordinates
    if (placesService.current && onAddressSelect) {
      const request = {
        placeId: suggestion.place_id,
        fields: ['geometry', 'formatted_address']
      };

      placesService.current.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          onAddressSelect(suggestion.description, location);
        }
      });
    }
  };

  return (
    <div className="relative">
      {/* Hidden div for PlacesService initialization */}
      <div ref={mapRef} style={{ display: 'none' }} />
      
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
          onFocus={() => value.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding suggestions to allow clicking
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id || index}
              className="px-4 py-3 hover:bg-accent cursor-pointer border-b border-border/50 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {suggestion.structured_formatting?.secondary_text || ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-4">
          <p className="text-sm text-muted-foreground text-center">Recherche en cours...</p>
        </div>
      )}
    </div>
  );
}