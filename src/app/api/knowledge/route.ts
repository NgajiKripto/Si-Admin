import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditKnowledgeContent } from "@/lib/agent-guard/knowledge-auditor";
import { storeEmbedding } from "@/lib/langchain/embeddings-service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const rawPage = parseInt(searchParams.get("page") || "1");
  const rawLimit = parseInt(searchParams.get("limit") || "20");
  const page = isNaN(rawPage) ? 1 : Math.max(1, rawPage);
  const limit = isNaN(rawLimit) ? 20 : Math.max(1, Math.min(100, rawLimit));
  const skip = (page - 1) * limit;

  try {
    const where = {
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { content: { contains: search } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.knowledgeEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.knowledgeEntry.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching knowledge entries:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengetahuan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, tags, source } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "title, content, dan category diperlukan" },
        { status: 400 }
      );
    }

    if (title.length > 500) {
      return NextResponse.json(
        { error: "title maksimal 500 karakter" },
        { status: 400 }
      );
    }

    if (content.length > 50000) {
      return NextResponse.json(
        { error: "content maksimal 50000 karakter" },
        { status: 400 }
      );
    }

    const validCategories = [
      "CHAT_HISTORY",
      "FAQ",
      "PRODUCT_INFO",
      "SOP",
      "RESPONSE_TEMPLATE",
      "TONE_GUIDELINE",
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Kategori tidak valid" },
        { status: 400 }
      );
    }

    // Audit content for prompt injection patterns
    const auditResult = auditKnowledgeContent(content);
    if (!auditResult.safe) {
      return NextResponse.json(
        {
          error: "Konten mengandung pola berbahaya",
          issues: auditResult.issues,
        },
        { status: 400 }
      );
    }

    const entry = await prisma.knowledgeEntry.create({
      data: {
        title,
        content,
        category,
        tags: tags || null,
        source: source || null,
      },
    });

    // Fire-and-forget: generate embedding in background
    storeEmbedding('KNOWLEDGE', entry.id, `${entry.title} ${entry.content}`).catch(err =>
      console.error('Failed to generate embedding:', err)
    );

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating knowledge entry:", error);
    return NextResponse.json(
      { error: "Gagal membuat entri pengetahuan" },
      { status: 500 }
    );
  }
}
