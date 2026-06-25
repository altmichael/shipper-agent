export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  const webhookUrl = process.env.WEBHOOK_URL;
  if (webhookUrl) {
    try {
      // Send as form-encoded data (required by Forminit public forms)
      const body = new URLSearchParams({ email, timestamp: new Date().toISOString() });
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
    } catch (err) {
      console.error("Webhook failed:", err);
    }
  } else {
    console.log(`[subscriber] ${new Date().toISOString()} — ${email}`);
  }

  return Response.json({ ok: true });
}
