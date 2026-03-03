"use client";

import {
  ReservationInboxWidget,
  type ReservationInboxWidgetConfig,
} from "../chat-widget/reservation-inbox-widget";

type UnifiedChatInterfaceProps = {
  surface: "floating";
  domain: "reservation";
  reservationConfig: ReservationInboxWidgetConfig;
};

export function UnifiedChatInterface(props: UnifiedChatInterfaceProps) {
  return <ReservationInboxWidget config={props.reservationConfig} />;
}
