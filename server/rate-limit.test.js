import assert from "node:assert/strict";
import test from "node:test";
import { createRateLimiter } from "./rate-limit.js";

test("bloqueia solicitações acima do limite", () => {
  const middleware = createRateLimiter({ windowMs: 60_000, max: 2, key: () => "user-a" });
  const response = { statusCode: 200, headers: {}, set(name, value) { this.headers[name] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  let nextCalls = 0;
  middleware({}, response, () => { nextCalls += 1; });
  middleware({}, response, () => { nextCalls += 1; });
  middleware({}, response, () => { nextCalls += 1; });
  assert.equal(nextCalls, 2);
  assert.equal(response.statusCode, 429);
  assert.equal(typeof response.headers["Retry-After"], "string");
});
