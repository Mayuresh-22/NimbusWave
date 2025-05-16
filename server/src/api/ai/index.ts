// this is the entry point for the AI module
import { zValidator } from "@hono/zod-validator";
import type { CoreMessage } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { z } from "zod";
import type { Bindings } from "../..";
import { NimbusWaveAgent } from "../../mastra/agents";
import type { HonoContext } from "../../mastra/tools";
import { setToolZipFile } from "../../mastra/tools";
import type { AuthContext } from "../../middlewares/auth";
import { toCoreMessages } from "../../utils";

const AIEndpoint = new Hono<{
  Bindings: Bindings;
  Variables: AuthContext;
}>().basePath("/ai");

const ChatEndpointSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 1 * 1024 * 1024,
      "File size should be less than 1MB",
    )
    .refine(
      (file) =>
        ["application/zip", "application/x-zip-compressed"].includes(file.type),
      "Invalid file type",
    ),
  message: z.string().nonempty(),
  chat_id: z.string().nonempty(),
  project_id: z.string().nonempty(),
});

interface ChatEndpointInputs {
  file: File;
  message: string;
  chat_id: string;
  project_id: string;
}

export interface Message {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolResult?: string;
}

AIEndpoint.post("/chat", zValidator("form", ChatEndpointSchema), async (c) => {
  const formData = await c.req.formData();
  const formVars: ChatEndpointInputs = {
    file: formData.get("file") as File,
    message: formData.get("message") as string,
    chat_id: formData.get("chat_id") as string,
    project_id: formData.get("project_id") as string,
  };

  // get the prev context for chat_id
  const prevContext = await c.env.DB.prepare(
    "SELECT chat_context FROM chats WHERE chat_id = ?",
  )
    .bind(formVars.chat_id)
    .first();
  const parsedContext = prevContext?.chat_context
    ? JSON.parse(prevContext?.chat_context as string)
    : [];

  // const response = await new llmService(c.env.GROQ_API_KEY).getLLMResponse(
  //   message,
  //   prevContext?.chat_context ? parsedContext : [],
  // );

  /*
      tbh, this (line 85-89) are few workarounds for the agent to work with the file upload
      and underlying llm models. 
      
      1 - As mastra tries to access the models api key from the .env.production
      file, using process.env.* to access the env variables.
      Cloudflare worker runtime has its own way of accessing the env variables
      through worker bindings. So we need to set the env variables here.

      2 - The agent is not able to access the file upload directly. I mean it doesn't
      make sense to pass the file content to the agent via message (its complete madness) in this case.
      So we need to set the file object to global var and let agent function access it 
      directly.

      3 - Another and final workaround is to set HonoContext in the runtime context of the agent.
      This will allow agent function to access the worker bindings directly.
    */
  process.env.GROQ_API_KEY = c.env.GROQ_API_KEY;
  process.env.CEREBRAS_API_KEY = c.env.CEREBRAS_API_KEY;
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = c.env.GOOGLE_GENERATIVE_AI_API_KEY;
  setToolZipFile(formVars.file);
  const runtimeContext = new RuntimeContext<HonoContext>();
  runtimeContext.set("c", c);

  // streaming response directly from the agent
  const agentStream = await NimbusWaveAgent.stream(
    [{ role: "user", content: formVars.message }],
    {
      runtimeContext,
      context: toCoreMessages(parsedContext.slice(-15)) as CoreMessage[],
      system: `These are the only original params - uid: ${c.var.user.id} project_id: ${formVars.project_id} chat_id: ${formVars.chat_id}`,
      runId: formVars.chat_id,
      resourceId: formVars.chat_id,
      threadId: formVars.chat_id,
      maxRetries: 1,
      maxTokens: 2000,
    },
  );

  const contextBuffer = parsedContext as Array<Message>;
  contextBuffer.push({
    role: "user",
    content: formVars.message,
  });

  agentStream.text.then(async (fullText) => {
    // persist tool calls and results
    for await (const chunk of agentStream.fullStream) {
      if (chunk.type === "tool-call") {
        contextBuffer.push({
          role: "tool",
          content: "",
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
        });
      } else if (chunk.type === "tool-result") {
        const toolResultStr = JSON.stringify(chunk.result);
        const toolCallIndex = contextBuffer.findIndex(
          (message) => message.toolCallId === chunk.toolCallId,
        );
        if (toolCallIndex !== -1) {
          contextBuffer[toolCallIndex] = {
            ...contextBuffer[toolCallIndex],
            toolResult: toolResultStr,
          };
        }
      }
    }

    await c.env.DB.prepare(
      "UPDATE chats SET chat_context = ? WHERE chat_id = ?",
    )
      .bind(
        JSON.stringify([
          ...contextBuffer,
          { role: "assistant", content: fullText || "Steps completed." },
        ]),
        formVars.chat_id,
      )
      .run();
  });

  // return agentStream.toDataStreamResponse();

  return stream(c, async (readableStreamDefaultWriter) => {
    c.res.headers.set("Content-Type", "text/event-stream");
    c.res.headers.set("Cache-Control", "no-cache");
    c.res.headers.set("Connection", "keep-alive");
    c.res.headers.set("Transfer-Encoding", "chunked");
    const reader = agentStream.toDataStream().getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      readableStreamDefaultWriter.write(value);
      readableStreamDefaultWriter.sleep(100);
    }
    readableStreamDefaultWriter.close();
  });
});
export default AIEndpoint;
