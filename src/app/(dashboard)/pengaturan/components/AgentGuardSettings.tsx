"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface AgentGuardConfig {
  id: string;
  isEnabled: boolean;
  maxResponseLength: number;
  maxResponseTokens: number;
  allowedTopics: string;
  blockedPatterns: string;
  blockedOutputPatterns: string;
  responseFormat: string;
  systemPromptHash: string | null;
}

export default function AgentGuardSettings() {
  const [config, setConfig] = useState<AgentGuardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable state
  const [isEnabled, setIsEnabled] = useState(true);
  const [maxResponseLength, setMaxResponseLength] = useState(500);
  const [maxResponseTokens, setMaxResponseTokens] = useState(200);
  const [allowedTopics, setAllowedTopics] = useState<string[]>([]);
  const [blockedPatterns, setBlockedPatterns] = useState<string[]>([]);
  const [blockedOutputPatterns, setBlockedOutputPatterns] = useState<string[]>(
    []
  );
  const [responseFormat, setResponseFormat] = useState("text");

  // Input fields for adding new items
  const [newTopic, setNewTopic] = useState("");
  const [newBlockedPattern, setNewBlockedPattern] = useState("");
  const [newBlockedOutputPattern, setNewBlockedOutputPattern] = useState("");

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/pengaturan/agent-guard");
        if (res.ok) {
          const data: AgentGuardConfig = await res.json();
          setConfig(data);
          setIsEnabled(data.isEnabled);
          setMaxResponseLength(data.maxResponseLength);
          setMaxResponseTokens(data.maxResponseTokens);
          setAllowedTopics(JSON.parse(data.allowedTopics));
          setBlockedPatterns(JSON.parse(data.blockedPatterns));
          setBlockedOutputPatterns(JSON.parse(data.blockedOutputPatterns));
          setResponseFormat(data.responseFormat);
        }
      } catch (error) {
        console.error("Error fetching guard config:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/pengaturan/agent-guard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled,
          maxResponseLength,
          maxResponseTokens,
          allowedTopics: JSON.stringify(allowedTopics),
          blockedPatterns: JSON.stringify(blockedPatterns),
          blockedOutputPatterns: JSON.stringify(blockedOutputPatterns),
          responseFormat,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        const errData = await res.json().catch(() => null);
        const message = errData?.error || "Gagal menyimpan konfigurasi";
        setError(message);
      }
    } catch (err) {
      console.error("Error saving guard config:", err);
      setError("Gagal menyimpan konfigurasi. Periksa koneksi Anda.");
    } finally {
      setSaving(false);
    }
  }

  function addTopic() {
    const trimmed = newTopic.trim().toLowerCase();
    if (trimmed && !allowedTopics.includes(trimmed)) {
      setAllowedTopics([...allowedTopics, trimmed]);
      setNewTopic("");
    }
  }

  function removeTopic(topic: string) {
    setAllowedTopics(allowedTopics.filter((t) => t !== topic));
  }

  function addBlockedPattern() {
    const trimmed = newBlockedPattern.trim();
    if (trimmed && !blockedPatterns.includes(trimmed)) {
      setBlockedPatterns([...blockedPatterns, trimmed]);
      setNewBlockedPattern("");
    }
  }

  function removeBlockedPattern(pattern: string) {
    setBlockedPatterns(blockedPatterns.filter((p) => p !== pattern));
  }

  function addBlockedOutputPattern() {
    const trimmed = newBlockedOutputPattern.trim();
    if (trimmed && !blockedOutputPatterns.includes(trimmed)) {
      setBlockedOutputPatterns([...blockedOutputPatterns, trimmed]);
      setNewBlockedOutputPattern("");
    }
  }

  function removeBlockedOutputPattern(pattern: string) {
    setBlockedOutputPatterns(blockedOutputPatterns.filter((p) => p !== pattern));
  }

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Memuat konfigurasi...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enable/Disable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktifkan Guard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Aktifkan atau nonaktifkan seluruh sistem keamanan agent.
          </p>
        </CardContent>
      </Card>

      {/* Response Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Batas Respons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Batas Panjang Respons (karakter)</Label>
              <Input
                type="number"
                value={maxResponseLength}
                onChange={(e) =>
                  setMaxResponseLength(parseInt(e.target.value) || 0)
                }
                min={50}
                max={5000}
              />
            </div>
            <div className="space-y-2">
              <Label>Batas Token Respons</Label>
              <Input
                type="number"
                value={maxResponseTokens}
                onChange={(e) =>
                  setMaxResponseTokens(parseInt(e.target.value) || 0)
                }
                min={10}
                max={2000}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allowed Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Topik Diizinkan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {allowedTopics.map((topic) => (
              <Badge key={topic} variant="secondary" className="gap-1">
                {topic}
                <button
                  onClick={() => removeTopic(topic)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Tambah topik baru..."
              onKeyDown={(e) => e.key === "Enter" && addTopic()}
            />
            <Button type="button" variant="outline" onClick={addTopic}>
              Tambah
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Input Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pola Input Diblokir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Pola teks yang akan diblokir pada input pengguna (mendukung regex).
          </p>
          <div className="flex flex-wrap gap-2">
            {blockedPatterns.map((pattern) => (
              <Badge key={pattern} variant="destructive" className="gap-1">
                {pattern}
                <button
                  onClick={() => removeBlockedPattern(pattern)}
                  className="ml-1 hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newBlockedPattern}
              onChange={(e) => setNewBlockedPattern(e.target.value)}
              placeholder="Tambah pola diblokir..."
              onKeyDown={(e) => e.key === "Enter" && addBlockedPattern()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addBlockedPattern}
            >
              Tambah
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Output Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pola Output Diblokir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Pola teks yang akan disunting dari output agent.
          </p>
          <div className="flex flex-wrap gap-2">
            {blockedOutputPatterns.map((pattern) => (
              <Badge key={pattern} variant="destructive" className="gap-1">
                {pattern}
                <button
                  onClick={() => removeBlockedOutputPattern(pattern)}
                  className="ml-1 hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newBlockedOutputPattern}
              onChange={(e) => setNewBlockedOutputPattern(e.target.value)}
              placeholder="Tambah pola output diblokir..."
              onKeyDown={(e) => e.key === "Enter" && addBlockedOutputPattern()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addBlockedOutputPattern}
            >
              Tambah
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Response Format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Format Respons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Format Output</Label>
            <Select value={responseFormat} onValueChange={setResponseFormat}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Teks Biasa</SelectItem>
                <SelectItem value="structured">Terstruktur (JSON)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  );
}
