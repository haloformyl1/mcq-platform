/**
 * Shared utility to resolve a student's effective plan tier ('ultra' | 'pro' | null).
 *
 * Rules:
 * 1. An explicit planTier override takes priority.
 * 2. If student is not subscribed / not gold, returns null.
 * 3. A student is on 'ultra' if:
 *    - They are complimentary and have an active PAID status with an expiration date (30-day Ultra pass).
 *    - Their latest upgrade request amount is 200 (upgrade fee), 499, or >= 400.
 *    - Their latest request note, planName, or student plan contains "ultra".
 * 4. Otherwise, if subscribed / complimentary, returns 'pro'.
 */
export function resolveEffectivePlanTier(
  student?: any,
  upgradeReq?: any,
  explicitPlanTier?: "pro" | "ultra" | null
): "pro" | "ultra" | null {
  if (explicitPlanTier) return explicitPlanTier;
  if (!student) return null;

  const status = student?.subscriptionStatus ? String(student.subscriptionStatus).trim().toUpperCase() : "";
  const isUltra = status === "ULTRA";
  const isComp = Boolean(student?.isComplimentary || status === "COMPLIMENTARY");
  const isPaidActive =
    status === "PAID" &&
    (!student?.subscriptionExpiresAt ||
      new Date(student.subscriptionExpiresAt).getTime() > Date.now());

  if (!isUltra && !isComp && !isPaidActive) return null;

  // In the streamlined Free / Ultra system, all active subscribers enjoy Ultra VIP tier
  return "ultra";
}
