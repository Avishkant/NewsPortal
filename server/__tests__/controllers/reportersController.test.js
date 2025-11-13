import fs from "fs";
import path from "path";

describe("reportersController scaffolding", () => {
  test("reportersController.js exists and exports handlers", () => {
    const p = path.join(
      __dirname,
      "..",
      "controllers",
      "reportersController.js"
    );
    const code = fs.readFileSync(p, "utf8");
    expect(code).toMatch(/export const listReporters/);
    expect(code).toMatch(/export const createReporter/);
    expect(code).toMatch(/export const deleteReporter/);
  });
});
