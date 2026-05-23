"use client";

import { CheckCircle, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FollowUp {
  id: string;
  customerId: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: string;
  priority: string;
  customer: {
    id: string;
    name: string;
  };
}

interface FollowUpListProps {
  followUps: FollowUp[];
  onMarkDone: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (followUp: FollowUp) => void;
}

export default function FollowUpList({
  followUps,
  onMarkDone,
  onDelete,
  onEdit,
}: FollowUpListProps) {
  function getStatusColor(status: string) {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "DONE":
        return "bg-green-100 text-green-800 border-green-200";
      case "OVERDUE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

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

  function getPriorityLabel(priority: string) {
    switch (priority) {
      case "HIGH":
        return "Tinggi";
      case "MEDIUM":
        return "Sedang";
      case "LOW":
        return "Rendah";
      default:
        return priority;
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "secondary";
      case "LOW":
        return "outline";
      default:
        return "secondary";
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (followUps.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Tidak ada follow up ditemukan</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {followUps.map((followUp) => (
        <Card
          key={followUp.id}
          className={cn(
            "transition-all hover:shadow-md",
            followUp.status === "OVERDUE" && "border-red-200",
            followUp.status === "DONE" && "border-green-200 opacity-75"
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm font-medium leading-tight">
                {followUp.title}
              </CardTitle>
              <Badge
                variant={
                  getPriorityColor(followUp.priority) as
                    | "default"
                    | "destructive"
                    | "secondary"
                    | "outline"
                }
                className="text-[10px] shrink-0"
              >
                {getPriorityLabel(followUp.priority)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Pelanggan: {followUp.customer.name}
              </p>
              {followUp.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {followUp.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Tenggat: {formatDate(followUp.dueDate)}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border",
                  getStatusColor(followUp.status)
                )}
              >
                {getStatusLabel(followUp.status)}
              </span>

              <div className="flex items-center gap-1">
                {followUp.status !== "DONE" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onMarkDone(followUp.id)}
                    title="Tandai selesai"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(followUp)}
                  title="Edit"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDelete(followUp.id)}
                  title="Hapus"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
