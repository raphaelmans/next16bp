"use client";

import { createContext, useContext } from "react";
import type { FormLayout } from "./types";

interface StandardFormContextValue {
  layout: FormLayout;
}

const StandardFormContext = createContext<StandardFormContextValue>({
  layout: "vertical",
});

const useStandardFormContext = () => useContext(StandardFormContext);

export { StandardFormContext, useStandardFormContext };
