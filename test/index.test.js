/*! Copyright 2022 - 2023 Ayogo Health Inc. */

import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { describe, it, beforeEach, afterEach, mock } from "node:test";
import { strict as importWithMocks } from "esmock";

const mockAuth = {
  getGoogleCredentials: mock.fn()
};

const mockSheets = {
  getSpreadsheet: mock.fn()
};

const { default: getCopyFromSpreadsheet } = await importWithMocks("../index.js", {
  "../auth.js": mockAuth,
  "../sheets.js": mockSheets
});

describe("getCopyFromSpreadsheet", function() {
  describe("successful run", function() {
    const access_token = randomUUID();

    beforeEach(function() {
      mockAuth.getGoogleCredentials.mock.mockImplementation(() => Promise.resolve({ access_token }));
      mockSheets.getSpreadsheet.mock.mockImplementation(() => Promise.resolve({ title: "Hello World" }));
    });

    afterEach(function() {
      mockAuth.getGoogleCredentials.mock.resetCalls();
      mockSheets.getSpreadsheet.mock.resetCalls();
    });

    it("should pass through the provided options", async function() {
      await getCopyFromSpreadsheet("spreadsheet-id", { option: "value" });

      const [authOpts] = mockAuth.getGoogleCredentials.mock.calls[0].arguments;
      const [sheetId, opts] = mockSheets.getSpreadsheet.mock.calls[0].arguments;

      assert.equal(authOpts.option, "value", "Options passed through");
      assert.equal(opts.option, "value", "Options passed through");
    });

    it("should acquire and use the Google auth token through", async function() {
      await getCopyFromSpreadsheet("spreadsheet-id");

      const [sheetId, opts] = mockSheets.getSpreadsheet.mock.calls[0].arguments;

      assert.equal(opts.access_token, access_token, "Auth token is passed through");
    });

    it("should pass in the spreadsheet identifier", async function() {
      await getCopyFromSpreadsheet("spreadsheet-id");

      const [sheetId, opts] = mockSheets.getSpreadsheet.mock.calls[0].arguments;

      assert.equal(sheetId, "spreadsheet-id", "Spreadsheet ID is passed through");
    });

    it("should resolve with a locale tree object", async function() {
      const result = await getCopyFromSpreadsheet("spreadsheet-id");

      assert.deepEqual(result, { title: "Hello World" }, "Locale Tree is returned");
    });
  });

  describe("unsuccessful authentication re-rejects", function() {
    beforeEach(function() {
      mockAuth.getGoogleCredentials.mock.mockImplementation(() => Promise.reject(new Error("Bad auth")));
    });

    afterEach(function() {
      mockAuth.getGoogleCredentials.mock.resetCalls();
      mockSheets.getSpreadsheet.mock.resetCalls();
    });

    it("should re-raise the error", async function() {
      try {
        await getCopyFromSpreadsheet("spreadsheet-id");

        assert.fail("Expected to reject");
      } catch (err) {
        assert.equal(err.message, "Bad auth", "Raises the error");
        assert.equal(mockSheets.getSpreadsheet.mock.callCount(), 0, "Stopped after error");
      }
    });
  });
});
