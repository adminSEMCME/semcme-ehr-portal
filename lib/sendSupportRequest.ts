import { NextResponse } from "next/server";
import { Resend } from "resend";
import { attachmentTypes, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS, supportForms, type SupportKind } from "@/lib/supportForms";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendSupportRequest(request: Request, kind: SupportKind) {
  try {
    const form = await request.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
    const read = (key: string) => typeof form.get(key) === "string" ? (form.get(key) as string).trim() : "";
    const name = read("name"), email = read("email"), category = read("category"), message = read("message");
    const accountName = read("accountName"), accountEmail = read("accountEmail"), institution = read("institution"), moduleName = read("module");
    const config = supportForms[kind];
    if (!name || name.length > 150 || !emailPattern.test(email) || email.length > 254 ||
      !(config.categories as readonly string[]).includes(category) || !message || message.length > 10000 || moduleName.length > 300 ||
      (kind === "account" && (!accountName || accountName.length > 150 || !emailPattern.test(accountEmail) || accountEmail.length > 254 || !institution || institution.length > 200))) {
      return NextResponse.json({ error: "Please complete all required fields and select a valid category." }, { status: 400 });
    }
    const files = form.getAll("attachments");
    if (files.length > MAX_ATTACHMENTS || files.some((file) => typeof file === "string" || !attachmentTypes.includes(file.type)) ||
      files.reduce((sum, file) => sum + (typeof file === "string" ? 0 : file.size), 0) > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json({ error: "Choose up to 3 PNG, JPG, PDF, or TXT files totaling no more than 3 MB." }, { status: 400 });
    }
    const attachments = await Promise.all((files as File[]).map(async (file) => ({ filename: file.name, content: Buffer.from(await file.arrayBuffer()), contentType: file.type })));
    const details = [
      ["Submitted by", name], ["Reply email", email], ["Category", category],
      ...(kind === "account" ? [["User's current name", accountName], ["User's current email", accountEmail], ["Requester's institution", institution]] : [["Module or page", moduleName || "Not specified"]]),
      [config.messageLabel, message],
    ];
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "SEMCME Support <support@mail.semcme.org>",
      to: ["sross@semcme.org", "NJuzych@semcme.org"],
      replyTo: email,
      subject: `${config.title}: ${category} — ${name.replace(/[\r\n]/g, " ")}`,
      text: `${config.title}\n\n${details.map(([label, value]) => `${label}: ${value}`).join("\n\n")}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;border:1px solid #e2e8f0;border-top:4px solid #0d9488;border-radius:12px;padding:28px"><h1 style="color:#02519c;font-size:24px">${escapeHtml(config.title)}</h1>${details.map(([label, value]) => `<p><strong>${escapeHtml(label)}</strong><br><span style="white-space:pre-wrap">${escapeHtml(value)}</span></p>`).join("")}<p style="color:#64748b">SEMCME EHR Learning Portal</p></div>`,
      attachments,
    });
    if (error) {
      console.error("Support email delivery failed:", error);
      return NextResponse.json({ error: "Your submission could not be sent. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Support submission failed:", error);
    return NextResponse.json({ error: "Your submission could not be sent. Please try again." }, { status: 500 });
  }
}
