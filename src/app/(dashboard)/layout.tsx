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
      {navItems.map((item) => {
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
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
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
      <aside className="hidden w-64 border-r bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center px-6">
          <h1 className="text-lg font-bold">Si-Admin</h1>
        </div>
        <Separator />
        <div className="flex-1 py-4">
          <SidebarNav />
        </div>
        <Separator />
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Admin</span>
              <span className="text-xs text-muted-foreground">Toko Serba Ada</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
          {/* Mobile Menu */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="px-6 py-4 text-lg font-bold">
                Si-Admin
              </SheetTitle>
              <Separator />
              <div className="py-4">
                <SidebarNav onNavigate={() => setSheetOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold md:hidden">Si-Admin</h2>
            <div className="ml-auto flex items-center gap-4">
              <Avatar className="h-8 w-8 md:hidden">
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
