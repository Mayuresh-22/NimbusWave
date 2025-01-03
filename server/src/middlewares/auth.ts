import type { User } from "@supabase/supabase-js";
import { createMiddleware } from "hono/factory";
import type { Bindings } from "..";
import Supabase from "../services/supabase";

export type AuthContext = {
  user: User;
};

const AuthMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: AuthContext;
}>(async (c, next) => {
  try {
    const userAuthenticated = await new Supabase(c).getUser(
      c.req.header("Authorization")?.split(" ")[1] || "",
    );
    if (!userAuthenticated) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("user", userAuthenticated);
    await next();
  } catch (error) {
    console.log(error);
    return c.json(
      { error: "Internal Server Error, Error Code: AM_01", message: error },
      500,
    );
  }
});

export default AuthMiddleware;
