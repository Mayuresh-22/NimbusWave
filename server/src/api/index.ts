import { Hono } from "hono";
import type { Bindings } from "..";
import AIEndpoint from "./ai";
import ProjectEndpoint from "./project";
import UserEndpoint from "./user";

const APIEndpoint = new Hono<{ Bindings: Bindings }>();

/*
 ------------------- This is the entry point for the API routes -------------------
*/
APIEndpoint.get("/", (c) => {
  return c.json({ message: "Hello, API!" });
});

/*
  Mount all the routes to /api/*
*/
APIEndpoint.route("/api", AIEndpoint);
APIEndpoint.route("/api", UserEndpoint);
APIEndpoint.route("/api", ProjectEndpoint);

export default APIEndpoint;
