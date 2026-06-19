// supabase/functions/delete-account/index.ts
//
// Permanently deletes the authenticated user's account: removes the
// auth.users row, which cascades through ON DELETE CASCADE to wipe
// every row tied to this user across profiles, plans, journal_entries,
// chat_messages, water_history, exercise_completions, feedback,
// plan_history. Required for Google Play / Apple compliance.
//
// We need the service-role key to call admin.deleteUser — that bypasses
// RLS. Only the authenticated user themselves can trigger their own
// deletion (verified via the JWT they pass).

import { preflight, json } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return json({ error: 'missing auth' }, 401);

  // Verify the JWT and extract the user id by calling /auth/v1/user
  const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SERVICE_ROLE },
  });
  if (!userResp.ok) return json({ error: 'invalid token' }, 401);
  const userData = (await userResp.json()) as { id?: string };
  const userId = userData.id;
  if (!userId) return json({ error: 'user not found' }, 401);

  // Hard delete the user — cascades to all owned rows.
  const delResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${SERVICE_ROLE}`, apikey: SERVICE_ROLE },
  });
  if (!delResp.ok) {
    const text = await delResp.text();
    return json({ error: `delete failed: ${text}` }, 500);
  }

  return json({ ok: true });
});
