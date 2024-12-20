import { createMiddleware } from "hono/factory";
import { Bindings } from "..";
import Supabase from "../services/supabase";

const AuthMiddleware = createMiddleware<{Bindings: Bindings}>(async (c, next) => {
  const userAuthenticated = await new Supabase(c).getUser(
    c.req.header("Authorization") || ""
  )
  if (!userAuthenticated) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

export default AuthMiddleware;