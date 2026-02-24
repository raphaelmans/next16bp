"use client";

import { create } from "zustand";

const MAX_CART_ITEMS = 12;

export type BookingCartItem = {
  key: string; // `${courtId}|${startTime}|${durationMinutes}`
  courtId: string;
  courtLabel: string;
  sportId: string;
  startTime: string; // ISO
  durationMinutes: number;
  estimatedPriceCents: number | null;
  currency: string;
};

type BookingCartState = {
  items: BookingCartItem[];
  addItem: (item: BookingCartItem) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  clearForSportChange: (newSportId: string) => void;
};

export const useBookingCartStore = create<BookingCartState>()((set) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      if (state.items.length >= MAX_CART_ITEMS) return state;
      if (state.items.some((i) => i.key === item.key)) return state;
      return { items: [...state.items, item] };
    }),

  removeItem: (key) =>
    set((state) => ({
      items: state.items.filter((i) => i.key !== key),
    })),

  clearCart: () => set({ items: [] }),

  clearForSportChange: (newSportId) =>
    set((state) => ({
      items: state.items.filter((i) => i.sportId === newSportId),
    })),
}));
