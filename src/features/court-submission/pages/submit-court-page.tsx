"use client";

import { PageHeader } from "@/components/ui/page-header";
import { SubmitCourtForm } from "../components/submit-court-form";

export default function SubmitCourtPage() {
  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <PageHeader
        title="Submit a Court"
        description="Know a court that's not listed? Help us grow the directory by submitting it. Your submission will be reviewed before it goes live."
      />
      <SubmitCourtForm />
    </div>
  );
}
