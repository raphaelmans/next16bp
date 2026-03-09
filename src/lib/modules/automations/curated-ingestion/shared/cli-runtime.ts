import { pathToFileURL } from "node:url";

export function isDirectExecution(metaUrl: string) {
  const entrypoint = process.argv[1];
  if (!entrypoint) return false;
  return metaUrl === pathToFileURL(entrypoint).href;
}

export async function runCliWithOptionalArgs<T>(
  cliArgs: string[] | undefined,
  runner: () => Promise<T>,
) {
  if (!cliArgs) {
    return runner();
  }

  const previousArgv = process.argv;
  const nodeArgv = previousArgv[0] ?? "node";
  const entryArgv = previousArgv[1] ?? "";

  process.argv = [nodeArgv, entryArgv, ...cliArgs];
  try {
    return await runner();
  } finally {
    process.argv = previousArgv;
  }
}
