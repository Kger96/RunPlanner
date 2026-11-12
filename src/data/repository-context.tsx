import { createContext, useContext, type ReactNode } from "react";
import type { PlannerRepository } from "./repository";

const RepositoryContext = createContext<PlannerRepository | null>(null);

export function RepositoryProvider({ repository, children }: { repository: PlannerRepository; children: ReactNode }) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>;
}

export function useRepository(): PlannerRepository {
  const repository = useContext(RepositoryContext);
  if (!repository) throw new Error("useRepository must be used inside a RepositoryProvider.");
  return repository;
}
