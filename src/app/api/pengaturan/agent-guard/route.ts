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
    const errors: string[] = [];

    // Validate isEnabled - must be boolean
    if (body.isEnabled !== undefined) {
      if (typeof body.isEnabled !== "boolean") {
        errors.push("isEnabled harus berupa boolean");
      } else {
        data.isEnabled = body.isEnabled;
      }
    }

    // Validate maxResponseLength - must be number between 50-5000
    if (body.maxResponseLength !== undefined) {
      const val = body.maxResponseLength;
      if (typeof val !== "number" || !Number.isInteger(val) || val < 50 || val > 5000) {
        errors.push("maxResponseLength harus berupa angka antara 50-5000");
      } else {
        data.maxResponseLength = val;
      }
    }

    // Validate maxResponseTokens - must be number between 10-2000
    if (body.maxResponseTokens !== undefined) {
      const val = body.maxResponseTokens;
      if (typeof val !== "number" || !Number.isInteger(val) || val < 10 || val > 2000) {
        errors.push("maxResponseTokens harus berupa angka antara 10-2000");
      } else {
        data.maxResponseTokens = val;
      }
    }

    // Validate responseFormat - must be "text" or "structured"
    if (body.responseFormat !== undefined) {
      if (body.responseFormat !== "text" && body.responseFormat !== "structured") {
        errors.push("responseFormat harus 'text' atau 'structured'");
      } else {
        data.responseFormat = body.responseFormat;
      }
    }

    // Validate allowedTopics - must be valid JSON array of strings
    if (body.allowedTopics !== undefined) {
      try {
        const parsed = JSON.parse(body.allowedTopics);
        if (!Array.isArray(parsed) || !parsed.every((item: unknown) => typeof item === "string")) {
          errors.push("allowedTopics harus berupa JSON array of strings");
        } else {
          data.allowedTopics = body.allowedTopics;
        }
      } catch {
        errors.push("allowedTopics harus berupa JSON yang valid");
      }
    }

    // Validate blockedPatterns - must be valid JSON array of strings
    if (body.blockedPatterns !== undefined) {
      try {
        const parsed = JSON.parse(body.blockedPatterns);
        if (!Array.isArray(parsed) || !parsed.every((item: unknown) => typeof item === "string")) {
          errors.push("blockedPatterns harus berupa JSON array of strings");
        } else {
          data.blockedPatterns = body.blockedPatterns;
        }
      } catch {
        errors.push("blockedPatterns harus berupa JSON yang valid");
      }
    }

    // Validate blockedOutputPatterns - must be valid JSON array of strings
    if (body.blockedOutputPatterns !== undefined) {
      try {
        const parsed = JSON.parse(body.blockedOutputPatterns);
        if (!Array.isArray(parsed) || !parsed.every((item: unknown) => typeof item === "string")) {
          errors.push("blockedOutputPatterns harus berupa JSON array of strings");
        } else {
          data.blockedOutputPatterns = body.blockedOutputPatterns;
        }
      } catch {
        errors.push("blockedOutputPatterns harus berupa JSON yang valid");
      }
    }

    // Validate systemPromptHash - must be string or null
    if (body.systemPromptHash !== undefined) {
      if (body.systemPromptHash !== null && typeof body.systemPromptHash !== "string") {
        errors.push("systemPromptHash harus berupa string atau null");
      } else {
        data.systemPromptHash = body.systemPromptHash;
      }
    }

    // Return validation errors if any
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validasi gagal", details: errors },
        { status: 400 }
      );
    }

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
