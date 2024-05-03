import { Hono } from "hono";
import { logger } from "hono/logger";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import { sign } from "hono/jwt";
import { getCookie, setCookie } from "hono/cookie";
import { bearerAuth } from "hono/bearer-auth";

const app = new Hono();

const schema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
      message:
        "Minimum eight characters, at least one letter, one number and one special character",
    }),
});

app.use(logger());

app.post("/login", zValidator("json", schema), async (c) => {
  const { email, password } = await c.req.json();

  if (password !== "qwery1234*") {
    throw new HTTPException(401, { message: "Invalid credentials" });
  }

  const payload = {
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  const token = await sign(payload, Bun.env.SECRET || "");
  setCookie(c, "token", token);
  return c.json({
    payload,
    token,
  });
});

app.use(
  "/index/*",
  bearerAuth({
    verifyToken: async (token, c) => {
      return token === getCookie(c, "token");
    },
  })
);

app.get("/index/movies", (c) => {
  return c.json({
    movies: [
      {
        title: "Movie 1",
        year: 2021,
      },
    ],
  });
});

export default app;
