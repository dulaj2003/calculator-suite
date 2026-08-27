const displayElement = document.querySelector("#display");
const expressionElement = document.querySelector("#expression");
const operatorButtons = [...document.querySelectorAll("[data-operator]")];

const labels = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

let display = "0";
let storedValue = null;
let operator = null;
let waitingForValue = false;
let hasError = false;

// Used for repeated "=" calculations.
let lastOperator = null;
let lastOperand = null;

const MAX_DIGITS = 15;
const SMALL_DISPLAY_DIGITS = 10;

function formatResult(value) {
  if (!Number.isFinite(value)) return "Error";

  if (Object.is(value, -0)) return "0";

  const rounded = Number.parseFloat(value.toPrecision(MAX_DIGITS));
  const plain = String(rounded);

  return plain.length <= MAX_DIGITS
    ? plain
    : rounded.toExponential(8).replace(/\.0+e/, "e");
}

function calculate(left, right, selectedOperator) {
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return null;
  }

  if (selectedOperator === "/" && right === 0) {
    return null;
  }

  const operations = {
    "+": () => left + right,
    "-": () => left - right,
    "*": () => left * right,
    "/": () => left / right,
  };

  if (!operations[selectedOperator]) {
    return null;
  }

  const result = operations[selectedOperator]();

  return Number.isFinite(result) ? result : null;
}

function render() {
  displayElement.textContent = display;

  const digitCount = display.replace(/\D/g, "").length;

  displayElement.classList.toggle(
    "display-small",
    digitCount > SMALL_DISPLAY_DIGITS
  );

  operatorButtons.forEach((button) => {
    button.classList.toggle(
      "is-active",
      button.dataset.operator === operator && waitingForValue
    );
  });
}

function reset() {
  display = "0";
  storedValue = null;
  operator = null;
  waitingForValue = false;
  hasError = false;

  lastOperator = null;
  lastOperand = null;

  expressionElement.textContent = "Ready";

  render();
}

function showError(message = "Calculation error") {
  display = "Error";

  storedValue = null;
  operator = null;
  waitingForValue = true;
  hasError = true;

  lastOperator = null;
  lastOperand = null;

  expressionElement.textContent = message;

  render();
}

function inputDigit(digit) {
  if (!/^\d$/.test(digit)) return;

  if (hasError || waitingForValue) {
    display = digit;
    waitingForValue = false;
    hasError = false;

    render();
    return;
  }

  if (display === "0") {
    display = digit;
  } else if (display === "-0") {
    display = `-${digit}`;
  } else if (display.replace(/\D/g, "").length < MAX_DIGITS) {
    display += digit;
  }

  render();
}

function inputDecimal() {
  if (hasError || waitingForValue) {
    display = "0.";
    waitingForValue = false;
    hasError = false;

    render();
    return;
  }

  if (!display.includes(".")) {
    display += ".";
  }

  render();
}

function chooseOperator(nextOperator) {
  if (hasError) return;

  const inputValue = Number(display);

  if (!Number.isFinite(inputValue)) {
    showError();
    return;
  }

  // If an operator is already pending and the user has entered
  // another number, calculate the intermediate result.
  if (
    operator &&
    storedValue !== null &&
    !waitingForValue
  ) {
    const result = calculate(
      storedValue,
      inputValue,
      operator
    );

    if (result === null) {
      showError(
        operator === "/" && inputValue === 0
          ? "Cannot divide by zero"
          : "Calculation error"
      );

      return;
    }

    display = formatResult(result);
    storedValue = result;
  } else if (storedValue === null) {
    storedValue = inputValue;
  }

  // Selecting a new operator cancels repeated "=" state.
  lastOperator = null;
  lastOperand = null;

  operator = nextOperator;
  waitingForValue = true;

  expressionElement.textContent =
    `${formatResult(storedValue)} ${labels[nextOperator]}`;

  render();
}

function equals() {
  if (hasError) return;

  /*
   * Normal calculation:
   *
   * 5 + 2 =
   * 7
   */
  if (
    operator !== null &&
    storedValue !== null &&
    !waitingForValue
  ) {
    const inputValue = Number(display);

    if (!Number.isFinite(inputValue)) {
      showError();
      return;
    }

    const result = calculate(
      storedValue,
      inputValue,
      operator
    );

    if (result === null) {
      showError(
        operator === "/" && inputValue === 0
          ? "Cannot divide by zero"
          : "Calculation error"
      );

      return;
    }

    expressionElement.textContent =
      `${formatResult(storedValue)} ${labels[operator]} ${formatResult(inputValue)} =`;

    display = formatResult(result);

    // Save for repeated "=".
    lastOperator = operator;
    lastOperand = inputValue;

    storedValue = null;
    operator = null;
    waitingForValue = true;

    render();

    return;
  }

  /*
   * Repeated "=":
   *
   * 5 + 2 = 7
   * = 9
   * = 11
   */
  if (
    operator === null &&
    lastOperator !== null &&
    lastOperand !== null
  ) {
    const currentValue = Number(display);

    if (!Number.isFinite(currentValue)) {
      showError();
      return;
    }

    const result = calculate(
      currentValue,
      lastOperand,
      lastOperator
    );

    if (result === null) {
      showError(
        lastOperator === "/" && lastOperand === 0
          ? "Cannot divide by zero"
          : "Calculation error"
      );

      return;
    }

    expressionElement.textContent =
      `${formatResult(currentValue)} ${labels[lastOperator]} ${formatResult(lastOperand)} =`;

    display = formatResult(result);
    waitingForValue = true;

    render();
  }
}

function toggleSign() {
  if (hasError) return;

  if (waitingForValue) {
    display = "-0";
    waitingForValue = false;

    render();
    return;
  }

  if (display === "0") {
    display = "-0";
  } else if (display === "-0") {
    display = "0";
  } else {
    const value = Number(display);

    if (!Number.isFinite(value)) {
      showError();
      return;
    }

    display = formatResult(value * -1);
  }

  render();
}

function applyPercent() {
  if (hasError || waitingForValue) return;

  const value = Number(display);

  if (!Number.isFinite(value)) {
    showError();
    return;
  }

  let percentValue;

  /*
   * Familiar calculator behavior:
   *
   * 200 + 10% = 220
   * 200 - 10% = 180
   *
   * For multiplication/division:
   *
   * 200 × 10% = 20
   * 200 ÷ 10% = 2000
   */
  if (
    operator &&
    storedValue !== null &&
    (operator === "+" || operator === "-")
  ) {
    percentValue = (storedValue * value) / 100;
  } else {
    percentValue = value / 100;
  }

  if (!Number.isFinite(percentValue)) {
    showError();
    return;
  }

  display = formatResult(percentValue);
  waitingForValue = false;

  render();
}

function backspace() {
  if (hasError) {
    reset();
    return;
  }

  if (waitingForValue) return;

  const next = display.slice(0, -1);

  if (next === "" || next === "-") {
    display = "0";
  } else {
    display = next;
  }

  render();
}

function handleAction(action) {
  if (action === "clear") {
    reset();
    return;
  }

  if (action === "decimal") {
    inputDecimal();
    return;
  }

  if (action === "equals") {
    equals();
    return;
  }

  if (action === "sign") {
    toggleSign();
    return;
  }

  if (action === "percent") {
    applyPercent();
    return;
  }

  if (action === "backspace") {
    backspace();
  }
}

document.querySelector(".keypad").addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) return;

  if (button.dataset.number) {
    inputDigit(button.dataset.number);
    return;
  }

  if (button.dataset.operator) {
    chooseOperator(button.dataset.operator);
    return;
  }

  if (button.dataset.action) {
    handleAction(button.dataset.action);
  }
});

window.addEventListener("keydown", (event) => {
  const keyMap = {
    Enter: "equals",
    "=": "equals",

    Escape: "clear",
    c: "clear",
    C: "clear",

    Backspace: "backspace",

    ",": "decimal",
    ".": "decimal",

    x: "*",
    X: "*",

    "%": "percent",
  };

  const value = keyMap[event.key] ?? event.key;

  if (/^\d$/.test(value)) {
    inputDigit(value);
  } else if (["+", "-", "*", "/"].includes(value)) {
    chooseOperator(value);
  } else if (
    [
      "equals",
      "clear",
      "backspace",
      "decimal",
      "percent",
    ].includes(value)
  ) {
    handleAction(value);
  } else {
    return;
  }

  event.preventDefault();
});

render();