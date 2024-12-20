// Purpose: Service to send/receive LLM messages
import Groq from "groq-sdk";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions.mjs";

interface LLMResponse {
  message: string;
  tool: string | null;
  thought: string;
}

class LLMService {
  llmProvider = "groq";
  llm = "llama-3.2-90b-vision-preview";
  llmSysPrompt = `You are a helpful AI assistant of NimbusWave, an AI-powered edge deployment platform that lets users deploy and scale their JavaScript/TypeScript web apps. And you are the ai assistant that navigates users through the deployment process.
You'll be given tools (functions) to call when required.

Simple deployment process: 
- User uploads their /dist or /build folder on the platform
- Collect essential information like project name, framework, and javascript/typescript.
- The deploy app on the global edge network

You should respond only and only in JSON of following format: (Other formats will be penalised)
{
  "message": string;
  "tool": string | null;
  "thought": string <your private thought>;
}
DO NOT get involved in non-deployment/Irrelevant questions. (Otherwise you will be penalised)
`;
  maxTokens = 712;
  groqInstance: Groq;

  constructor(apiKey: string) {
    this.groqInstance = new Groq({ apiKey: apiKey });
  }

  async getLLMResponse(message: string, context: ChatCompletionMessageParam[]): Promise<LLMResponse> {
    const messageArray: ChatCompletionMessageParam[] = [{
      "role": "system",
      "content": this.llmSysPrompt
    }, ...context]
    messageArray.push({
      "role": "user",
      "content": message
    });
    const chatCompletion = await this.groqInstance.chat.completions.create({
      "messages": messageArray,
      "model": this.llm,
      "temperature": 1,
      "max_tokens": this.maxTokens,
      "top_p": 1,
      "stream": false,
      "stop": null
    });

    console.log(chatCompletion.choices[0].message.content);
    if (chatCompletion.choices[0].message.content === null) {
      return {
        message: "I'm sorry, I don't understand. Can you please rephrase?",
        tool: null,
        thought: ""
      };
    }

    return JSON.parse(chatCompletion.choices[0].message.content) as LLMResponse;
  }
}

export default LLMService;