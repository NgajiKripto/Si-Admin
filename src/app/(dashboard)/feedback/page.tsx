"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import FeedbackForm from "./components/FeedbackForm";
import FeedbackTemplates from "./components/FeedbackTemplates";

interface Feedback {
  id: string;
  customerId: string;
  content: string;
  rating: number;
  sentAt: string;
  customer: {
    id: string;
    name: string;
  };
  conversation?: {
    channelRef?: {
      name: string;
      type: string;
    };
  } | null;
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [templateContent, setTemplateContent] = useState("");

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (ratingFilter) params.set("rating", ratingFilter.toString());

      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  }, [ratingFilter]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  async function handleSubmit(data: {
    customerId: string;
    content: string;
    rating: number;
    conversationId?: string;
    templateUsed?: string;
  }) {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      fetchFeedbacks();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  }

  function handleSelectTemplate(content: string) {
    setTemplateContent(content);
    setFormOpen(true);
  }

  function renderStars(rating: number) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feedback</h1>
          <p className="text-sm text-muted-foreground">
            Kelola feedback pelanggan
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Kirim Feedback
        </Button>
      </div>

      {/* Rating Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filter Rating:</span>
        <Button
          variant={ratingFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setRatingFilter(null)}
        >
          Semua
        </Button>
        {[5, 4, 3, 2, 1].map((r) => (
          <Button
            key={r}
            variant={ratingFilter === r ? "default" : "outline"}
            size="sm"
            onClick={() => setRatingFilter(r)}
          >
            {r} <Star className="h-3 w-3 ml-1 fill-current" />
          </Button>
        ))}
      </div>

      {/* Feedback History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat...
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada feedback
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Isi Feedback</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell className="font-medium">
                      {feedback.customer.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {feedback.content}
                    </TableCell>
                    <TableCell>{renderStars(feedback.rating)}</TableCell>
                    <TableCell>
                      {feedback.conversation?.channelRef ? (
                        <Badge variant="secondary">
                          {feedback.conversation.channelRef.type}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(feedback.sentAt).toLocaleDateString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Templates Section */}
      <FeedbackTemplates onSelectTemplate={handleSelectTemplate} />

      <FeedbackForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        templateContent={templateContent}
      />
    </div>
  );
}
