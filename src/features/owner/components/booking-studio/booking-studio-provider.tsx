"use client";

import { createContext, useContext, useRef } from "react";
import { useStore } from "zustand";
import {
  type BookingStudioState,
  type BookingStudioStoreApi,
  createBookingStudioStore,
} from "../../stores/booking-studio-store";

const BookingStudioStoreContext = createContext<BookingStudioStoreApi | null>(
  null,
);

interface BookingStudioProviderProps {
  initialDate: Date;
  children: React.ReactNode;
}

export function BookingStudioProvider({
  initialDate,
  children,
}: BookingStudioProviderProps) {
  const storeRef = useRef<BookingStudioStoreApi | undefined>(undefined);
  if (!storeRef.current) {
    storeRef.current = createBookingStudioStore(initialDate);
  }

  return (
    <BookingStudioStoreContext.Provider value={storeRef.current}>
      {children}
    </BookingStudioStoreContext.Provider>
  );
}

export function useBookingStudio<T>(selector: (s: BookingStudioState) => T): T {
  const store = useContext(BookingStudioStoreContext);
  if (!store) {
    throw new Error(
      "useBookingStudio must be used within BookingStudioProvider",
    );
  }
  return useStore(store, selector);
}
