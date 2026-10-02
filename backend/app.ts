import Fastify from "fastify";
import { prisma } from "./config/prisma.ts";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { config } from "./config/index.ts";
import APIError from "./errors/APIError.ts";
import superjson from "superjson";
import multipart from "@fastify/multipart";

import { env } from "./config/env.ts";

export function buildApp() {
  const app = Fastify({
    logger: {
      file: "log/server.txt",
    },
  });

  app.withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setReplySerializer((payload) => {
    return JSON.stringify(superjson.serialize(payload)["json"]);
  });
  
  app.setErrorHandler((error: any, req, res) => {
    if (error instanceof APIError) {
      return res.status(error.statusCode).send({
        message: error.message,
      });
    }
    
    if (error.statusCode === 429) {
      return res.status(429).send({
        message: "You hit the rate limit! Slow down Please!",
      });
    }

    if (error.validation) {
      return res.status(400).send({
        message: "Validation failed",
        errors: error.message,
      });
    }

    req.log.error(error);

    return res.status(error.statusCode || 500).send({
      message: error.message || "Internal Server Error",
    });
  });

  // register plugins
  app.register(import("@fastify/rate-limit"), {
    max: 100,
    timeWindow: "1 minute",
  });
  app.register(import("@fastify/helmet"));
  app.register(import("@fastify/cors"), {
      origin: config.env.CLIENT_URL,
      credentials: true,
    });
    
    app.register(import("@fastify/jwt"), {
      secret: config.env.ACCESS_TOKEN_SECRET,
    });
    
    // app.register(import("./plugins/auth.ts"));
    
    app.register(import("./plugins/prisma.ts"));
    app.register(import("./plugins/redis.ts"));
    
    app.register(import("@fastify/static"), {
      root: env["UPLOAD_DIR"],
      prefix: "/public/",
    });
    
    app.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
        files: 1,
      },
    });
    
    // register routes
    app.register(import("./routes/api.routes.ts"), {
      prefix: "/api",
    });
    
    app.get("/", function (_, reply) {
      reply.send("Void War");
    });
    app.get("/hello", function (_, reply) {
      reply.send("Hi, welcome to voidwar.");
    });
    
    // Hooks
    app.addHook("onClose", async () => {
      await prisma.$disconnect();
    });
    
    app.addHook("onError", async () => {
      await prisma.$disconnect();
    });
    
    return app;
  }
  