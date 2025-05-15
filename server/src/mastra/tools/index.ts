import type { RuntimeContext } from "@mastra/core/runtime-context";
import { createTool } from "@mastra/core/tools";
import type { Context } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import { inherits } from "util";
import type { Bindings } from "../..";

export type HonoContext = {
  c: Context<{ Bindings: Bindings }>;
};

export const saveDetailsTool = createTool({
  id: "save-details",
  description: "Save the details of the project to the database",
  inputSchema: z.object({
    uid: z.string().describe("User ID"),
    project_id: z.string().describe("ID of the project"),
    project_name: z.string().describe("Name of the application"),
    project_description: z.string().describe("Description of the application"),
    project_framework: z.string().describe("Framework of the application"),
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
