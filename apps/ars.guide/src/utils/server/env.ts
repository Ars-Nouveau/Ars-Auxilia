import {
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  GITHUB_APP_ID,
  GITHUB_APP_INSTALLATION_ID,
  GITHUB_APP_PRIVATE_KEY,
  GITHUB_BASE_BRANCH,
  GITHUB_OWNER,
  GITHUB_REPO,
} from "astro:env/server";

export type GuideEnv = {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  GITHUB_APP_ID: string;
  GITHUB_APP_INSTALLATION_ID?: string;
  GITHUB_APP_PRIVATE_KEY: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BASE_BRANCH: string;
};

export const getEnv = (): GuideEnv => ({
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  GITHUB_APP_ID,
  GITHUB_APP_INSTALLATION_ID: GITHUB_APP_INSTALLATION_ID ?? undefined,
  GITHUB_APP_PRIVATE_KEY,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_BASE_BRANCH,
});

export const requireEnv = (env: GuideEnv, key: keyof GuideEnv) => {
  const value = env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};
