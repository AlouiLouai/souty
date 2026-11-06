import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // These tests rasterize and decode multi-megapixel images. That takes a
    // second or two on a laptop and several times longer on a shared CI runner.
    testTimeout: 30_000,
  },
});
