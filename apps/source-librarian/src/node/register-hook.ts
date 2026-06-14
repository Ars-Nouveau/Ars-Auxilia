import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(pathToFileURL('./src/node/https-hook.mjs'))
