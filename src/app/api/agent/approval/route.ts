import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getAgentTools } from "@/lib/langchain/tools";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const pendingApprovals = await prisma.humanApprovalQueue.findMany({
      where: { status: "PENDING" },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json({
      approvals: pendingApprovals.map((item) => {
        let actionPayload: unknown;
        try {
          actionPayload = JSON.parse(item.actionPayload);
        } catch {
          actionPayload = { raw: item.actionPayload, parseError: true };
        }
        return {
          id: item.id,
          sessionId: item.sessionId,
          actionType: item.actionType,
          actionPayload,
          status: item.status,
          requestedAt: item.requestedAt,
        };
      }),
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
  const authError = requireAuth(request);
  if (authError) return authError;

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
      // Reject items without payload hash (created before integrity check was added)
      if (!queueItem.payloadHash) {
        return NextResponse.json(
          { error: "Item ini tidak memiliki hash integritas. Silakan buat ulang aksi." },
          { status: 400 }
        );
      }
      const computedHash = createHash("sha256").update(queueItem.actionPayload).digest("hex");
      if (computedHash !== queueItem.payloadHash) {
        return NextResponse.json(
          { error: "Integritas payload gagal diverifikasi. Aksi ditolak." },
          { status: 400 }
        );
      }

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
        let payload: { toolName: string; args: Record<string, unknown> };
        try {
          payload = JSON.parse(queueItem.actionPayload) as {
            toolName: string;
            args: Record<string, unknown>;
          };
        } catch {
          executionResult = "Gagal memparse payload aksi: format JSON tidak valid.";
          return NextResponse.json({
            success: true,
            message: "Aksi telah disetujui tetapi gagal dieksekusi.",
            result: executionResult,
          });
        }

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
