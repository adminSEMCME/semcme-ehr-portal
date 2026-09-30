import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseServer";
import { canManageUsers, PRIMARY_ADMIN_EMAIL } from "@/lib/adminAccounts";
import { userRoles } from "@/lib/userRoles";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Institution Administrators do not have the website-admin role.
    if (!canManageUsers(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => null);
    const { userId, institutionId, role } = body ?? {};
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof userId !== "string" || !uuid.test(userId) ||
      (institutionId !== null && (typeof institutionId !== "string" || !uuid.test(institutionId))) ||
      !firstName || firstName.length > 150 || !lastName || lastName.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      !(userRoles as readonly unknown[]).includes(role)) {
      return NextResponse.json({ error: "Enter a valid name, email, institution, and role." }, { status: 400 });
    }
    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: previous, error: profileError } = await admin.from("profiles")
      .select("id, email, first_name, last_name, role, institution_id, is_approved").eq("id", userId).maybeSingle();
    if (profileError) throw profileError;
    if (!previous) return NextResponse.json({ error: "User not found." }, { status: 404 });
    const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
    if (targetError || !target.user) throw targetError || new Error("Sign-in account not found");
    if (canManageUsers(target.user) || target.user.user_metadata?.role === "admin" || previous.role === "admin" ||
      target.user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: "Website administrator accounts cannot be changed through learner management." }, { status: 403 });
    }

    let institution: { id: string; name: string } | null = null;
    if (institutionId !== null) {
      const { data, error } = await admin.from("institutions").select("id, name").eq("id", institutionId).maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Institution no longer exists. Refresh and try again." }, { status: 400 });
      institution = data;
    }
    if (role === "Institution Administrator" && !institution) {
      return NextResponse.json({ error: "Institution Administrators must have an institution." }, { status: 400 });
    }

    // Update Auth first so duplicate sign-in emails cannot leave the profile changed.
    const emailChanged = target.user.email?.toLowerCase() !== email;
    if (emailChanged) {
      const { error } = await admin.auth.admin.updateUserById(userId, { email, email_confirm: true });
      if (error) return NextResponse.json({ error: error.code === "email_exists" || error.code === "email_conflict" || error.status === 422
        ? "That email address is already in use or is invalid. Choose another email."
        : "Unable to update the sign-in email. Please try again." }, { status: 400 });
    }
    // A newly assigned IA (or an IA moving institutions) must be approved again.
    const needsApproval = role === "Institution Administrator" &&
      (previous.role !== role || previous.institution_id !== institutionId);
    const isApproved = needsApproval ? false : role !== "Institution Administrator" ? true : previous.is_approved;
    const { data: updated, error: updateError } = await admin.from("profiles").update({
      first_name: firstName, last_name: lastName, email, institution_id: institutionId, role, is_approved: isApproved,
    }).eq("id", userId).select("id, email, first_name, last_name, institution_id, role, is_approved").maybeSingle();
    if (updateError || !updated) {
      if (emailChanged) {
        const { error: rollbackError } = await admin.auth.admin.updateUserById(userId, { email: target.user.email, email_confirm: !!target.user.email_confirmed_at });
        if (rollbackError) {
          console.error("User update email rollback failed:", userId, rollbackError);
          return NextResponse.json({ error: "The sign-in email changed, but the profile could not be saved. Retry saving these details to synchronize the account." }, { status: 500 });
        }
      }
      throw updateError || new Error("User no longer exists");
    }
    return NextResponse.json({ ...updated, institution: institution?.name ?? null, needsApproval });
  } catch (error) {
    console.error("User update failed:", error);
    return NextResponse.json({ error: "Unable to update user. Please try again." }, { status: 500 });
  }
}
