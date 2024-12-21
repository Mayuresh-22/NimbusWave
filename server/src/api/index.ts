import { Hono } from "hono";
import AIEndpoint from "./ai";
import { Bindings } from "..";
import UserEndpoint from "./user";

const APIEndpoint = new Hono<{ Bindings: Bindings }>();

/*
  * This is the entry point for the API module
*/
APIEndpoint.get("/", (c) => {
  return c.json({ message: "Hello, API!" });
});

/*
  Mount all the routes to api/
*/
APIEndpoint.route("/api", AIEndpoint);
APIEndpoint.route("/api", UserEndpoint);

export default APIEndpoint;