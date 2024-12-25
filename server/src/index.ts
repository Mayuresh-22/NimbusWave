import { Hono } from "hono";
import APIEndpoint from "./api";
import AuthMiddleware from "./middlewares/auth";
import { cors } from "hono/cors";
import AppEndpoint from "./api/serve_app";

/*
  This is the custom binding interface to include the .dev.vars
  that extends the CloudflareBindings interface.
*/
export interface Bindings extends CloudflareBindings {
  GROQ_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

/*
  This is the main Hono instance
*/
const server = new Hono<{ Bindings: Bindings }>();

/*
  This middlewares will be applied to all routes.
*/
server.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Authorization", "Content-Type", "Accept"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);
server.use("/", AuthMiddleware);
server.use("/api/*", AuthMiddleware);

/*
  This is the route that will be used to handle all the requests.
*/
server.route("/", APIEndpoint);
server.route("/", AppEndpoint);

export default server;
