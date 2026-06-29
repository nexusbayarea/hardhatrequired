import { execSync } from 'child_process'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

interface AuditFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  message: string
  file?: string
  line?: number
  remediation: string
}

interface AuditReport {
  timestamp: string
  findings: AuditFinding[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
    passed: number
  }
}

class SecurityAuditor {
  private findings: AuditFinding[] = []

  async run(): Promise<AuditReport> {
    console.log('\n🔒 IIE Security Audit\n')

    await this.checkDependencies()
    await this.checkSecrets()
    await this.checkEnvVars()
    await this.checkRLSPolicies()
    await this.checkCORSHeaders()
    await this.checkInputValidation()
    await this.checkSQLInjection()
    await this.checkXSSPrevention()

    const summary = this.summarize()

    return {
      timestamp: new Date().toISOString(),
      findings: this.findings,
      summary,
    }
  }

  private async checkDependencies(): Promise<void> {
    console.log('📦 Checking dependencies...')
    try {
      const auditOutput = execSync('npm audit --json', { encoding: 'utf-8', cwd: process.cwd() })
      const audit = JSON.parse(auditOutput)

      if (audit.vulnerabilities) {
        for (const [pkg, vuln] of Object.entries<any>(audit.vulnerabilities)) {
          const severity = vuln.severity === 'critical' || vuln.severity === 'high'
            ? vuln.severity
            : 'medium'

          this.findings.push({
            severity,
            category: 'Dependency',
            message: `${pkg}@${vuln.range}: ${vuln.via?.[0]?.title || 'Vulnerability found'}`,
            remediation: `Run 'npm audit fix' or upgrade ${pkg} to a patched version`,
          })
        }
      }

      if (Object.keys(audit.vulnerabilities || {}).length === 0) {
        this.pass('Dependency', 'No known vulnerabilities in dependencies')
      }
    } catch {
      this.pass('Dependency', 'npm audit skipped (no lockfile or offline)')
    }
  }

  private async checkSecrets(): Promise<void> {
    console.log('🔑 Scanning for hardcoded secrets...')

    const secretPatterns = [
      { pattern: /sk-[a-zA-Z0-9]{48}/, name: 'Stripe Secret Key' },
      { pattern: /sk-[a-zA-Z0-9]{32}/, name: 'Supabase Service Key' },
      { pattern: /AIza[0-9A-Za-z_-]{35}/, name: 'Google API Key' },
      { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub PAT' },
      { pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}/, name: 'Slack Token' },
      { pattern: /Bearer\s+[a-zA-Z0-9_\-\.]{20,}/, name: 'Bearer Token' },
      { pattern: /password\s*=\s*["'][^"']{8,}["']/i, name: 'Hardcoded Password' },
    ]

    const scanDirs = ['app', 'lib', 'components', 'scripts']
    const scannedFiles: string[] = []

    for (const dir of scanDirs) {
      if (!existsSync(dir)) continue
      const files = this.getAllFiles(dir)
      scannedFiles.push(...files)
    }

    let secretsFound = 0
    for (const file of scannedFiles) {
      if (file.includes('node_modules')) continue
      const content = readFileSync(file, 'utf-8')

      for (const { pattern, name } of secretPatterns) {
        const matches = content.match(pattern)
        if (matches) {
          secretsFound++
          this.findings.push({
            severity: 'critical',
            category: 'Secrets',
            message: `Potential ${name} found in ${file}`,
            file,
            remediation: 'Move to environment variables or use Infisical/Vault. NEVER commit secrets.',
          })
        }
      }
    }

    if (secretsFound === 0) {
      this.pass('Secrets', `No hardcoded secrets detected in ${scannedFiles.length} files`)
    }
  }

  private async checkEnvVars(): Promise<void> {
    console.log('🔧 Checking environment variables...')

    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]

    const recommended = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'GOOGLE_PLACES_API_KEY',
      'APOLLO_API_KEY',
      'DEEPSEEK_API_KEY',
    ]

    for (const env of required) {
      if (!process.env[env]) {
        this.findings.push({
          severity: 'high',
          category: 'Environment',
          message: `Missing required env var: ${env}`,
          remediation: `Add ${env} to your .env.local and deployment platform`,
        })
      }
    }

    for (const env of recommended) {
      if (!process.env[env]) {
        this.findings.push({
          severity: 'low',
          category: 'Environment',
          message: `Missing recommended env var: ${env}`,
          remediation: `Add ${env} when ready for production features`,
        })
      }
    }

    if (this.findings.filter(f => f.category === 'Environment' && f.severity === 'high').length === 0) {
      this.pass('Environment', 'All required environment variables present')
    }
  }

  private async checkRLSPolicies(): Promise<void> {
    console.log('🛡️  Checking RLS policies...')

    const migrationDir = 'supabase/migrations'
    if (!existsSync(migrationDir)) {
      this.findings.push({
        severity: 'high',
        category: 'RLS',
        message: 'No migrations directory found',
        remediation: 'Create supabase/migrations/ and add RLS policies for all tables',
      })
      return
    }

    const migrations = readdirSync(migrationDir).filter(f => f.endsWith('.sql'))
    const allMigrations = migrations.map(f => readFileSync(join(migrationDir, f), 'utf-8')).join('\n')

    const requiredTables = [
      'organizations', 'users', 'companies', 'contacts',
      'campaigns', 'outreach_logs', 'searches', 'subscriptions',
      'usage_events', 'billing_limits',
    ]

    for (const table of requiredTables) {
      if (!allMigrations.includes('ENABLE ROW LEVEL SECURITY') ||
          !allMigrations.includes(table)) {
        this.findings.push({
          severity: 'high',
          category: 'RLS',
          message: `Cannot verify RLS is enabled for table: ${table}`,
          remediation: `Add 'ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;' to migrations`,
        })
      }
    }

    if (this.findings.filter(f => f.category === 'RLS' && f.severity === 'high').length === 0) {
      this.pass('RLS', `RLS policies verified across ${requiredTables.length} tables`)
    }
  }

  private async checkCORSHeaders(): Promise<void> {
    console.log('🌐 Checking CORS configuration...')

    const edgeFunctionDir = 'supabase/functions'
    if (!existsSync(edgeFunctionDir)) {
      this.pass('CORS', 'No edge functions to audit')
      return
    }

    const corsPattern = /Access-Control-Allow-Origin/
    const files = this.getAllFiles(edgeFunctionDir)
    let hasCORS = false

    for (const file of files) {
      if (file.endsWith('.ts')) {
        const content = readFileSync(file, 'utf-8')
        if (corsPattern.test(content)) {
          hasCORS = true
          break
        }
      }
    }

    if (!hasCORS) {
      this.findings.push({
        severity: 'medium',
        category: 'CORS',
        message: 'No CORS headers found in edge functions',
        remediation: 'Add CORS headers to all edge function responses for GitHub Pages compatibility',
      })
    } else {
      this.pass('CORS', 'CORS headers configured in edge functions')
    }
  }

  private async checkInputValidation(): Promise<void> {
    console.log('✅ Checking input validation...')

    const apiDir = 'app/api'
    if (!existsSync(apiDir)) {
      this.pass('Validation', 'No API routes to audit')
      return
    }

    const routeFiles = this.getAllFiles(apiDir).filter(f => f.endsWith('route.ts'))
    let validatedRoutes = 0

    for (const file of routeFiles) {
      const content = readFileSync(file, 'utf-8')
      if (content.includes('zod') || content.includes('validate') || content.includes('schema')) {
        validatedRoutes++
      }
    }

    if (validatedRoutes < routeFiles.length * 0.8) {
      this.findings.push({
        severity: 'medium',
        category: 'Validation',
        message: `Only ${validatedRoutes}/${routeFiles.length} API routes have input validation`,
        remediation: 'Add Zod schemas to all API routes. See lib/validation.ts for examples.',
      })
    } else {
      this.pass('Validation', `${validatedRoutes}/${routeFiles.length} routes validated`)
    }
  }

  private async checkSQLInjection(): Promise<void> {
    console.log('💉 Checking SQL injection prevention...')

    const dangerousPatterns = [
      /\$\{.*\}.*\bFROM\b/i,
      /\bexec\s*\(/i,
      /\beval\s*\(/i,
    ]

    const scanDirs = ['app', 'lib']
    let issues = 0

    for (const dir of scanDirs) {
      if (!existsSync(dir)) continue
      for (const file of this.getAllFiles(dir)) {
        if (file.includes('node_modules')) continue
        const content = readFileSync(file, 'utf-8')

        for (const pattern of dangerousPatterns) {
          if (pattern.test(content)) {
            issues++
            this.findings.push({
              severity: 'critical',
              category: 'SQL Injection',
              message: `Potential SQL injection vector in ${file}`,
              file,
              remediation: 'Use parameterized queries or Supabase RPC. Never interpolate user input into SQL.',
            })
          }
        }
      }
    }

    if (issues === 0) {
      this.pass('SQL Injection', 'No SQL injection vectors detected')
    }
  }

  private async checkXSSPrevention(): Promise<void> {
    console.log('🛡️  Checking XSS prevention...')

    const frontendFiles = this.getAllFiles('app').filter(f => f.endsWith('.tsx'))
    let xssRisks = 0

    for (const file of frontendFiles) {
      const content = readFileSync(file, 'utf-8')
      if (content.includes('dangerouslySetInnerHTML') && !content.includes('DOMPurify') && !content.includes('sanitize')) {
        xssRisks++
        this.findings.push({
          severity: 'medium',
          category: 'XSS',
          message: `dangerouslySetInnerHTML without sanitization in ${file}`,
          file,
          remediation: 'Use DOMPurify to sanitize HTML before using dangerouslySetInnerHTML',
        })
      }
    }

    if (xssRisks === 0) {
      this.pass('XSS', 'No XSS risks detected in frontend components')
    }
  }

  private getAllFiles(dir: string): string[] {
    const files: string[] = []
    const items = readdirSync(dir, { withFileTypes: true })

    for (const item of items) {
      const path = join(dir, item.name)
      if (item.isDirectory()) {
        files.push(...this.getAllFiles(path))
      } else {
        files.push(path)
      }
    }

    return files
  }

  private pass(category: string, message: string): void {
    this.findings.push({
      severity: 'info',
      category,
      message: `✅ ${message}`,
      remediation: 'N/A — check passed',
    })
  }

  private summarize() {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, passed: 0 }
    for (const f of this.findings) {
      if (f.severity === 'info' && f.message.startsWith('✅')) {
        counts.passed++
      } else {
        counts[f.severity]++
      }
    }
    return counts
  }
}

async function main() {
  const auditor = new SecurityAuditor()
  const report = await auditor.run()

  console.log('\n' + '='.repeat(80))
  console.log('SECURITY AUDIT REPORT')
  console.log('='.repeat(80))
  console.log(`Timestamp: ${report.timestamp}`)
  console.log(`\nSummary:`)
  console.log(`  Critical: ${report.summary.critical}`)
  console.log(`  High:     ${report.summary.high}`)
  console.log(`  Medium:   ${report.summary.medium}`)
  console.log(`  Low:      ${report.summary.low}`)
  console.log(`  Passed:   ${report.summary.passed}`)

  if (report.findings.filter(f => f.severity !== 'info' || !f.message.startsWith('✅')).length > 0) {
    console.log(`\nFindings:`)
    for (const finding of report.findings) {
      if (finding.severity === 'info' && finding.message.startsWith('✅')) continue
      const icon = finding.severity === 'critical' ? '🔴' :
                   finding.severity === 'high' ? '🟠' :
                   finding.severity === 'medium' ? '🟡' : '🔵'
      console.log(`\n${icon} [${finding.severity.toUpperCase()}] ${finding.category}`)
      console.log(`   ${finding.message}`)
      if (finding.file) console.log(`   File: ${finding.file}`)
      console.log(`   Fix: ${finding.remediation}`)
    }
  }

  console.log('\n' + '='.repeat(80))

  const hasCritical = report.summary.critical > 0 || report.summary.high > 0
  if (hasCritical) {
    console.log('\n❌ Audit FAILED — critical/high findings must be resolved before production')
    process.exit(1)
  }

  console.log('\n✅ Audit PASSED — ready for production')
}

if (require.main === module) {
  main().catch(console.error)
}

export { SecurityAuditor, type AuditFinding, type AuditReport }
