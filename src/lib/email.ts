export async function sendOTP(email: string, otp: string) {
  // If EmailJS credentials are provided in .env, use them
  if (process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY) {
    const data = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY, // Optional, for extra security
      template_params: {
        to_email: email,
        otp: otp,
      }
    };

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("EmailJS Error:", errorText);
      console.warn("⚠️ Continuing with local terminal OTP because EmailJS is misconfigured.");
      
      console.log("\n========================================");
      console.log(`[LOCAL DEV MOCK EMAIL]`);
      console.log(`Sending to: ${email}`);
      console.log(`Your OTP is: ${otp}`);
      console.log("========================================\n");
      return true; // Don't crash
    }
    
    return true;
  }

  // Fallback: If no credentials provided, log OTP to console so you can still log in
  console.log("\n========================================");
  console.log(`[LOCAL DEV MOCK EMAIL]`);
  console.log(`Sending to: ${email}`);
  console.log(`Your OTP is: ${otp}`);
  console.log("========================================\n");
  
  return true;
}
