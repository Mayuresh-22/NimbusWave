import { createMiddleware } from "hono/factory";
import { Bindings } from "..";
import Supabase from "../services/supabase";
import { User } from "@supabase/supabase-js";

export type AuthContext = {
  user: User;
};

const AuthMiddleware = createMiddleware<{Bindings: Bindings, Variables: AuthContext}>(async (c, next) => {
  try {
    const userAuthenticated = await new Supabase(c).getUser(
      c.req.header("Authorization")?.split(" ")[1] || ""
    )
    if (!userAuthenticated) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("user", userAuthenticated);
    await next();
  } catch (error) {
    return c.json({ error: "Internal Server Error, Error Code: AM_01" }, 500);
  }
});

export default AuthMiddleware;