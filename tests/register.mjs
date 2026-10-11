// Test-only: lets `node --test` load the app's TypeScript modules (Node strips the types) by
// resolving extensionless relative imports and the "@/" alias to .ts files. App code is untouched.
import { register } from "node:module";
register("./resolve-ts.mjs", import.meta.url);
