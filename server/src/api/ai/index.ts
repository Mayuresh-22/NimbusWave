// this is the entry point for the AI module
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'
import { Bindings } from "../..";
import llmService from "../../services/llmService";

const ChatEndpointRequest = z.object({
  message: z.string(),
  chat_id: z.string(),
  project_id: z.string()
});

const AIEndpoint = new Hono<{ Bindings: Bindings }>().basePath("/ai");

AIEndpoint.post("/chat", zValidator("json", ChatEndpointRequest), async (c) => {
  const body = await c.req.json();
  const response = await new llmService(c.env.GROQ_API_KEY)
    .getLLMResponse(body.message, []);
  return c.json(response);
});
//hello
export default AIEndpoint;