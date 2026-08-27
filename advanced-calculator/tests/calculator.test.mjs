import assert from "node:assert/strict";
import test from "node:test";
import { calculate, formatNumber } from "../lib/calculator.mjs";

test("performs all four arithmetic operations", () => {
  assert.equal(calculate(12, 3, "+"), 15);
  assert.equal(calculate(12, 3, "−"), 9);
  assert.equal(calculate(12, 3, "×"), 36);
  assert.equal(calculate(12, 3, "÷"), 4);
});

test("rejects division by zero", () => {
  assert.equal(Number.isNaN(calculate(12, 0, "÷")), true);
});

test("formats floating-point results cleanly", () => {
  assert.equal(formatNumber(0.1 + 0.2), "0.3");
  assert.equal(formatNumber(1234567890123), "1234567890123");
  assert.equal(formatNumber(-0), "0");
});
