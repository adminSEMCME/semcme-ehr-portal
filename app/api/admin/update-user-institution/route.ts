import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseServer";
import { canManageUsers } from "@/lib/adminAccounts";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Use the website-admin role, never the Institution Administrator role.
    if (!canManageUsers(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const { userId, institutionId } = body ?? {};
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof userId !== "string" || !uuid.test(userId) ||
        typeof institutionId !== "string" || !uuid.test(institutionId)) {
      return NextResponse.json({ error: "Select a valid user and institution." }, { status: 400 });
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: institution, error: institutionError } = await admin
      .from("institutions").select("id, name").eq("id", institutionId).maybeSingle();
    if (institutionError) throw institutionError;
    if (!institution) {
      return NextResponse.json({ error: "Institution no longer exists. Refresh and try again." }, { status: 400 });
    }

    // Only this field changes; progress, certificates, roles and approval stay intact.
    const { data: profile, error } = await admin.from("profiles")
      .update({ institution_id: institution.id }).eq("id", userId)
      .select("id, institution_id").maybeSingle();
    if (error) throw error;
    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ userId: profile.id, institution_id: profile.institution_id, institution: institution.name });
  } catch (error) {
    console.error("Institution update failed:", error);
    return NextResponse.json({ error: "Unable to update institution. Please try again." }, { status: 500 });
  }
}
