import { describe, expect, it } from "vitest";
import { policySchema } from "./index";

describe("policySchema", () => {
  it("accepts a minimal policy", () => {
    expect(policySchema.safeParse({ overview: { summary: "x", stack: [] } }).success).toBe(true);
  });
});
