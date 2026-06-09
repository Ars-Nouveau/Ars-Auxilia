import { getArchiveUrl } from "@ars/addon-builder";
import pMemoize from "p-memoize";
import { type Entry, fromBuffer, type ZipFile } from "yauzl";

export const fetchZipBuffer = pMemoize(async (): Promise<Buffer> => {
  const response = await fetch(getArchiveUrl(), {
    headers: { Accept: "application/zip, application/octet-stream" },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ArsAddonBuilder zip: ${response.status} ${response.statusText}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
});

export const openZip = (buffer: Buffer) =>
  new Promise<ZipFile>((resolve, reject) => {
    fromBuffer(buffer, { lazyEntries: true }, (error, zipFile) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(zipFile);
    });
  });

export const readEntryContents = (zipFile: ZipFile, entry: Entry) =>
  new Promise<Buffer>((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error) {
        reject(error);
        return;
      }

      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer | string) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      stream.once("error", reject);
      stream.once("end", () => resolve(Buffer.concat(chunks)));
    });
  });
