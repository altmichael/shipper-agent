"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      router.push("/chat");
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col font-mono">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 text-yellow-400 text-sm tracking-widest uppercase">
          🚀 The Shipper Agent
        </div>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-3xl">
          Stop hiding<br />
          <span className="text-yellow-400">in localhost.</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-xl mb-4">
          An AI co-founder that reads the subtext of your procrastination and forces you to ship.
        </p>
        <p className="text-gray-600 text-sm mb-12">
          No therapy. No checklists. Just momentum.
        </p>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Loading..." : "Try it free →"}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <p className="text-zinc-600 text-xs mt-3">
            No credit card. No API key. By continuing you agree to receive occasional emails.
          </p>
        </form>
      </section>

      {/* Three archetypes */}
      <section className="border-t border-zinc-900 px-6 py-16">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="border border-zinc-800 rounded p-6 hover:border-zinc-600 transition-colors">
            <div className="text-2xl mb-3">✂️</div>
            <h3 className="text-yellow-400 font-bold mb-2">The Cutter</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              When your product is bloated and you've lost the soul of it. Ruthlessly cuts features until only the magic remains.
            </p>
          </div>
          <div className="border border-zinc-800 rounded p-6 hover:border-zinc-600 transition-colors">
            <div className="text-2xl mb-3">🔧</div>
            <h3 className="text-yellow-400 font-bold mb-2">The Builder</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              When you're debating AWS vs GCP for zero users. Strips every assumed constraint and ships in 24 hours.
            </p>
          </div>
          <div className="border border-zinc-800 rounded p-6 hover:border-zinc-600 transition-colors">
            <div className="text-2xl mb-3">💰</div>
            <h3 className="text-yellow-400 font-bold mb-2">The Closer</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              When you're terrified of selling. Rewrites your weak pitch into an offer so good they feel stupid saying no.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-6 text-center text-zinc-700 text-xs">
        Built to drag your genius out of localhost and into the real world.
        <span className="mx-2">·</span>
        <a
          href="https://github.com/altmichael/shipper-agent"
          className="hover:text-zinc-400 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}
