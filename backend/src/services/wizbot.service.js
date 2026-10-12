import Anthropic from "@anthropic-ai/sdk";
import ApiError from "../utils/apiError.js";

/**
 * Wizbot is backed by the Anthropic API. It needs ANTHROPIC_API_KEY set in
 * .env to actually respond - this is intentionally NOT in the required env
 * vars list in config/env.js, so the rest of the backend can run without it
 * during development. Hitting the wizbot endpoint without a key set throws
 * a clear 500 telling you exactly what's missing, instead of a cryptic SDK error.
 */
let client = null;

function getClient() {
  if (client) return client;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw ApiError.internal(
      "Wizbot is not configured: set ANTHROPIC_API_KEY in your .env file to enable the AI assistant."
    );
  }

  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const SYSTEM_PROMPT = `You are Wizbot, an AI career assistant embedded in the Wizpace job platform.
You help users with: resume feedback, interview preparation, job search strategy,
and career advice. Keep responses concise and actionable (this is a chat UI, not
an essay). If asked something unrelated to careers/jobs, gently redirect.`;

/**
 * @param {Array<{role: "user"|"assistant", content: string}>} messages - full conversation history
 * @param {object} [botConfig] - user's chosen avatar/persona settings, folded into the system prompt
 * @returns {Promise<string>} the assistant's reply text
 */


export async function getWizbotReply(messages, botConfig = {}) {
  const anthropic = getClient();

  let systemPrompt = SYSTEM_PROMPT;
  if (botConfig.persona) {
    systemPrompt += `\nAdopt this persona/tone: ${botConfig.persona}`;
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock?.text || "";
  } catch (err) {
    // The Anthropic SDK's error.message is the raw API response body
    // (billing/credit issues, invalid key, rate limits, etc). That's
    // exactly what ops needs to see, but it's not something an end user
    // chatting with Wizbot should ever see verbatim - it can expose
    // account/billing internals and just looks like a broken app. We
    // always log the raw detail server-side, then surface a clean,
    // status-appropriate message to the client instead.
    console.error("[wizbot] Anthropic API error:", err.status, err.message);

    if (err.status === 401) {
      throw ApiError.internal("Wizbot is misconfigured (invalid API key). Please contact support.");
    }
    if (err.status === 429) {
      throw ApiError.internal("Wizbot is getting a lot of requests right now. Please try again in a moment.");
    }
      throw ApiError.internal("Wizbot is temporarily unavailable. Please try again shortly.");
  }
}
