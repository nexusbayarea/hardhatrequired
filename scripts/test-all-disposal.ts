import { IndexIntelligenceEngine } from '../lib/market/adapter';
import { VERTICAL_REGISTRY } from '../lib/market/registry';

async function main() {
  const verticals = Object.keys(VERTICAL_REGISTRY);
  console.log(`Testing ${verticals.length} verticals (disposal mode, zip=94536, radius=100)\n`);

  for (const v of verticals) {
    const config = VERTICAL_REGISTRY[v];
    const start = Date.now();

    try {
      const engine = new IndexIntelligenceEngine();
      const { companies } = await engine.executeMarketDiscovery(
        { zip: '94536', radius: 100, mode: 'disposal' },
        config,
      );

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      console.log(`${v.padEnd(35)} ${companies.length.toString().padStart(2)} results (${elapsed}s)`);
    } catch (err: any) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`${v.padEnd(35)} ERROR (${elapsed}s): ${err.message?.slice(0, 80)}`);
    }
  }
}

main().catch(console.error);
