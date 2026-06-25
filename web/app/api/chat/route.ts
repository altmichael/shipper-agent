import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { readFileSync } from "fs";
import { join } from "path";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import { moderateInput, SYSTEM_ADDENDUM } from "@/lib/moderation";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getSystemPrompt(): string {
  const base = readFileSync(join(process.cwd(), "SYSTEM_PROMPT.md"), "utf-8");
  return `${base}\n\n${SYSTEM_ADDENDUM}`;
}

export async function POST(req: Request) {
  // Rate limiting
  const ip = getIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return Response.json({ error: rateCheck.reason }, { status: 429 });
  }

  const { messages } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Moderate the latest user message
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  if (lastUserMessage) {
    const modResult = moderateInput(lastUserMessage.content);
    if (!modResult.safe) {
      return Response.json({ error: modResult.reason }, { status: 422 });
    }
  }

  const systemPrompt = getSystemPrompt();

  // Convert messages to Gemini format
  // Gemini uses "model" instead of "assistant", and needs alternating user/model turns
  const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: 1024 },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
    ],
  });

  const chat = model.startChat({ history });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Retry on 503 (model overloaded) — up to 3 attempts with backoff
      const MAX_RETRIES = 3;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await chat.sendMessageStream(lastMessage.content);
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
          return;
        } catch (err: unknown) {
          const status = (err as { status?: number })?.status;
          const isOverloaded = status === 503 || status === 429;

          if (isOverloaded && attempt < MAX_RETRIES) {
            // Wait 1s, 2s, 4s before retrying
            await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
            continue;
          }

          console.error("Gemini error:", err);
          const msg = isOverloaded
            ? "I'm getting a ton of requests right now — give me a few seconds and hit send again."
            : "Something went wrong. Try again.";
          controller.enqueue(encoder.encode(msg));
          controller.close();
          return;
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
