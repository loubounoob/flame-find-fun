import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
        error: t('errors.geolocationNotSupported'),
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
            errorMessage = t('errors.geolocationDenied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('errors.geolocationUnavailable');
            break;
          case error.TIMEOUT:
            errorMessage = t('errors.geolocationTimeout');
            break;
          default:
            errorMessage = t('errors.geolocationUnknown');
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