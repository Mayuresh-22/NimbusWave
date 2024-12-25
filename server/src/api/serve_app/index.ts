// this is the entry point for the AI module
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { Bindings } from "../..";
import { DEPLOYMENT_NOT_FOUND_HTML } from "../../html/deployment_not_found";

const AppEndpointReqSchema = z.object({
  email: z.string().nonempty().email(),
  uid: z.string().nonempty(),
  meta_data: z.object({
    name: z.string().nonempty().optional(),
  }),
});

const AppEndpoint = new Hono<{ Bindings: Bindings }>();

AppEndpoint.get("/app/:app_name/*", async (c) => {
  const appName = c.req.param("app_name");

  const projectResult = await c.env.DB.prepare(
    "SELECT entry_file_path FROM projects WHERE project_app_name = ?",
  )
    .bind(appName)
    .first();

  if (!projectResult) {
    return c.html(DEPLOYMENT_NOT_FOUND_HTML);
  }
  const appHTML = await fetch(projectResult.entry_file_path as string).then(
    (res) => res.text(),
  );
  return c.html(appHTML);
});

export default AppEndpoint;
