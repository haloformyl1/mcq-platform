import prisma from "@/lib/prisma";
import { normalizeAcademicLevel } from "@/lib/studyMaterialMetadata";

export type NotificationCategory = 
  | "all" 
  | "payments" 
  | "ultra" 
  | "materials" 
  | "exams" 
  | "announcements" 
  | "system";

export type NotificationType =
  | "payment_success"
  | "payment_failed"
  | "payment_refunded"
  | "membership_activated"
  | "membership_renewed"
  | "membership_expiring"
  | "membership_expired"
  | "content_published"
  | "exam_available"
  | "admin_announcement"
  | "system_alert";

export interface CreateNotificationInput {
  studentId: string;
  type: NotificationType;
  category: "payments" | "ultra" | "materials" | "exams" | "announcements" | "system";
  title: string;
  message: string;
  metadata?: Record<string, any> | null;
  actionLabel?: string | null;
  actionUrl?: string | null;
  priority?: boolean;
  eventKey?: string | null;
  expiresAt?: Date | null;
}

let schemaEnsured = false;

/**
 * Ensures the Notification table and its indexes exist in PostgreSQL.
 * Runs idempotently via raw SQL.
 */
export async function ensureNotificationSchema() {
  if (schemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "studentId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "metadata" JSONB,
        "actionLabel" TEXT,
        "actionUrl" TEXT,
        "priority" BOOLEAN NOT NULL DEFAULT false,
        "readAt" TIMESTAMP(3),
        "eventKey" TEXT UNIQUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3),
        CONSTRAINT "Notification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Notification_studentId_createdAt_idx" ON "Notification"("studentId", "createdAt" DESC);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Notification_studentId_readAt_idx" ON "Notification"("studentId", "readAt");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Notification_category_idx" ON "Notification"("category");
    `);

    schemaEnsured = true;
  } catch (err: any) {
    console.error("Warning ensuring Notification schema:", err?.message || err);
  }
}

/**
 * Creates a notification for a student. Idempotent based on eventKey.
 */
export async function createNotification(input: CreateNotificationInput) {
  await ensureNotificationSchema();

  try {
    // Check if eventKey already exists to ensure idempotency
    if (input.eventKey) {
      const existing: any[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM "Notification" WHERE "eventKey" = $1 LIMIT 1;`,
        input.eventKey
      );
      if (existing && existing.length > 0) {
        return existing[0];
      }
    }

    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "Notification" (
        "id", "studentId", "type", "category", "title", "message", 
        "metadata", "actionLabel", "actionUrl", "priority", "eventKey", "expiresAt", "createdAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, NOW()
      ) ON CONFLICT ("eventKey") DO NOTHING;`,
      id,
      input.studentId,
      input.type,
      input.category,
      input.title,
      input.message,
      metadataJson,
      input.actionLabel || null,
      input.actionUrl || null,
      Boolean(input.priority),
      input.eventKey || null,
      input.expiresAt || null
    );

    return { id, ...input };
  } catch (error: any) {
    console.error("Failed to create notification:", error?.message || error);
    return null;
  }
}

/**
 * Triggered on verified payment success (Paytm webhook or Admin approval).
 */
export async function notifyPaymentSuccess(params: {
  studentId: string;
  amount: number;
  planName?: string;
  txnId?: string | null;
  paymentDate?: Date | string | null;
  orderId?: string | null;
}) {
  const { studentId, amount, planName = "PIE Ultra", txnId, paymentDate, orderId } = params;
  const dateFormatted = paymentDate 
    ? new Date(paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  
  const refCode = txnId || orderId || `TXN-${Date.now()}`;
  const eventKey = `payment_success_${refCode}_${studentId}`;

  return await createNotification({
    studentId,
    type: "payment_success",
    category: "payments",
    title: `Payment Verified • ₹${amount}`,
    message: `Your payment of ₹${amount} for ${planName} has been verified successfully. Reference ID: ${refCode}. Date: ${dateFormatted}.`,
    metadata: {
      amount,
      planName,
      txnId: refCode,
      paymentDate: dateFormatted,
      status: "Successful"
    },
    actionLabel: "View Payment Details",
    actionUrl: "/dashboard/account",
    priority: true,
    eventKey
  });
}

/**
 * Triggered on membership activation or renewal to PIE Ultra.
 */
export async function notifyMembershipActivated(params: {
  studentId: string;
  planTier?: "ultra" | "pro";
  expiresAt?: Date | string | null;
  amount?: number;
  isComplimentary?: boolean;
}) {
  const { studentId, planTier = "ultra", expiresAt, amount, isComplimentary } = params;
  const isUltra = planTier === "ultra";
  
  const expiryFormatted = expiresAt 
    ? new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : (isComplimentary ? "Lifetime VIP Access" : "30-Day Cycle");

  const expiryKey = expiresAt ? new Date(expiresAt).toISOString().split("T")[0] : (isComplimentary ? "lifetime" : "cycle");
  const eventKey = `membership_activated_${studentId}_${planTier}_${expiryKey}`;

  const planName = isUltra ? "PIE Ultra" : "PIE Pro";
  const title = `Welcome to ${planName}`;
  const message = isUltra
    ? `Your VIP membership has been upgraded successfully. Full access unlocked: Unlimited Chemistry exams, PIE AI Tutor queries, 3D molecular models & PIE LAB simulations active until ${expiryFormatted}.`
    : `Your ${planName} subscription is active until ${expiryFormatted}. 20 AI queries/day, 5 downloads/day & national percentiles unlocked.`;

  return await createNotification({
    studentId,
    type: "membership_activated",
    category: "ultra",
    title,
    message,
    metadata: {
      planName,
      status: "Active",
      expiresAt: expiryFormatted,
      benefits: isUltra ? [
        "Unlimited Chemistry exams",
        "PIE AI Tutor access",
        "3D molecular models",
        "PIE LAB simulations"
      ] : [
        "Daily Practice Problems",
        "National Percentile Rankings",
        "AI Diagnostic Reports"
      ]
    },
    actionLabel: `Explore ${planName} →`,
    actionUrl: "/dashboard",
    priority: true,
    eventKey
  });
}

/**
 * Triggered when admin uploads / publishes new study material.
 * Targets ONLY students whose board and class match the content's criteria!
 */
export async function notifyContentPublished(params: {
  materialId: string;
  title: string;
  board?: string | null;
  academicLevel?: string | null;
  discipline?: string | null;
  category?: string | null;
  isPremium?: boolean;
}) {
  await ensureNotificationSchema();

  const { materialId, title, board = "ALL", academicLevel = "ALL", discipline, category, isPremium } = params;
  
  const targetBoard = (board || "ALL").toUpperCase().trim();
  const targetLevel = (academicLevel || "ALL").toUpperCase().trim();
  const normTargetLevel = normalizeAcademicLevel(targetLevel);

  // 1. Query students based on board criteria
  let studentsQuery = `SELECT id, board, "academicLevel" FROM "Student" WHERE "status" = 'ACTIVE'`;
  const queryParams: any[] = [];

  if (targetBoard !== "ALL" && targetBoard !== "ALL CURRICULUMS" && targetBoard !== "3D_ANIMATION") {
    queryParams.push(targetBoard);
    studentsQuery += ` AND UPPER(COALESCE(board, '')) = $${queryParams.length}`;
  }

  const students: any[] = await prisma.$queryRawUnsafe(studentsQuery, ...queryParams);
  if (!students || students.length === 0) return;

  // 2. Filter students further by academicLevel / class match
  const eligibleStudents = students.filter(st => {
    // If material is targetted to ALL classes, every student in that board is eligible
    if (targetLevel === "ALL" || normTargetLevel === "ALL") return true;

    const studentLevel = normalizeAcademicLevel(st.academicLevel || "");
    if (!studentLevel) return false;

    // Match CBSE/ICSE Class 11 or WBCHSE SEM-I / SEM-II
    if (normTargetLevel === "11" || normTargetLevel === "ALL_11") {
      return studentLevel === "11" || studentLevel === "SEM-I" || studentLevel === "SEM-II";
    }
    // Match CBSE/ICSE Class 12 or WBCHSE SEM-III / SEM-IV
    if (normTargetLevel === "12" || normTargetLevel === "ALL_12") {
      return studentLevel === "12" || studentLevel === "SEM-III" || studentLevel === "SEM-IV";
    }
    // Specific semester matches (SEM-I, SEM-II, SEM-III, SEM-IV)
    if (normTargetLevel.startsWith("SEM-")) {
      return studentLevel === normTargetLevel;
    }
    // Entrance streams (NEET, JEE, WBJEE)
    if (["NEET", "JEE", "WBJEE", "CUET"].includes(normTargetLevel)) {
      return studentLevel === normTargetLevel || (st.board || "").toUpperCase().includes("ENTRANCE");
    }

    return studentLevel === normTargetLevel;
  });

  if (eligibleStudents.length === 0) return;

  const boardLabel = targetBoard === "ALL" ? "Chemistry" : targetBoard;
  const levelLabel = targetLevel === "ALL" ? "" : ` (${targetLevel})`;
  const notifTitle = `New ${boardLabel} Material: ${title}`;
  const notifMessage = `Fresh educational content has been published for ${boardLabel}${levelLabel}. Category: ${category || "Study Material"}.`;

  // 3. Batch insert notifications for eligible students (idempotent per student & material)
  for (const st of eligibleStudents) {
    const eventKey = `content_${materialId}_${st.id}`;
    await createNotification({
      studentId: st.id,
      type: "content_published",
      category: "materials",
      title: notifTitle,
      message: notifMessage,
      metadata: {
        materialId,
        board: targetBoard,
        classSem: targetLevel,
        category: category || "Study Material",
        isPremium: Boolean(isPremium)
      },
      actionLabel: "Explore New Material →",
      actionUrl: `/dashboard/pdf-viewer/${materialId}`,
      priority: false,
      eventKey
    });
  }
}

/**
 * Triggered when a new test/exam is published.
 */
export async function notifyExamAvailable(params: {
  testId: string;
  title: string;
  targetBoard?: string | null;
  targetAcademicLevel?: string | null;
  durationMinutes?: number;
  totalQuestions?: number;
}) {
  await ensureNotificationSchema();

  const { testId, title, targetBoard = "ALL", targetAcademicLevel = "ALL", durationMinutes, totalQuestions } = params;
  const board = (targetBoard || "ALL").toUpperCase().trim();

  let studentsQuery = `SELECT id, board, "academicLevel" FROM "Student" WHERE "status" = 'ACTIVE'`;
  const queryParams: any[] = [];

  if (board !== "ALL") {
    queryParams.push(board);
    studentsQuery += ` AND UPPER(COALESCE(board, '')) = $${queryParams.length}`;
  }

  const students: any[] = await prisma.$queryRawUnsafe(studentsQuery, ...queryParams);
  if (!students || students.length === 0) return;

  for (const st of students) {
    const eventKey = `exam_${testId}_${st.id}`;
    await createNotification({
      studentId: st.id,
      type: "exam_available",
      category: "exams",
      title: `Exam Available: ${title}`,
      message: `A new mock exam series is now live${durationMinutes ? ` (${durationMinutes} mins)` : ""}. Test your knowledge and track your national percentile.`,
      metadata: {
        testId,
        durationMinutes,
        totalQuestions
      },
      actionLabel: "Take Exam Now →",
      actionUrl: `/dashboard`,
      priority: true,
      eventKey
    });
  }
}

/**
 * Returns paginated notifications and category counts for a student.
 */
export async function getStudentNotifications(
  studentId: string, 
  options: { category?: string; page?: number; limit?: number } = {}
) {
  await ensureNotificationSchema();

  const { category = "all", page = 1, limit = 20 } = options;
  const offset = (Math.max(1, page) - 1) * limit;

  let whereClause = `WHERE "studentId" = $1`;
  const queryParams: any[] = [studentId];

  if (category && category !== "all") {
    queryParams.push(category);
    whereClause += ` AND "category" = $${queryParams.length}`;
  }

  // 1. Fetch notifications
  const notifications: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "Notification" 
     ${whereClause} 
     ORDER BY "priority" DESC, "createdAt" DESC 
     LIMIT ${limit} OFFSET ${offset};`,
    ...queryParams
  );

  // 2. Fetch total count for current category filter
  const countRes: any[] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM "Notification" ${whereClause};`,
    ...queryParams
  );
  const total = countRes && countRes[0] ? Number(countRes[0].count) : 0;

  // 3. Fetch unread count for student across all categories
  const unreadRes: any[] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM "Notification" WHERE "studentId" = $1 AND "readAt" IS NULL;`,
    studentId
  );
  const unreadCount = unreadRes && unreadRes[0] ? Number(unreadRes[0].count) : 0;

  // 4. Category breakdown counts
  const categoryCountsRes: any[] = await prisma.$queryRawUnsafe(
    `SELECT "category", COUNT(*)::int AS count 
     FROM "Notification" 
     WHERE "studentId" = $1 
     GROUP BY "category";`,
    studentId
  );

  const categoryCounts: Record<string, number> = {
    all: 0,
    payments: 0,
    ultra: 0,
    materials: 0,
    exams: 0,
    announcements: 0,
    system: 0
  };

  let allTotal = 0;
  for (const row of categoryCountsRes) {
    const cat = row.category as string;
    const c = Number(row.count) || 0;
    categoryCounts[cat] = c;
    allTotal += c;
  }
  categoryCounts.all = allTotal;

  return {
    notifications,
    total,
    page,
    limit,
    hasMore: offset + notifications.length < total,
    unreadCount,
    categoryCounts
  };
}

/**
 * Marks all unread notifications for a student as read.
 */
export async function markAllNotificationsAsRead(studentId: string) {
  await ensureNotificationSchema();

  const res: any = await prisma.$executeRawUnsafe(
    `UPDATE "Notification" 
     SET "readAt" = NOW() 
     WHERE "studentId" = $1 AND "readAt" IS NULL;`,
    studentId
  );

  return { success: true, count: res };
}

/**
 * Marks a specific notification as read.
 */
export async function markNotificationAsRead(studentId: string, notificationId: string) {
  await ensureNotificationSchema();

  await prisma.$executeRawUnsafe(
    `UPDATE "Notification" 
     SET "readAt" = NOW() 
     WHERE "id" = $1 AND "studentId" = $2;`,
    notificationId,
    studentId
  );

  return { success: true };
}

/**
 * Clears/Deletes all notifications for a student.
 */
export async function deleteAllNotifications(studentId: string) {
  await ensureNotificationSchema();

  await prisma.$executeRawUnsafe(
    `DELETE FROM "Notification" WHERE "studentId" = $1;`,
    studentId
  );

  return { success: true };
}

/**
 * Deletes a single notification for a student.
 */
export async function deleteNotification(studentId: string, notificationId: string) {
  await ensureNotificationSchema();

  await prisma.$executeRawUnsafe(
    `DELETE FROM "Notification" WHERE "id" = $1 AND "studentId" = $2;`,
    notificationId,
    studentId
  );

  return { success: true };
}

/**
 * Seeds initial contextual notifications if a student currently has zero records.
 * Ensures existing subscribers see their active VIP Ultra pass or pending payment review.
 */
export async function seedContextualNotificationsForStudent(studentId: string) {
  await ensureNotificationSchema();

  const countRes: any[] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM "Notification" WHERE "studentId" = $1;`,
    studentId
  );
  const count = countRes && countRes[0] ? Number(countRes[0].count) : 0;
  
  if (count > 0) return; // Already has notifications

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      upgradeRequests: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!student) return;

  const isPaid = student.subscriptionStatus === "PAID";
  const isComp = Boolean(student.isComplimentary || student.subscriptionStatus === "COMPLIMENTARY");
  const latestReq = student.upgradeRequests?.[0];

  // 1. Pending payment review
  if (latestReq && latestReq.status === "PENDING") {
    const isUltraReq = (latestReq.note || "").toLowerCase().includes("ultra") || latestReq.amount === 499 || latestReq.amount === 200;
    const planName = isUltraReq ? "PIE Ultra" : "PIE Pro";
    await createNotification({
      studentId,
      type: "payment_success",
      category: "payments",
      title: "Payment Verification In Progress",
      message: `Your payment of ₹${latestReq.amount || 99} for ${planName} (UTR: ${latestReq.utrNumber || "Submitted"}) is awaiting admin verification. Approval usually takes 15–30 minutes.`,
      metadata: {
        amount: latestReq.amount,
        planName,
        utrNumber: latestReq.utrNumber,
        status: "In Review"
      },
      actionLabel: "Track Payment Status",
      actionUrl: "/dashboard/account",
      priority: true,
      eventKey: `seed_pending_${latestReq.id}`
    });
  }

  // 2. Active Ultra or Pro membership
  if (isPaid || isComp) {
    const isUltra = (latestReq?.note || "").toLowerCase().includes("ultra") || latestReq?.amount === 499 || latestReq?.amount === 200;
    await notifyMembershipActivated({
      studentId,
      planTier: isUltra ? "ultra" : "pro",
      expiresAt: student.subscriptionExpiresAt,
      isComplimentary: isComp
    });
  }

  // 3. Welcome to PIE platform announcement
  await createNotification({
    studentId,
    type: "admin_announcement",
    category: "announcements",
    title: "Welcome to PIE Chemistry Platform",
    message: "Explore our interactive 3D simulations, chapter notes, and proctored exam hall. Check this notification center anytime for real-time alerts.",
    actionLabel: "Explore Dashboard",
    actionUrl: "/dashboard",
    priority: false,
    eventKey: `seed_welcome_${studentId}`
  });
}
