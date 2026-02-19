import "stream-chat";

declare module "stream-chat" {
  interface CustomChannelData {
    reservation_id?: string;
    claim_request_id?: string;
    place_verification_request_id?: string;
    open_play_id?: string;
    place_id?: string;
  }
}
