import type { APIRoute } from "astro";
import { createAuth } from "../../../utils/server/auth";
import { getEnv } from "../../../utils/server/env";

export const prerender = false;

export const ALL: APIRoute = async (context) => {
  const auth = createAuth(getEnv());
  return auth.handler(context.request);
};
