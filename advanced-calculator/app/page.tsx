"use client";

import { useCallback, useEffect, useState } from "react";
import { calculate, formatNumber } from "@/lib/calculator.mjs";

type Operator = "+" | "−" | "×" | "÷";

const keys = [
  {
    label: "AC",
    action: "clear",
    kind: "utility",
  },
  {
    label: "+/−",
    action: "sign",
    kind: "utility",
  },
  {
    label: "%",
    action: "percent",
    kind: "utility",
  },
  {
    label: "÷",
    action: "operator",
    kind: "operator",
  },

  {
    label: "7",
    action: "digit",
    kind: "number",
  },
  {
    label: "8",
    action: "digit",
    kind: "number",
  },
  {
    label: "9",
    action: "digit",
    kind: "number",
  },
  {
    label: "×",
    action: "operator",
    kind: "operator",
  },

  {
    label: "4",
    action: "digit",
    kind: "number",
  },
  {
    label: "5",
    action: "digit",
    kind: "number",
  },
  {
    label: "6",
    action: "digit",
    kind: "number",
  },
  {
    label: "−",
    action: "operator",
    kind: "operator",
  },

  {
    label: "1",
    action: "digit",
    kind: "number",
  },
  {
    label: "2",
    action: "digit",
    kind: "number",
  },
  {
    label: "3",
    action: "digit",
    kind: "number",
  },
  {
    label: "+",
    action: "operator",
    kind: "operator",
  },

  {
    label: "⌫",
    action: "delete",
    kind: "number",
  },
  {
    label: "0",
    action: "digit",
    kind: "number",
  },
  {
    label: ".",
    action: "decimal",
    kind: "number",
  },
  {
    label: "=",
    action: "equals",
    kind: "equals",
  },
] as const;

export default function Home() {
  const [display, setDisplay] = useState("0");

  const [storedValue, setStoredValue] =
    useState<number | null>(null);

  const [pendingOperator, setPendingOperator] =
    useState<Operator | null>(null);

  const [waitingForOperand, setWaitingForOperand] =
    useState(false);

  const [status, setStatus] = useState("Ready");

  // Used for repeated "=" calculations.
  const [lastOperator, setLastOperator] =
    useState<Operator | null>(null);

  const [lastOperand, setLastOperand] =
    useState<number | null>(null);

  const reset = useCallback(() => {
    setDisplay("0");
    setStoredValue(null);
    setPendingOperator(null);
    setWaitingForOperand(false);
    setStatus("Ready");

    setLastOperator(null);
    setLastOperand(null);
  }, []);

  const showCalculationError = useCallback(
    (operator: Operator | null, value: number) => {
      setDisplay("Error");

      if (operator === "÷" && value === 0) {
        setStatus("Cannot divide by zero");
      } else {
        setStatus("Calculation error");
      }

      setStoredValue(null);
      setPendingOperator(null);
      setWaitingForOperand(true);

      setLastOperator(null);
      setLastOperand(null);
    },
    []
  );

  const inputDigit = useCallback(
    (digit: string) => {
      if (!/^\d$/.test(digit)) return;

      if (
        display === "Error" ||
        waitingForOperand
      ) {
        setDisplay(digit);
        setWaitingForOperand(false);
        return;
      }

      const digitCount =
        display.replace(/\D/g, "").length;

      if (digitCount >= 15) {
        return;
      }

      if (display === "0") {
        setDisplay(digit);
      } else if (display === "-0") {
        setDisplay(`-${digit}`);
      } else {
        setDisplay(display + digit);
      }
    },
    [display, waitingForOperand]
  );

  const inputDecimal = useCallback(() => {
    if (
      display === "Error" ||
      waitingForOperand
    ) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }

    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }, [display, waitingForOperand]);

  const chooseOperator = useCallback(
    (nextOperator: Operator) => {
      if (display === "Error") return;

      const current = Number(display);

      if (!Number.isFinite(current)) {
        reset();
        return;
      }

      let nextStored = current;

      /*
       * Existing operation:
       *
       * 5 + 2 then ×
       *
       * becomes:
       *
       * 7 ×
       */
      if (
        storedValue !== null &&
        pendingOperator &&
        !waitingForOperand
      ) {
        const result = calculate(
          storedValue,
          current,
          pendingOperator
        );

        if (!Number.isFinite(result)) {
          showCalculationError(
            pendingOperator,
            current
          );
          return;
        }

        nextStored = result;

        setDisplay(formatNumber(result));
      }

      /*
       * If the user changes:
       *
       * 5 +
       * then presses ×
       *
       * keep 5 and change the operator.
       */
      else if (
        storedValue !== null &&
        waitingForOperand
      ) {
        setPendingOperator(nextOperator);

        setStatus(
          `${formatNumber(storedValue)} ${nextOperator}`
        );

        return;
      }

      setStoredValue(nextStored);

      setPendingOperator(nextOperator);

      setWaitingForOperand(true);

      setStatus(
        `${formatNumber(nextStored)} ${nextOperator}`
      );

      // A new operator starts a new calculation sequence.
      setLastOperator(null);
      setLastOperand(null);
    },
    [
      display,
      pendingOperator,
      reset,
      showCalculationError,
      storedValue,
      waitingForOperand,
    ]
  );

  const showResult = useCallback(() => {
    if (display === "Error") return;

    /*
     * Normal calculation:
     *
     * 5 + 2 =
     * 7
     */
    if (
      storedValue !== null &&
      pendingOperator !== null &&
      !waitingForOperand
    ) {
      const current = Number(display);

      if (!Number.isFinite(current)) {
        showCalculationError(
          pendingOperator,
          current
        );
        return;
      }

      const result = calculate(
        storedValue,
        current,
        pendingOperator
      );

      if (!Number.isFinite(result)) {
        showCalculationError(
          pendingOperator,
          current
        );
        return;
      }

      setDisplay(formatNumber(result));

      setStatus(
        `${formatNumber(storedValue)} ${pendingOperator} ${formatNumber(current)} =`
      );

      // Save operation for repeated "=".
      setLastOperator(pendingOperator);
      setLastOperand(current);

      setStoredValue(null);
      setPendingOperator(null);
      setWaitingForOperand(true);

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
      storedValue === null &&
      pendingOperator === null &&
      lastOperator !== null &&
      lastOperand !== null
    ) {
      const current = Number(display);

      if (!Number.isFinite(current)) {
        showCalculationError(
          lastOperator,
          lastOperand
        );
        return;
      }

      const result = calculate(
        current,
        lastOperand,
        lastOperator
      );

      if (!Number.isFinite(result)) {
        showCalculationError(
          lastOperator,
          lastOperand
        );
        return;
      }

      setDisplay(formatNumber(result));

      setStatus(
        `${formatNumber(current)} ${lastOperator} ${formatNumber(lastOperand)} =`
      );

      setWaitingForOperand(true);
    }
  }, [
    display,
    lastOperand,
    lastOperator,
    pendingOperator,
    showCalculationError,
    storedValue,
    waitingForOperand,
  ]);

  const toggleSign = useCallback(() => {
    if (display === "Error") return;

    if (waitingForOperand) {
      setDisplay("-0");
      setWaitingForOperand(false);
      return;
    }

    if (display === "0") {
      setDisplay("-0");
      return;
    }

    if (display === "-0") {
      setDisplay("0");
      return;
    }

    const value = Number(display);

    if (!Number.isFinite(value)) {
      return;
    }

    setDisplay(formatNumber(value * -1));
  }, [display, waitingForOperand]);

  const applyPercent = useCallback(() => {
    /*
     * Do not calculate percentage when we are waiting
     * for a new operand.
     *
     * Example:
     *
     * 200 +
     * %
     *
     * should not unexpectedly produce 400.
     */
    if (
      display === "Error" ||
      waitingForOperand
    ) {
      return;
    }

    const value = Number(display);

    if (!Number.isFinite(value)) {
      return;
    }

    let percentValue: number;

    /*
     * Familiar calculator behavior:
     *
     * 200 + 10% = 220
     * 200 - 10% = 180
     *
     * Multiplication/division:
     *
     * 200 × 10% = 20
     * 200 ÷ 10% = 2000
     */
    if (
      pendingOperator &&
      storedValue !== null &&
      (
        pendingOperator === "+" ||
        pendingOperator === "−"
      )
    ) {
      percentValue =
        (storedValue * value) / 100;
    } else {
      percentValue = value / 100;
    }

    if (!Number.isFinite(percentValue)) {
      setDisplay("Error");
      setStatus("Calculation error");

      setStoredValue(null);
      setPendingOperator(null);
      setWaitingForOperand(true);

      setLastOperator(null);
      setLastOperand(null);

      return;
    }

    setDisplay(formatNumber(percentValue));
    setWaitingForOperand(false);
  }, [
    display,
    pendingOperator,
    storedValue,
    waitingForOperand,
  ]);

  const removeDigit = useCallback(() => {
    if (display === "Error") {
      reset();
      return;
    }

    if (waitingForOperand) return;

    const next = display.slice(0, -1);

    setDisplay(
      next === "" || next === "-"
        ? "0"
        : next
    );
  }, [display, reset, waitingForOperand]);

  const handleAction = useCallback(
    (action: string, label: string) => {
      switch (action) {
        case "digit":
          inputDigit(label);
          break;

        case "decimal":
          inputDecimal();
          break;

        case "operator":
          chooseOperator(
            label as Operator
          );
          break;

        case "equals":
          showResult();
          break;

        case "clear":
          reset();
          break;

        case "sign":
          toggleSign();
          break;

        case "percent":
          applyPercent();
          break;

        case "delete":
          removeDigit();
          break;

        default:
          break;
      }
    },
    [
      applyPercent,
      chooseOperator,
      inputDecimal,
      inputDigit,
      removeDigit,
      reset,
      showResult,
      toggleSign,
    ]
  );

  useEffect(() => {
    const onKeyDown = (
      event: KeyboardEvent
    ) => {
      const operatorMap: Record<
        string,
        Operator
      > = {
        "+": "+",
        "-": "−",
        "*": "×",
        "/": "÷",
      };

      if (/^[0-9]$/.test(event.key)) {
        handleAction(
          "digit",
          event.key
        );
      } else if (
        event.key === "." ||
        event.key === ","
      ) {
        handleAction(
          "decimal",
          "."
        );
      } else if (
        event.key.toLowerCase() === "x"
      ) {
        handleAction(
          "operator",
          "×"
        );
      } else if (
        operatorMap[event.key]
      ) {
        handleAction(
          "operator",
          operatorMap[event.key]
        );
      } else if (
        event.key === "Enter" ||
        event.key === "="
      ) {
        handleAction(
          "equals",
          "="
        );
      } else if (
        event.key === "Backspace"
      ) {
        handleAction(
          "delete",
          "delete"
        );
      } else if (
        event.key === "Escape" ||
        event.key.toLowerCase() === "c"
      ) {
        handleAction(
          "clear",
          "AC"
        );
      } else if (
        event.key === "%"
      ) {
        handleAction(
          "percent",
          "%"
        );
      } else {
        return;
      }

      event.preventDefault();
    };

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [handleAction]);

  return (
    <main className="calculator-page">
      <div
        className="decor decor-top"
        aria-hidden="true"
      />

      <div
        className="decor decor-bottom"
        aria-hidden="true"
      />

      <section
        className="calculator-wrap"
        aria-label="Professional calculator"
      >
        <div className="calculator">
          <div
            className="display-panel"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="status">
              {status}
            </p>

            <output
              className={`display ${
                display.replace(/\D/g, "")
                  .length >= 11
                  ? "display-small"
                  : ""
              }`}
            >
              {display}
            </output>
          </div>

          <div className="keypad">
            {keys.map((key, index) => (
              <button
                className={`key key-${key.kind} ${
                  key.action === "operator" &&
                  key.label === pendingOperator &&
                  waitingForOperand
                    ? "key-active"
                    : ""
                }`}
                key={`${key.label}-${index}`}
                type="button"
                onClick={() =>
                  handleAction(
                    key.action,
                    key.label
                  )
                }
                aria-label={
                  key.action === "delete"
                    ? "Delete last digit"
                    : key.label
                }
              >
                {key.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="keyboard-help"
          aria-label="Keyboard shortcuts"
        >
          <strong>
            Keyboard supported
          </strong>

          <span>
            <kbd>Esc</kbd> clear
          </span>

          <span>
            <kbd>Enter</kbd> calculate
          </span>
        </div>
      </section>
    </main>
  );
}