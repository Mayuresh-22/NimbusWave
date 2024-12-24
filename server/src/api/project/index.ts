// this is the entry point for the AI module
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Bindings } from "../..";
import { v4 } from "uuid";
import { AuthContext } from "../../middlewares/auth";
import FRAMEWORK_PROCESSORS from "../../services/frameworks";
import DeploymentService from "../../services/deployment";

const CreateProjectReqSchema = z.object({
  default: z.boolean(),
  project_name: z.string().nonempty().optional(),
  project_description: z.string().nonempty().optional(),
  project_framework: z.string().nonempty().optional(),
});

const DeployProjectReqSchema = z
  .object({
    project_id: z.string().nonempty(),
    project_name: z.string().nonempty(),
    project_description: z.string().nonempty(),
    project_framework: z.string().nonempty(),
  })
  .refine((project) => project.project_framework in FRAMEWORK_PROCESSORS, {
    message: `Project framework is invalid or not supported`,
  });


const ProjectEndpoint = new Hono<{
  Bindings: Bindings;
  Variables: AuthContext;
}>();

ProjectEndpoint.post(
  "/project",
  zValidator("json", CreateProjectReqSchema),
  async (c) => {
    const body = await c.req.json();
    /*
    This route creates a new project and a chat window
    associated with the project. The project is associated
    with the user who created it.
  */

    const userResult = await c.env.DB.prepare(
      "SELECT project_credits FROM users WHERE id = ?"
    )
      .bind(c.var.user.id)
      .first();

    if (!userResult) {
      return c.json(
        {
          status: "error",
          message: "User not found, complete onboarding process first.",
        },
        404
      );
    } else if ((userResult.project_credits as number) < 1) {
      return c.json(
        {
          status: "error",
          message: "Insufficient project credits, purchase more credits.",
        },
        200
      );
    }

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
        ).bind((userResult.project_credits as number) - 1, c.var.user.id),
      ]);

      projectResult.map((queryResult) => {
        if (queryResult.success !== true && queryResult.meta.changes !== 1) {
          return c.json(
            { status: "error", message: "Project creation failed" },
            500
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
        200
      );
    }
  }
);

ProjectEndpoint.get("/project", async (c) => {
  const { id, withChats } = c.req.query();

  if (!id) {
    return c.json(
      {
        status: "error",
        message: "Project ID is required",
      },
      400
    );
  }

  const projectResult = await c.env.DB.prepare(
    `SELECT  projects.project_id, chats.chat_id, project_name, project_framework, project_description, project_status, chats.chat_context 
    FROM projects JOIN chats ON projects.chat_id = chats.chat_id WHERE projects.project_id = ? AND projects.user_id = ? AND chats.user_id = ?`
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
      404
    );
  }

  return c.json(
    {
      status: "success",
      data: projectResult,
    },
    200
  );
});

ProjectEndpoint.post(
  "/project/deploy",
  zValidator("form", DeployProjectReqSchema),
  async (c) => {
    const body = await c.req.formData();
    const zipProjectFiles: File = body.get("file") as File;
    const projectId = body.get("project_id") as string;
    const projectName = body.get("project_name") as string;
    const projectDescription = body.get("project_description") as string;
    const projectFramework = body.get("project_framework") as string;

    // check if the file is a zip file
    if (
      zipProjectFiles.type !== "application/x-zip-compressed" &&
      zipProjectFiles.type !== "application/zip"
    ) {
      return c.json(
        {
          status: "error",
          message: "Invalid file type, only zip files are allowed",
        },
        400
      );
    }
    const deploymentResult = await new DeploymentService(
      projectId,
      zipProjectFiles,
      {
        project_name: projectName,
        project_description: projectDescription,
        project_framework: projectFramework,
      },
      c
    ).unzip()
    .then((deploymentService) => deploymentService.processFiles())
    .then((deploymentService) => deploymentService.processIndexHTML())

    return c.json(
      {
        status: "success",
        message: "Project deployed successfully",
        data: deploymentResult,
      },
      200
    );
  }
);

export default ProjectEndpoint;
