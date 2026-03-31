#!/usr/bin/env node

const { startServer } = require("./lib/haki-ui/sse-server.cjs");

async function main() {
  const portArg = process.argv.find((arg) => arg.startsWith("--port="));
  const port = portArg ? Number(portArg.split("=")[1]) : 4312;
  const { server, port: listeningPort } = await startServer({ port });

  process.stdout.write(
    JSON.stringify(
      {
        status: "listening",
        port: listeningPort,
        url: `http://localhost:${listeningPort}`,
      },
      null,
      2,
    ),
  );

  process.on("SIGINT", () => {
    server.close(() => process.exit(0));
  });
}

main().catch((error) => {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exit(1);
});
