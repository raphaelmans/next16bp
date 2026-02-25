import { assign, setup } from "xstate";
import {
  computeAddItem,
  computeRemoveItem,
  computeSportFilter,
  computeValidationError,
} from "./booking-cart-machine.actions";
import {
  canAddItem,
  willBeEmptyAfterRemove,
  willBeEmptyAfterSportChange,
} from "./booking-cart-machine.guards";
import type {
  BookingCartContext,
  BookingCartEvent,
  BookingCartInput,
  BookingCartItem,
} from "./booking-cart-machine.types";

const DEFAULT_MAX_ITEMS = 12;

export const bookingCartMachine = setup({
  types: {
    context: {} as BookingCartContext,
    events: {} as BookingCartEvent,
    input: {} as BookingCartInput,
  },
  guards: {
    canAddItem: ({ context, event }) => canAddItem({ context, event }),
    willBeEmptyAfterRemove: ({ context, event }) =>
      willBeEmptyAfterRemove({ context, event }),
    willBeEmptyAfterSportChange: ({ context, event }) =>
      willBeEmptyAfterSportChange({ context, event }),
  },
  actions: {
    appendItem: assign(({ context, event }) => {
      if (event.type !== "ADD_ITEM") return {};
      return {
        items: computeAddItem(context.items, event.item),
        lastValidationError: null,
      };
    }),

    rejectItem: assign(({ context, event }) => {
      if (event.type !== "ADD_ITEM") return {};
      return {
        lastValidationError: computeValidationError(context, event),
      };
    }),

    removeItem: assign(({ context, event }) => {
      if (event.type !== "REMOVE_ITEM") return {};
      return {
        items: computeRemoveItem(context.items, event.key),
        lastValidationError: null,
      };
    }),

    clearCart: assign(() => ({
      items: [] as BookingCartItem[],
      lastValidationError: null,
    })),

    filterBySport: assign(({ context, event }) => {
      if (event.type !== "SPORT_CHANGED") return {};
      return {
        items: computeSportFilter(context.items, event.sportId),
        lastValidationError: null,
      };
    }),
  },
}).createMachine({
  id: "bookingCart",
  context: ({ input }) => ({
    items: [] as BookingCartItem[],
    maxItems: input.maxItems ?? DEFAULT_MAX_ITEMS,
    placeTimeZone: input.placeTimeZone,
    lastValidationError: null,
  }),
  initial: "empty",
  states: {
    empty: {
      on: {
        ADD_ITEM: [
          {
            guard: "canAddItem",
            actions: "appendItem",
            target: "hasItems",
          },
          {
            actions: "rejectItem",
          },
        ],
      },
    },
    hasItems: {
      on: {
        ADD_ITEM: [
          {
            guard: "canAddItem",
            actions: "appendItem",
          },
          {
            actions: "rejectItem",
          },
        ],
        REMOVE_ITEM: [
          {
            guard: "willBeEmptyAfterRemove",
            actions: "removeItem",
            target: "empty",
          },
          {
            actions: "removeItem",
          },
        ],
        CLEAR_CART: {
          actions: "clearCart",
          target: "empty",
        },
        SPORT_CHANGED: [
          {
            guard: "willBeEmptyAfterSportChange",
            actions: "filterBySport",
            target: "empty",
          },
          {
            actions: "filterBySport",
          },
        ],
        REQUEST_CHECKOUT: {
          target: "checkout",
        },
      },
    },
    checkout: {
      on: {
        CANCEL_CHECKOUT: {
          target: "hasItems",
        },
      },
    },
  },
});

export type { BookingCartContext, BookingCartEvent, BookingCartInput };
