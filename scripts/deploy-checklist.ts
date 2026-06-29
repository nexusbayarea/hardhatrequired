import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'

interface ChecklistItem {
  category: string
  item: string
  status: 'pass' | 'fail' | 'warn' | 'skip'
  message: string
}

class DeployChecklist {
  private items: ChecklistItem[] = []

  async run(): Promise<ChecklistItem[]> {
    console.log('\n🚀 IIE Production Launch Checklist\n')

    await this.checkGitStatus()
    await this.checkEnvVars()
    await this.checkDatabaseMigrations()
    await this.checkBuild()
    await this.checkTests()
    await this.checkDependencies()
    await this.checkVercelConfig()
    await this.checkSupabaseConnection()
    await this.checkStripeConfig()
    await this.checkDomainConfig()

    return this.items
  }

  private add(category: string, item: string, status: ChecklistItem['status'], message: string) {
    this.items.push({ category, item, status, message })
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : status === 'warn' ? '⚠️' : '⏭️'
    console.log(`${icon} [${category}] ${item}: ${message}`)
  }

  private async checkGitStatus(): Promise<void> {
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim()
      const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim()

      if (branch !== 'main' && branch !== 'master') {
        this.add('Git', 'Branch', 'warn', `On branch "${branch}" — deploy from main for production`)
      } else {
        this.add('Git', 'Branch', 'pass', `On ${branch}`)
      }

      if (status.length > 0) {
        this.add('Git', 'Working Tree', 'warn', `${status.split('\n').length} uncommitted changes`)
      } else {
        this.add('Git', 'Working Tree', 'pass', 'Clean')
      }
    } catch {
      this.add('Git', 'Status', 'skip', 'Not a git repository or git not available')
    }
  }

  private async checkEnvVars(): Promise<void> {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]

    const production = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'GOOGLE_PLACES_API_KEY',
      'APOLLO_API_KEY',
      'DEEPSEEK_API_KEY',
    ]

    let allRequired = true
    for (const env of required) {
      if (!process.env[env]) {
        this.add('Env', env, 'fail', `Missing — application will not function`)
        allRequired = false
      }
    }

    if (allRequired) {
      this.add('Env', 'Required Vars', 'pass', 'All present')
    }

    let prodCount = 0
    for (const env of production) {
      if (process.env[env]) prodCount++
    }

    if (prodCount === production.length) {
      this.add('Env', 'Production Vars', 'pass', `${prodCount}/${production.length} present`)
    } else {
      this.add('Env', 'Production Vars', 'warn', `${prodCount}/${production.length} present — some features may be limited`)
    }
  }

  private async checkDatabaseMigrations(): Promise<void> {
    const migrationDir = 'supabase/migrations'
    if (!existsSync(migrationDir)) {
      this.add('DB', 'Migrations', 'fail', 'No migrations directory found')
      return
    }

    const files = require('fs').readdirSync(migrationDir).filter((f: string) => f.endsWith('.sql'))

    if (files.length === 0) {
      this.add('DB', 'Migrations', 'fail', 'No migration files found')
    } else if (files.length < 6) {
      this.add('DB', 'Migrations', 'warn', `${files.length} migrations — expected at least 6 (001-006+)`)
    } else {
      this.add('DB', 'Migrations', 'pass', `${files.length} migrations found`)
    }

    const latest = files.sort().pop()
    if (latest && latest.includes('007')) {
      this.add('DB', 'Production Hardening', 'pass', `${latest} present`)
    } else {
      this.add('DB', 'Production Hardening', 'warn', 'Migration 007 (production hardening) not found')
    }
  }

  private async checkBuild(): Promise<void> {
    try {
      execSync('npm run build', { stdio: 'pipe', cwd: process.cwd() })
      this.add('Build', 'Next.js Build', 'pass', 'Build succeeded')
    } catch (e: any) {
      this.add('Build', 'Next.js Build', 'fail', e.message || 'Build failed')
    }
  }

  private async checkTests(): Promise<void> {
    const hasTestScript = existsSync('package.json') &&
      readFileSync('package.json', 'utf-8').includes('"test"')

    if (!hasTestScript) {
      this.add('Tests', 'Test Suite', 'warn', 'No test script in package.json')
      return
    }

    try {
      execSync('npm test', { stdio: 'pipe', cwd: process.cwd() })
      this.add('Tests', 'Test Suite', 'pass', 'All tests passed')
    } catch {
      this.add('Tests', 'Test Suite', 'warn', 'Tests failed or no tests found')
    }
  }

  private async checkDependencies(): Promise<void> {
    try {
      execSync('npm audit --audit-level=high', { stdio: 'pipe', cwd: process.cwd() })
      this.add('Deps', 'Vulnerabilities', 'pass', 'No high/critical vulnerabilities')
    } catch {
      this.add('Deps', 'Vulnerabilities', 'warn', 'High/critical vulnerabilities found — run npm audit fix')
    }
  }

  private async checkVercelConfig(): Promise<void> {
    const vercelJson = 'vercel.json'
    const hasVercel = existsSync(vercelJson)

    if (!hasVercel) {
      this.add('Deploy', 'Vercel Config', 'warn', 'No vercel.json — using defaults')
    } else {
      this.add('Deploy', 'Vercel Config', 'pass', 'vercel.json present')
    }

    const nextConfig = 'next.config.ts'
    if (existsSync(nextConfig)) {
      const content = readFileSync(nextConfig, 'utf-8')
      if (content.includes("output: 'export'")) {
        this.add('Deploy', 'Next.js Output', 'warn', "output: 'export' set — API routes won't work on Vercel")
      } else {
        this.add('Deploy', 'Next.js Output', 'pass', 'Serverless mode — API routes enabled')
      }
    }
  }

  private async checkSupabaseConnection(): Promise<void> {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!url) {
        this.add('Supabase', 'Connection', 'skip', 'URL not configured')
        return
      }

      const res = await fetch(`${url}/rest/v1/`, {
        headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
      })

      if (res.ok) {
        this.add('Supabase', 'Connection', 'pass', 'Reachable')
      } else {
        this.add('Supabase', 'Connection', 'fail', `HTTP ${res.status}`)
      }
    } catch {
      this.add('Supabase', 'Connection', 'fail', 'Cannot reach Supabase — check URL and network')
    }
  }

  private async checkStripeConfig(): Promise<void> {
    if (!process.env.STRIPE_SECRET_KEY) {
      this.add('Stripe', 'Configuration', 'warn', 'STRIPE_SECRET_KEY not set — billing disabled')
      return
    }

    try {
      const { default: Stripe } = await import('stripe')
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
      await stripe.balance.retrieve()
      this.add('Stripe', 'Connection', 'pass', 'API key valid')
    } catch {
      this.add('Stripe', 'Connection', 'fail', 'Invalid Stripe API key')
    }
  }

  private async checkDomainConfig(): Promise<void> {
    const domains = [
      'indexintelligenceengine.vercel.app',
    ]

    for (const domain of domains) {
      try {
        const res = await fetch(`https://${domain}`, { method: 'HEAD' })
        if (res.ok || res.status === 404) {
          this.add('Domain', domain, 'pass', 'Reachable')
        } else {
          this.add('Domain', domain, 'warn', `HTTP ${res.status}`)
        }
      } catch {
        this.add('Domain', domain, 'warn', 'Not reachable — may not be deployed yet')
      }
    }
  }
}

async function main() {
  const checklist = new DeployChecklist()
  const items = await checklist.run()

  console.log('\n' + '='.repeat(80))
  console.log('DEPLOY CHECKLIST SUMMARY')
  console.log('='.repeat(80))

  const passed = items.filter(i => i.status === 'pass').length
  const failed = items.filter(i => i.status === 'fail').length
  const warnings = items.filter(i => i.status === 'warn').length
  const skipped = items.filter(i => i.status === 'skip').length

  console.log(`\nTotal Checks: ${items.length}`)
  console.log(`  ✅ Passed:   ${passed}`)
  console.log(`  ❌ Failed:   ${failed}`)
  console.log(`  ⚠️  Warnings: ${warnings}`)
  console.log(`  ⏭️  Skipped:  ${skipped}`)

  if (failed > 0) {
    console.log(`\n❌ LAUNCH BLOCKED — ${failed} critical checks failed`)
    console.log('\nFailed items:')
    items.filter(i => i.status === 'fail').forEach(i => {
      console.log(`  • [${i.category}] ${i.item}: ${i.message}`)
    })
    process.exit(1)
  }

  if (warnings > 0) {
    console.log(`\n⚠️  LAUNCH READY WITH WARNINGS — review warnings before go-live`)
  } else {
    console.log(`\n🚀 ALL CLEAR — Ready for production launch!`)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { DeployChecklist, type ChecklistItem }
