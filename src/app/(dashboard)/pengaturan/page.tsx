"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BusinessProfileForm from "./components/BusinessProfileForm";
import ChannelManager from "./components/ChannelManager";
import CategoryManager from "./components/CategoryManager";
import AgentGuardSettings from "./components/AgentGuardSettings";

export default function PengaturanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Kelola profil bisnis, channel, dan kustomisasi
        </p>
      </div>

      <Tabs defaultValue="profil">
        <TabsList>
          <TabsTrigger value="profil">Profil Bisnis</TabsTrigger>
          <TabsTrigger value="channel">Channel</TabsTrigger>
          <TabsTrigger value="kustomisasi">Kustomisasi</TabsTrigger>
          <TabsTrigger value="keamanan">Keamanan Agent</TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="mt-4">
          <BusinessProfileForm />
        </TabsContent>

        <TabsContent value="channel" className="mt-4">
          <ChannelManager />
        </TabsContent>

        <TabsContent value="kustomisasi" className="mt-4">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="keamanan" className="mt-4">
          <AgentGuardSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
