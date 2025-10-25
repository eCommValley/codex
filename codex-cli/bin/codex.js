#!/usr/bin/env node
import { runCli } from "../src/cli.js";

runCli(process.argv.slice(2)).catch((error) => {
  if (process.env.CODEX_DEBUG === "1") {
    console.error(error);
  } else {
    console.error(error.message || error);
  }
  process.exit(1);
});
