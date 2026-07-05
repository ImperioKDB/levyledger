import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fibolqhqrettfzasdeyn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_n3ICy7zL7VdQnDoROwv32w_YEKrhfyx'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// MVP scope: LevyLedger only serves University of Benin faculties. Every
// treasury slug is guaranteed to start with "uniben-" via generateFacultySlug,
// so the fleet can always be located by slug prefix regardless of what free
// text ends up in the `university` column.
export const UNIBEN_UNIVERSITY_NAME = 'University of Benin'

export interface DepartmentRequest {
  id: string
  university: string
  department: string
  slug: string
  exec_1: string
  exec_2: string
  exec_3: string
  exec_4: string
  exec_5: string
  submitter_name: string | null
  submitter_contact: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
}

export interface StudentProfile {
  wallet_address: string
  full_name: string
  matric_number: string
  faculty_slug: string
  created_at: string
}

export async function submitDepartmentRequest(data: {
  university: string
  department: string
  slug: string
  execs: string[]
  submitterName: string
  submitterContact: string
}) {
  // Directory-first guard: block duplicate/flooded requests for a faculty
  // that already has a pending or approved slug. Manual admin vetting still
  // happens after this point -- this only stops silent duplicates.
  const { data: existing, error: checkError } = await supabase
    .from('department_requests')
    .select('id')
    .eq('slug', data.slug)
    .in('status', ['pending', 'approved'])
    .maybeSingle()
  if (checkError) throw checkError
  if (existing) {
    throw new Error(
      'A faculty with this name is already registered or pending review. Contact a LevyLedger admin if you believe this is a mistake.'
    )
  }

  const { error } = await supabase.from('department_requests').insert({
    university: data.university,
    department: data.department,
    slug: data.slug,
    exec_1: data.execs[0],
    exec_2: data.execs[1],
    exec_3: data.execs[2],
    exec_4: data.execs[3],
    exec_5: data.execs[4],
    submitter_name: data.submitterName || null,
    submitter_contact: data.submitterContact || null,
  })
  if (error) throw error
}

export async function fetchPendingRequests(): Promise<DepartmentRequest[]> {
  const { data, error } = await supabase
    .from('department_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as DepartmentRequest[]
}

export async function fetchApprovedRequests(): Promise<DepartmentRequest[]> {
  const { data, error } = await supabase
    .from('department_requests')
    .select('*')
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })
  if (error) throw error
  return data as DepartmentRequest[]
}

// Directory used by the homepage aggregate hero and the /universities
// (faculties) listing page. Filters by slug rather than the free-text
// university column, since the slug is the value actually used to derive
// the on-chain treasury PDA and is guaranteed consistent. Matches both the
// per-faculty shape ("uniben-eng") and the bare legacy slug ("uniben") from
// treasuries initialized before the directory existed.
export async function fetchApprovedUnibenFaculties(): Promise<DepartmentRequest[]> {
  const { data, error } = await supabase
    .from('department_requests')
    .select('*')
    .eq('status', 'approved')
    .or('slug.eq.uniben,slug.ilike.uniben-%')
    .order('department', { ascending: true })
  if (error) throw error
  return data as DepartmentRequest[]
}

// Looks up a single faculty's directory entry by its on-chain slug. Used to
// show a real department name (e.g. "Faculty of Computing") instead of the
// raw slug on faculty-scoped pages. Returns null for slugs that aren't in
// the directory yet -- callers should fall back to the raw slug, not treat
// this as an error.
export async function fetchFacultyBySlug(slug: string): Promise<DepartmentRequest | null> {
  const { data, error } = await supabase
    .from('department_requests')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle()
  if (error) throw error
  return data as DepartmentRequest | null
}

export async function markRequestApproved(id: string) {
  const { error } = await supabase
    .from('department_requests')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function markRequestRejected(id: string) {
  const { error } = await supabase
    .from('department_requests')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ── Student identity directory ────────────────────────────────────────────
// Reads only. Writes go through app/app/api/profile/route.ts, which
// verifies a wallet signature server-side before upserting with the
// service role key. This file's anon-key client is read-only for
// student_profiles by design -- do not add a client-side upsert here.

export async function fetchProfileByWallet(walletAddress: string): Promise<StudentProfile | null> {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle()
  if (error) throw error
  return data as StudentProfile | null
}

export async function fetchProfilesByWallets(walletAddresses: string[]): Promise<StudentProfile[]> {
  if (walletAddresses.length === 0) return []
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .in('wallet_address', walletAddresses)
  if (error) throw error
  return data as StudentProfile[]
}

// Kept generic (not hardcoded to UNIBEN) so a future multi-university
// expansion doesn't require a rewrite. Current MVP only ever calls
// generateFacultySlug below, which pins the prefix to "uniben-".
export function generateSlug(university: string, faculty: string): string {
  const clean = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${clean(university)}-${clean(faculty)}`
}

// MVP-scoped slug generator: always prefixed "uniben-", regardless of what
// a user might type into a university field. Removes the slug-drift risk
// that free-texting the university name would otherwise introduce (e.g.
// "Uniben" vs "University of Benin" producing two different slugs for the
// same faculty).
export function generateFacultySlug(faculty: string): string {
  const clean = faculty.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `uniben-${clean}`
}
