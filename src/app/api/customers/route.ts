import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pelanggan" },
      { status: 500 }
    );
  }
}
