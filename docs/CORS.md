# CORS Configuration for Edge Functions

All edge functions must include CORS headers to allow the GitHub Pages site to call them:

```typescript
// Add to each edge function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS preflight
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}

// Return CORS headers with all responses
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})
```

## Current Functions (Deployed on Supabase)
- process-lead ✅ (has CORS)
- sla-clock
- suggest-reply
- analyze-conversation
- generate-monthly-summary
- generate-weekly-report
- alert-revenue-leakage
- create-checkout
- nba-executor
- qualify-ai

## GitHub Secrets Required
Add these in GitHub repo settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
