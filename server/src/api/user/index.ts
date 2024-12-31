// this is the entry point for the AI module
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { Bindings } from "../..";
import type { AuthContext } from "../../middlewares/auth";

const UserCreateRequestSchema = z.object({
  email: z.string().nonempty().email(),
  uid: z.string().nonempty(),
  meta_data: z.object({
    name: z.string().nonempty().optional(),
  }),
});

const UserEndpoint = new Hono<{ Bindings: Bindings; Variables: AuthContext }>();

UserEndpoint.post(
  "/user",
  zValidator("json", UserCreateRequestSchema),
  async (c) => {
    const body = await c.req.json();
    const userResult = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ?",
    )
      .bind(body.uid)
      .first();
    if (userResult) {
      return c.json({ message: "User already exists, Try logging in" });
    }
    const user = await c.env.DB.prepare(
      "INSERT INTO users (id, email_address, metadata, project_credits, token_balance) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(body.uid, body.email, JSON.stringify(body.meta_data), 10, 102400)
      .run();
    if (!user) {
      return c.json({ message: "Failed to create user" }, 500);
    }
    return c.json({ message: "User created" });
  },
);

UserEndpoint.get("/user/dashboard", async (c) => {
  // get user obj and db
  const authUser = c.var.user;

  const userDashboardResult = await c.env.DB.prepare(
    `SELECT 
    p.project_id,
    p.user_id,
    p.project_name,
    p.project_app_name,
    p.project_framework,
    p.project_description,
    p.project_status,
    p.project_type,
    p.project_size,
    p.updated_at,
    p.created_at,
    json_group_array(
      json_object(
        'deployment_id', d.deployment_id,
        'deployment_name', d.deployment_app_name,
        'deployment_logs', d.deployment_logs,
        'deployment_size', d.deployment_size,
        'time_taken', d.time_taken,
        'deployment_status', d.deployment_status,
        'created_at', d.created_at
      )
    ) as deployments
    FROM projects p
    LEFT JOIN deployments d ON p.project_id = d.project_id
    WHERE p.user_id = ?
    GROUP BY p.project_id ORDER BY p.created_at DESC`,
  )
    .bind(authUser.id)
    .all();

  if (!userDashboardResult) {
    return c.json({ message: "User data not found" }, 400);
  }

  // parse json string back to object
  userDashboardResult.results = userDashboardResult.results.map((result) => {
    result.deployments = JSON.parse(result.deployments as string);
    // @ts-expect-error deployment_id can be null
    result.deployments =
      result.deployments[0].deployment_id === null ? [] : result.deployments;
    return result;
  });

  return c.json({
    status: "success",
    user_id: authUser.id,
    data: {
      no_of_projects: userDashboardResult.results.length,
      projects: userDashboardResult.results,
    },
  });
});

export default UserEndpoint;
