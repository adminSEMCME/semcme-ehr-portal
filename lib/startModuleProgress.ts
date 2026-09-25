import type { SupabaseClient } from "@supabase/supabase-js";

export async function startModuleProgress(
  client: SupabaseClient,
  userId: string,
  moduleId: string,
) {
  const now = new Date().toISOString();
  // Initialize only once, including when two tabs launch concurrently.
  // Never overwrite saved progress or completion with dashboard state.
  const { error: insertError } = await client.from("module_progress").upsert(
    {
      user_id: userId,
      module_id: moduleId,
      status: "in_progress",
      progress_percent: 0,
      date_started: now,
      last_accessed: now,
    },
    { onConflict: "user_id,module_id", ignoreDuplicates: true },
  );
  if (insertError) throw insertError;

  const { error: updateError } = await client
    .from("module_progress")
    .update({ last_accessed: now })
    .eq("user_id", userId)
    .eq("module_id", moduleId);
  if (updateError) throw updateError;
}
