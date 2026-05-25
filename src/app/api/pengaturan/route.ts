import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    let profile = await prisma.businessProfile.findFirst();

    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: {
          name: "Toko Serba Ada",
          type: "Retail",
          description: "",
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching business profile:", error);
    return NextResponse.json(
      { error: "Gagal mengambil profil bisnis" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, type, description } = body;

    let profile = await prisma.businessProfile.findFirst();

    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: {
          name: name || "Toko Serba Ada",
          type: type || "Retail",
          description: description || "",
        },
      });
    } else {
      profile = await prisma.businessProfile.update({
        where: { id: profile.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(type !== undefined ? { type } : {}),
          ...(description !== undefined ? { description } : {}),
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating business profile:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui profil bisnis" },
      { status: 500 }
    );
  }
}
