"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KnowledgeList from "./components/KnowledgeList";
import KnowledgePreview from "./components/KnowledgePreview";
import KnowledgeStats from "./components/KnowledgeStats";
import BulkImport from "./components/BulkImport";

const TABS = [
  { value: "all", label: "Semua", category: undefined },
  { value: "chat_history", label: "Riwayat Chat", category: "CHAT_HISTORY" },
  { value: "faq", label: "FAQ", category: "FAQ" },
  { value: "product_info", label: "Info Produk", category: "PRODUCT_INFO" },
  { value: "sop", label: "SOP", category: "SOP" },
  { value: "response_template", label: "Template Respons", category: "RESPONSE_TEMPLATE" },
  { value: "tone_guideline", label: "Panduan Nada", category: "TONE_GUIDELINE" },
];

export default function PengetahuanPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const activeCategory = TABS.find((t) => t.value === activeTab)?.category;

  function handleRefresh() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Basis Pengetahuan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data pelatihan dan pengetahuan agent
          </p>
        </div>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Impor Massal
        </Button>
      </div>

      <KnowledgeStats key={`stats-${refreshKey}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-4">
                <KnowledgeList
                  key={`${tab.value}-${refreshKey}`}
                  category={tab.category}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div>
          <KnowledgePreview />
        </div>
      </div>

      <BulkImport
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
