import fs from "fs";
import path from "path";

describe("authController scaffolding", () => {
  test("authController.js exists and exports handlers", () => {
    const p = path.join(__dirname, "..", "controllers", "authController.js");
    const code = fs.readFileSync(p, "utf8");
    expect(code).toMatch(/export const login/);
    expect(code).toMatch(/export const register/);
  });
});
