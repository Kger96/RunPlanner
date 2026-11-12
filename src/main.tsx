import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { createLocalRepository } from "./data/local-repository";
import { RepositoryProvider } from "./data/repository-context";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RepositoryProvider repository={createLocalRepository()}>
      <App />
    </RepositoryProvider>
  </StrictMode>,
);