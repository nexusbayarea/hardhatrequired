import { InfisicalSDK } from '@infisical/sdk';

let client: InfisicalSDK | null = null;

function getClient(): InfisicalSDK {
  if (!client) {
    const token = process.env.INFISICAL_TOKEN;
    if (!token) throw new Error('INFISICAL_TOKEN environment variable is not set');
    client = new InfisicalSDK();
    client.auth().accessToken(token);
  }
  return client;
}

export async function getSecret(secretName: string): Promise<string> {
  const c = getClient();
  const secret = await (c.secrets().getSecret as any)({ secretName });
  return secret.secretValue;
}

export async function getSecrets(secretNames: string[]): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  for (const name of secretNames) {
    try {
      results[name] = await getSecret(name);
    } catch {
      results[name] = '';
    }
  }
  return results;
}
