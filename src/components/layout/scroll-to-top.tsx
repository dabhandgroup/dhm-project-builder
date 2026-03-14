"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ScrollToTop() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Scroll the main content area to top on route change
    const main = document.querySelector("main");
    if (main) {
      main.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
