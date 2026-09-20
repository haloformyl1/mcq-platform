import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { hasPremiumAccess } from "@/lib/subscription";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const cleanId = id.startsWith("db-") ? id.replace("db-", "") : id;

    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const payload = session ? await decrypt(session) : null;

    if (!payload || !payload.id) {
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Login Required</title>
  <style>
    body { background: #040b12; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: #081420; border: 1px solid rgba(0, 195, 255, 0.2); padding: 32px; border-radius: 16px; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h2 { color: #38bdf8; margin: 0 0 12px 0; font-size: 20px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0; }
    a { display: inline-block; background: linear-gradient(135deg, #0284c7, #0369a1); color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 10px; font-size: 13px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h2>🔒 Student Login Required</h2>
    <p>Please log in to your student account to access this 3D Chemistry Interactive Simulation.</p>
    <a href="/login" target="_top">Go to Login</a>
  </div>
</body>
</html>`,
        { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, subscriptionStatus: true, subscriptionExpiresAt: true }
    });

    if (!student) {
      return new NextResponse("Student profile not found", { status: 404 });
    }

    const material = await prisma.studyMaterial.findUnique({
      where: { id: cleanId }
    });

    if (!material) {
      return new NextResponse("Study material or 3D Lab simulation not found", { status: 404 });
    }

    // Enforce subscription verification for premium labs
    if (material.isPremium) {
      const canAccess = hasPremiumAccess(student.subscriptionStatus, student.subscriptionExpiresAt);
      if (!canAccess) {
        return new NextResponse(
          `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Gold Subscription Required</title>
  <style>
    body { background: #040b12; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: #081420; border: 1px solid rgba(245, 158, 11, 0.3); padding: 32px; border-radius: 16px; max-width: 440px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h2 { color: #fbbf24; margin: 0 0 12px 0; font-size: 20px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0; }
    a { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>👑 Gold Access Required</h2>
    <p>This 3D Interactive Chemistry Lab is an exclusive feature of the Gold membership. Upgrade your subscription to unlock all 3D virtual simulations and premium vaults.</p>
    <a href="/dashboard/account" target="_top">Upgrade to Gold Membership</a>
  </div>
</body>
</html>`,
          { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }
    }

    // Fetch external lab content server-to-server
    const response = await fetch(material.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      },
      redirect: "follow"
    });

    if (!response.ok) {
      return new NextResponse(`Remote simulation server responded with status: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "text/html";

    if (contentType.includes("text/html")) {
      let html = await response.text();

      // Resolve base URL for external relative assets
      const baseHref = material.url.endsWith('/') 
        ? material.url 
        : material.url.substring(0, material.url.lastIndexOf('/') + 1) || (new URL(material.url).origin + '/');

      // Injected frame security guard and base tag
      const injection = `
  <base href="${baseHref}">
  <script>
    try {
      // Guard: If opened directly outside the in-app viewer, redirect back into platform
      if (window.top === window.self) {
        window.location.replace('/dashboard/lab-viewer/${cleanId}');
      }
    } catch(e) {}
  </script>
`;

      if (html.includes("<head>")) {
        html = html.replace("<head>", `<head>${injection}`);
      } else if (html.includes("<HEAD>")) {
        html = html.replace("<HEAD>", `<HEAD>${injection}`);
      } else {
        html = `<head>${injection}</head>${html}`;
      }

      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "Referrer-Policy": "no-referrer"
        }
      });
    }

    // Stream other content types directly (CSS, JS, textures)
    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-cache, no-store, must-revalidate"
      }
    });

  } catch (error) {
    console.error("Lab proxy error:", error);
    return new NextResponse("Failed to proxy 3D Lab simulation", { status: 500 });
  }
}