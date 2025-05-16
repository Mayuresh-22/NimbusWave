import type { RuntimeContext } from "@mastra/core/runtime-context";
import { createTool } from "@mastra/core/tools";
import type { Context } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import { inherits } from "util";
import type { Bindings } from "../..";
import type { AuthContext } from "../../middlewares/auth";
import type { ProjectFilesMeta } from "../../services/deployment";
import DeploymentService from "../../services/deployment";
import FRAMEWORK_PROCESSORS from "../../services/frameworks";

export type HonoContext = {
  c: Context<{ Bindings: Bindings; Variables: AuthContext }>;
};

export let toolZipFile: File | null = null;
export const setToolZipFile = (file: File) => {
  toolZipFile = file;
};

const DeployInputSchema = z.object({
  uid: z.string().nonempty(),
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

export const saveDetailsTool = createTool({
  id: "save-details",
  description: "Save the details of the project to the database",
  inputSchema: z.object({
    uid: z.string().describe("User ID"),
    project_id: z.string().describe("ID of the project"),
    project_name: z.string().describe("Name of the application").max(20),
    project_description: z
      .string()
      .describe("Description of the application")
      .max(150),
    project_framework: z
      .string()
      .nonempty()
      .max(10)
      .refine(
        (project_framework) => project_framework in FRAMEWORK_PROCESSORS,
        {
          message: "Project framework is invalid or not supported",
        },
      ),
  }),
  outputSchema: z.object({
    status: z.string(),
    message: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const {
      uid,
      project_id,
      project_name,
      project_description,
      project_framework,
    } = context;
    const c = (runtimeContext as RuntimeContext<HonoContext>).get("c");
    const projectResult = await c.env.DB.prepare(
      "UPDATE projects SET project_name = ?, project_description = ?, project_framework = ? WHERE project_id = ? AND user_id = ?",
    )
      .bind(
        project_name,
        project_description,
        project_framework,
        project_id,
        uid,
      )
      .run();

    if (projectResult.meta.changes !== 1) {
      return {
        status: "error",
        message: "Project not found",
      };
    }

    return {
      status: "success",
      message: "Project updated successfully",
    };
  },
});

export const deployTool = createTool({
  id: "deploy",
  description:
    "Deploy the application on the edge network. Do not use this tool without explicit permission.",
  inputSchema: DeployInputSchema,
  outputSchema: z.object({
    status: z.string(),
    message: z.string(),
    data: z
      .object({
        deployment_id: z.string(),
        project_url: z.string(),
        project_size: z.string(),
        time_taken: z.string(),
        deployment_logs: z.string(),
      })
      .optional(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const {
      uid,
      project_id,
      project_name,
      project_description,
      project_framework,
    } = context;

    const c = (runtimeContext as RuntimeContext<HonoContext>).get("c");

    const projectUpdateResult = await c.env.DB.prepare(
      "UPDATE projects SET project_name = ?, project_description = ?, project_framework = ? WHERE project_id = ? AND user_id = ?",
    )
      .bind(
        project_name,
        project_description,
        project_framework,
        project_id,
        uid,
      )
      .run();
    if (projectUpdateResult.meta.changes !== 1) {
      return {
        status: "error",
        message: "Project not found",
      };
    }

    // check if the file is a zip file
    const isValidZipFile =
      toolZipFile &&
      (toolZipFile.type === "application/zip" ||
        toolZipFile.type === "application/x-zip-compressed");
    if (!isValidZipFile) {
      return {
        status: "error",
        message: "Invalid file type, only zip files are allowed",
      };
    }

    // check if project exists
    const existingProject = await c.env.DB.prepare(
      "SELECT * FROM projects WHERE project_id = ? AND user_id = ?",
    )
      .bind(project_id, uid)
      .first();
    if (!existingProject) {
      return {
        status: "error",
        message: "Project not found",
      };
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
        project_id,
        toolZipFile as File,
        {
          project_app_name: existingProject.project_app_name,
          project_name: project_name,
          project_description: project_description,
          project_framework: project_framework,
        },
        (existingProject.project_files_meta as string)
          ? JSON.parse(existingProject.project_files_meta as string)
          : ({} as ProjectFilesMeta),
        {
          UPDATE_PROJECT_APP_NAME: true,
        },
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
          project_id,
          deployServiceResult.log,
          deployServiceResult.projectSize,
          deployServiceResult.timeTaken,
        ),
        c.env.DB.prepare(
          `UPDATE projects SET project_name = ?, project_app_name = ?, project_framework = ?, 
        project_description = ?, project_status = 1, project_size = ?, project_files_meta = ?, entry_file_path = ?, 
        is_temp = 0 WHERE project_id = ? AND user_id = ?`,
        ).bind(
          project_name,
          deployServiceResult.appName,
          project_framework,
          project_description,
          deployServiceResult.projectSize,
          deployServiceResult.projectFilesDict,
          deployServiceResult.deploymentResult.secure_url,
          project_id,
          c.var.user.id,
        ),
      ]);

      /*
        Check if the deployment was successful and the changes were made in the database
      */
      deployQueryResults.map((queryResult) => {
        if (queryResult.success !== true && queryResult.meta.changes !== 1) {
          return {
            status: "error",
            message: "Project deployment failed",
            logs: deployServiceResult.log,
          };
        }
      });

      return {
        status: "success",
        message: "Project deployed successfully",
        data: {
          deployment_id: deployServiceResult.deploymentId,
          project_url: `${c.env.SERVER_BASE_URL}/app/${deployServiceResult.appName}`,
          project_size: deployServiceResult.projectSize,
          time_taken: deployServiceResult.timeTaken,
          deployment_logs: deployServiceResult.log,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw error;
      // return {
      //   status: "error",
      //   message: "Project deployment failed",
      //   logs: errorMessage,
      // };
    }
  },
});
