/**
 * Tests for ValidationBadge component
 *
 * These tests verify the behavior of the ValidationBadge component
 * under different validation result scenarios.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ValidationBadge from "../ValidationBadge";

describe("ValidationBadge", () => {
  test('renders "not validated" state when no validation result provided', () => {
    render(<ValidationBadge validationResult={null} />);

    expect(screen.getByText("Not validated")).toBeInTheDocument();
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  test('renders "valid" state for valid result with no warnings', () => {
    const validResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    render(<ValidationBadge validationResult={validResult} />);

    expect(screen.getByText("Valid")).toBeInTheDocument();
    expect(screen.getByText("✔")).toBeInTheDocument();

    // Badge should have valid class
    const badge = screen.getByText("Valid").closest(".validation-badge");
    expect(badge).toHaveClass("validation-badge-valid");
  });

  test('renders "valid with warnings" state for valid result with warnings', () => {
    const validWithWarningsResult = {
      valid: true,
      errors: [],
      warnings: [{ path: "command", message: "Potentially unsafe command" }],
    };

    render(<ValidationBadge validationResult={validWithWarningsResult} />);

    expect(screen.getByText("Valid with warnings")).toBeInTheDocument();
    expect(screen.getByText("⚠")).toBeInTheDocument();

    // Badge should have warning class
    const badge = screen
      .getByText("Valid with warnings")
      .closest(".validation-badge");
    expect(badge).toHaveClass("validation-badge-warning");
  });

  test('renders "invalid" state for invalid result', () => {
    const invalidResult = {
      valid: false,
      errors: [{ path: "command", message: "Missing command property" }],
      warnings: [],
    };

    render(<ValidationBadge validationResult={invalidResult} />);

    expect(screen.getByText("Invalid")).toBeInTheDocument();
    expect(screen.getByText("✘")).toBeInTheDocument();

    // Badge should have error class
    const badge = screen.getByText("Invalid").closest(".validation-badge");
    expect(badge).toHaveClass("validation-badge-error");
  });

  test("shows details popup when showDetails is true and has warnings/errors", () => {
    const invalidResult = {
      valid: false,
      errors: [{ path: "command", message: "Missing command property" }],
      warnings: [{ path: "env.PORT", message: "Invalid variable name" }],
    };

    render(
      <ValidationBadge validationResult={invalidResult} showDetails={true} />,
    );

    // Should show error and warning in popup
    expect(screen.getByText("Errors (1)")).toBeInTheDocument();
    expect(screen.getByText(/Missing command property/)).toBeInTheDocument();
    expect(screen.getByText("Warnings (1)")).toBeInTheDocument();
    expect(screen.getByText(/Invalid variable name/)).toBeInTheDocument();
  });

  test("truncates long error/warning lists in details popup", () => {
    const invalidResult = {
      valid: false,
      errors: Array(5)
        .fill(0)
        .map((_, i) => ({
          path: `error${i}`,
          message: `Error message ${i}`,
        })),
      warnings: Array(5)
        .fill(0)
        .map((_, i) => ({
          path: `warning${i}`,
          message: `Warning message ${i}`,
        })),
    };

    render(
      <ValidationBadge validationResult={invalidResult} showDetails={true} />,
    );

    // Should show first 3 errors/warnings and a "more" message
    expect(screen.getByText("Errors (5)")).toBeInTheDocument();
    expect(screen.getByText(/Error message 0/)).toBeInTheDocument();
    expect(screen.getByText(/Error message 1/)).toBeInTheDocument();
    expect(screen.getByText(/Error message 2/)).toBeInTheDocument();
    expect(screen.getByText(/...and 2 more error/)).toBeInTheDocument();

    expect(screen.getByText("Warnings (5)")).toBeInTheDocument();
    expect(screen.getByText(/Warning message 0/)).toBeInTheDocument();
    expect(screen.getByText(/Warning message 1/)).toBeInTheDocument();
    expect(screen.getByText(/Warning message 2/)).toBeInTheDocument();
    expect(screen.getByText(/...and 2 more warning/)).toBeInTheDocument();
  });

  test("calls onClick handler when clicked", () => {
    const mockOnClick = jest.fn();
    const validResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    render(
      <ValidationBadge validationResult={validResult} onClick={mockOnClick} />,
    );

    // Click the badge
    fireEvent.click(screen.getByText("Valid"));

    // Should have called the onClick handler
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
