import { performance } from 'perf_hooks'

interface LoadTestConfig {
  concurrentUsers: number
  requestsPerUser: number
  rampUpSeconds: number
  targetUrl: string
  endpoints: string[]
}

interface TestResult {
  endpoint: string
  totalRequests: number
  successful: number
  failed: number
  avgLatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  requestsPerSecond: number
  errors: Array<{ status: number; message: string; count: number }>
}

const DEFAULT_CONFIG: LoadTestConfig = {
  concurrentUsers: 50,
  requestsPerUser: 20,
  rampUpSeconds: 10,
  targetUrl: process.env.IIE_BASE_URL || 'https://indexintelligenceengine.vercel.app',
  endpoints: [
    '/api/search',
    '/api/dashboard/overview',
    '/api/campaigns',
    '/api/metrics',
  ],
}

class LoadTester {
  private config: LoadTestConfig
  private results: Map<string, number[]> = new Map()
  private errors: Map<string, Map<string, number>> = new Map()

  constructor(config: Partial<LoadTestConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.config.endpoints.forEach(e => {
      this.results.set(e, [])
      this.errors.set(e, new Map())
    })
  }

  async run(): Promise<TestResult[]> {
    console.log(`\n🚀 Starting Load Test`)
    console.log(`   Users: ${this.config.concurrentUsers}`)
    console.log(`   Requests/User: ${this.config.requestsPerUser}`)
    console.log(`   Ramp-up: ${this.config.rampUpSeconds}s`)
    console.log(`   Target: ${this.config.targetUrl}\n`)

    const startTime = performance.now()
    const userPromises: Promise<void>[] = []
    const delayPerUser = (this.config.rampUpSeconds * 1000) / this.config.concurrentUsers

    for (let userId = 0; userId < this.config.concurrentUsers; userId++) {
      await new Promise(r => setTimeout(r, delayPerUser))
      userPromises.push(this.simulateUser(userId))
    }

    await Promise.all(userPromises)
    const totalDuration = (performance.now() - startTime) / 1000

    return this.compileResults(totalDuration)
  }

  private async simulateUser(userId: number): Promise<void> {
    const token = process.env.IIE_TEST_TOKEN || ''
    const orgId = process.env.IIE_TEST_ORG_ID || 'test-org'

    for (let i = 0; i < this.config.requestsPerUser; i++) {
      const endpoint = this.config.endpoints[i % this.config.endpoints.length]
      const url = `${this.config.targetUrl}${endpoint}`

      const reqStart = performance.now()
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'x-iie-client-context': `${orgId}:AGENT`,
          },
          body: JSON.stringify({
            zip: '10001',
            radius: 25,
            search: 'test query',
          }),
        })

        const latency = performance.now() - reqStart
        this.results.get(endpoint)!.push(latency)

        if (!res.ok) {
          const errorKey = `${res.status}: ${res.statusText}`
          const errorMap = this.errors.get(endpoint)!
          errorMap.set(errorKey, (errorMap.get(errorKey) || 0) + 1)
        }
      } catch (e: any) {
        const latency = performance.now() - reqStart
        this.results.get(endpoint)!.push(latency)
        const errorKey = `NETWORK: ${e.message}`
        const errorMap = this.errors.get(endpoint)!
        errorMap.set(errorKey, (errorMap.get(errorKey) || 0) + 1)
      }
    }
  }

  private compileResults(totalDuration: number): TestResult[] {
    return this.config.endpoints.map(endpoint => {
      const latencies = this.results.get(endpoint)!.sort((a, b) => a - b)
      const total = latencies.length
      const failed = Array.from(this.errors.get(endpoint)!.values()).reduce((a, b) => a + b, 0)

      return {
        endpoint,
        totalRequests: total,
        successful: total - failed,
        failed,
        avgLatencyMs: total > 0 ? latencies.reduce((a, b) => a + b, 0) / total : 0,
        p95LatencyMs: total > 0 ? latencies[Math.floor(total * 0.95)] : 0,
        p99LatencyMs: total > 0 ? latencies[Math.floor(total * 0.99)] : 0,
        requestsPerSecond: total / totalDuration,
        errors: Array.from(this.errors.get(endpoint)!.entries()).map(([message, count]) => ({
          status: parseInt(message.split(':')[0]) || 0,
          message,
          count,
        })),
      }
    })
  }
}

async function main() {
  const tester = new LoadTester({
    concurrentUsers: parseInt(process.env.CONCURRENT_USERS || '50'),
    requestsPerUser: parseInt(process.env.REQUESTS_PER_USER || '20'),
  })

  const results = await tester.run()

  console.log('\n📊 RESULTS\n')
  console.log('='.repeat(80))

  for (const r of results) {
    console.log(`\n${r.endpoint}`)
    console.log(`  Total: ${r.totalRequests} | Success: ${r.successful} | Failed: ${r.failed}`)
    console.log(`  RPS: ${r.requestsPerSecond.toFixed(2)}`)
    console.log(`  Latency: avg=${r.avgLatencyMs.toFixed(0)}ms | p95=${r.p95LatencyMs.toFixed(0)}ms | p99=${r.p99LatencyMs.toFixed(0)}ms`)
    if (r.errors.length > 0) {
      console.log(`  Errors:`)
      r.errors.forEach(e => console.log(`    ${e.message} (${e.count}x)`))
    }
  }

  console.log('\n' + '='.repeat(80))

  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)
  if (totalFailed > 0) {
    console.log(`\n❌ ${totalFailed} requests failed`)
    process.exit(1)
  }

  console.log('\n✅ All tests passed')
}

if (require.main === module) {
  main().catch(console.error)
}

export { LoadTester, type LoadTestConfig, type TestResult }
