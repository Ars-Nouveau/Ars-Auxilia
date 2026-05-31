import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { ZodError } from "zod";
import {
  getAuthSession,
  getDiscordAccountInfo,
  getSubmitterIdentity,
} from "../../utils/server/auth";
import { getEnv } from "../../utils/server/env";
import { createSpellSubmissionPullRequest } from "../../utils/server/github-app";
import { getCategoryIds } from "../../utils/spell-data/categories";
import { getVersions } from "../../utils/versions";
import {
  createSpellSubmissionFile,
  readSpellSubmissionFormData,
} from "../../utils/spell-submissions/schema";

export const prerender = false;

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

export const POST: APIRoute = async (context) => {
  try {
    const env = getEnv();
    const session = await getAuthSession(context.request, env);

    if (!session) {
      return json(
        { error: "You must sign in with Discord before submitting a spell." },
        { status: 401 },
      );
    }

    const discordAccountInfo = await getDiscordAccountInfo(
      context.request,
      env,
    );
    const submitter = getSubmitterIdentity(session, discordAccountInfo);
    const categoryValues = await getCategoryIds();
    const versionValues = await getVersions();
    const form = readSpellSubmissionFormData(
      await context.request.formData(),
      categoryValues,
      versionValues,
    );
    const glyphEntries = await getCollection("glyphs");
    const availableGlyphs = new Set(glyphEntries.map((entry) => entry.id));
    const submission = createSpellSubmissionFile({
      form,
      submitter,
      availableGlyphs,
      categoryValues,
      allowedVersions: versionValues,
    });
    const pullRequest = await createSpellSubmissionPullRequest({
      env,
      submission,
      username: submitter.username,
    });

    return json({ ok: true, ...pullRequest });
  } catch (error) {
    console.error("Spell submission failed:", error);

    if (error instanceof ZodError) {
      return json(
        { error: "Invalid spell submission.", issues: error.issues },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to submit spell.";
    const status = message.includes("Unknown glyphs") ? 400 : 500;

    return json({ error: message }, { status });
  }
};
