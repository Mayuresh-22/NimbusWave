// this is the entry point for the AI module
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Bindings } from "../..";
import llmService from "../../services/llmService";

const ChatEndpointRequest = z.object({
  message: z.string().nonempty(),
  chat_id: z.string().nonempty(),
  project_id: z.string().nonempty(),
});

const AIEndpoint = new Hono<{ Bindings: Bindings }>().basePath("/ai");

AIEndpoint.post("/chat", zValidator("json", ChatEndpointRequest), async (c) => {
  const { message, chat_id, project_id } = await c.req.json();
  // get the prev context for chat_id
  const prevContext = await c.env.DB.prepare(
    "SELECT chat_context FROM chats WHERE chat_id = ?",
  )
    .bind(chat_id)
    .first();
  const parsedContext = prevContext?.chat_context
    ? JSON.parse(prevContext?.chat_context as string)
    : [];

  const response = await new llmService(c.env.GROQ_API_KEY).getLLMResponse(
    message,
    prevContext?.chat_context ? parsedContext : [],
  );

  // save the context
  await c.env.DB.prepare("UPDATE chats SET chat_context = ? WHERE chat_id = ?")
    .bind(
      JSON.stringify([
        ...(prevContext?.chat_context ? parsedContext : []),
        { role: "user", content: message },
        { role: "assistant", content: response.message },
      ]),
      chat_id,
    )
    .run();
  return c.json(response);
});

export default AIEndpoint;
