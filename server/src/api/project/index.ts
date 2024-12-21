// this is the entry point for the AI module
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'
import { Bindings } from "../..";
import llmService from "../../services/llmService";
import { v4 } from "uuid";
import { AuthContext } from "../../middlewares/auth";

const CreateProjectReq = z.object({
  default: z.boolean(),
  project_name: z.string().optional(),
  project_description: z.string().optional(),
  project_framework: z.string().optional()
});

const ProjectEndpoint = new Hono<{ Bindings: Bindings, Variables: AuthContext }>();

ProjectEndpoint.post("/project", zValidator("json", CreateProjectReq), async (c) => {
  const body = await c.req.json();
  // check if user has sufficient credits
  console.log(c.var.user.id);

  const userResult = await c.env.DB.prepare(
    "SELECT project_credits FROM users WHERE id = ?"
  )
    .bind(c.var.user.id)
    .first();

  if (!userResult) {
    return c.json({
      status: "error",
      message: "User not found, complete onboarding process first."
    }, 404);
  } else if ((userResult.project_credits as number) < 1) {
    return c.json({
      status: "error",
      message: "Insufficient project credits, purchase more credits."
    }, 200);
  }

  /*
    This route creates a new project and a chat window
    associated with the project. The project is associated
    with the user who created it.
  */
  const projectId = v4();
  const chatId = v4();

  if (body.default) {
    const projectResult = await c.env.DB.batch([
      c.env.DB.prepare(
        "INSERT INTO projects (project_id, chat_id, user_id) VALUES (?, ?, ?)"
      ).bind(projectId, chatId, c.var.user.id),
      c.env.DB.prepare(
        "INSERT INTO chats (chat_id, project_id, user_id) VALUES (?, ?, ?)"
      ).bind(chatId, projectId, c.var.user.id),
      c.env.DB.prepare(
        "UPDATE users SET project_credits = ? WHERE id = ?"
      )
        .bind((userResult.project_credits as number) - 1, c.var.user.id)
    ]);

    projectResult.map((queryResult) => {
      if (queryResult.success !== true && queryResult.meta.changes !== 1) {
        return c.json({ status: "error", message: "Project creation failed" }, 500);
      }
    });

    return c.json({
      status: "success",
      message: "Project created",
      data: {
        project_id: projectId,
        chat_id: chatId,
        project_type: 'private'
      }
    }, 200);
  }
});

export default ProjectEndpoint;