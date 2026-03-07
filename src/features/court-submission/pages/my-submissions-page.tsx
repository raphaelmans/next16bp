"use client";

import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { MySubmissionsList } from "../components/my-submissions-list";

export default function MySubmissionsPage() {
  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <PageHeader
        title="My Submissions"
        description="Courts you've submitted for review."
        actions={
          <Button asChild>
            <Link href={appRoutes.submitCourt.base}>Submit a Court</Link>
          </Button>
        }
      />
      <MySubmissionsList />
    </div>
  );
}
