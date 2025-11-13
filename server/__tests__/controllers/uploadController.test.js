import fs from "fs";
import path from "path";

describe("uploadController scaffolding", () => {
  test("uploadController.js exists and exports uploadImage", () => {
    const p = path.join(__dirname, "..", "controllers", "uploadController.js");
    const code = fs.readFileSync(p, "utf8");
    expect(code).toMatch(/export const uploadImage/);
  });
});
