import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const accessRequests = await prisma.testAccessRequest.findMany({
      include: {
        student: { select: { id: true, name: true, email: true, phone: true } },
        test: { select: { id: true, title: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      accessRequests: accessRequests || [],
      pendingRequests: accessRequests || []
    });
  } catch (error: any) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ 
      error: error?.message || "Failed to fetch notifications",
      accessRequests: [],
      pendingRequests: []
    }, { status: 500 });
  }
}