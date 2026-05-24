import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let config = await prisma.agentGuardConfig.findFirst();

    if (!config) {
      config = await prisma.agentGuardConfig.create({
        data: {},
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching agent guard config:", error);
    return NextResponse.json(
      { error: "Gagal mengambil konfigurasi guard" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    let config = await prisma.agentGuardConfig.findFirst();

    if (!config) {
      config = await prisma.agentGuardConfig.create({
        data: {},
      });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.isEnabled !== undefined) data.isEnabled = body.isEnabled;
    if (body.maxResponseLength !== undefined)
      data.maxResponseLength = body.maxResponseLength;
    if (body.maxResponseTokens !== undefined)
      data.maxResponseTokens = body.maxResponseTokens;
    if (body.allowedTopics !== undefined)
      data.allowedTopics = body.allowedTopics;
    if (body.blockedPatterns !== undefined)
      data.blockedPatterns = body.blockedPatterns;
    if (body.blockedOutputPatterns !== undefined)
      data.blockedOutputPatterns = body.blockedOutputPatterns;
    if (body.responseFormat !== undefined)
      data.responseFormat = body.responseFormat;
    if (body.systemPromptHash !== undefined)
      data.systemPromptHash = body.systemPromptHash;

    const updated = await prisma.agentGuardConfig.update({
      where: { id: config.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating agent guard config:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui konfigurasi guard" },
      { status: 500 }
    );
  }
}
