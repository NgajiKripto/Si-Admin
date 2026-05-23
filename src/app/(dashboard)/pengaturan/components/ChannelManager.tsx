"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  MessageCircle,
  Send,
  Mail,
  Camera,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface Channel {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  config: string | null;
}

function getChannelIcon(type: string) {
  switch (type) {
    case "WhatsApp":
      return MessageCircle;
    case "Telegram":
      return Send;
    case "Email":
      return Mail;
    case "Instagram":
      return Camera;
    case "SMS":
      return MessageSquare;
    default:
      return MessageCircle;
  }
}

export default function ChannelManager() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [config, setConfig] = useState("");

  useEffect(() => {
    fetchChannels();
  }, []);

  async function fetchChannels() {
    try {
      const res = await fetch("/api/pengaturan/channels");
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !type) return;

    try {
      await fetch("/api/pengaturan/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, config }),
      });
      setName("");
      setType("");
      setConfig("");
      setFormOpen(false);
      fetchChannels();
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      await fetch(`/api/pengaturan/channels?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchChannels();
    } catch (error) {
      console.error("Error toggling channel:", error);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/pengaturan/channels?id=${id}`, { method: "DELETE" });
      fetchChannels();
    } catch (error) {
      console.error("Error deleting channel:", error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Channel Terhubung</h3>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah Channel
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {channels.map((channel) => {
          const Icon = getChannelIcon(channel.type);
          return (
            <Card key={channel.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <CardTitle className="text-sm">{channel.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={channel.isActive}
                      onCheckedChange={() =>
                        handleToggle(channel.id, channel.isActive)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDelete(channel.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{channel.type}</Badge>
                  <Badge variant={channel.isActive ? "default" : "outline"}>
                    {channel.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                {channel.config && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {channel.config}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
        {channels.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">
            Belum ada channel. Klik Tambah Channel untuk menghubungkan.
          </p>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Channel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipe Channel</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Telegram">Telegram</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nama Channel</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama channel..."
              />
            </div>
            <div className="space-y-2">
              <Label>Konfigurasi (opsional)</Label>
              <Input
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                placeholder="API key, nomor telepon, dll..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={!name || !type}>
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
