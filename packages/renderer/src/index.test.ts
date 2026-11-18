import { describe, expect, it } from "vitest";
import { policyContentSchema } from "@contextops/policy-schema";
import { render } from "./index";

describe("render", () => {
  it("is stubbed until phase 2", () => {
    const policy = policyContentSchema.parse({ overview: { summary: "x" } });
    expect(() => render(policy, {}, "agents")).toThrow();
  });
});
