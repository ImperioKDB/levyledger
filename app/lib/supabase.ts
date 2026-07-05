import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fibolqhqrettfzasdeyn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_n3ICy7zL7VdQnDoROwv32w_YEKrhfyx'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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

export function generateSlug(university: string, faculty: string): string {
  const clean = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${clean(university)}-${clean(faculty)}`
}
