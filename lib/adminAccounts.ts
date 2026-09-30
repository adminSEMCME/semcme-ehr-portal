export const PRIMARY_ADMIN_EMAIL = "admin@semcme.org";

// user_metadata is editable by account holders, so it cannot authorize edits.
export function canManageUsers(user: {
  email?: string;
  email_confirmed_at?: string;
  app_metadata?: Record<string, unknown>;
}) {
  return user.app_metadata?.role === "admin" ||
    (!!user.email_confirmed_at && user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase());
}

