import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { parseMaterialMetadata, isStudentEligibleForMaterial } from "@/lib/studyMaterialMetadata";
import { validateStudentSession } from "@/lib/sessionService";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    const payload = session ? await decrypt(session) : null;

    let isSubscribed = false;
    let studentProfile: { board?: string | null; academicLevel?: string | null } | null = null;

    if (payload && payload.id) {
      const { isValid, isRevoked } = await validateStudentSession(payload.id, cookieStore, req);
      if (isValid && !isRevoked) {
        const student = await prisma.student.findUnique({
          where: { id: payload.id },
          select: { 
            subscriptionStatus: true, 
            subscriptionExpiresAt: true,
            board: true,
            academicLevel: true
          }
        });
        if (student) {
          studentProfile = { board: student.board, academicLevel: student.academicLevel };
          const isComp = student.subscriptionStatus === "COMPLIMENTARY";
          const isPaid = student.subscriptionStatus === "PAID" && (!student.subscriptionExpiresAt || new Date(student.subscriptionExpiresAt).getTime() > Date.now());
          isSubscribed = isComp || isPaid;
        }
      } else {
        cookieStore.delete("session");
      }
    }

    const materials = await prisma.studyMaterial.findMany({
      orderBy: { createdAt: "desc" }
    });

    const sanitized = materials.map(m => {
      const meta = parseMaterialMetadata(m.description, m.title, m.type);
      // For enrolled logged-in students, enforce academic curriculum cohort eligibility.
      // For guest visitors without an account (studentProfile === null), allow open exploration of all free content!
      const eligibility = studentProfile 
        ? isStudentEligibleForMaterial(studentProfile, meta.section, meta.classSem)
        : { eligible: true, reason: "" };
      const isLevelRestricted = studentProfile ? !eligibility.eligible : false;
      const isPaidLocked = m.isPremium && !isSubscribed;
      const isLocked = isLevelRestricted || isPaidLocked;
      const is3D = meta.category === '3D animations' || m.type === 'LINK';

      let safeUrl = m.url;
      if (isLocked) {
        safeUrl = "#locked";
      } else if (is3D) {
        safeUrl = `/dashboard/lab-viewer/${m.id}`;
      }

      return {
        ...m,
        url: safeUrl,
        isLocked,
        isLevelRestricted,
        restrictionReason: eligibility.reason,
        badgeLabel: eligibility.badgeLabel,
        buttonLabel: eligibility.buttonLabel,
        targetLabel: eligibility.targetLabel,
        policyTitle: eligibility.policyTitle,
        policyNote: eligibility.policyNote,
        category: meta.category,
        discipline: meta.discipline,
        section: meta.section,
        classSem: meta.classSem,
        description: meta.cleanDescription
      };
    });

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Fetch study materials error:", error);
    return NextResponse.json({ error: "Failed to fetch study materials" }, { status: 500 });
  }
}
