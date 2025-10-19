import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGeolocation } from './useGeolocation';

// Faster reverse geocoding using BigDataCloud API
async function getCountryFromCoords(lat: number, lng: number): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    const data = await response.json();
    const countryCode = data.countryCode?.toLowerCase();
    
    console.log('[Language Detection] Geocoding result:', {
      lat,
      lng,
      countryCode,
      countryName: data.countryName
    });
    
    return countryCode || null;
  } catch (error) {
    console.error('[Language Detection] Geocoding error:', error);
    return null;
  }
}

export function useLanguage() {
  const { i18n } = useTranslation();
  const { position, isLoading } = useGeolocation();
  const [hasDetected, setHasDetected] = useState(false);

  useEffect(() => {
    const detectLanguage = async () => {
      const savedLanguage = localStorage.getItem('userLanguage');
      const languageSource = localStorage.getItem('languageSource');

      console.log('[Language Detection] Starting detection:', {
        savedLanguage,
        languageSource,
        hasPosition: !!position,
        isLoading,
        browserLang: navigator.language
      });

      // If manually selected by user, respect it and don't auto-detect
      if (savedLanguage && languageSource === 'manual') {
        console.log('[Language Detection] Using manual selection:', savedLanguage);
        if (i18n.language !== savedLanguage) {
          i18n.changeLanguage(savedLanguage);
        }
        setHasDetected(true);
        return;
      }

      // Use browser language immediately while waiting for geolocation
      const browserLang = navigator.language.toLowerCase();
      const browserDetectedLang = browserLang.startsWith('fr') ? 'fr' : 'en';
      
      if (!position && !isLoading && !hasDetected) {
        // Geolocation failed or denied - use browser language
        console.log('[Language Detection] No geolocation, using browser:', browserDetectedLang);
        if (i18n.language !== browserDetectedLang) {
          i18n.changeLanguage(browserDetectedLang);
        }
        localStorage.setItem('userLanguage', browserDetectedLang);
        localStorage.setItem('languageSource', 'auto');
        setHasDetected(true);
        return;
      }

      // If we have geolocation, use it (priority over browser)
      if (position && !hasDetected) {
        const countryCode = await getCountryFromCoords(position.lat, position.lng);
        const detectedLanguage = countryCode === 'fr' ? 'fr' : 'en';
        
        console.log('[Language Detection] Using geolocation:', {
          countryCode,
          detectedLanguage
        });
        
        if (i18n.language !== detectedLanguage) {
          i18n.changeLanguage(detectedLanguage);
        }
        localStorage.setItem('userLanguage', detectedLanguage);
        localStorage.setItem('languageSource', 'auto');
        setHasDetected(true);
      }
    };

    detectLanguage();
  }, [position, isLoading, i18n, hasDetected]);

  const changeLanguage = (lang: string, source: 'manual' | 'auto' = 'manual') => {
    console.log('[Language Detection] Manual change:', { lang, source });
    i18n.changeLanguage(lang);
    localStorage.setItem('userLanguage', lang);
    localStorage.setItem('languageSource', source);
  };

  const resetLanguageDetection = () => {
    localStorage.removeItem('userLanguage');
    localStorage.removeItem('languageSource');
    setHasDetected(false);
    window.location.reload();
  };

  return {
    language: i18n.language,
    changeLanguage,
    resetLanguageDetection,
  };
}
