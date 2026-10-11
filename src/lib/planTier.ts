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

  const status = student?.subscriptionStatus;
  const isComp = Boolean(student?.isComplimentary || status === "COMPLIMENTARY");
  const isPaidActive =
    status === "PAID" &&
    (!student?.subscriptionExpiresAt ||
      new Date(student.subscriptionExpiresAt).getTime() > Date.now());

  if (!isComp && !isPaidActive) return null;

  // Rule A: Complimentary student upgraded to 30-day Ultra
  if (isComp && isPaidActive && Boolean(student?.subscriptionExpiresAt)) {
    return "ultra";
  }

  // Rule B: Check upgrade request details (passed directly or in student.upgradeRequests)
  const req =
    upgradeReq ||
    (Array.isArray(student?.upgradeRequests) ? student.upgradeRequests[0] : null);

  const planText = (
    student?.subscriptionPlanName ||
    student?.planName ||
    student?.plan ||
    req?.note ||
    req?.purchasedClass ||
    req?.planName ||
    ""
  ).toLowerCase();

  const amount = Number(req?.amount) || 0;

  if (
    planText.includes("ultra") ||
    amount === 200 ||
    amount === 499 ||
    amount >= 400
  ) {
    return "ultra";
  }

  return "pro";
}
