#!/usr/bin/env python3
"""
The Shipper Agent — CLI Wrapper
A terminal-based accountability partner that refuses to let you build in localhost forever.

Usage:
    python shipper.py                     # Continue your project session
    python shipper.py --new               # Start a fresh project
    python shipper.py --provider openai   # Use OpenAI instead
    python shipper.py --dry-run           # Print the system prompt and exit

Requires:
    pip install anthropic   (default)
    pip install openai      (if using --provider openai)

Set your API key:
    export ANTHROPIC_API_KEY=sk-...
    export OPENAI_API_KEY=sk-...         (if using OpenAI)
"""

import argparse
import sys
import os
import json
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
SYSTEM_PROMPT_PATH = SCRIPT_DIR / "SYSTEM_PROMPT.md"
MEMORY_DIR = Path.home() / ".shipper"
SESSION_FILE = MEMORY_DIR / "session.json"

# ── Terminal Colors ──────────────────────────────────────────────────────────

class Colors:
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    MAGENTA = "\033[95m"
    RESET = "\033[0m"

BANNER = f"""
{Colors.BOLD}{Colors.CYAN}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              🚀  THE SHIPPER AGENT  🚀                       ║
║                                                              ║
║    Your AI assistant has been reprogrammed.                   ║
║    It will no longer help you build in circles.               ║
║    It will force you to ship.                                 ║
║                                                              ║
║    Type your message. Press Ctrl+C to exit.                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
{Colors.RESET}
"""

# ── Session Persistence ──────────────────────────────────────────────────────

def load_session() -> dict:
    MEMORY_DIR.mkdir(exist_ok=True)
    if SESSION_FILE.exists():
        try:
            return json.loads(SESSION_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"project": None, "messages": [], "last_seen": None}


def save_session(session: dict):
    MEMORY_DIR.mkdir(exist_ok=True)
    session["last_seen"] = datetime.now().isoformat()
    SESSION_FILE.write_text(json.dumps(session, indent=2), encoding="utf-8")


def reset_session():
    if SESSION_FILE.exists():
        SESSION_FILE.unlink()


def format_last_seen(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso)
        delta = datetime.now() - dt
        if delta.days == 0:
            hours = delta.seconds // 3600
            return f"{hours}h ago" if hours > 0 else "earlier today"
        elif delta.days == 1:
            return "yesterday"
        else:
            return f"{delta.days} days ago"
    except Exception:
        return "a while ago"


# ── System Prompt Loader ─────────────────────────────────────────────────────

def load_system_prompt() -> str:
    if not SYSTEM_PROMPT_PATH.exists():
        print(f"{Colors.RED}Error: {SYSTEM_PROMPT_PATH} not found.{Colors.RESET}")
        print(f"Make sure SYSTEM_PROMPT.md is in the same directory as this script.")
        sys.exit(1)
    return SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")


# ── Provider Backends ────────────────────────────────────────────────────────

def chat_anthropic(system_prompt: str, messages: list[dict]) -> str:
    try:
        import anthropic
    except ImportError:
        print(f"{Colors.RED}Error: 'anthropic' package not installed.{Colors.RESET}")
        print(f"Run: pip install anthropic")
        sys.exit(1)

    client = anthropic.Anthropic()
    full_response = []
    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=system_prompt,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_response.append(text)
    print()
    return "".join(full_response)


def chat_openai(system_prompt: str, messages: list[dict]) -> str:
    try:
        import openai
    except ImportError:
        print(f"{Colors.RED}Error: 'openai' package not installed.{Colors.RESET}")
        print(f"Run: pip install openai")
        sys.exit(1)

    client = openai.OpenAI()
    full_messages = [{"role": "system", "content": system_prompt}] + messages
    full_response = []
    stream = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=2048,
        messages=full_messages,
        stream=True,
    )
    for chunk in stream:
        text = chunk.choices[0].delta.content or ""
        print(text, end="", flush=True)
        full_response.append(text)
    print()
    return "".join(full_response)


PROVIDERS = {
    "anthropic": chat_anthropic,
    "openai": chat_openai,
}

# ── Interactive Loop ─────────────────────────────────────────────────────────

def run_interactive(provider: str, new_session: bool = False):
    system_prompt = load_system_prompt()
    chat_fn = PROVIDERS[provider]

    print(BANNER)
    print(f"{Colors.DIM}Provider: {provider}{Colors.RESET}\n")

    if new_session:
        reset_session()

    session = load_session()
    messages = session["messages"]
    is_returning = bool(messages) and not new_session

    if is_returning:
        last_seen = format_last_seen(session["last_seen"]) if session["last_seen"] else "a while ago"
        project = session.get("project") or "your project"
        print(f"{Colors.DIM}↩  Resuming session from {last_seen} — {len(messages) // 2} exchanges on {project}{Colors.RESET}\n")

        # Ask the agent to pick up where we left off, with accountability
        resume_prompt = (
            f"The developer is back. Last session was {last_seen}. "
            f"Review our conversation history and immediately hold them accountable: "
            f"ask what they actually did since we last spoke, then pick up exactly where we left off."
        )
        print(f"{Colors.YELLOW}🚀 Shipper Agent:{Colors.RESET} ", end="", flush=True)
        try:
            messages.append({"role": "user", "content": resume_prompt})
            response = chat_fn(system_prompt, messages)
            messages.append({"role": "assistant", "content": response})
            print()
        except Exception as e:
            print(f"{Colors.RED}API Error: {e}{Colors.RESET}")
            messages.pop()
            sys.exit(1)
    else:
        # Fresh start — ask for the project name, then kick off
        print(f"{Colors.YELLOW}🚀 Shipper Agent:{Colors.RESET} ", end="", flush=True)
        try:
            opening = chat_fn(system_prompt, [{"role": "user", "content": "I'm here. Let's go."}])
            messages.append({"role": "user", "content": "I'm here. Let's go."})
            messages.append({"role": "assistant", "content": opening})
            print()
        except Exception as e:
            print(f"{Colors.RED}API Error: {e}{Colors.RESET}")
            sys.exit(1)

    save_session(session)

    # Main conversation loop
    while True:
        try:
            user_input = input(f"{Colors.GREEN}You:{Colors.RESET} ").strip()
        except (KeyboardInterrupt, EOFError):
            print(f"\n\n{Colors.CYAN}Session saved. We'll pick this up next time.{Colors.RESET}\n")
            save_session(session)
            break

        if not user_input:
            continue

        if user_input.lower() in ("exit", "quit", "q"):
            print(f"\n{Colors.CYAN}Session saved. But the question stands: did you ship today?{Colors.RESET}\n")
            save_session(session)
            break

        if user_input.lower() == "--new":
            print(f"\n{Colors.MAGENTA}Starting fresh. Previous session cleared.{Colors.RESET}\n")
            reset_session()
            session = load_session()
            messages = session["messages"]
            continue

        messages.append({"role": "user", "content": user_input})

        # Capture project name from early messages for display
        if not session.get("project") and len(messages) <= 6:
            session["project"] = "your project"

        try:
            print(f"\n{Colors.YELLOW}🚀 Shipper Agent:{Colors.RESET} ", end="", flush=True)
            response = chat_fn(system_prompt, messages)
            messages.append({"role": "assistant", "content": response})
            print()
            save_session(session)
        except Exception as e:
            print(f"{Colors.RED}API Error: {e}{Colors.RESET}")
            messages.pop()


# ── Entry Point ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="The Shipper Agent — An AI that refuses to let you build in localhost forever.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--provider",
        choices=list(PROVIDERS.keys()),
        default="anthropic",
        help="LLM provider to use (default: anthropic)",
    )
    parser.add_argument(
        "--new",
        action="store_true",
        help="Start a fresh session, clearing previous conversation",
    )
    parser.add_argument(
        "--init",
        action="store_true",
        help="Copy CLAUDE.md into the current directory to activate co-founder mode in Claude Code",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the system prompt and exit without starting a chat",
    )
    args = parser.parse_args()

    if args.init:
        import shutil
        dest = Path.cwd() / "CLAUDE.md"
        src = SCRIPT_DIR / "CLAUDE.md"
        # Running --init from inside the repo itself: source and target are the same
        if src.resolve() == dest.resolve():
            print(f"{Colors.GREEN}✓ CLAUDE.md is already here — your co-founder is ready.{Colors.RESET}")
            print(f"{Colors.DIM}Run --init from a different project folder to copy it there.{Colors.RESET}")
            return
        if dest.exists():
            overwrite = input(f"{Colors.YELLOW}CLAUDE.md already exists here. Overwrite? (y/n):{Colors.RESET} ").strip().lower()
            if overwrite != "y":
                print(f"{Colors.DIM}Aborted.{Colors.RESET}")
                return
        shutil.copy(src, dest)
        print(f"{Colors.GREEN}✓ CLAUDE.md copied to {dest}{Colors.RESET}")
        print(f"{Colors.DIM}Open this folder in Claude Code — your co-founder is ready.{Colors.RESET}")
        return

    if args.dry_run:
        print(load_system_prompt())
        return

    if args.provider == "anthropic" and not os.environ.get("ANTHROPIC_API_KEY"):
        print(f"{Colors.RED}Error: ANTHROPIC_API_KEY environment variable not set.{Colors.RESET}")
        print(f"Run: export ANTHROPIC_API_KEY=sk-...")
        sys.exit(1)
    elif args.provider == "openai" and not os.environ.get("OPENAI_API_KEY"):
        print(f"{Colors.RED}Error: OPENAI_API_KEY environment variable not set.{Colors.RESET}")
        print(f"Run: export OPENAI_API_KEY=sk-...")
        sys.exit(1)

    run_interactive(args.provider, new_session=args.new)


if __name__ == "__main__":
    main()
