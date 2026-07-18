import type { RuntimeRepository } from "./RuntimeRepository.js";

export function getExperiment(repository: RuntimeRepository, id: string) {
  return repository.requireExperiment(id);
}
