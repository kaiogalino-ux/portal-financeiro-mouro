'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Modo apresentação: liga Fullscreen API quando disponível e sempre aplica
 * o layout de apresentação via ?presentation=1 (funciona mesmo se o
 * navegador bloquear fullscreen — ex.: alguns browsers de TV/kiosk).
 */
export function usePresentationMode() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get('presentation') === '1';
  const [fullscreenSupported] = useState(
    () => typeof document !== 'undefined' && !!document.documentElement.requestFullscreen,
  );

  const setActive = useCallback(
    async (next: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set('presentation', '1');
      else params.delete('presentation');
      router.replace(`?${params.toString()}`, { scroll: false });

      if (fullscreenSupported) {
        try {
          if (next) await document.documentElement.requestFullscreen();
          else if (document.fullscreenElement) await document.exitFullscreen();
        } catch {
          // Fullscreen bloqueado pelo navegador — o layout ?presentation=1 já cobre o essencial.
        }
      }
    },
    [fullscreenSupported, router, searchParams],
  );

  return { active, toggle: () => setActive(!active), fullscreenSupported };
}
