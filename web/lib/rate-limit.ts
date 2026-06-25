// In-memory rate limiting — works for single Vercel instance (MVP)
// Upgrade to Vercel KV / Upstash Redis for multi-instance production

interface IPRecord {
  count: number;
  firstSeen: number;
  blocked: boolean;
}

const ipStore = new Map<string, IPRecord>();
let globalCallsToday = 0;
let dayWindowStart = Date.now();

const MAX_MESSAGES_PER_IP = 4;
const IP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_GLOBAL_CALLS_PER_DAY = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string; retryAfterMs?: number };

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();

  // Reset the global daily counter once a day
  if (now - dayWindowStart > DAY_MS) {
    globalCallsToday = 0;
    dayWindowStart = now;
  }

  // Hard global cap — protects your API budget no matter what
  if (globalCallsToday >= MAX_GLOBAL_CALLS_PER_DAY) {
    return {
      allowed: false,
      reason: "We've hit today's free usage cap. Come back tomorrow — or grab a paid plan for unlimited access.",
    };
  }

  const record = ipStore.get(ip);

  if (!record) {
    ipStore.set(ip, { count: 1, firstSeen: now, blocked: false });
    globalCallsToday++;
    return { allowed: true };
  }

  // Reset this IP's window after 24 hours
  if (now - record.firstSeen > IP_WINDOW_MS) {
    ipStore.set(ip, { count: 1, firstSeen: now, blocked: false });
    globalCallsToday++;
    return { allowed: true };
  }

  if (record.count >= MAX_MESSAGES_PER_IP) {
    const retryAfterMs = IP_WINDOW_MS - (now - record.firstSeen);
    return {
      allowed: false,
      reason: `You've used your ${MAX_MESSAGES_PER_IP} free messages. Come back in 24 hours — or grab a paid plan for unlimited access.`,
      retryAfterMs,
    };
  }

  record.count++;
  globalCallsToday++;
  return { allowed: true };
}

export function getIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded ? forwarded.split(",")[0] : "unknown").trim();
}
