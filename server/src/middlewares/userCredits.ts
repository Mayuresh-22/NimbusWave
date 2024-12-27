import { createMiddleware } from "hono/factory";
import type { Bindings } from "..";
import { getSQLDateTimeNow } from "../services/helper";
import type { AuthContext } from "./auth";

export const UserCreditsMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: AuthContext;
}>(async (c, next) => {
  try {
    const userResult = await c.env.DB.prepare(
      "SELECT project_credits, deployment_pm, deployment_limit_reset_at FROM users WHERE id = ?",
    )
      .bind(c.var.user.id)
      .first();

    if (!userResult) {
      return c.json(
        {
          status: "error",
          message: "User not found, complete onboarding process first.",
        },
        404,
      );
    }
    if ((userResult.project_credits as number) < 1) {
      return c.json(
        {
          status: "error",
          message: "Insufficient project credits, please purchase more.",
        },
        402,
      );
    }
    if (
      (userResult.deployment_pm as number) < 1 &&
      (await getSQLDateTimeNow()) <=
        (userResult.deployment_limit_reset_at as string)
    ) {
      return c.json(
        {
          status: "error",
          message:
            "Number of Deployment limit reached, please wait for the reset.",
        },
        402,
      );
    }

    await next();
  } catch (error) {
    console.log(error);
    return c.json({ error: "Internal Server Error, Error Code: UCM_01" }, 500);
  }
});
