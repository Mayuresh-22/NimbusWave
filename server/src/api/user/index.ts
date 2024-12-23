// this is the entry point for the AI module
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Bindings } from "../..";
import llmService from "../../services/llmService";

const UserEndpointRequest = z.object({
  email: z.string().nonempty().email(),
  uid: z.string().nonempty(),
  meta_data: z.object({
    name: z.string().nonempty().optional(),
  }),
});

const UserEndpoint = new Hono<{ Bindings: Bindings }>();

UserEndpoint.post(
  "/user",
  zValidator("json", UserEndpointRequest),
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

export default UserEndpoint;
