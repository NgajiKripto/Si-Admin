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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di Si-Admin. Berikut ringkasan bisnis Anda.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Percakapan Aktif
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeConversations}</div>
            <p className="text-xs text-muted-foreground">
              Total percakapan yang sedang berlangsung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Follow Up Tertunda
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingFollowUps}</div>
            <p className="text-xs text-muted-foreground">
              Tugas yang perlu ditindaklanjuti
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Barang yang perlu di-restok segera
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Feedback Terkirim
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.feedbackCount}</div>
            <p className="text-xs text-muted-foreground">
              Total feedback dari pelanggan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Percakapan Terbaru</CardTitle>
            <CardDescription>
              5 percakapan terakhir yang masuk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
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
                  >
                    {conv.status === "ACTIVE" ? "Aktif" : "Selesai"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Follow Up Terlambat</CardTitle>
            <CardDescription>
              Tugas yang melewati tenggat waktu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.overdueFollowUps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Tidak ada follow up yang terlambat
                </p>
              ) : (
                data.overdueFollowUps.map((fu) => (
                  <div
                    key={fu.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{fu.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {fu.customer.name}
                      </span>
                    </div>
                    <Badge variant="destructive">Terlambat</Badge>
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
