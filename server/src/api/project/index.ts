// this is the entry point for the AI module
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from '@hono/zod-validator'
import { Bindings } from "../..";
import { v4 } from "uuid";
import { AuthContext } from "../../middlewares/auth";
import AdmZip from "adm-zip";
import cloudinary from "../../services/cloudinary";

const CreateProjectReq = z.object({
  default: z.boolean(),
  project_name: z.string().optional(),
  project_description: z.string().optional(),
  project_framework: z.string().optional()
});

const DeployProjectReq = z.object({
  project_id: z.string(),
  project_name: z.string(),
  project_description: z.string(),
  project_framework: z.string()
});

const ProjectEndpoint = new Hono<{ Bindings: Bindings, Variables: AuthContext }>();

ProjectEndpoint.post("/project", zValidator("json", CreateProjectReq), async (c) => {
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

ProjectEndpoint.get("/project", async (c) => {
  const { id, withChats } = c.req.query();

  if (!id) {
    return c.json({
      status: "error",
      message: "Project ID is required"
    }, 400);
  }

  const projectResult = await c.env.DB.prepare(
    `SELECT  projects.project_id, chats.chat_id, project_name, project_framework, project_description, project_status, chats.chat_context 
    FROM projects JOIN chats ON projects.chat_id = chats.chat_id WHERE projects.project_id = ? AND projects.user_id = ? AND chats.user_id = ?`
  )
    .bind(id, c.var.user.id, c.var.user.id)
    .first();

  console.log(projectResult);

  if (!projectResult) {
    return c.json({
      status: "error",
      message: "Project not found"
    }, 404);
  }

  return c.json({
    status: "success",
    data: projectResult
  }, 200);
});

ProjectEndpoint.post("/project/deploy", zValidator("form", DeployProjectReq),
  async (c) => {
    const body = await c.req.formData();
    const projectFile: File = body.get("file") as File;
    
    // check if the file is a zip file
    if (projectFile.type !== "application/x-zip-compressed") {
      return c.json({
        status: "error",
        message: "Invalid file type, only zip files are allowed"
      }, 400);
    }
    // unzip the file
    const arrayBuffer = await projectFile.arrayBuffer();
    const admZip = new AdmZip(Buffer.from(arrayBuffer));
    const zipEntries = admZip.getEntries();
    console.log(zipEntries);
    
    for (const zipEntry of zipEntries) {
      // upload this file to the cloud storage cloudinary
      // get the url and save it to the database
      const fileContent = zipEntry.getData();
      const file = new File([fileContent], zipEntry.entryName, { type: 'application/octet-stream' });
      await cloudinary.uploadFile(file);
    }
    // const projectResult = await c.env.DB.prepare(
    //   `SELECT  projects.project_id, chats.chat_id, project_name, project_framework, project_description, project_status, chats.chat_context 
    // FROM projects JOIN chats ON projects.chat_id = chats.chat_id WHERE projects.project_id = ? AND projects.user_id = ? AND chats.user_id = ?`
    // )
    //   .bind(project_id, c.var.user.id, c.var.user.id)
    //   .first();

    // if (!projectResult) {
    //   return c.json({
    //     status: "error",
    //     message: "Project not found"
    //   }, 404);
    // }

    // const deployResult = await llmService.deployProject(project_type, project_name, project_description, project_framework);

    // if (deployResult.status === "error") {
    //   return c.json(deployResult, 500);
    // }

    return c.json({message: "deployed"}, 200);
  });

export default ProjectEndpoint;