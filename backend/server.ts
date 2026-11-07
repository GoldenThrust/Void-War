
import { prisma } from "./config/prisma.ts";
import { env } from "./config/env.ts";
import { buildApp } from "./app.ts";
import Websocket from "./config/websocket.ts";

const start = async () => {
  console.clear();
  const app = buildApp();

  try {
    await app.listen({
      port: Number(env.PORT),
      host: env.HOST,
    });

    Websocket.run();

    console.info(
      `HTTP server running on http://${env.HOST}:${env.PORT}`
    );
  } catch (err) {
    console.error(err);

    Websocket.stop();

    await app.close();
    await prisma.$disconnect();

    process.exit(1);
  }
};

start();
