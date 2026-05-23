"use client";

import { useState, useEffect } from "react";
import { Search, MessageSquare, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  customerId: string;
  channelId: string;
  status: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  channelRef: {
    id: string;
    name: string;
    type: string;
  };
}

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ConversationList({
  selectedId,
  onSelect,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, [search, channelFilter]);

  async function fetchConversations() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (channelFilter && channelFilter !== "all")
        params.set("channel", channelFilter);

      const res = await fetch(`/api/chat?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateStr: string | null) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Baru saja";
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Kemarin";
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }

  // Get unique channels from conversations
  const channels = Array.from(
    new Map(
      conversations.map((c) => [c.channelRef.id, c.channelRef])
    ).values()
  );

  return (
    <div className="flex h-full flex-col border-r">
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari percakapan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Semua Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Channel</SelectItem>
            {channels.map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                {channel.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Memuat...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Tidak ada percakapan
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "w-full rounded-lg p-3 text-left transition-colors hover:bg-accent",
                  selectedId === conv.id && "bg-accent"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {conv.customer.name}
                      </span>
                      <span className="flex items-center text-xs text-muted-foreground">
                        {conv.channelRef.type === "WHATSAPP" ? (
                          <MessageSquare className="h-3 w-3" />
                        ) : (
                          <Hash className="h-3 w-3" />
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conv.lastMessage || "Belum ada pesan"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                    {conv.unreadCount > 0 && (
                      <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
