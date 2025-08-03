import { useState, useEffect } from 'react';

interface GeolocationPosition {
  lat: number;
  lng: number;
}

interface GeolocationState {
  position: GeolocationPosition | null;
  isLoading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    isLoading: false,
    error: null,
  });

  const getCurrentPosition = () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'La géolocalisation n\'est pas supportée par ce navigateur.',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          position: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          isLoading: false,
          error: null,
        });
      },
      (error) => {
        let errorMessage = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'L\'accès à la géolocalisation a été refusé.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Les informations de localisation ne sont pas disponibles.';
            break;
          case error.TIMEOUT:
            errorMessage = 'La demande de géolocalisation a expiré.';
            break;
          default:
            errorMessage = 'Une erreur inconnue s\'est produite.';
            break;
        }
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000, // 1 minute
      }
    );
  };

  useEffect(() => {
    // Récupérer automatiquement la position au premier chargement
    getCurrentPosition();
  }, []);

  return {
    ...state,
    getCurrentPosition,
  };
}