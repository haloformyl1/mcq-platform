import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { validateStudentSession } from "@/lib/sessionService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) {
      return NextResponse.json({ active: false, reason: "no_session" }, { status: 401 });
    }

    const payload = await decrypt(session);
    if (!payload || !payload.id) {
      return NextResponse.json({ active: false, reason: "invalid_token" }, { status: 401 });
    }

    const { isValid, isRevoked, reason } = await validateStudentSession(payload.id, cookieStore, req);
    if (!isValid || isRevoked) {
      cookieStore.delete("session");
      return NextResponse.json({ active: false, reason: reason || "concurrent_device" }, { status: 401 });
    }

    return NextResponse.json({ active: true });
  } catch (error) {
    return NextResponse.json({ active: true });
  }
}
