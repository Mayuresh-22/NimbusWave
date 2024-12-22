import { Hono } from "hono";
import APIEndpoint from "./api";
import AuthMiddleware from "./middlewares/auth";
import { cors } from "hono/cors";

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
const app = new Hono<{ Bindings: Bindings }>();

/*
  This middlewares will be applied to all routes.
*/
app.use(
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
app.use("/*", AuthMiddleware);

/*
  This is the route that will be used to handle all the requests.
*/
app.route("/", APIEndpoint);

export default app;
