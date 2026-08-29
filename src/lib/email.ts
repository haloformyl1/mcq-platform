const DEFAULT_EMAILJS_SERVICE_ID = "service_dzy9m19";
const DEFAULT_EMAILJS_TEMPLATE_ID = "template_ejptlnn";
const DEFAULT_EMAILJS_PUBLIC_KEY = "ZMyIGn4yoqfC3P74Q";

export const ADMIN_RECOVERY_EMAIL = process.env.ADMIN_RECOVERY_EMAIL || "arghyadeeproy25@gmail.com";

export async function sendOTP(email: string, otp: string) {
  const serviceId = process.env.EMAILJS_SERVICE_ID || DEFAULT_EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID || DEFAULT_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || DEFAULT_EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (serviceId && templateId && publicKey) {
    try {
      const data: any = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: email,
          otp: otp,
        },
      };

      if (privateKey) {
        data.accessToken = privateKey;
      }

      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(25000),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        console.error("EmailJS Error:", errorText);
        console.warn("⚠️ Continuing with local terminal OTP fallback.");
      } else {
        return true;
      }
    } catch (err: any) {
      console.error("EmailJS send failed:", err?.message || err);
    }
  }

  // Fallback: If no credentials provided or API failed, log OTP to console
  console.log("\n========================================");
  console.log("[LOCAL DEV MOCK EMAIL]");
  console.log(`Sending to: ${email}`);
  console.log(`Your OTP is: ${otp}`);
  console.log("========================================\n");

  return true;
}

export async function sendAdminRecoveryEmail(otp: string, username?: string) {
  const serviceId = process.env.EMAILJS_SERVICE_ID || DEFAULT_EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID || DEFAULT_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || DEFAULT_EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const targetEmail = ADMIN_RECOVERY_EMAIL;

  if (serviceId && templateId && publicKey) {
    try {
      const data: any = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: targetEmail,
          otp: otp,
          username: username || "admin",
          message: `MCQ Platform Admin Credential Recovery.\n\nYour Admin Username: ${username || "admin"}\nYour 6-digit OTP code: ${otp}\n\nUse this OTP to verify and reset your credentials. Valid for 10 minutes.`,
        },
      };

      if (privateKey) {
        data.accessToken = privateKey;
      }

      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(25000),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        console.error("EmailJS Admin Recovery Error:", errorText);
        console.warn("⚠️ Continuing with local terminal fallback.");
      } else {
        console.log(`✅ Email successfully sent via EmailJS to ${targetEmail}`);
        return true;
      }
    } catch (err: any) {
      console.error("EmailJS admin dispatch failed:", err?.message || err);
    }
  }

  // Fallback / local dev logging
  console.log("\n========================================");
  console.log("[ADMIN CREDENTIAL RECOVERY EMAIL DISPATCH]");
  console.log(`Target Email: ${targetEmail}`);
  console.log(`Admin Username: ${username || "admin"}`);
  console.log(`6-digit OTP: ${otp}`);
  console.log("========================================\n");

  return true;
}
