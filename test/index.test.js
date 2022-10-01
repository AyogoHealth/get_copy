/*! Copyright 2022 Ayogo Health Inc. */

import { randomUUID } from "node:crypto";
import { strict as assert } from "node:assert";
import { strict as importWithMocks } from "esmock";
import { mockFunction } from "./mockHelper.js";

//import { describe, it, beforeEach, afterEach } from "node:test";
import tap from "tap";
const { describe, beforeEach, afterEach, it } = tap.mocha;

const mockAuth = {
  getGoogleCredentials: mockFunction()
};

const mockSheets = {
  getSpreadsheet: mockFunction()
};

const { default: getCopyFromSpreadsheet } = await importWithMocks("../index.js", {
  "../auth.js": mockAuth,
  "../sheets.js": mockSheets
});

describe("getCopyFromSpreadsheet", function() {
  describe("successful run", function() {
    const access_token = randomUUID();

    beforeEach(function() {
      mockAuth.getGoogleCredentials.resolveWith({ access_token });
      mockSheets.getSpreadsheet.resolveWith({ title: "Hello World" });
    });

    afterEach(function() {
      mockAuth.getGoogleCredentials.resetMock();
      mockSheets.getSpreadsheet.resetMock();
    });

    it("should pass through the provided options", async function() {
      await getCopyFromSpreadsheet("spreadsheet-id", { option: "value" });

      const [authOpts] = mockAuth.getGoogleCredentials.call(0);
      const [sheetId, opts] = mockSheets.getSpreadsheet.call(0);

      assert.equal(authOpts.option, "value", "Options passed through");
      assert.equal(opts.option, "value", "Options passed through");
    });

    it("should acquire and use the Google auth token through", async function() {
      await getCopyFromSpreadsheet("spreadsheet-id");

      const [sheetId, opts] = mockSheets.getSpreadsheet.call(0);

      assert.equal(opts.access_token, access_token, "Auth token is passed through");
    });

    it("should pass in the spreadsheet identifier", async function() {
      await getCopyFromSpreadsheet("spreadsheet-id");

      const [sheetId, opts] = mockSheets.getSpreadsheet.call(0);

      assert.equal(sheetId, "spreadsheet-id", "Spreadsheet ID is passed through");
    });

    it("should resolve with a locale tree object", async function() {
      const result = await getCopyFromSpreadsheet("spreadsheet-id");

      assert.deepEqual(result, { title: "Hello World" }, "Locale Tree is returned");
    });
  });

  describe("unsuccessful authentication re-rejects", function() {
    beforeEach(function() {
      mockAuth.getGoogleCredentials.rejectWith(new Error("Bad auth"));
    });

    afterEach(function() {
      mockAuth.getGoogleCredentials.resetMock();
      mockSheets.getSpreadsheet.resetMock();
    });

    it("should re-raise the error", async function() {
      try {
        await getCopyFromSpreadsheet("spreadsheet-id");

        assert.fail("Expected to reject");
      } catch (err) {
        assert.equal(err.message, "Bad auth", "Raises the error");
        assert.equal(mockSheets.getSpreadsheet.called, false, "Stopped after error");
      }
    });
  });
});
