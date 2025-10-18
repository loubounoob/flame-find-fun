import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from './useGeolocation';

// Reverse geocoding to get country from coordinates
async function getCountryFromCoords(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'Ludigo App',
        },
      }
    );
    const data = await response.json();
    return data.address?.country_code || null;
  } catch (error) {
    console.error('Error fetching country from coordinates:', error);
    return null;
  }
}

export function useLanguage() {
  const { i18n } = useTranslation();
  const { position } = useGeolocation();

  useEffect(() => {
    // If language already set in localStorage, use it
    const savedLanguage = localStorage.getItem('userLanguage');
    if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
      if (i18n.language !== savedLanguage) {
        i18n.changeLanguage(savedLanguage);
      }
      return;
    }

    // Detect language based on geolocation
    if (position) {
      getCountryFromCoords(position.lat, position.lng).then((countryCode) => {
        const detectedLanguage = countryCode === 'fr' ? 'fr' : 'en';
        
        // Only change if different from current language
        if (i18n.language !== detectedLanguage) {
          i18n.changeLanguage(detectedLanguage);
          localStorage.setItem('userLanguage', detectedLanguage);
        }
      });
    } else {
      // Fallback to browser language detection
      const browserLang = navigator.language.toLowerCase();
      const detectedLanguage = browserLang.startsWith('fr') ? 'fr' : 'en';
      
      if (i18n.language !== detectedLanguage) {
        i18n.changeLanguage(detectedLanguage);
        localStorage.setItem('userLanguage', detectedLanguage);
      }
    }
  }, [position, i18n]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('userLanguage', lang);
  };

  return {
    language: i18n.language,
    changeLanguage,
  };
}
