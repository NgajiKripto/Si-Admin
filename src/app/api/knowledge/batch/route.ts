import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditKnowledgeContent } from "@/lib/agent-guard/knowledge-auditor";
import { requireAuth } from "@/lib/auth";

const validCategories = [
  "CHAT_HISTORY",
  "FAQ",
  "PRODUCT_INFO",
  "SOP",
  "RESPONSE_TEMPLATE",
  "TONE_GUIDELINE",
];

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { entries } = body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "entries array diperlukan dan tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Validate all entries before creating
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry.title || !entry.content || !entry.category) {
        return NextResponse.json(
          { error: `Entri ${i + 1}: title, content, dan category diperlukan` },
          { status: 400 }
        );
      }
      if (!validCategories.includes(entry.category)) {
        return NextResponse.json(
          { error: `Entri ${i + 1}: kategori tidak valid` },
          { status: 400 }
        );
      }
      if (entry.title.length > 500) {
        return NextResponse.json(
          { error: `Entri ${i + 1}: title maksimal 500 karakter` },
          { status: 400 }
        );
      }
      if (entry.content.length > 50000) {
        return NextResponse.json(
          { error: `Entri ${i + 1}: content maksimal 50000 karakter` },
          { status: 400 }
        );
      }
      const auditResult = auditKnowledgeContent(entry.content);
      if (!auditResult.safe) {
        return NextResponse.json(
          { error: `Entri ${i + 1}: konten mengandung pola berbahaya - ${auditResult.issues.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Create all entries atomically in a transaction
    const created = await prisma.$transaction(
      entries.map((entry) =>
        prisma.knowledgeEntry.create({
          data: {
            title: entry.title,
            content: entry.content,
            category: entry.category,
            tags: entry.tags || null,
            source: entry.source || null,
          },
        })
      )
    );

    return NextResponse.json(
      { created: created.length, entries: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error batch creating knowledge entries:", error);
    return NextResponse.json(
      { error: "Gagal membuat entri secara massal" },
      { status: 500 }
    );
  }
}
