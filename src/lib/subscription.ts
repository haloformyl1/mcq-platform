import prisma from "@/lib/prisma";

export async function autoExpireSubscriptions() {
  try {
    const now = new Date();
    await prisma.student.updateMany({
      where: {
        subscriptionStatus: "PAID",
        subscriptionExpiresAt: {
          not: null,
          lte: now
        }
      },
      data: {
        subscriptionStatus: "FREE"
      }
    });
  } catch (error) {
    console.error("Auto expire subscriptions error:", error);
  }
}

export function hasPremiumAccess(subscriptionStatus: string | null | undefined): boolean {
  return subscriptionStatus === "PAID" || subscriptionStatus === "COMPLIMENTARY";
}

export function formatDateTime24(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}