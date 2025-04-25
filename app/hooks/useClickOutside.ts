import { useEffect, RefObject } from 'react';

/**
 * Hook pour détecter les clics en dehors d'un élément référencé
 * @param ref Référence à l'élément DOM à surveiller
 * @param callback Fonction à exécuter lorsqu'un clic est détecté en dehors de l'élément
 */
function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  callback: () => void
): void {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    // Ajouter l'écouteur d'événement à document
    document.addEventListener('mousedown', handleClickOutside);
    
    // Nettoyer l'écouteur d'événement
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
}

export default useClickOutside; 