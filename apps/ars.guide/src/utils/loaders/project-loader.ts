import type { Loader } from "astro/loaders";
import { fetchZipBuffer, openZip, readEntryContents } from "./zip-cache";

const PROJECT_PATH_PATTERN = /\/projects\/(.+)\.json$/;

interface RawProject {
  mod_id: string;
  display_name: string;
  color: string;
  disabled: boolean;
  cf_id?: number;
  dependencies?: { cf_id: number; name: string }[];
}

const textDecoder = new TextDecoder();

export function projectLoader() {
  return {
    name: "project-loader",
    load: async ({ store, parseData }) => {
      store.clear();

      const zipBuffer = await fetchZipBuffer();
      const zipFile = await openZip(zipBuffer);

      await new Promise<void>((resolve, reject) => {
        let settled = false;

        const fail = (error: Error) => {
          if (settled) return;
          settled = true;
          zipFile.close();
          reject(error);
        };

        const continueReading = () => zipFile.readEntry();

        zipFile.once("error", fail);
        zipFile.once("end", () => {
          if (settled) return;
          settled = true;
          resolve();
        });

        zipFile.on("entry", (entry) => {
          const pathName: string = entry.fileName;
          if (!PROJECT_PATH_PATTERN.test(pathName) || pathName.endsWith("/")) {
            continueReading();
            return;
          }

          readEntryContents(zipFile, entry)
            .then(async (contents) => {
              const raw = JSON.parse(
                textDecoder.decode(contents),
              ) as RawProject;

              if (raw.disabled || raw.cf_id == null || raw.dependencies == null) {
                continueReading();
                return;
              }

              const id = raw.mod_id;
              const data = await parseData({
                id,
                data: {
                  mod_id: raw.mod_id,
                  display_name: raw.display_name,
                  color: raw.color,
                  cf_id: raw.cf_id,
                  dependencies: raw.dependencies,
                },
              });

              store.set({ id, data });
              continueReading();
            })
            .catch(fail);
        });

        continueReading();
      });
    },
  } satisfies Loader;
}
