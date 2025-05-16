import type { Message } from "../api/ai";

export const toCoreMessages = (messages: Array<Message>) => {
  return messages.map((message) => {
    if (message.role === "user") {
      return { role: "user", content: message.content };
    } else if (message.role === "assistant") {
      return { role: "assistant", content: message.content };
    } else if (message.role === "tool") {
      return {
        role: "assistant",
        content: `toolCallId: ${message.toolCallId},
        toolName: ${message.toolName} toolResult: ${message.toolResult}`,
      };
    }
  });
};
