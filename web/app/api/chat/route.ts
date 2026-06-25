import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { readFileSync } from "fs";
import { join } from "path";
import { checkRateLimit, getIP } from "@/lib/rate-limit";
import { moderateInput, SYSTEM_ADDENDUM } from "@/lib/moderation";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function getSystemPrompt(): string {
  const base = readFileSync(join(process.cwd(), "..", "SYSTEM_PROMPT.md"), "utf-8");
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
    model: "gemini-2.5-flash-lite",  // update model ID here if needed
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
      try {
        const result = await chat.sendMessageStream(lastMessage.content);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        console.error("Gemini error:", err);
        controller.enqueue(encoder.encode("Something went wrong. Try again."));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
