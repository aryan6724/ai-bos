import {
  describe,
  it,
  expect,
} from "vitest";

import request from "supertest";

import app from "../app.js";

describe("Health Check", () => {
  it("should return API health successfully", async () => {
    const response = await request(app)
      .get("/api/health");

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(
      true
    );

    expect(response.body.message).toBe(
      "Server health check passed"
    );

    expect(
      response.body.timestamp
    ).toBeDefined();
  });
});