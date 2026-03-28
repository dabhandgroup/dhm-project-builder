"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";

export function ConfettiTrigger() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = searchParams.get("new") === "1";

  useEffect(() => {
    if (!isNew) return;

    // Fire confetti burst
    const end = Date.now() + 800;

    function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }
    frame();

    // Clean up the URL param
    const url = new URL(window.location.href);
    url.searchParams.delete("new");
    router.replace(url.pathname, { scroll: false });
  }, [isNew, router]);

  return null;
}
