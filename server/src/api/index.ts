import { Hono } from "hono";
import AIEndpoint from "./ai";
import { Bindings } from "..";

const APIEndpoint = new Hono<{ Bindings: Bindings }>();

/*
  * This is the entry point for the API module
*/
APIEndpoint.get("/", (c) => {
  return c.json({ message: "Hello, API!" });
});

/*
  Mount the AIEndpoint to the APIEndpoint
*/
APIEndpoint.route("/api", AIEndpoint);

export default APIEndpoint;