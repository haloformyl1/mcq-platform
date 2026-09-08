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
        console.warn("Continuing with local terminal OTP fallback.");
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
        console.warn("Continuing with local terminal fallback.");
      } else {
        console.log(`Email successfully sent via EmailJS to ${targetEmail}`);
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

export interface SubscriptionUpgradeEmailParams {
  email: string;
  name?: string | null;
  amount?: number | null;
  expiresAt?: Date | string | null;
  activeSince?: Date | string | null;
}

export async function sendSubscriptionUpgradeEmail(params: SubscriptionUpgradeEmailParams) {
  const { email, name, amount = 199, expiresAt } = params;
  const studentName = name || "Student";
  const validUntilStr = expiresAt 
    ? new Date(expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "30 Days from today";
  const formattedFee = amount ? `₹${amount}` : "₹199";

  // 1. If custom SMTP is provided in env, dispatch via nodemailer
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const htmlContent = `
        <div style="background-color:#030811; color:#f8fafc; font-family:Arial,sans-serif; max-width:600px; margin:0 auto; padding:30px 20px; border-radius:16px; border:1px solid rgba(245,158,11,0.3);">
          <div style="text-align:center; padding-bottom:20px;">
            <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:900; letter-spacing:-0.5px;">PIECHEM EXAM PLATFORM</h1>
            <p style="color:#f59e0b; font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:2px; margin-top:5px;">Gold Membership Activated</p>
          </div>
          
          <div style="background-color:rgba(10,21,36,0.8); border:1px solid rgba(245,158,11,0.2); border-radius:12px; padding:24px; margin-bottom:24px;">
            <h2 style="color:#ffffff; font-size:18px; margin-top:0;">Hello ${studentName},</h2>
            <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">
              Great news! Your payment of <strong>${formattedFee}</strong> has been officially verified by Administrator <strong>Arghyadeep Roy</strong>.
            </p>
            <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">
              Your <strong>30-Day All-Access Pass</strong> is now active and valid until <strong style="color:#fcd34d;">${validUntilStr}</strong>.
            </p>
            
            <div style="background-color:#030811; border-left:4px solid #10b981; padding:12px 16px; margin:20px 0; border-radius:4px;">
              <p style="color:#10b981; font-weight:bold; font-size:13px; margin:0;">Unlocked Gold Benefits:</p>
              <ul style="color:#94a3b8; font-size:13px; margin:8px 0 0 0; padding-left:20px;">
                <li>Unlimited attempts on all 50+ Chemistry Exams</li>
                <li>Full step-by-step solutions & 3D Molecular Models</li>
                <li>Proctored national percentiles and chapter analytics</li>
              </ul>
            </div>

            <div style="text-align:center; margin-top:25px;">
              <a href="https://piechem.vercel.app/dashboard" style="background:linear-gradient(to right, #f59e0b, #eab308); color:#020617; text-decoration:none; padding:14px 28px; border-radius:10px; font-weight:bold; font-size:14px; display:inline-block; text-transform:uppercase; letter-spacing:1px;">
                Start Practicing Tests Now
              </a>
            </div>
          </div>

          <div style="text-align:center; color:#64748b; font-size:11px; line-height:1.5;">
            <p style="margin:0;">For support or inquiries, contact Administrator Arghyadeep Roy: <a href="tel:9830507435" style="color:#38bdf8;">9830507435</a></p>
            <p style="margin:5px 0 0 0;">PIECHEM Smart Exam Platform • All rights reserved</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"PIECHEM Exam Platform" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "🎉 Your PIECHEM Gold Membership is Active!",
        html: htmlContent,
      });

      console.log(`[SUBSCRIPTION UPGRADE EMAIL] Sent successfully to ${email} via SMTP.`);
      return true;
    } catch (err) {
      console.error("[SUBSCRIPTION UPGRADE EMAIL] SMTP dispatch failed:", err);
    }
  }

  // 2. Try EmailJS
  const serviceId = process.env.EMAILJS_SERVICE_ID || DEFAULT_EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_UPGRADE_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID || DEFAULT_EMAILJS_TEMPLATE_ID;
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
          student_name: studentName,
          amount: formattedFee,
          valid_until: validUntilStr,
          message: `Hello ${studentName},\n\nYour payment of ${formattedFee} has been approved by Administrator Arghyadeep Roy.\nYour 30-Day Gold Membership is now active until ${validUntilStr}.\n\nAll 50+ Chemistry Exams, 3D Models, and proctored percentiles are unlocked.\n\nLogin at: https://piechem.vercel.app/dashboard`,
        },
      };
      if (privateKey) data.accessToken = privateKey;

      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(20000),
      });

      if (res.ok) {
        console.log(`[SUBSCRIPTION UPGRADE EMAIL] Sent via EmailJS to ${email}`);
        return true;
      }
    } catch (err: any) {
      console.error("[SUBSCRIPTION UPGRADE EMAIL] EmailJS failed:", err?.message || err);
    }
  }

  // 3. Fallback dev console logging
  console.log("\n========================================");
  console.log("[GOLD SUBSCRIPTION ACTIVATION EMAIL DISPATCH]");
  console.log(`To: ${email} (${studentName})`);
  console.log(`Amount: ${formattedFee}`);
  console.log(`Valid Until: ${validUntilStr}`);
  console.log("Status: Gold Membership Activated (30 Days)");
  console.log("========================================\n");

  return true;
}
