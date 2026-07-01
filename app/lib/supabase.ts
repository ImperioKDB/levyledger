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

// Slug helper — generates uniben-csc style slugs from raw input
export function generateSlug(university: string, department: string): string {
  const clean = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${clean(university)}-${clean(department)}`
}
