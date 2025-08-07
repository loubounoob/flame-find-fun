import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // Don't save settings route as previous route
    if (!location.pathname.includes('/settings')) {
      sessionStorage.setItem('previousRoute', location.pathname);
    }
  }, [location.pathname]);

  return null;
}