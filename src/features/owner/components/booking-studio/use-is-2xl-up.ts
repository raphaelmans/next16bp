"use client";

import * as React from "react";

export function useIs2xlUp() {
  const [is2xlUp, setIs2xlUp] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1536px)").matches;
  });

  React.useEffect(() => {
    const mql = window.matchMedia("(min-width: 1536px)");
    const onChange = () => setIs2xlUp(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return is2xlUp;
}
