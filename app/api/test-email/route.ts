import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: "SEMCME <onboarding@resend.dev>",
      to: "shanectr@umich.edu",
      subject: "Resend test - SEMCME",
      html: `
        <h2>✅ Resend is working</h2>
        <p>This is a test email from your SEMCME app.</p>
      `,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Email test failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
