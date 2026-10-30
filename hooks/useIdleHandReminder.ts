"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shows a reminder once no hand has been in frame for `timeoutMs`. Hides
 * the moment a hand reappears; disabled (and reset) while `enabled` is false.
 */
export function useIdleHandReminder(enabled: boolean, timeoutMs: number) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  const onHandPresenceChange = useCallback(
    (present: boolean) => {
      if (present) {
        dismiss();
        return;
      }
      if (!enabled || timerRef.current) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setVisible(true);
      }, timeoutMs);
    },
    [dismiss, enabled, timeoutMs]
  );

  useEffect(() => {
    if (!enabled) dismiss();
  }, [enabled, dismiss]);

  useEffect(() => clearTimer, [clearTimer]);

  return { visible, dismiss, onHandPresenceChange };
}
