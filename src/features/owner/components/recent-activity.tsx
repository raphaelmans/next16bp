"use client";

import {
  Ban,
  CalendarPlus,
  CheckCircle,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { formatRelative } from "@/common/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ActivityType = "booking" | "payment" | "blocked" | "confirmed";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: Date | string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const activityConfig: Record<
  ActivityType,
  { icon: LucideIcon; iconClassName: string }
> = {
  booking: {
    icon: CalendarPlus,
    iconClassName: "text-primary bg-primary/10",
  },
  payment: {
    icon: CreditCard,
    iconClassName: "text-success bg-success/10",
  },
  blocked: {
    icon: Ban,
    iconClassName: "text-muted-foreground bg-muted",
  },
  confirmed: {
    icon: CheckCircle,
    iconClassName: "text-success bg-success/10",
  },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {activities.map((activity, index) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;

          return (
            <div
              key={activity.id}
              className={`flex items-start gap-3 py-3 ${
                index !== activities.length - 1 ? "border-b" : ""
              }`}
            >
              <div
                className={`mt-0.5 rounded-full p-1.5 ${config.iconClassName}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium">{activity.title}</p>
                {activity.description && (
                  <p className="text-xs text-muted-foreground break-words">
                    {activity.description}
                  </p>
                )}
              </div>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {formatRelative(activity.timestamp)}
              </time>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
