// this is the entry point for the AI module
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { v4 } from "uuid";
import { z } from "zod";
import type { Bindings } from "../..";
import type { AuthContext } from "../../middlewares/auth";
import { UserCreditsMiddleware } from "../../middlewares/userCredits";
import type { ProjectFilesMeta } from "../../services/deployment";
import DeploymentService from "../../services/deployment";
import FRAMEWORK_PROCESSORS from "../../services/frameworks";

interface ProjectDeploymentRequestVars {
  zipFile: File;
  projectId: string;
  projectName: string;
  projectDescription: string;
  projectFramework: string;
}

const CreateProjectReqSchema = z.object({
  default: z.boolean(),
  project_name: z.string().nonempty().max(20).optional(),
  project_description: z.string().nonempty().max(100).optional(),
  project_framework: z.string().nonempty().max(10).optional(),
});

const DeployProjectReqSchema = z
  .object({
    file: z
      .instanceof(File)
      .refine(
        (file) => file.size <= 1 * 1024 * 1024,
        "File size should be less than 1MB",
      )
      .refine(
        (file) =>
          ["application/zip", "application/x-zip-compressed"].includes(
            file.type,
          ),
        "Invalid file type",
      ),
    project_id: z.string().nonempty(),
    project_name: z.string().nonempty().max(20),
    project_description: z.string().nonempty().max(100),
    project_framework: z.string().nonempty().max(10),
  })
  .refine((project) => project.project_framework in FRAMEWORK_PROCESSORS, {
    message: "Project framework is invalid or not supported",
  });

const ProjectEndpoint = new Hono<{
  Bindings: Bindings;
  Variables: AuthContext;
}>();

/*
  -------------------------- Middleware(s) --------------------------
  Mount middlewares on certain routes
*/
ProjectEndpoint.use("/project/deploy", UserCreditsMiddleware);

/*
  -------------------------- /project/* --------------------------
*/

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

ProjectEndpoint.post(
  "/project/deploy",
  zValidator("form", DeployProjectReqSchema),
  async (c) => {
    const body = await c.req.formData();
    const deploymentReqVars: ProjectDeploymentRequestVars = {
      zipFile: body.get("file") as File,
      projectId: body.get("project_id") as string,
      projectName: body.get("project_name") as string,
      projectDescription: body.get("project_description") as string,
      projectFramework: body.get("project_framework") as string,
    };

    // check if the file is a zip file
    const isValidZipFile =
      deploymentReqVars.zipFile.type === "application/zip" ||
      deploymentReqVars.zipFile.type === "application/x-zip-compressed";
    if (!isValidZipFile) {
      return c.json(
        {
          status: "error",
          message: "Invalid file type, only zip files are allowed",
        },
        400,
      );
    }

    // check if project exists
    const existingProject = await c.env.DB.prepare(
      "SELECT * FROM projects WHERE project_id = ? AND user_id = ?",
    )
      .bind(deploymentReqVars.projectId, c.var.user.id)
      .first();

    if (!existingProject) {
      return c.json(
        {
          status: "error",
          message: "Project not found",
        },
        404,
      );
    }
    /*
      Deployment process starts here this process will be completed synchronously.
      It make use of chainable methods to process the deployment files.

      Flags used in the deployment process:
      UPDATE_PROJECT_APP_NAME: update project app name if null (default: true)
      UPDATE_BASE_NAME: update base name if null (default: false)
    */
    try {
      const deployServiceResult = await new DeploymentService(
        c,
        deploymentReqVars.projectId,
        deploymentReqVars.zipFile,
        {
          project_app_name: existingProject.project_app_name,
          project_name: deploymentReqVars.projectName,
          project_description: deploymentReqVars.projectDescription,
          project_framework: deploymentReqVars.projectFramework,
        },
        JSON.parse(
          existingProject.project_files_meta as string,
        ) as ProjectFilesMeta,
      )
        .unzip()
        .then((deploymentInstance) => deploymentInstance.processFiles())
        .then((deploymentInstance) => deploymentInstance.processIndexHTML())
        .then((deploymentInstance) => deploymentInstance.finalize());
      console.log(deployServiceResult.projectFilesDict);

      /*
        Insert deployment details into the database & update project details
        TODO: add value for deployment_url column, construct url in following format:
        ${c.env.SERVER_BASE_URL}/deployment/${deployServiceResult.deploymentName}
      */
      const deployQueryResults = await c.env.DB.batch([
        c.env.DB.prepare(
          `INSERT INTO deployments (deployment_id, project_id, 
        deployment_status, deployment_logs, deployment_size, time_taken) 
        VALUES (?, ?, 1, ?, ?, ?)`,
        ).bind(
          deployServiceResult.deploymentId,
          deploymentReqVars.projectId,
          deployServiceResult.log,
          deployServiceResult.projectSize,
          deployServiceResult.timeTaken,
        ),
        c.env.DB.prepare(
          `UPDATE projects SET project_name = ?, project_app_name = ?, project_framework = ?, 
        project_description = ?, project_status = 1, project_size = ?, project_files_meta = ?, entry_file_path = ?, 
        is_temp = 0 WHERE project_id = ? AND user_id = ?`,
        ).bind(
          deploymentReqVars.projectName,
          deployServiceResult.appName,
          deploymentReqVars.projectFramework,
          deploymentReqVars.projectDescription,
          deployServiceResult.projectSize,
          deployServiceResult.projectFilesDict,
          deployServiceResult.deploymentResult.secure_url,
          deploymentReqVars.projectId,
          c.var.user.id,
        ),
      ]);
      /*
        Check if the deployment was successful and the changes were made in the database
      */
      deployQueryResults.map((queryResult) => {
        if (queryResult.success !== true && queryResult.meta.changes !== 1) {
          return c.json(
            {
              status: "error",
              message: "Project deployment failed",
              logs: deployServiceResult.log,
            },
            500,
          );
        }
      });

      return c.json(
        {
          status: "success",
          message: "Project deployed successfully",
          data: {
            deployment_id: deployServiceResult.deploymentId,
            deployment_url: `${c.env.SERVER_BASE_URL}/deployment/${deployServiceResult.deploymentName}`,
            project_url: `${c.env.SERVER_BASE_URL}/app/${deployServiceResult.appName}`,
            project_size: deployServiceResult.projectSize,
            time_taken: deployServiceResult.timeTaken,
            deployment_logs: deployServiceResult.log,
          },
        },
        200,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return c.json(
        {
          status: "error",
          message: "Project deployment failed",
          logs: errorMessage,
        },
        500,
      );
    }
  },
);

export default ProjectEndpoint;
