"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FollowUp {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
  customer: {
    id: string;
    name: string;
  };
}

interface FollowUpCalendarProps {
  followUps: FollowUp[];
}

export default function FollowUpCalendar({ followUps }: FollowUpCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  // Get dates that have follow-ups
  const followUpDates = followUps.reduce(
    (acc, fu) => {
      const dateKey = new Date(fu.dueDate).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(fu);
      return acc;
    },
    {} as Record<string, FollowUp[]>
  );

  const selectedDateStr = selectedDate?.toDateString() || "";
  const selectedFollowUps = followUpDates[selectedDateStr] || [];

  // Create modifier dates for calendar
  const datesWithFollowUps = Object.keys(followUpDates).map(
    (d) => new Date(d)
  );

  function getStatusLabel(status: string) {
    switch (status) {
      case "PENDING":
        return "Tertunda";
      case "DONE":
        return "Selesai";
      case "OVERDUE":
        return "Terlambat";
      default:
        return status;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "DONE":
        return "bg-green-100 text-green-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Kalender</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{ hasFollowUp: datesWithFollowUps }}
            modifiersClassNames={{
              hasFollowUp:
                "bg-primary/10 font-bold text-primary",
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Follow Up{" "}
            {selectedDate
              ? selectedDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedFollowUps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tidak ada follow up pada tanggal ini
            </p>
          ) : (
            <div className="space-y-3">
              {selectedFollowUps.map((fu) => (
                <div
                  key={fu.id}
                  className="flex items-start justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{fu.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {fu.customer.name}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-[10px] border-0",
                      getStatusColor(fu.status)
                    )}
                  >
                    {getStatusLabel(fu.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
