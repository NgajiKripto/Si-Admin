// TODO: Tambahkan middleware autentikasi sebelum deployment
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  CalendarClock,
  Star,
  Package,
  Settings,
  Menu,
  Brain,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/follow-up", label: "Follow Up", icon: CalendarClock },
  { href: "/feedback", label: "Feedback", icon: Star },
  { href: "/stok", label: "Stok Barang", icon: Package },
  { href: "/pengetahuan", label: "Pengetahuan", icon: Brain },
  { href: "/kecerdasan", label: "Kecerdasan Agent", icon: Sparkles },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item, index) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "nav-sweep flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
              isActive
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_oklch(0.75_0.18_180_/_0.2)]"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="noise-overlay hidden w-64 md:flex md:flex-col relative overflow-hidden bg-sidebar border-r border-sidebar-border">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar via-sidebar to-[oklch(0.75_0.18_180_/_0.05)] pointer-events-none" />

        {/* Diagonal accent stripe at the boundary */}
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-primary via-accent to-primary opacity-60" />
        <div className="absolute top-16 -right-3 w-6 h-24 bg-primary/10 rotate-12 rounded-full blur-sm" />

        {/* Brand */}
        <div className="relative z-10 flex h-16 items-center px-6 gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-lg font-bold font-display tracking-tight text-sidebar-foreground">
            Si-Admin
          </h1>
        </div>

        <Separator className="opacity-30" />

        {/* Navigation */}
        <div className="relative z-10 flex-1 py-4 overflow-y-auto">
          <SidebarNav />
        </div>

        <Separator className="opacity-30" />

        {/* User section */}
        <div className="relative z-10 p-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent/50">
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">Admin</span>
              <span className="text-xs text-muted-foreground">Toko Serba Ada</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col relative">
        {/* Top Header */}
        <header className="flex h-14 items-center gap-4 border-b border-border/50 bg-card/50 backdrop-blur-md px-4 md:px-6 sticky top-0 z-30">
          {/* Mobile Menu */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
              <SheetTitle className="px-6 py-4 text-lg font-bold font-display text-sidebar-foreground">
                Si-Admin
              </SheetTitle>
              <Separator className="opacity-30" />
              <div className="py-4">
                <SidebarNav onNavigate={() => setSheetOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold font-display md:hidden text-foreground">Si-Admin</h2>
            <div className="ml-auto flex items-center gap-4">
              <Avatar className="h-8 w-8 md:hidden ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 gradient-mesh relative">
          {children}
        </main>
      </div>
    </div>
  );
}
