"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, UserRoundPen, Wrench } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { attachmentTypes, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS, supportForms, type SupportKind } from "@/lib/supportForms";

import { DEFAULT_INSTITUTIONS } from "@/lib/defaultInstitutions";

const fieldClass = "mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 transition focus:border-blue-500 focus:bg-white";

const accountChangeExamples: Record<string, string> = {
  Name: "Current name: Jhn Doe\nUpdated name: John Doe",
  "Email address": "Current email: Jdo@gmail.com\nUpdated email: JDoe@gmail.com",
  Institution: "Current institution: Henry Ford Health\nUpdated institution: Corewell Health Royal Oak",
  "Role / learner group": "Current role: Medical Student\nUpdated role: Resident / Fellow",
};
const defaultAccountExample = "Current name: Jhn Doe\nUpdated name: John Doe\n\nCurrent email: Jdo@gmail.com\nUpdated email: JDoe@gmail.com";

export default function SupportForm({ kind }: { kind: SupportKind }) {
  const config = supportForms[kind];
  const Icon = kind === "account" ? UserRoundPen : kind === "technical" ? Wrench : MessageSquare;
  const [category, setCategory] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const sending = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    files.forEach((file) => data.append("attachments", file));
    sending.current = true;
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const response = await fetch(`/api/support/${kind}`, { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Unable to send your request. Please try again.");
      form.reset();
      setCategory("");
      setFiles([]);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send your request. Please try again.");
    } finally {
      sending.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <AppHeader action="back" />
      <div className="mx-auto mt-6 max-w-3xl px-4 sm:mt-10 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-white/40 bg-white shadow-xl">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-7 sm:px-9">
            <div className="mb-4 flex items-center gap-3 text-sm font-bold tracking-wide text-semcmeBlue"><Icon aria-hidden="true" className="h-5 w-5" /> SEMCME SUPPORT</div>
            <h1 className="text-2xl font-bold text-semcmeBlue sm:text-3xl">{config.title}</h1>
            <p className="mt-3 text-slate-600">{config.description}</p>
          </div>
          <div className="px-6 py-7 sm:px-9">
            <p className="mb-6 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><Mail aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />Your submission goes to SEMCME team members. We will reply to the email address you provide.</p>
            {success && <p role="status" className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">Thank you! Your submission has been sent to SEMCME team members.</p>}
            {error && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
            <form onSubmit={submit}>
              <fieldset disabled={loading} className="space-y-6 disabled:opacity-70">
                <legend className="mb-4 text-sm text-slate-500">All fields are required unless marked optional.</legend>
                <div className={kind === "account" ? "space-y-5 rounded-xl border border-slate-200 p-5" : "space-y-5"}>
                  {kind === "account" && <div><h2 className="font-bold text-semcmeBlue">Institution Administrator submitting this request</h2><p className="mt-1 text-sm text-slate-500">Enter your contact details here so our team can follow up with you.</p></div>}
                  <div className="grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-bold text-slate-700" htmlFor="support-name">{kind === "account" ? "IA name (your name)" : "Your name"}<input id="support-name" name="name" autoComplete="name" required maxLength={150} className={fieldClass} /></label>
                  <label className="text-sm font-bold text-slate-700" htmlFor="support-email">{kind === "account" ? "IA email (your email)" : "Your email"}<input id="support-email" name="email" type="email" autoComplete="email" required maxLength={254} className={fieldClass} /></label>
                  </div>
                  {kind === "account" && <label className="block text-sm font-bold text-slate-700" htmlFor="requester-institution">IA institution (your institution)<input id="requester-institution" name="institution" required maxLength={200} className={fieldClass} /></label>}
                </div>
                <label className="block text-sm font-bold text-slate-700" htmlFor="support-category">{config.categoryLabel}<select id="support-category" name="category" required value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}><option value="" disabled>Select an option</option>{config.categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                {kind === "account" ? <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="font-bold text-semcmeBlue">User whose account needs updating</h2>
                  <p className="text-sm text-slate-500">Enter the current details of the user you are requesting changes for.</p>
                  <label className="block text-sm font-bold text-slate-700" htmlFor="account-name">User&apos;s current name<input id="account-name" name="accountName" required maxLength={150} className={fieldClass} /></label>
                  <label className="block text-sm font-bold text-slate-700" htmlFor="account-email">User&apos;s current account email<input id="account-email" name="accountEmail" type="email" required maxLength={254} className={fieldClass} /></label>
                  {(category === "Institution" || category === "Multiple account details") && <div>
                    <label className="block text-sm font-bold text-slate-700" htmlFor="new-institution">User&apos;s new institution{category === "Multiple account details" ? " (optional)" : ""}
                      <select id="new-institution" name="newInstitution" required={category === "Institution"} defaultValue="" className={fieldClass}>
                        <option value="">{category === "Institution" ? "Select the user's new institution" : "No institution change"}</option>
                        {DEFAULT_INSTITUTIONS.map((institution) => <option key={institution} value={institution}>{institution}</option>)}
                      </select>
                    </label>
                    <p className="mt-2 text-sm text-slate-500">Select the institution the user should belong to. Only SEMCME default institutions are listed.</p>
                  </div>}
                </div> : <label className="block text-sm font-bold text-slate-700" htmlFor="support-module">Module or page (optional)<input id="support-module" name="module" maxLength={300} placeholder="Module title, number, or page address" className={fieldClass} /></label>}
                <div><label className="text-sm font-bold text-slate-700" htmlFor="support-message">{config.messageLabel}</label><p id="message-hint" className="mt-1 text-sm text-slate-500">{config.messageHint}</p><textarea id="support-message" name="message" placeholder={kind === "account" ? (accountChangeExamples[category] ?? defaultAccountExample) : undefined} required maxLength={10000} rows={6} aria-describedby="message-hint" className={`${fieldClass} resize-y`} /></div>
                <div className="rounded-xl border border-dashed border-slate-300 p-5">
                  <label htmlFor="support-files" className="text-sm font-bold text-slate-700">Attachments (optional)</label>
                  <p id="attachment-hint" className="mt-1 text-sm text-slate-500">PNG, JPG, PDF, or TXT. Up to 3 files, 3 MB total. Please omit passwords and patient information.</p>
                  <input ref={fileInput} id="support-files" type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.txt" aria-describedby="attachment-hint" className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-bold file:text-blue-900" onChange={(event) => {
                    const next = [...files, ...Array.from(event.target.files ?? [])];
                    if (next.length > MAX_ATTACHMENTS || next.reduce((sum, file) => sum + file.size, 0) > MAX_ATTACHMENT_BYTES || next.some((file) => !attachmentTypes.includes(file.type))) {
                      setError("Choose up to 3 PNG, JPG, PDF, or TXT files totaling no more than 3 MB.");
                    } else { setFiles(next); setError(""); }
                    event.target.value = "";
                  }} />
                  {files.length > 0 && <ul className="mt-3 space-y-2">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 break-words">{file.name}</span><Button type="button" variant="ghost" size="sm" aria-label={`Remove ${file.name}`} onClick={() => setFiles(files.filter((_, i) => i !== index))}>Remove</Button></li>)}</ul>}
                </div>
                <Button type="submit" disabled={loading} size="xl" className="w-full whitespace-normal">{loading ? "Sending..." : config.button}</Button>
              </fieldset>
            </form>
          </div>
        </div>
        <nav aria-label="Other support forms" className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-white">{(Object.keys(supportForms) as SupportKind[]).filter((key) => key !== kind).map((key) => <Link key={key} href={`/support/${key}`} className="underline underline-offset-4 hover:text-blue-100">{supportForms[key].title}</Link>)}</nav>
      </div>
    </div>
  );
}
