"use client";

import { PageHeader } from "@/components/ui/page-header";
import { SubmitCourtForm } from "../components/submit-court-form";

export default function SubmitCourtPage() {
  return (
    <div className="container mx-auto max-w-2xl py-6 space-y-6">
      <PageHeader
        title="Submit a Venue"
        description="Know a venue that's not listed? Help us grow the directory by submitting it. Your submission will be reviewed before it goes live."
      />
      <SubmitCourtForm />
    </div>
  );
}
