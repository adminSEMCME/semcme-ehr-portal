import { Resend } from "resend";

type Registration = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  institution: string;
};

const reviewUrl = "https://ehr.portal.semcme.org/admin-dashboard#adminApprovals";

function escapeHtml(value: string) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    };
    return entities[character];
  });
}

// Email failures must never roll back a successfully saved registration.
export async function notifyInstitutionAdminRegistration(registration: Registration) {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const details = [
      ["Name", `${registration.firstName} ${registration.lastName}`],
      ["Email", registration.email],
      ["Institution", registration.institution],
    ];
    const message = {
      from: "SEMCME EHR Portal <support@mail.semcme.org>",
      to: ["NJuzych@semcme.org"],
      subject: "New Institution Administrator registration awaiting approval",
      text: `A new Institution Administrator has registered and is awaiting approval.\n\n${details.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\nReview the request: ${reviewUrl}\nSign in as an administrator and open Admin Approvals to approve or deny this request.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#333">
        <h2 style="color:#02519c">Institution Administrator approval requested</h2>
        <p>A new Institution Administrator has registered and is awaiting approval.</p>
        ${details.map(([label, value]) => `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`).join("")}
        <p><a href="${reviewUrl}">Review registration in the admin dashboard</a></p>
        <p>Sign in as an administrator and open Admin Approvals to approve or deny this request.</p>
      </div>`,
    };

    // A stable key prevents duplicate delivery if the first response is lost.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { error } = await resend.emails.send(message, {
          idempotencyKey: `institution-admin-registration/${registration.userId}`,
        });
        if (error) throw new Error(`${error.name}: ${error.message}`);
        return true;
      } catch (error) {
        if (attempt === 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error("IA registration notification failed; request remains pending:", {
      userId: registration.userId,
      error: error instanceof Error ? error.message : "Unknown email error",
    });
  }
  return false;
}
