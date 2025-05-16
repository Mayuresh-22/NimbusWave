// this is the entry point for the AI module
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { v4 } from "uuid";
import { z } from "zod";
import type { Bindings } from "../..";
import type { AuthContext } from "../../middlewares/auth";
import {
  UserDeploymentCreditsMiddleware,
  UserProjectCreditsMiddleware,
} from "../../middlewares/userCredits";
import FRAMEWORK_PROCESSORS from "../../services/frameworks";

interface ProjectDeploymentRequestVars {
  zipFile: File;
  projectId: string;
  project_name: string;
  project_description: string;
  project_framework: string;
}

const ProjectSchema = z.object({
  default: z.boolean(),
  id: z.string().nonempty().optional(),
  project_name: z.string().nonempty().max(20).optional(),
  project_description: z.string().nonempty().max(100).optional(),
  project_framework: z.string().nonempty().max(10).optional(),
});

const ProjectDeploymentReqSchema = z.object({
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
  project_id: z.string().nonempty(),
  project_name: z.string().nonempty().max(20),
  project_description: z.string().nonempty().max(150),
  project_framework: z
    .string()
    .nonempty()
    .max(10)
    .refine((project_framework) => project_framework in FRAMEWORK_PROCESSORS, {
      message: "Project framework is invalid or not supported",
    }),
  redeploy: z.boolean().optional().default(false),
});

const ProjectEndpoint = new Hono<{
  Bindings: Bindings;
  Variables: AuthContext;
}>();

/*
  -------------------------- Middleware(s) --------------------------
  Mount middlewares on certain routes
*/
ProjectEndpoint.post("/project", UserProjectCreditsMiddleware);
ProjectEndpoint.use("/project/deploy", UserDeploymentCreditsMiddleware);

/*
  -------------------------- /project/* --------------------------
*/

ProjectEndpoint.post(
  "/project",
  zValidator("json", ProjectSchema),
  async (c) => {
    const body = await c.req.json();
    /*
    This route creates a new project and a chat window
    associated with the project. The project is associated
    with the user who created it.
  */

    const userResult = await c.env.DB.prepare(
      "SELECT project_credits FROM users WHERE id = ?",
    )
      .bind(c.var.user.id)
      .first();

    if (!userResult) {
      return c.json(
        {
          status: "error",
          message: "User not found, complete onboarding process first.",
        },
        401,
      );
    } else if ((userResult.project_credits as number) < 1) {
      return c.json(
        {
          status: "error",
          message: "Insufficient project credits, purchase more credits.",
        },
        200,
      );
    }

    const projectId = v4();
    const chatId = v4();

    if (body.default) {
      const projectResult = await c.env.DB.batch([
        c.env.DB.prepare(
          "INSERT INTO projects (project_id, chat_id, user_id) VALUES (?, ?, ?)",
        ).bind(projectId, chatId, c.var.user.id),
        c.env.DB.prepare(
          "INSERT INTO chats (chat_id, project_id, user_id) VALUES (?, ?, ?)",
        ).bind(chatId, projectId, c.var.user.id),
        c.env.DB.prepare(
          "UPDATE users SET project_credits = ? WHERE id = ?",
        ).bind((userResult.project_credits as number) - 1, c.var.user.id),
      ]);

      projectResult.map((queryResult) => {
        if (queryResult.success !== true && queryResult.meta.changes !== 1) {
          return c.json(
            { status: "error", message: "Project creation failed" },
            500,
          );
        }
      });

      return c.json(
        {
          status: "success",
          message: "Project created",
          data: {
            project_id: projectId,
            chat_id: chatId,
            project_type: "private",
          },
        },
        200,
      );
    }
  },
);

ProjectEndpoint.get("/project", async (c) => {
  const { id, withChats } = c.req.query();

  if (!id) {
    return c.json(
      {
        status: "error",
        message: "Project ID is required",
      },
      400,
    );
  }

  const projectResult = await c.env.DB.prepare(
    `SELECT  projects.project_id, chats.chat_id, project_name, project_framework, project_description, project_status, chats.chat_context 
    FROM projects JOIN chats ON projects.chat_id = chats.chat_id WHERE projects.project_id = ? AND projects.user_id = ? AND chats.user_id = ?`,
  )
    .bind(id, c.var.user.id, c.var.user.id)
    .first();

  console.log(projectResult);

  if (!projectResult) {
    return c.json(
      {
        status: "error",
        message: "Project not found",
      },
      404,
    );
  }

  return c.json(
    {
      status: "success",
      data: projectResult,
    },
    200,
  );
});

ProjectEndpoint.delete("/project", async (c) => {
  const { id } = c.req.query();

  if (!id) {
    return c.json(
      {
        status: "error",
        message: "Project ID is required",
      },
      400,
    );
  }

  const projectResult = await c.env.DB.prepare(
    "SELECT project_id FROM projects WHERE project_id = ? AND user_id = ?",
  )
    .bind(id, c.var.user.id)
    .first();

  if (!projectResult) {
    return c.json(
      {
        status: "error",
        message:
          "Project not found or you do not have permission to delete it.",
      },
      404,
    );
  }

  const deleteResult = await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM projects WHERE project_id = ?").bind(id),
    c.env.DB.prepare(
      "UPDATE users SET project_credits = project_credits + 1 WHERE id = ?",
    ).bind(c.var.user.id),
  ]);

  const failed = deleteResult.some(
    (queryResult) =>
      queryResult.success !== true || queryResult.meta.changes === 0,
  );

  if (failed) {
    return c.json(
      {
        status: "error",
        message: "Failed to delete the project or update credits.",
      },
      500,
    );
  }

  return c.json(
    {
      status: "success",
      message: "Project deleted successfully, and credits updated.",
    },
    200,
  );
});

export default ProjectEndpoint;
