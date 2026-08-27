/**
 * @param {number} left
 * @param {number} right
 * @param {"+" | "−" | "×" | "÷"} operator
 */
export function calculate(left, right, operator) {
  if (operator === "+") return left + right;
  if (operator === "−") return left - right;
  if (operator === "×") return left * right;
  if (operator === "÷") return right === 0 ? Number.NaN : left / right;
  return right;
}

/** @param {number} value */
export function formatNumber(value) {
  if (!Number.isFinite(value)) return "Error";
  if (Object.is(value, -0)) return "0";

  const rounded = Number.parseFloat(value.toPrecision(15));
  const text = String(rounded);

  if (text.length <= 15) return text;

  return rounded
    .toExponential(8)
    .replace(/\.0+e/, "e")
    .replace("e+", "e");
}


