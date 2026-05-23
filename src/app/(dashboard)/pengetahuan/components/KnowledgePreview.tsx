"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Match {
  id: string;
  title: string;
  category: string;
  relevance: number;
}

export default function KnowledgePreview() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [tested, setTested] = useState(false);

  async function handleTest() {
    if (!question.trim()) return;

    setLoading(true);
    setTested(false);
    try {
      const res = await fetch("/api/knowledge/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer);
        setMatches(data.matches);
        setTested(true);
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menguji");
      }
    } catch (error) {
      console.error("Error testing:", error);
      alert("Gagal menguji pengetahuan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Uji Respons Agent</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ketik pertanyaan pelanggan untuk menguji..."
            rows={3}
          />
          <Button
            onClick={handleTest}
            disabled={!question.trim() || loading}
            className="w-full sm:w-auto"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? "Menguji..." : "Test"}
          </Button>
        </div>

        {tested && (
          <>
            <Separator />
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-1">Respons Agent:</h4>
                <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap">
                  {answer}
                </div>
              </div>

              {matches.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Entri yang Cocok ({matches.length}):
                  </h4>
                  <div className="space-y-2">
                    {matches.map((match) => (
                      <div
                        key={match.id}
                        className="flex items-center justify-between border rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{match.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {match.category}
                          </Badge>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Relevansi: {match.relevance}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
