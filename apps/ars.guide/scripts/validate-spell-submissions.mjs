import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const versionsPath = join(appRoot, "src/content/versions/versions.json");
const submissionsDir = join(appRoot, "src/content/spell-submissions");

const parseJsonFile = async (path) => {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`Failed to parse ${path}: ${error.message}`);
  }
};

const versionData = await parseJsonFile(versionsPath);
const supportedVersions = new Set(Object.keys(versionData));
const submissionFiles = (await readdir(submissionsDir))
  .filter((file) => file.endsWith(".json"))
  .toSorted((a, b) => a.localeCompare(b));

const errors = [];

for (const file of submissionFiles) {
  const path = join(submissionsDir, file);
  const submission = await parseJsonFile(path);
  const versions = submission?.versions;

  if (!Array.isArray(versions) || versions.length === 0) {
    errors.push(`${file}: versions must be a non-empty array.`);
    continue;
  }

  const seenVersions = new Set();
  for (const version of versions) {
    if (typeof version !== "string" || version.length === 0) {
      errors.push(`${file}: versions contains a non-string or empty value.`);
      continue;
    }

    if (seenVersions.has(version)) {
      errors.push(`${file}: versions contains duplicate value ${version}.`);
    }
    seenVersions.add(version);

    if (!supportedVersions.has(version)) {
      errors.push(
        `${file}: unsupported version ${version}. Add it to src/content/versions/versions.json or remove it from this submission.`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error("Spell submission validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Validated ${submissionFiles.length} spell submissions against ${supportedVersions.size} supported versions.`,
);
