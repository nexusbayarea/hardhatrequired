import { createClient } from '@supabase/supabase-js'
import { getSecret } from '@/lib/infisical'

let supabaseClient: ReturnType<typeof createClient> | null = null
let initPromise: Promise<ReturnType<typeof createClient> | null> | null = null

async function getSupabase(): Promise<ReturnType<typeof createClient> | null> {
  if (supabaseClient) return supabaseClient
  if (initPromise) return initPromise

  initPromise = (async () => {
    const supabaseUrl = await getSecret('NEXT_PUBLIC_SUPABASE_URL')
    const supabaseAnonKey = await getSecret('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase credentials missing. Engine will be unavailable.")
      return null
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    return supabaseClient
  })()

  return initPromise
}

export { getSupabase }

export const invokeEngine = async (functionName: string, payload: object) => {
  const client = await getSupabase()
  if (!client) {
    throw new Error('Supabase client not initialized. Check environment variables.')
  }

  const { data, error } = await client.functions.invoke(functionName, {
    body: payload,
  })

  if (error) {
    console.error(`Engine Error [${functionName}]:`, error)
    throw error
  }
  return data
}

export const processLead = (message: string, metadata?: object) =>
  invokeEngine('process-lead', { message, metadata })

export const qualifyLead = (leadId: string) =>
  invokeEngine('qualify-ai', { id: leadId })

export const suggestReply = (leadId: string, context?: string) =>
  invokeEngine('suggest-reply', { leadId, context })

export const analyzeConversation = (messages: string[]) =>
  invokeEngine('analyze-conversation', { messages })

export const checkSLA = () =>
  invokeEngine('sla-clock', {})

export const getWeeklyReport = () =>
  invokeEngine('generate-weekly-report', {})

export const getMonthlySummary = () =>
  invokeEngine('generate-monthly-summary', {})

export const checkRevenueLeakage = () =>
  invokeEngine('alert-revenue-leakage', {})

export const executeNBA = (leadId: string) =>
  invokeEngine('nba-executor', { leadId })

export const createCheckout = (items: any[]) =>
  invokeEngine('create-checkout', { items })
