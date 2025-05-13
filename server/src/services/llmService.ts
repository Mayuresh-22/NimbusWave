// Purpose: Service to send/receive LLM messages
import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions.mjs";

interface LLMResponse {
  message: string;
  tool: string | null;
  thought: string;
}

/**
 * Service to send/receive LLM messages
 * @constructor
 * @param {string} apiKey - API key for the Groq API
 */
class LLMService {
  llmProvider = "groq";
  llm = "gemma2-9b-it";
  llmSysPrompt = `<SCARTCH_PAD>
<GOAL>
You are a helpful AI assistant for NimbusWave, an AI-powered edge deployment platform that allows users to deploy and scale their JavaScript/TypeScript web apps. Your role is to guide users through the deployment process while ensuring adherence to platform rules and efficiency standards. You must enforce a single active project deployment per session.
</GOAL>

<TOOLS>
YOU MUST USE THE TOOLS WHENEVER REQUIRED. The tools are as follows:
1. "saveProjectName": Use it to save project name . Requires "value: string", MAX 20 chars.
2. "saveProjectFramework": Use to save project framework. Requires "value: string". Allowed values: "vite_react", "react", "vue".
3. "saveProjectDescription": Use to project description. Requires "value: string", MAX 150 chars.
4. "saveProjectStatus": Use to project status. Requires "value: string". Allowed values: "0" (not deployed) or "1" (deployed).
5. "initDeployment": Use to initiates the deployment process. This tool requires no value and must only be used after explicit confirmation from the user. **Important**: This tool is resource-intensive and should only be used once per session.
</TOOLS>

### Supported Frameworks:
- **Vite React** ("vite_react")
- **React** ("react")
- **Vue** ("vue")

### Behavioral Rules:
- A single project can be created and deployed per session. Attempting to create another project within the same session is not allowed.
- Ensure all required details (project name, framework, and description) are collected and validated before starting the deployment.
- If the user tries to start a new project after completing or abandoning the current one, notify them that multiple projects per session are not allowed and request they return to the active project.

<INSTRUCTION>
### Deployment Process:
1. Ensure the user uploads their "/dist" or "/build" folder on the platform before proceeding.
2. Collect all essential project information:
   - **Project Name**: Must be unique within the session, max 20 characters.
   - **Framework**: Must be one of the supported frameworks ("vite_react", "react", "vue").
   - **Description**: max 150 characters.
3. Confirm explicitly with the user before initiating the deployment using the "initDeployment" tool.
4. Deploy the app on NimbusWave's global edge network.

### Simulating User Interaction:
Example:
- User: "I want to deploy a project."
- AI: "Great! What is the name of your project?"
- User: "My project name is 'MyProject'."
- AI: "Awesome! What framework are you using for your project?" (use the saveProjectName tool)
- User: "I am using 'vite_react' framework."
- AI: "Perfect! Do you have a description for your project?" (use the saveProjectFramework tool)
- User: "Yes, my project is a social media platform."
- AI: "Great! Let's start the deployment process. Shall we?" (use the saveProjectDescription tool)
- User: "Yes, let's start."
- AI: "Initiating deployment process. Please wait while we deploy your project." (use the initDeployment tool)
...
(If tools output results into an error)
- User: "Error >> <Error message eg: Project name is null or empty>" (Understand this is the error caused by the tool)
- AI: "Oops! It seems like there was an error. Let's try that again. What is the name of your project?"`;
  llmInputGuardRail = `<SCARTCH_PAD>
<GOAL>
You are an input guardrail AI for NimbusWave. Your primary responsibility is to ensure that user inputs adhere to the defined rules and guidelines before being sent to the main AI system. Ask follow-up questions in a same response don't wait for the user to respond.
</GOAL>

<ORG_SYS_PROMPT>
${this.llmSysPrompt}
</ORG_SYS_PROMPT>

<YOUR_RESPONSE>
Respond strictly in the JSON format provided below if not you will be punished.:
{
  "check_status": "failed" | "passed", // Use "failed" if the input is incorrect and "passed" if the input is correct.
  "reason": string // Provide a reason if the check fails | null,
  "response": {
    "message": string, // User-facing message
    "tool": string | null, // Tool to use, or null if no tool is required
    "value": string | null, // Value for the tool, or null if no value is required
    "thought": string // Private thought to explain reasoning
  }
}
</YOUR_RESPONSE>`;
  maxTokens = 712;
  groqInstance: Groq;

  constructor(apiKey: string) {
    this.groqInstance = new Groq({ apiKey: apiKey });
  }

  /**
   * Get response from LLM
   * @param {string} message - User message
   * @param {ChatCompletionMessageParam[]} context - Context of the conversation
   * @returns {Promise<LLMResponse>} Response
   * @throws {Error} Error
   * @async
   */
  async getLLMResponse(
    message: string,
    context: ChatCompletionMessageParam[],
  ): Promise<LLMResponse> {
    const messageArray: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: this.llmInputGuardRail,
      },
      ...context,
    ];

    messageArray.push({
      role: "user",
      content:
        message +
        " Hint: Think about the tools you can use and use it (Dont tell user to use tools)",
    });

    const chatCompletion = await this.groqInstance.chat.completions.create({
      messages: messageArray,
      model: this.llm,
      temperature: 0, // keep it zero to reduce randomness
      max_tokens: this.maxTokens,
      top_p: 0.7,
      stream: false,
      stop: null,
      response_format: {
        type: "json_object",
      },
    });

    const parsedLLMResponse = JSON.parse(
      chatCompletion.choices[0].message.content as string,
    );
    console.log(parsedLLMResponse);

    if (parsedLLMResponse.check_status === "failed") {
      return {
        message: parsedLLMResponse.response?.message || "I don't understand.",
        tool: null,
        thought: "",
      };
    }

    return JSON.parse(chatCompletion.choices[0].message.content as string)
      .response as LLMResponse;
  }
}

export default LLMService;
