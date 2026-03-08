import type { Metadata } from "next";
import { SavedVenuesPage } from "@/features/discovery/pages/saved-venues-page";

export const metadata: Metadata = {
  title: "Saved Venues",
  description: "View your saved venues",
};

export default function SavedVenuesRoute() {
  return <SavedVenuesPage />;
}
