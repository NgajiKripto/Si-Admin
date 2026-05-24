import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json(
        { error: "Parameter 'requestId' diperlukan" },
        { status: 400 }
      );
    }

    const traceEntry = await prisma.agentMetrics.findFirst({
      where: {
        requestId,
        stepName: "TRACE",
      },
    });

    if (!traceEntry) {
      return NextResponse.json(
        { error: "Trace tidak ditemukan" },
        { status: 404 }
      );
    }

    // Parse the trace from errorMessage field
    let trace: unknown = [];
    try {
      trace = JSON.parse(traceEntry.errorMessage || "[]");
    } catch {
      trace = [];
    }

    return NextResponse.json({
      requestId,
      sessionId: traceEntry.sessionId,
      createdAt: traceEntry.createdAt,
      trace,
    });
  } catch (error) {
    console.error("Error fetching trace:", error);
    return NextResponse.json(
      { error: "Gagal mengambil trace" },
      { status: 500 }
    );
  }
}
