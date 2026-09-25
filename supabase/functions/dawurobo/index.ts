import { withSupabase } from 'npm:@supabase/server@^1';

const BASE_URL = Deno.env.get('DAWUROBO_BASE_URL') ?? 'https://delivery.dawurobo.com';

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const operations = {
  health: { path: '/api/v1/delivery/health', method: 'GET' },
  estimate: { path: '/api/v1/delivery/orders.estimate', method: 'POST' },
  create: { path: '/api/v1/delivery/orders.create', method: 'POST' },
  get: { path: '/api/v1/delivery/orders.get', method: 'POST' },
  track: { path: '/api/v1/delivery/orders.track', method: 'POST' },
  cancel: { path: '/api/v1/delivery/orders.cancel', method: 'POST' },
} as const;

type Operation = keyof typeof operations;

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    try {
      const apiKey = Deno.env.get('DAWUROBO_API_KEY');
      const signingSecret = Deno.env.get('DAWUROBO_SIGNING_SECRET');

      if (!apiKey || !signingSecret) {
        return Response.json(
          { error: 'Dawurobo integration is not configured on JSI yet.' },
          { status: 503 },
        );
      }

      const input = await req.json().catch(() => ({}));
      const operation = input.operation as Operation;
      const config = operations[operation];

      if (!config) {
        return Response.json({ error: 'Unsupported Dawurobo operation.' }, { status: 400 });
      }

      const body = config.method === 'GET' ? '' : JSON.stringify(input.payload ?? {});
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonce = crypto.randomUUID();
      const bodyHash = await sha256Hex(body);
      const canonical = [
        config.method,
        config.path,
        '',
        bodyHash,
        timestamp,
        nonce,
      ].join('\n');
      const signature = await hmacHex(signingSecret, canonical);

      const response = await fetch(`${BASE_URL}${config.path}`, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'X-Signature': signature,
          'X-Timestamp': timestamp,
          'X-Nonce': nonce,
        },
        body: config.method === 'GET' ? undefined : body,
      });

      const responseBody = await response.text();
      let parsed: unknown = responseBody;
      try { parsed = JSON.parse(responseBody); } catch {}

      return Response.json(
        { ok: response.ok, operation, data: parsed, userId: ctx.userClaims?.sub },
        { status: response.ok ? 200 : response.status },
      );
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : 'Dawurobo request failed.' },
        { status: 500 },
      );
    }
  }),
};
