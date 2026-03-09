"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type SearchNavigationProgressContextValue = {
  isSearchNavigationPending: boolean;
  startSearchNavigation: () => void;
  finishSearchNavigation: () => void;
};

const SearchNavigationProgressContext =
  createContext<SearchNavigationProgressContextValue | null>(null);

interface SearchNavigationProgressProviderProps {
  children: React.ReactNode;
}

export function SearchNavigationProgressProvider({
  children,
}: SearchNavigationProgressProviderProps) {
  const [isSearchNavigationPending, setIsSearchNavigationPending] =
    useState(false);

  const startSearchNavigation = useCallback(() => {
    setIsSearchNavigationPending(true);
  }, []);

  const finishSearchNavigation = useCallback(() => {
    setIsSearchNavigationPending(false);
  }, []);

  const value = useMemo(
    () => ({
      isSearchNavigationPending,
      startSearchNavigation,
      finishSearchNavigation,
    }),
    [finishSearchNavigation, isSearchNavigationPending, startSearchNavigation],
  );

  return (
    <SearchNavigationProgressContext.Provider value={value}>
      {children}
    </SearchNavigationProgressContext.Provider>
  );
}

export function useSearchNavigationProgress() {
  const context = useContext(SearchNavigationProgressContext);

  if (!context) {
    throw new Error(
      "useSearchNavigationProgress must be used within SearchNavigationProgressProvider",
    );
  }

  return context;
}
