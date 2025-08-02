import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Import shared filename utilities
export { sanitizeForFilename, createSafeFilename } from "../shared/filename-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Saves an object as a pretty-printed JSON mock file in the mocks/responses directory.
 * @param filename The mock file name (e.g. 'google-directions-route.mock.json')
 * @param data The object to serialize and save
 */
export function saveMockResponse(filename: string, data: any): void {
  const mocksDir = path.resolve(__dirname, "../client/src/mocks/responses");
  if (!fs.existsSync(mocksDir)) {
    fs.mkdirSync(mocksDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(mocksDir, filename),
    JSON.stringify(data, null, 2)
  );
}
