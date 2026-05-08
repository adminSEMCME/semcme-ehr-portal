import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: "Technical Support Request <tech@mail.semcme.org>",
      to: ["sross@semcme.org"],
      subject: `Tech Support Request from ${name}`,
      replyTo: email,

      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">

        <div style="background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 4px solid #02519c;">
          <img
            src="https://ehr.portal.semcme.org/logos/semcme_logo.jpg"
            alt="SEMCME Logo"
            style="max-width: 200px; height: auto;"
          />
        </div>

        <div style="padding: 30px;">
          <h2 style="color: #02519c;">Technical Support Request</h2>

          <p>A new technical support request has been submitted.</p>

          <p><strong>Name:</strong><br/>${name}</p>

          <p>
            <strong>Email:</strong><br/>
            <a href="mailto:${email}" style="color:#02519c;">
              ${email}
            </a>
          </p>

          <div style="margin-top:20px;">
            <p style="font-weight:bold;">Message:</p>
            <div style="
              background:#f4f6f8;
              border:1px solid #d1d5db;
              padding:15px;
              border-radius:6px;
            ">
              ${message}
            </div>
          </div>

          <p style="margin-top:30px; font-size:13px; color:#6b7280;">
            — SEMCME EHR Portal
          </p>
        </div>
      </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
