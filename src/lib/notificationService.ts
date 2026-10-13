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

export interface AnnouncementAudienceFilter {
  targetBoard?: string;
  targetAcademicLevel?: string;
  targetSubscription?: "ALL" | "PAID" | "FREE" | "ULTRA";
}

export interface AdminAnnouncementInput {
  title: string;
  message: string;
  category?: "announcements" | "system" | "ultra" | "exams";
  priority?: boolean;
  actionLabel?: string | null;
  actionUrl?: string | null;
  announcementId?: string;
  filter?: AnnouncementAudienceFilter;
}

interface StudentTargetRow {
  id: string;
  board: string | null;
  academicLevel: string | null;
}

export interface NotificationDbRow {
  id: string;
  studentId: string;
  type: string;
  category: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  actionLabel?: string | null;
  actionUrl?: string | null;
  priority?: boolean;
  readAt?: Date | string | null;
  eventKey?: string | null;
  createdAt: Date | string;
  expiresAt?: Date | string | null;
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
 * Creates a single notification for a student. Idempotent based on eventKey.
 */
export async function createNotification(input: CreateNotificationInput) {
  await ensureNotificationSchema();

  try {
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

export interface BatchNotificationResult {
  totalProcessed: number;
  insertedCount: number;
  skippedCount: number;
  failedCount: number;
  batchCount: number;
  successCount: number; // Backward-compatible alias for insertedCount
}

/**
 * Creates notifications in bounded batches using multi-row SQL INSERT.
 * Idempotent with ON CONFLICT ("eventKey") DO NOTHING.
 * Accurately tracks inserted, duplicate/skipped, and failed rows.
 */
export async function createNotificationsBatch(
  inputs: CreateNotificationInput[],
  batchSize: number = 200
): Promise<BatchNotificationResult> {
  await ensureNotificationSchema();

  if (!inputs || inputs.length === 0) {
    return {
      totalProcessed: 0,
      insertedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      batchCount: 0,
      successCount: 0
    };
  }

  let totalProcessed = 0;
  let insertedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let batchCount = 0;

  for (let i = 0; i < inputs.length; i += batchSize) {
    const chunk = inputs.slice(i, i + batchSize);
    batchCount++;

    const valueClauses: string[] = [];
    const queryParams: any[] = [];

    chunk.forEach((item, idx) => {
      const baseIdx = idx * 12;
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${i + idx}`;
      const metadataJson = item.metadata ? JSON.stringify(item.metadata) : null;

      queryParams.push(
        notifId,
        item.studentId,
        item.type,
        item.category,
        item.title,
        item.message,
        metadataJson,
        item.actionLabel || null,
        item.actionUrl || null,
        Boolean(item.priority),
        item.eventKey || null,
        item.expiresAt || null
      );

      valueClauses.push(
        `($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5}, $${baseIdx + 6}, $${baseIdx + 7}::jsonb, $${baseIdx + 8}, $${baseIdx + 9}, $${baseIdx + 10}, $${baseIdx + 11}, $${baseIdx + 12}, NOW())`
      );
    });

    try {
      const sql = `
        INSERT INTO "Notification" (
          "id", "studentId", "type", "category", "title", "message", 
          "metadata", "actionLabel", "actionUrl", "priority", "eventKey", "expiresAt", "createdAt"
        ) VALUES ${valueClauses.join(", ")}
        ON CONFLICT ("eventKey") DO NOTHING;
      `;

      const affectedRows: any = await prisma.$executeRawUnsafe(sql, ...queryParams);
      const newlyInserted = typeof affectedRows === "number" ? affectedRows : 0;
      const skippedInBatch = Math.max(0, chunk.length - newlyInserted);

      insertedCount += newlyInserted;
      skippedCount += skippedInBatch;
    } catch (err: any) {
      console.error(`Batch ${batchCount} notification insert error:`, err?.message || err);
      // Fallback for this chunk: insert row by row safely
      for (const item of chunk) {
        try {
          if (item.eventKey) {
            const existing: any[] = await prisma.$queryRawUnsafe(
              `SELECT id FROM "Notification" WHERE "eventKey" = $1 LIMIT 1;`,
              item.eventKey
            );
            if (existing && existing.length > 0) {
              skippedCount++;
              continue;
            }
          }

          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          const metaJson = item.metadata ? JSON.stringify(item.metadata) : null;
          const res: any = await prisma.$executeRawUnsafe(
            `INSERT INTO "Notification" (
              "id", "studentId", "type", "category", "title", "message", 
              "metadata", "actionLabel", "actionUrl", "priority", "eventKey", "expiresAt", "createdAt"
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, NOW()
            ) ON CONFLICT ("eventKey") DO NOTHING;`,
            notifId,
            item.studentId,
            item.type,
            item.category,
            item.title,
            item.message,
            metaJson,
            item.actionLabel || null,
            item.actionUrl || null,
            Boolean(item.priority),
            item.eventKey || null,
            item.expiresAt || null
          );

          if (typeof res === "number" && res > 0) {
            insertedCount++;
          } else {
            skippedCount++;
          }
        } catch (singleErr) {
          console.error("Fallback single notification insert error:", singleErr);
          failedCount++;
        }
      }
    }

    totalProcessed += chunk.length;
  }

  return {
    totalProcessed,
    insertedCount,
    skippedCount,
    failedCount,
    batchCount,
    successCount: insertedCount
  };
}

/**
 * Builds parameterized SQL WHERE clause and parameters for student audience targeting.
 * Correctly distinguishes school-board targeting (CBSE, ICSE, WBCHSE) from
 * entrance-exam targeting (NEET, JEE) which can encompass students across any board.
 */
function buildAudienceQuery(filter?: AnnouncementAudienceFilter): { sql: string; params: any[] } {
  let query = `WHERE "status" = 'ACTIVE'`;
  const params: any[] = [];

  const targetBoard = (filter?.targetBoard || "ALL").toUpperCase().trim();
  const targetLevel = (filter?.targetAcademicLevel || "ALL").toUpperCase().trim();
  const targetSub = filter?.targetSubscription || "ALL";

  // 1. Board / Curriculum Filter
  if (targetBoard && targetBoard !== "ALL" && targetBoard !== "ALL CURRICULUMS") {
    if (targetBoard === "ICSE" || targetBoard === "ISC") {
      params.push("ICSE", "ISC");
      query += ` AND UPPER(COALESCE(board, '')) IN ($${params.length - 1}, $${params.length})`;
    } else if (targetBoard === "NEET") {
      // Targets students preparing for NEET across school boards (CBSE, ICSE, WBCHSE) and medical aspirants
      // Uses PostgreSQL word-boundary regex (\m \M) to eliminate false positives on substrings (e.g. 'Ranjeet', 'Navneet')
      params.push("\\mNEET\\M");
      const p = `$${params.length}`;
      query += ` AND (
        COALESCE(board, '') ~* ${p}
        OR COALESCE("academicLevel", '') ~* ${p}
        OR EXISTS (
          SELECT 1 FROM "TestAttempt" ta
          JOIN "Test" t ON ta."testId" = t.id
          WHERE ta."studentId" = "Student".id
          AND (COALESCE(t."targetBoard", '') ~* ${p} OR t.title ~* ${p})
        )
        OR EXISTS (
          SELECT 1 FROM "StudentDownload" sd
          JOIN "StudyMaterial" sm ON sd."studyMaterialId" = sm.id
          WHERE sd."studentId" = "Student".id
          AND (sm.title ~* ${p} OR COALESCE(sm.description, '') ~* ${p})
        )
        OR EXISTS (
          SELECT 1 FROM "SubscriptionUpgradeRequest" sur
          WHERE sur."studentId" = "Student".id
          AND (COALESCE(sur.note, '') ~* ${p} OR COALESCE(sur."purchasedClass", '') ~* ${p} OR COALESCE(sur."purchasedBoard", '') ~* ${p})
        )
      )`;
    } else if (targetBoard === "JEE") {
      // Targets students preparing for JEE across school boards (CBSE, ICSE, WBCHSE) and engineering aspirants
      // Uses PostgreSQL word-boundary regex (\m \M) to eliminate false positives on substrings (e.g. 'Banerjee', 'Mukherjee', 'Chatterjee', 'Sanjeev')
      params.push("\\mJEE\\M");
      const p = `$${params.length}`;
      query += ` AND (
        COALESCE(board, '') ~* ${p}
        OR COALESCE("academicLevel", '') ~* ${p}
        OR EXISTS (
          SELECT 1 FROM "TestAttempt" ta
          JOIN "Test" t ON ta."testId" = t.id
          WHERE ta."studentId" = "Student".id
          AND (COALESCE(t."targetBoard", '') ~* ${p} OR t.title ~* ${p})
        )
        OR EXISTS (
          SELECT 1 FROM "StudentDownload" sd
          JOIN "StudyMaterial" sm ON sd."studyMaterialId" = sm.id
          WHERE sd."studentId" = "Student".id
          AND (sm.title ~* ${p} OR COALESCE(sm.description, '') ~* ${p})
        )
        OR EXISTS (
          SELECT 1 FROM "SubscriptionUpgradeRequest" sur
          WHERE sur."studentId" = "Student".id
          AND (COALESCE(sur.note, '') ~* ${p} OR COALESCE(sur."purchasedClass", '') ~* ${p} OR COALESCE(sur."purchasedBoard", '') ~* ${p})
        )
      )`;
    } else if (targetBoard.includes("ENTRANCE")) {
      // Targets entrance cohorts using token-aware word boundaries
      params.push("\\m(ENTRANCE|NEET|JEE|WBJEE)\\M");
      const p = `$${params.length}`;
      query += ` AND (
        COALESCE(board, '') ~* ${p}
        OR COALESCE("academicLevel", '') ~* ${p}
        OR UPPER(COALESCE("academicLevel", '')) IN ('NEET', 'JEE', 'WBJEE', 'CUET')
        OR EXISTS (
          SELECT 1 FROM "TestAttempt" ta
          JOIN "Test" t ON ta."testId" = t.id
          WHERE ta."studentId" = "Student".id
          AND (COALESCE(t."targetBoard", '') ~* ${p} OR t.title ~* ${p})
        )
        OR EXISTS (
          SELECT 1 FROM "StudentDownload" sd
          JOIN "StudyMaterial" sm ON sd."studyMaterialId" = sm.id
          WHERE sd."studentId" = "Student".id
          AND (sm.title ~* ${p} OR COALESCE(sm.description, '') ~* ${p})
        )
        OR EXISTS (
          SELECT 1 FROM "SubscriptionUpgradeRequest" sur
          WHERE sur."studentId" = "Student".id
          AND (COALESCE(sur.note, '') ~* ${p} OR COALESCE(sur."purchasedClass", '') ~* ${p} OR COALESCE(sur."purchasedBoard", '') ~* ${p})
        )
      )`;
    } else {
      // Standard School Board (e.g. CBSE, WBCHSE)
      params.push(targetBoard);
      query += ` AND UPPER(COALESCE(board, '')) = $${params.length}`;
    }
  }

  // 2. Academic Level Filter
  if (targetLevel && targetLevel !== "ALL") {
    const normLevel = normalizeAcademicLevel(targetLevel);
    if (normLevel === "11" || normLevel === "ALL_11") {
      params.push("11", "CLASS 11", "CLASS XI", "XI", "SEM-I", "SEM-II");
      query += ` AND UPPER(COALESCE("academicLevel", '')) IN ($${params.length - 5}, $${params.length - 4}, $${params.length - 3}, $${params.length - 2}, $${params.length - 1}, $${params.length})`;
    } else if (normLevel === "12" || normLevel === "ALL_12") {
      params.push("12", "CLASS 12", "CLASS XII", "XII", "SEM-III", "SEM-IV");
      query += ` AND UPPER(COALESCE("academicLevel", '')) IN ($${params.length - 5}, $${params.length - 4}, $${params.length - 3}, $${params.length - 2}, $${params.length - 1}, $${params.length})`;
    } else if (normLevel === "NEET") {
      params.push("\\mNEET\\M");
      const p = `$${params.length}`;
      query += ` AND (
        COALESCE("academicLevel", '') ~* ${p}
        OR COALESCE(board, '') ~* ${p}
        OR EXISTS (
          SELECT 1 FROM "TestAttempt" ta
          JOIN "Test" t ON ta."testId" = t.id
          WHERE ta."studentId" = "Student".id
          AND (COALESCE(t."targetBoard", '') ~* ${p} OR t.title ~* ${p})
        )
        OR EXISTS (
          SELECT 1 FROM "StudentDownload" sd
          JOIN "StudyMaterial" sm ON sd."studyMaterialId" = sm.id
          WHERE sd."studentId" = "Student".id
          AND (sm.title ~* ${p} OR COALESCE(sm.description, '') ~* ${p})
        )
      )`;
    } else if (normLevel === "JEE") {
      params.push("\\mJEE\\M");
      const p = `$${params.length}`;
      query += ` AND (
        COALESCE("academicLevel", '') ~* ${p}
        OR COALESCE(board, '') ~* ${p}
        OR EXISTS (
          SELECT 1 FROM "TestAttempt" ta
          JOIN "Test" t ON ta."testId" = t.id
          WHERE ta."studentId" = "Student".id
          AND (COALESCE(t."targetBoard", '') ~* ${p} OR t.title ~* ${p})
        )
        OR EXISTS (
          SELECT 1 FROM "StudentDownload" sd
          JOIN "StudyMaterial" sm ON sd."studyMaterialId" = sm.id
          WHERE sd."studentId" = "Student".id
          AND (sm.title ~* ${p} OR COALESCE(sm.description, '') ~* ${p})
        )
      )`;
    } else if (normLevel.startsWith("SEM-")) {
      params.push(normLevel);
      query += ` AND UPPER(COALESCE("academicLevel", '')) = $${params.length}`;
    } else {
      params.push(normLevel);
      query += ` AND UPPER(COALESCE("academicLevel", '')) = $${params.length}`;
    }
  }

  // 3. Subscription Status Filter
  if (targetSub === "PAID" || targetSub === "ULTRA") {
    params.push("PAID", "COMPLIMENTARY", "ULTRA");
    query += ` AND "subscriptionStatus" IN ($${params.length - 2}, $${params.length - 1}, $${params.length})`;
  } else if (targetSub === "FREE") {
    params.push("FREE");
    query += ` AND (COALESCE("subscriptionStatus", 'FREE') = $${params.length})`;
  }

  return { sql: query, params };
}

/**
 * Estimates audience count for announcement targeting based on real database records.
 */
export async function estimateAudienceCount(filter?: AnnouncementAudienceFilter): Promise<number> {
  await ensureNotificationSchema();
  const { sql, params } = buildAudienceQuery(filter);

  try {
    const countRes: any[] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(DISTINCT id)::int AS count FROM "Student" ${sql};`,
      ...params
    );
    return countRes && countRes[0] ? Number(countRes[0].count) : 0;
  } catch (err: any) {
    console.error("Estimate audience query error:", err?.message || err);
    return 0;
  }
}

/**
 * Validates and sanitizes action URL to prevent open-redirect vulnerabilities.
 */
export function sanitizeActionUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Allow relative URLs starting with /
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) {
    return trimmed;
  }

  // Allow official domain
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" && parsed.hostname === "piechem.vercel.app") {
      return trimmed;
    }
  } catch {}

  // Reject arbitrary external links or javascript: protocols
  return null;
}

/**
 * Dispatches a targeted administrator announcement to eligible students.
 * Deduplicates recipients, enforces bounded batches, and reports accurate counts.
 */
export async function dispatchAdminAnnouncement(params: AdminAnnouncementInput): Promise<{
  success: boolean;
  totalTargeted: number;
  attemptedCount: number;
  insertedCount: number;
  skippedCount: number;
  failedCount: number;
  successCount: number;
  batchCount: number;
  announcementId: string;
}> {
  await ensureNotificationSchema();

  const {
    title,
    message,
    category = "announcements",
    priority = false,
    actionLabel,
    actionUrl,
    announcementId = `annc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    filter
  } = params;

  const sanitizedUrl = sanitizeActionUrl(actionUrl);
  const { sql, params: queryParams } = buildAudienceQuery(filter);

  // Fetch unique matching student IDs
  const students: any[] = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT id FROM "Student" ${sql};`,
    ...queryParams
  );

  if (!students || students.length === 0) {
    return {
      success: true,
      totalTargeted: 0,
      attemptedCount: 0,
      insertedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      successCount: 0,
      batchCount: 0,
      announcementId
    };
  }

  const notificationInputs: CreateNotificationInput[] = students.map((st) => ({
    studentId: st.id,
    type: "admin_announcement",
    category,
    title,
    message,
    metadata: {
      announcementId,
      targetBoard: filter?.targetBoard || "ALL",
      targetAcademicLevel: filter?.targetAcademicLevel || "ALL",
      targetSubscription: filter?.targetSubscription || "ALL",
      dispatchedAt: new Date().toISOString()
    },
    actionLabel: actionLabel?.trim() || null,
    actionUrl: sanitizedUrl,
    priority: Boolean(priority),
    eventKey: `annc_${announcementId}_${st.id}`
  }));

  const batchResult = await createNotificationsBatch(notificationInputs, 200);

  return {
    success: true,
    totalTargeted: students.length,
    attemptedCount: batchResult.totalProcessed,
    insertedCount: batchResult.insertedCount,
    skippedCount: batchResult.skippedCount,
    failedCount: batchResult.failedCount,
    successCount: batchResult.insertedCount,
    batchCount: batchResult.batchCount,
    announcementId
  };
}

/**
 * Triggered on verified payment success (Paytm webhook or Admin manual approval).
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
    message: `Your payment of ₹${amount} for ${planName} has been verified successfully. Reference: ${refCode}. Date: ${dateFormatted}.`,
    metadata: {
      amount,
      planName,
      txnId: refCode,
      paymentDate: dateFormatted,
      status: "Successful"
    },
    actionLabel: "View Membership Details",
    actionUrl: "/dashboard/account",
    priority: true,
    eventKey
  });
}

/**
 * Triggered on membership activation or renewal to PIE Ultra / PIE Pro.
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
    ? `Your VIP membership is active until ${expiryFormatted}. Unlimited Chemistry exams, PIE AI Tutor queries, 3D molecular models & notes downloads unlocked.`
    : `Your ${planName} subscription is active until ${expiryFormatted}. Daily Practice Problems, 3D models & national percentile rankings unlocked.`;

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
      isComplimentary: Boolean(isComplimentary),
      benefits: isUltra ? [
        "Unlimited Chemistry exams",
        "PIE AI Tutor access",
        "3D molecular models",
        "Digital library downloads"
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

  const { materialId, title, board, academicLevel = "ALL", discipline, category, isPremium } = params;
  
  const rawBoard = board ? String(board).trim() : "";
  if (!rawBoard || rawBoard.toUpperCase() === "UNKNOWN" || rawBoard.toUpperCase() === "UNDEFINED") {
    console.warn(`[notifyContentPublished] Safe fallback: Missing or ambiguous board metadata for material "${title}" (${materialId}). Skipping broadcast to avoid accidentally notifying the entire student population.`);
    return;
  }

  const targetBoard = rawBoard.toUpperCase();
  const targetLevel = (academicLevel || "ALL").toUpperCase().trim();
  const normTargetLevel = normalizeAcademicLevel(targetLevel);

  // 1. Query students based on board criteria (deduplicated)
  let studentsQuery = `SELECT DISTINCT id, board, "academicLevel" FROM "Student" WHERE "status" = 'ACTIVE'`;
  const queryParams: any[] = [];

  if (targetBoard !== "ALL" && targetBoard !== "ALL CURRICULUMS" && targetBoard !== "3D_ANIMATION") {
    if (targetBoard === "ICSE" || targetBoard === "ISC") {
      queryParams.push("ICSE", "ISC");
      studentsQuery += ` AND UPPER(COALESCE(board, '')) IN ($${queryParams.length - 1}, $${queryParams.length})`;
    } else if (targetBoard === "NEET" || normTargetLevel === "NEET") {
      queryParams.push("\\mNEET\\M");
      const p = `$${queryParams.length}`;
      studentsQuery += ` AND (
        COALESCE(board, '') ~* ${p}
        OR COALESCE("academicLevel", '') ~* ${p}
        OR EXISTS (
          SELECT 1 FROM "TestAttempt" ta
          JOIN "Test" t ON ta."testId" = t.id
          WHERE ta."studentId" = "Student".id
          AND (COALESCE(t."targetBoard", '') ~* ${p} OR t.title ~* ${p})
        )
        OR EXISTS (
          SELECT 1 FROM "StudentDownload" sd
          JOIN "StudyMaterial" sm ON sd."studyMaterialId" = sm.id
          WHERE sd."studentId" = "Student".id
          AND (sm.title ~* ${p} OR COALESCE(sm.description, '') ~* ${p})
        )
      )`;
    } else if (targetBoard === "JEE" || normTargetLevel === "JEE") {
      queryParams.push("\\mJEE\\M");
      const p = `$${queryParams.length}`;
      studentsQuery += ` AND (
        COALESCE(board, '') ~* ${p}
        OR COALESCE("academicLevel", '') ~* ${p}
        OR EXISTS (
          SELECT 1 FROM "TestAttempt" ta
          JOIN "Test" t ON ta."testId" = t.id
          WHERE ta."studentId" = "Student".id
          AND (COALESCE(t."targetBoard", '') ~* ${p} OR t.title ~* ${p})
        )
        OR EXISTS (
          SELECT 1 FROM "StudentDownload" sd
          JOIN "StudyMaterial" sm ON sd."studyMaterialId" = sm.id
          WHERE sd."studentId" = "Student".id
          AND (sm.title ~* ${p} OR COALESCE(sm.description, '') ~* ${p})
        )
      )`;
    } else if (targetBoard.includes("ENTRANCE")) {
      queryParams.push("\\m(ENTRANCE|NEET|JEE|WBJEE)\\M");
      const p = `$${queryParams.length}`;
      studentsQuery += ` AND (
        COALESCE(board, '') ~* ${p}
        OR COALESCE("academicLevel", '') ~* ${p}
        OR UPPER(COALESCE("academicLevel", '')) IN ('NEET', 'JEE', 'WBJEE', 'CUET')
        OR EXISTS (
          SELECT 1 FROM "TestAttempt" ta
          JOIN "Test" t ON ta."testId" = t.id
          WHERE ta."studentId" = "Student".id
          AND (COALESCE(t."targetBoard", '') ~* ${p} OR t.title ~* ${p})
        )
        OR EXISTS (
          SELECT 1 FROM "StudentDownload" sd
          JOIN "StudyMaterial" sm ON sd."studyMaterialId" = sm.id
          WHERE sd."studentId" = "Student".id
          AND (sm.title ~* ${p} OR COALESCE(sm.description, '') ~* ${p})
        )
      )`;
    } else {
      queryParams.push(targetBoard);
      studentsQuery += ` AND UPPER(COALESCE(board, '')) = $${queryParams.length}`;
    }
  }

  const students: StudentTargetRow[] = await prisma.$queryRawUnsafe(studentsQuery, ...queryParams);
  if (!students || students.length === 0) return;

  // 2. Filter students further by academicLevel / class match
  const eligibleStudents = students.filter((st) => {
    if (targetLevel === "ALL" || normTargetLevel === "ALL") return true;

    const studentLevel = normalizeAcademicLevel(st.academicLevel || "");
    if (!studentLevel) return false;

    if (normTargetLevel === "11" || normTargetLevel === "ALL_11") {
      return studentLevel === "11" || studentLevel === "SEM-I" || studentLevel === "SEM-II";
    }
    if (normTargetLevel === "12" || normTargetLevel === "ALL_12") {
      return studentLevel === "12" || studentLevel === "SEM-III" || studentLevel === "SEM-IV";
    }
    if (normTargetLevel.startsWith("SEM-")) {
      return studentLevel === normTargetLevel;
    }
    if (["NEET", "JEE", "WBJEE", "CUET"].includes(normTargetLevel)) {
      return studentLevel === normTargetLevel || (st.board || "").toUpperCase().includes("ENTRANCE");
    }

    return studentLevel === normTargetLevel;
  });

  if (eligibleStudents.length === 0) return;

  const boardLabel = targetBoard === "ALL" ? "Chemistry" : targetBoard;
  const levelLabel = targetLevel === "ALL" ? "" : ` (${targetLevel})`;
  const notifTitle = `New ${boardLabel} Material: ${title}`;
  const notifMessage = `Fresh educational content published for ${boardLabel}${levelLabel}. Category: ${category || "Study Material"}.`;

  const notificationsToCreate: CreateNotificationInput[] = eligibleStudents.map((st) => ({
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
    actionLabel: "Open Study Material →",
    actionUrl: `/dashboard/pdf-viewer/${materialId}`,
    priority: false,
    eventKey: `content_${materialId}_${st.id}`
  }));

  await createNotificationsBatch(notificationsToCreate, 200);
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

  let studentsQuery = `SELECT DISTINCT id, board, "academicLevel" FROM "Student" WHERE "status" = 'ACTIVE'`;
  const queryParams: unknown[] = [];

  if (board !== "ALL" && board !== "ALL CURRICULUMS") {
    if (board === "ICSE" || board === "ISC") {
      queryParams.push("ICSE", "ISC");
      studentsQuery += ` AND UPPER(COALESCE(board, '')) IN ($${queryParams.length - 1}, $${queryParams.length})`;
    } else if (board === "NEET") {
      queryParams.push("\\mNEET\\M");
      studentsQuery += ` AND (COALESCE(board, '') ~* $${queryParams.length} OR COALESCE("academicLevel", '') ~* $${queryParams.length})`;
    } else if (board === "JEE") {
      queryParams.push("\\mJEE\\M");
      studentsQuery += ` AND (COALESCE(board, '') ~* $${queryParams.length} OR COALESCE("academicLevel", '') ~* $${queryParams.length})`;
    } else if (board.includes("ENTRANCE")) {
      queryParams.push("\\m(ENTRANCE|NEET|JEE|WBJEE)\\M");
      studentsQuery += ` AND (COALESCE(board, '') ~* $${queryParams.length} OR COALESCE("academicLevel", '') ~* $${queryParams.length})`;
    } else {
      queryParams.push(board);
      studentsQuery += ` AND UPPER(COALESCE(board, '')) = $${queryParams.length}`;
    }
  }

  const students: StudentTargetRow[] = await prisma.$queryRawUnsafe(studentsQuery, ...queryParams);
  if (!students || students.length === 0) return;

  const notificationsToCreate: CreateNotificationInput[] = students.map((st) => ({
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
    eventKey: `exam_${testId}_${st.id}`
  }));

  await createNotificationsBatch(notificationsToCreate, 200);
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
  const queryParams: unknown[] = [studentId];

  if (category && category !== "all") {
    queryParams.push(category);
    whereClause += ` AND "category" = $${queryParams.length}`;
  }

  const notifications: NotificationDbRow[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "Notification" 
     ${whereClause} 
     ORDER BY "priority" DESC, "createdAt" DESC 
     LIMIT ${limit} OFFSET ${offset};`,
    ...queryParams
  );

  const countRes: Array<{ count: number | bigint | string }> = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM "Notification" ${whereClause};`,
    ...queryParams
  );
  const total = countRes && countRes[0] ? Number(countRes[0].count) : 0;

  const unreadRes: Array<{ count: number | bigint | string }> = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM "Notification" WHERE "studentId" = $1 AND "readAt" IS NULL;`,
    studentId
  );
  const unreadCount = unreadRes && unreadRes[0] ? Number(unreadRes[0].count) : 0;

  const categoryCountsRes: Array<{ category: string; count: number | bigint | string }> = await prisma.$queryRawUnsafe(
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
 * Marks notifications as read for a specific student.
 * If notificationIds array is provided, acknowledges only those specific IDs.
 * Otherwise acknowledges all currently unread notifications for that student.
 */
export async function markAllNotificationsAsRead(studentId: string, notificationIds?: string[]) {
  await ensureNotificationSchema();

  if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
    const sanitizedIds = notificationIds.filter((id) => typeof id === "string" && id.trim().length > 0);
    if (sanitizedIds.length > 0) {
      const res: number = await prisma.$executeRawUnsafe(
        `UPDATE "Notification" 
         SET "readAt" = NOW() 
         WHERE "studentId" = $1 AND "id" = ANY($2::text[]) AND "readAt" IS NULL;`,
        studentId,
        sanitizedIds
      );
      return { success: true, count: res };
    }
  }

  const res: number = await prisma.$executeRawUnsafe(
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
 */
export async function seedContextualNotificationsForStudent(studentId: string) {
  await ensureNotificationSchema();

  const countRes: Array<{ count: number | bigint | string }> = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM "Notification" WHERE "studentId" = $1;`,
    studentId
  );
  const count = countRes && countRes[0] ? Number(countRes[0].count) : 0;
  
  if (count > 0) return;

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
  const isComp = Boolean(student.isComplimentary || student.subscriptionStatus === "COMPLIMENTARY" || student.subscriptionStatus === "ULTRA");
  const latestReq = student.upgradeRequests?.[0];

  if (latestReq && latestReq.status === "PENDING") {
    const isUltraReq = (latestReq.note || "").toLowerCase().includes("ultra") || latestReq.amount === 499 || latestReq.amount === 200;
    const planName = isUltraReq ? "PIE Ultra" : "PIE Pro";
    await createNotification({
      studentId,
      type: "payment_success",
      category: "payments",
      title: "Payment Verification In Progress",
      message: `Your payment of ₹${latestReq.amount || 99} for ${planName} (UTR: ${latestReq.utrNumber || "Submitted"}) is awaiting admin verification.`,
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

  if (isPaid || isComp) {
    const isUltra = (latestReq?.note || "").toLowerCase().includes("ultra") || latestReq?.amount === 499 || latestReq?.amount === 200;
    await notifyMembershipActivated({
      studentId,
      planTier: isUltra ? "ultra" : "pro",
      expiresAt: student.subscriptionExpiresAt,
      isComplimentary: isComp
    });
  }

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
