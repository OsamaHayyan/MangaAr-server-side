import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = (fileUrl) => {
  const __filename = fileURLToPath(fileUrl);
  return dirname(__filename);
};

export default __dirname;
