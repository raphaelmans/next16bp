"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

interface TermsCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function TermsCheckbox({
  checked,
  onCheckedChange,
}: TermsCheckboxProps) {
  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          className="mt-1"
        />
        <div className="flex-1 text-sm">
          <label htmlFor="terms" className="cursor-pointer font-medium">
            I have read and accept the{" "}
            <Link
              href="/terms"
              target="_blank"
              className="text-primary underline"
            >
              Terms & Conditions
            </Link>{" "}
            and acknowledge that:
          </label>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>• KudosCourts does not process or verify payments</li>
            <li>• Payment disputes are between me and the court owner</li>
            <li>• KudosCourts is not liable for booking disputes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
