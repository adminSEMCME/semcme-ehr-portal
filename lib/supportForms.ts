export const supportForms = {
  account: {
    title: "User Account Changes",
    description: "Institution administrators: request a correction to a user's account. The SEMCME team will review and make the change.",
    categoryLabel: "What needs to change?",
    categories: ["Name", "Email address", "Institution", "Role / learner group", "Multiple account details", "Other"],
    messageLabel: "Requested changes",
    messageHint: "Include the current details and the correct replacement for each field that needs to change.",
    button: "Send account change request",
  },
  technical: {
    title: "Technical Help",
    description: "Having trouble using the EHR Learning Portal? Tell us what happened so we can help you get back to learning.",
    categoryLabel: "What are you having trouble with?",
    categories: ["Sign-in or password reset", "Registration or email confirmation", "Modules missing or unavailable", "Module content or video not loading", "Progress or completion not saving", "Assessment or evaluation not submitting", "Certificate not generating or downloading", "Continuing education credit", "Simulated EHR activity", "Institution Administrator Dashboard or learner reports", "Other"],
    messageLabel: "Describe the issue",
    messageHint: "Tell us what you were trying to do, what happened, and any error message. Include your browser and device if relevant.",
    button: "Send technical help request",
  },
  program: {
    title: "Module Feedback & Suggestions",
    description: "Help us improve the EHR learning experience. Share a module review, suggest a change, or recommend a topic.",
    categoryLabel: "What would you like to share?",
    categories: ["Module review", "Content correction or clarification", "Suggested module improvement", "New topic or module suggestion", "Accessibility or usability feedback", "General program feedback", "Other"],
    messageLabel: "Your feedback",
    messageHint: "Share what worked well and what we could improve. For a content correction, include the module and section or question.",
    button: "Send feedback",
  },
} as const;

export type SupportKind = keyof typeof supportForms;
export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
export const MAX_ATTACHMENTS = 3;
export const attachmentTypes = ["image/png", "image/jpeg", "application/pdf", "text/plain"];
