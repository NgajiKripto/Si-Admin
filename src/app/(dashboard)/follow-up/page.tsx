"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FollowUpList from "./components/FollowUpList";
import FollowUpForm from "./components/FollowUpForm";
import FollowUpCalendar from "./components/FollowUpCalendar";

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

export default function FollowUpPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<{
    id: string;
    customerId: string;
    title: string;
    description: string;
    dueDate: string;
    priority: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all")
        params.set("status", statusFilter);

      const res = await fetch(`/api/follow-up?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data);
      }
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  async function handleSubmit(data: {
    id?: string;
    customerId: string;
    title: string;
    description: string;
    dueDate: string;
    priority: string;
  }) {
    try {
      if (data.id) {
        // Update
        await fetch(`/api/follow-up/${data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        // Create
        await fetch("/api/follow-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      fetchFollowUps();
    } catch (error) {
      console.error("Error submitting follow-up:", error);
    }
  }

  async function handleMarkDone(id: string) {
    try {
      await fetch(`/api/follow-up/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      fetchFollowUps();
    } catch (error) {
      console.error("Error marking follow-up as done:", error);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/follow-up/${id}`, {
        method: "DELETE",
      });
      fetchFollowUps();
    } catch (error) {
      console.error("Error deleting follow-up:", error);
    }
  }

  function handleEdit(followUp: FollowUp) {
    setEditData({
      id: followUp.id,
      customerId: followUp.customerId,
      title: followUp.title,
      description: followUp.description || "",
      dueDate: followUp.dueDate,
      priority: followUp.priority,
    });
    setFormOpen(true);
  }

  function handleOpenNew() {
    setEditData(null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Follow Up</h1>
          <p className="text-sm text-muted-foreground">
            Kelola tindak lanjut pelanggan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setViewMode(viewMode === "list" ? "calendar" : "list")
            }
            title={viewMode === "list" ? "Tampilan kalender" : "Tampilan daftar"}
          >
            {viewMode === "list" ? (
              <CalendarDays className="h-4 w-4" />
            ) : (
              <List className="h-4 w-4" />
            )}
          </Button>
          <Button onClick={handleOpenNew}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Follow Up
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="PENDING">Tertunda</TabsTrigger>
            <TabsTrigger value="DONE">Selesai</TabsTrigger>
            <TabsTrigger value="OVERDUE">Terlambat</TabsTrigger>
          </TabsList>
          <TabsContent value={statusFilter} className="mt-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Memuat...
              </div>
            ) : (
              <FollowUpList
                followUps={followUps}
                onMarkDone={handleMarkDone}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <FollowUpCalendar followUps={followUps} />
      )}

      <FollowUpForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        editData={editData}
      />
    </div>
  );
}
