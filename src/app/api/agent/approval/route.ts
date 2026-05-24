import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgentTools } from "@/lib/langchain/tools";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "dev-admin-token";

function checkAuth(request: NextRequest): boolean {
  const token = request.headers.get("x-admin-token");
  return token === ADMIN_SECRET;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Header 'x-admin-token' tidak valid." },
      { status: 401 }
    );
  }

  try {
    const pendingApprovals = await prisma.humanApprovalQueue.findMany({
      where: { status: "PENDING" },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json({
      approvals: pendingApprovals.map((item) => ({
        id: item.id,
        sessionId: item.sessionId,
        actionType: item.actionType,
        actionPayload: JSON.parse(item.actionPayload),
        status: item.status,
        requestedAt: item.requestedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data antrian persetujuan." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Header 'x-admin-token' tidak valid." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id, action, notes, resolvedBy } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: "Field 'id' dan 'action' diperlukan." },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Action harus 'approve' atau 'reject'." },
        { status: 400 }
      );
    }

    const queueItem = await prisma.humanApprovalQueue.findUnique({
      where: { id },
    });

    if (!queueItem) {
      return NextResponse.json(
        { error: "Item persetujuan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (queueItem.status !== "PENDING") {
      return NextResponse.json(
        { error: `Item sudah diproses dengan status: ${queueItem.status}` },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Update status to APPROVED
      await prisma.humanApprovalQueue.update({
        where: { id },
        data: {
          status: "APPROVED",
          resolvedAt: new Date(),
          resolvedBy: resolvedBy || "admin",
          notes: notes || null,
        },
      });

      // Execute the stored action
      let executionResult: string;
      try {
        const payload = JSON.parse(queueItem.actionPayload) as {
          toolName: string;
          args: Record<string, unknown>;
        };

        const tools = getAgentTools();
        const tool = tools.find((t) => t.name === payload.toolName);

        if (!tool) {
          executionResult = `Tool '${payload.toolName}' tidak ditemukan.`;
        } else {
          executionResult = await (tool as unknown as { invoke: (args: Record<string, unknown>) => Promise<string> }).invoke(payload.args);
        }
      } catch (execError) {
        executionResult = `Gagal mengeksekusi aksi: ${execError instanceof Error ? execError.message : "Unknown error"}`;
      }

      return NextResponse.json({
        success: true,
        message: "Aksi telah disetujui dan dieksekusi.",
        result: executionResult,
      });
    } else {
      // Reject
      await prisma.humanApprovalQueue.update({
        where: { id },
        data: {
          status: "REJECTED",
          resolvedAt: new Date(),
          resolvedBy: resolvedBy || "admin",
          notes: notes || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Aksi telah ditolak.",
      });
    }
  } catch (error) {
    console.error("Error processing approval:", error);
    return NextResponse.json(
      { error: "Gagal memproses persetujuan." },
      { status: 500 }
    );
  }
}
