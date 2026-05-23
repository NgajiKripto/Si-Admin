import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CalendarClock, Package, Star } from "lucide-react";


export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [
    activeConversations,
    pendingFollowUps,
    lowStockItems,
    feedbackCount,
    recentConversations,
    overdueFollowUps,
  ] = await Promise.all([
    prisma.conversation.count({ where: { status: "ACTIVE" } }),
    prisma.followUp.count({ where: { status: "PENDING" } }),
    prisma.$queryRaw<{ count: number }[]>`SELECT COUNT(*) as count FROM StockItem WHERE quantity <= minThreshold`.then(
      (r) => Number(r[0]?.count ?? 0)
    ),
    prisma.feedback.count(),
    prisma.conversation.findMany({
      take: 5,
      orderBy: { lastMessageAt: "desc" },
      include: { customer: true },
    }),
    prisma.followUp.findMany({
      where: { status: "OVERDUE" },
      include: { customer: true },
      take: 5,
    }),
  ]);

  return {
    activeConversations,
    pendingFollowUps,
    lowStockItems,
    feedbackCount,
    recentConversations,
    overdueFollowUps,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-8 relative">
      {/* Page header */}
      <div className="animate-stagger-fade-in" style={{ "--stagger-delay": "0ms" } as React.CSSProperties}>
        <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Selamat datang di Si-Admin. Berikut ringkasan bisnis Anda.
        </p>
      </div>

      {/* Metric Cards - Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)]">
          {/* Hero card - spans 2 columns and 2 rows */}
          <Card className="animate-stagger-fade-in glass sm:col-span-2 lg:col-span-2 lg:row-span-2 relative overflow-hidden group hover:shadow-[0_8px_40px_oklch(0.75_0.18_180_/_0.15)] transition-all duration-500" style={{ "--stagger-delay": "100ms" } as React.CSSProperties}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500" />
            <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-accent/5 group-hover:bg-accent/10 transition-colors duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-medium font-display text-card-foreground">
                Percakapan Aktif
              </CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold font-display text-foreground tracking-tight">{data.activeConversations}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Total percakapan yang sedang berlangsung
              </p>
              <div className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-primary/60 to-primary/20" />
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="animate-stagger-fade-in glass relative overflow-hidden group hover:shadow-[0_4px_24px_oklch(0.78_0.15_65_/_0.12)] transition-all duration-500 hover:-translate-y-0.5" style={{ "--stagger-delay": "220ms" } as React.CSSProperties}>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-accent to-accent/30" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-accent/5 group-hover:bg-accent/10 transition-colors duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                Follow Up Tertunda
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 ring-1 ring-accent/20">
                <CalendarClock className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-foreground">{data.pendingFollowUps}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tugas yang perlu ditindaklanjuti
              </p>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="animate-stagger-fade-in glass relative overflow-hidden group hover:shadow-[0_4px_24px_oklch(0.65_0.2_330_/_0.12)] transition-all duration-500 hover:-translate-y-0.5" style={{ "--stagger-delay": "340ms" } as React.CSSProperties}>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-destructive/80 to-destructive/20" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-destructive/5 group-hover:bg-destructive/10 transition-colors duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                Stok Rendah
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 ring-1 ring-destructive/20">
                <Package className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-foreground">{data.lowStockItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Barang yang perlu di-restok segera
              </p>
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="animate-stagger-fade-in glass sm:col-span-2 lg:col-span-2 relative overflow-hidden group hover:shadow-[0_4px_24px_oklch(0.75_0.18_180_/_0.1)] transition-all duration-500 hover:-translate-y-0.5" style={{ "--stagger-delay": "460ms" } as React.CSSProperties}>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-chart-4 to-chart-4/30" />
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-chart-4/5 group-hover:bg-chart-4/10 transition-colors duration-500" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                Feedback Terkirim
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-4/10 ring-1 ring-chart-4/20">
                <Star className="h-4 w-4 text-chart-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-foreground">{data.feedbackCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total feedback dari pelanggan
              </p>
            </CardContent>
          </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass relative overflow-hidden animate-stagger-fade-in" style={{ "--stagger-delay": "600ms" } as React.CSSProperties}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">Percakapan Terbaru</CardTitle>
            <CardDescription>
              5 percakapan terakhir yang masuk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between rounded-lg px-3 py-3 transition-all duration-200 hover:bg-secondary/50 group/item"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground group-hover/item:text-primary transition-colors">
                      {conv.customer.name}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {conv.lastMessage}
                    </span>
                  </div>
                  <Badge
                    variant={
                      conv.status === "ACTIVE" ? "default" : "secondary"
                    }
                    className="shrink-0"
                  >
                    {conv.status === "ACTIVE" ? "Aktif" : "Selesai"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass relative overflow-hidden animate-stagger-fade-in" style={{ "--stagger-delay": "750ms" } as React.CSSProperties}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-destructive/60 via-destructive/20 to-transparent" />
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-lg">Follow Up Terlambat</CardTitle>
            <CardDescription>
              Tugas yang melewati tenggat waktu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.overdueFollowUps.length === 0 ? (
                <p className="text-sm text-muted-foreground px-3 py-3">
                  Tidak ada follow up yang terlambat
                </p>
              ) : (
                data.overdueFollowUps.map((fu) => (
                  <div
                    key={fu.id}
                    className="flex items-center justify-between rounded-lg px-3 py-3 transition-all duration-200 hover:bg-secondary/50 group/item"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground group-hover/item:text-destructive transition-colors">
                        {fu.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fu.customer.name}
                      </span>
                    </div>
                    <Badge variant="destructive" className="shrink-0">Terlambat</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
