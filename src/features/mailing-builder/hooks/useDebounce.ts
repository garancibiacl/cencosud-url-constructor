import { useEffect, useState } from "react";

/**
 * Retrasa la propagación de `value` hasta que hayan transcurrido `delay` ms
 * desde el último cambio. Evita operaciones costosas (ej: renderizado HTML del
 * mailing) en cada pulsación de tecla del inspector.
 *
 * @example
 *   const debouncedDoc = useDebounce(document, 400);
 *   const html = useMemo(() => renderMailingHtml(debouncedDoc), [debouncedDoc]);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
