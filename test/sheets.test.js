/*! Copyright 2022 Ayogo Health Inc. */

import { strict as assert } from "node:assert";
import { strict as importWithMocks } from "esmock";
import { mockFunction } from "./mockHelper.js";

import { describe, it, beforeEach, afterEach } from "node:test";
//import tap from "tap";
//const { describe, beforeEach, afterEach, it } = tap.mocha;

const { sortObjectKeys, buildLocaleTree } = await importWithMocks("../sheets.js", {});

// NOTE: assert.deepEqual will compare keys unordered, so we have to
// JSON.stringify the results and compare strings to ensure proper ordering is
// kept
describe("sortObjectKeys", function() {
  it("should do nothing to primitive values", function() {
    assert.equal(sortObjectKeys(5.125), 5.125, "Returns numbers unchanged");
    assert.equal(sortObjectKeys("Hi"), "Hi", "Returns strings unchanged");
    assert.equal(sortObjectKeys(true), true, "Returns booleans unchanged");
  });

  it("should sort top-level object keys", function() {
    const obj = sortObjectKeys({ b: 1, a: 2 });
    const expected = { a: 2, b: 1 };

    assert.equal(JSON.stringify(obj), JSON.stringify(expected), "Reordered keys");
  });

  it("should sort nested object keys", function() {
    const obj = sortObjectKeys({ b: 1, a: 2, c: { b: 3, a: 4 } });
    const expected = { a: 2, b: 1, c: { a: 4, b: 3 } };

    assert.equal(JSON.stringify(obj), JSON.stringify(expected), "Reordered keys");
  });

  it("should sort object keys within arrays", function() {
    const obj = sortObjectKeys({ c: [{ b: 3, a: 4 }] });
    const expected = { c: [{ a: 4, b: 3 }] };

    assert.equal(JSON.stringify(obj), JSON.stringify(expected), "Reordered keys");
  });
});

describe("buildLocaleTree", function() {
  it("should turn key/value pairs into an object", function() {
    const result = buildLocaleTree([ ["foo", "bar"], ["baz", "qux"] ]);

    assert.deepEqual(result, { foo: "bar", baz: "qux" }, "Converted tuples to object");
  });

  it("should handle sub-object keys", function() {
    const result = buildLocaleTree([ ["foo.bar.baz", "qux"], ["foo.asdf", "qwerty"] ]);

    assert.deepEqual(result, { foo: { bar: { baz: "qux" }, asdf: "qwerty" }}, "Converted tuples to object");
  });

  it("should handle key and sub-object keys with empty values", function() {
    const result = buildLocaleTree([ ["foo.bar.baz", undefined], ["asdf", undefined] ]);

    assert.deepEqual(result, { foo: { bar: { baz: "" }}, asdf: "" }, "Converted tuples to object");
  });

  it("should return sorted keys", function() {
    const result = buildLocaleTree([ ["foo", "bar"], ["asdf", "qwerty"] ]);
    const expected = { asdf: "qwerty", foo: "bar" };

    // Again, need to compare as JSON to ensure key ordering
    assert.deepEqual(JSON.stringify(result), JSON.stringify(expected), "Converted tuples to object");
  });
});
