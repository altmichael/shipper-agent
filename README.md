# The Shipper Agent

**A CLI co-founder that refuses to let you build in localhost forever.**

Most AI tools help you write more code. This one tells you to stop hiding and ship. It reads the subtext of your procrastination, silently diagnoses *why* you're stalling, and shifts persona to apply exactly the right pressure.

---

## The Three Archetypes

| | Archetype | When it triggers | What it does |
|---|---|---|---|
| 🍏 | **The Visionary Simplifier** | Cluttered UI, lost soul, tech jargon | Cuts features, demands the magic moment |
| 🚀 | **The First-Principles Executor** | Over-engineering, zero users, stalled deploy | Deletes your auth, ships a URL hash instead |
| 💰 | **The Market & Offer Master** | Afraid to sell, weak positioning | Rewrites your pitch into an offer they can't ignore |

The agent never breaks character. It never says "I am switching personas." It just pushes.

---

## Quickstart (CLI — 5 minutes)

### 1. Clone the repo

```bash
git clone https://github.com/altmichael/shipper-agent.git
cd shipper-agent
```

### 2. Install the dependency

```bash
pip install anthropic
# or, if you prefer OpenAI:
pip install openai
```

### 3. Set your API key

```bash
# Anthropic (default)
export ANTHROPIC_API_KEY=sk-ant-...

# Or OpenAI
export OPENAI_API_KEY=sk-...
```

Get an Anthropic key at [console.anthropic.com](https://console.anthropic.com). Get an OpenAI key at [platform.openai.com](https://platform.openai.com).

### 4. Run it

```bash
python shipper.py
```

That's it. Your co-founder will introduce itself and ask what you're building.

---

## Commands

```bash
python shipper.py                    # Resume your last session
python shipper.py --new              # Start a fresh project
python shipper.py --provider openai  # Use GPT-4o instead of Claude
python shipper.py --dry-run          # Print the system prompt and exit
```

---

## Session Memory

The agent remembers everything. Conversations are saved to `~/.shipper/session.json`.

When you come back, it reads the full history and immediately holds you accountable:
> *"You said you were going to push to GitHub yesterday. Did you?"*

This is the point. A co-founder doesn't forget.

---

## Use Without the CLI

You don't need the CLI. Just copy the contents of `SYSTEM_PROMPT.md` and paste it as the system prompt in any LLM chat interface — Claude, ChatGPT, anything.

Then start talking about your half-finished project.

---

## Use With Claude Code

If you use [Claude Code](https://claude.ai/code), copy `CLAUDE.md` into your project root. Claude will load it automatically at the start of every session and act as your persistent co-founder across your entire codebase — not just in conversation, but while you build.

Add a **Project Status** section at the bottom of your CLAUDE.md to track commitments, progress, and next actions across sessions:

```markdown
## PROJECT STATUS

### What we've built
- ✅ Feature X
- ✅ Feature Y

### Committed to next
- [ ] Push to GitHub
- [ ] Post on Reddit

### Accountability question for next session
"Did you do the thing? We're doing it right now if not."
```

Claude will read this before you type a word and lead with accountability.

---

## How It Works

The system prompt (`SYSTEM_PROMPT.md`) instructs the LLM to:

1. **Run a silent diagnostic** on every message — not what you said, but what you *meant*
2. **Identify the exact block** — choice paralysis, pitch paralysis, over-engineering, or soul loss
3. **Invoke the matching archetype** seamlessly, without announcing the switch
4. **End every response with one micro-commitment** — not a checklist, one tiny shared action

---

## Contributing

Pull requests welcome. Keep it simple — this tool's power is its focus.

---

*Built to drag your genius out of localhost and into the real world.*
