export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  // Forward to webhook (Zapier, Make, etc.) if configured
  const webhookUrl = process.env.WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, timestamp: new Date().toISOString() }),
      });
    } catch (err) {
      console.error("Webhook failed:", err);
    }
  } else {
    // Fallback: log to console (replace with DB in production)
    console.log(`[subscriber] ${new Date().toISOString()} — ${email}`);
  }

  return Response.json({ ok: true });
}
