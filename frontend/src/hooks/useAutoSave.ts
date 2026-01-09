import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoSaveOptions {
  value: string;
  onSave: (value: string) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSavedAt: Date | null;
  forceSave: () => Promise<void>;
  error: Error | null;
}

/**
 * Hook personnalisé pour auto-save avec debouncing
 *
 * @param options.value - Valeur à sauvegarder
 * @param options.onSave - Fonction async de sauvegarde
 * @param options.delay - Délai en ms avant sauvegarde (défaut: 30000ms = 30s)
 * @param options.enabled - Activer/désactiver l'auto-save (défaut: true)
 * @returns État de sauvegarde et fonction pour forcer la sauvegarde
 */
export function useAutoSave({
  value,
  onSave,
  delay = 30000,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastValueRef = useRef<string>(value);
  const isMountedRef = useRef(true);

  // Fonction de sauvegarde
  const save = useCallback(async (valueToSave: string) => {
    if (!enabled) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave(valueToSave);

      if (isMountedRef.current) {
        setLastSavedAt(new Date());
        lastValueRef.current = valueToSave;
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Erreur de sauvegarde'));
      }
      console.error('Erreur auto-save:', err);
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [enabled, onSave]);

  // Force save (appel manuel)
  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await save(value);
  }, [value, save]);

  // Auto-save avec debouncing
  useEffect(() => {
    if (!enabled) return;

    // Si la valeur n'a pas changé, ne rien faire
    if (value === lastValueRef.current) return;

    // Nettoyer le timeout existant
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Créer un nouveau timeout
    timeoutRef.current = setTimeout(() => {
      save(value);
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, enabled, save]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSavedAt,
    forceSave,
    error,
  };
}
