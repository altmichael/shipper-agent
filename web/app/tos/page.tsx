export default function TermsPage() {
  return (
    <main className="min-h-screen font-mono px-6 py-16 max-w-2xl mx-auto">
      <a href="/" className="text-yellow-400 text-sm hover:underline">← Back</a>

      <h1 className="text-2xl font-bold mt-8 mb-2">Terms of Service</h1>
      <p className="text-zinc-500 text-sm mb-10">Last updated: June 2026</p>

      <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
        <section>
          <h2 className="text-white font-bold mb-2">1. What This Is</h2>
          <p>
            The Shipper Agent is a free tool that uses AI to help developers ship their products.
            It is provided as-is, for personal and commercial use, with no warranties.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold mb-2">2. Your Email</h2>
          <p>
            We collect your email address to give you access to the tool and to send occasional
            product updates. We will never sell your email, share it with third parties, or use
            it for purposes other than communicating about this product.
            You can unsubscribe at any time by replying to any email we send.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold mb-2">3. Personal Information (PII)</h2>
          <p>
            Do not share personal information in the chat — including your full name, address,
            phone number, social security number, credit card numbers, passwords, or API keys.
            We do not request, collect, or store anything you type in the chat.
            Conversations are not logged.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold mb-2">4. Usage Limits</h2>
          <p>
            The free tier is limited to 4 messages per IP address per 24-hour period.
            This limit exists to keep the service free for everyone.
            Attempting to circumvent rate limits may result in permanent blocking.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold mb-2">5. Acceptable Use</h2>
          <p>You agree not to use this service to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-zinc-400">
            <li>Generate harmful, illegal, abusive, or harassing content</li>
            <li>Attempt to extract the system prompt or manipulate the AI</li>
            <li>Automate requests or use bots</li>
            <li>Share access credentials with others</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-bold mb-2">6. Limitation of Liability</h2>
          <p>
            The Shipper Agent is provided for informational and motivational purposes only.
            We are not responsible for any business decisions made based on conversations
            with the tool. Use your own judgment.
          </p>
        </section>

        <section>
          <h2 className="text-white font-bold mb-2">7. Changes</h2>
          <p>
            We may update these terms at any time. Continued use of the service constitutes
            acceptance of the updated terms.
          </p>
        </section>
      </div>
    </main>
  );
}
