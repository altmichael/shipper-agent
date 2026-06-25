// In-memory rate limiting — works for single Vercel instance (MVP)
// Upgrade to Vercel KV / Upstash Redis for multi-instance production

interface IPRecord {
  count: number;
  firstSeen: number;
  blocked: boolean;
}

const ipStore = new Map<string, IPRecord>();
let globalCallsThisHour = 0;
let hourWindowStart = Date.now();

const MAX_MESSAGES_PER_IP = 4;
const IP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_GLOBAL_CALLS_PER_HOUR = 100;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string; retryAfterMs?: number };

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();

  // Reset global hourly counter
  if (now - hourWindowStart > 60 * 60 * 1000) {
    globalCallsThisHour = 0;
    hourWindowStart = now;
  }

  if (globalCallsThisHour >= MAX_GLOBAL_CALLS_PER_HOUR) {
    return {
      allowed: false,
      reason: "Service is busy right now. Try again in an hour.",
    };
  }

  const record = ipStore.get(ip);

  if (!record) {
    ipStore.set(ip, { count: 1, firstSeen: now, blocked: false });
    globalCallsThisHour++;
    return { allowed: true };
  }

  // Reset window after 24 hours
  if (now - record.firstSeen > IP_WINDOW_MS) {
    ipStore.set(ip, { count: 1, firstSeen: now, blocked: false });
    globalCallsThisHour++;
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
  globalCallsThisHour++;
  return { allowed: true };
}

export function getIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded ? forwarded.split(",")[0] : "unknown").trim();
}
