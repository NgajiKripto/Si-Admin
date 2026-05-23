"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MemoryPanel from "./components/MemoryPanel";
import LearningPanel from "./components/LearningPanel";
import KnowledgeGraphPanel from "./components/KnowledgeGraphPanel";
import HybridSearchPanel from "./components/HybridSearchPanel";
import HealthDashboard from "./components/HealthDashboard";

export default function KecerdasanPage() {
  const [activeTab, setActiveTab] = useState("memori");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kecerdasan Agent</h1>
        <p className="text-sm text-muted-foreground">
          Monitor dan kelola sistem kecerdasan agent
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="memori">Memori</TabsTrigger>
          <TabsTrigger value="pembelajaran">Pembelajaran</TabsTrigger>
          <TabsTrigger value="graf">Graf Pengetahuan</TabsTrigger>
          <TabsTrigger value="pencarian">Pencarian</TabsTrigger>
          <TabsTrigger value="kesehatan">Kesehatan</TabsTrigger>
        </TabsList>

        <TabsContent value="memori" className="mt-4">
          <MemoryPanel />
        </TabsContent>

        <TabsContent value="pembelajaran" className="mt-4">
          <LearningPanel />
        </TabsContent>

        <TabsContent value="graf" className="mt-4">
          <KnowledgeGraphPanel />
        </TabsContent>

        <TabsContent value="pencarian" className="mt-4">
          <HybridSearchPanel />
        </TabsContent>

        <TabsContent value="kesehatan" className="mt-4">
          <HealthDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
