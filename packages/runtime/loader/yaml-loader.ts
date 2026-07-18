import { readFile } from "node:fs/promises";
import { parse } from "yaml";

import { RepositoryValidationError } from "../errors/RuntimeError.js";

export async function loadYamlFile(path: string): Promise<Record<string, unknown>> {
  let contents: string;
  try {
    contents = await readFile(path, "utf8");
  } catch (error) {
    throw new RepositoryValidationError(`Unable to read YAML file: ${(error as Error).message}`, path);
  }
  try {
    const parsed: unknown = parse(contents);
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new RepositoryValidationError("Entity YAML must contain a mapping.", path);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RepositoryValidationError) throw error;
    throw new RepositoryValidationError(`Invalid YAML: ${(error as Error).message}`, path);
  }
}
