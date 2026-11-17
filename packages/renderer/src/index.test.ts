import { describe, expect, it } from "vitest";
import { render } from "./index";

describe("render", () => {
  it("is stubbed until phase 2", () => {
    expect(() => render({ overview: { summary: "", stack: [] } }, {}, "agents")).toThrow();
  });
});
