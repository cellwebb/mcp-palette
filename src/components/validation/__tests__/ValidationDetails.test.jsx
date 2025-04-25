/**
 * Tests for ValidationDetails component
 *
 * These tests verify the behavior of the ValidationDetails component
 * under different validation result scenarios.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ValidationDetails from "../ValidationDetails";

describe("ValidationDetails", () => {
  test("renders empty state when no validation issues found", () => {
    const validResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    render(<ValidationDetails validationResult={validResult} />);

    expect(
      screen.getByText("No validation issues found. Configuration is valid."),
    ).toBeInTheDocument();
  });

  test("renders empty state when validation result is null", () => {
    render(<ValidationDetails validationResult={null} />);

    // Use a flexible matcher in case text is split or wrapped
    expect(
      screen.getByText((content) =>
        content.includes("No validation issues found")
      )
    ).toBeInTheDocument();
  });

  test("renders validation errors", () => {
    const invalidResult = {
      valid: false,
      errors: [
        { path: "command", message: "Missing command property" },
        { path: "args", message: "args must be an array" },
      ],
      warnings: [],
    };

    render(<ValidationDetails validationResult={invalidResult} />);

    // Should show error tab by default
    expect(screen.getByText("Errors (2)")).toBeInTheDocument();

    // Should show both errors
    expect(screen.getByText("command")).toBeInTheDocument();
    expect(screen.getByText("Missing command property")).toBeInTheDocument();
    expect(screen.getByText("args")).toBeInTheDocument();
    expect(screen.getByText("args must be an array")).toBeInTheDocument();
  });

  test("renders validation warnings", () => {
    const warningResult = {
      valid: true,
      errors: [],
      warnings: [
        { path: "command", message: "Potentially unsafe command" },
        { path: "env.PORT", message: "Invalid variable name" },
      ],
    };

    render(<ValidationDetails validationResult={warningResult} />);

    // Switch to warnings tab
    fireEvent.click(screen.getByText("Warnings (2)"));

    // Should show both warnings
    expect(screen.getByText("command")).toBeInTheDocument();
    expect(screen.getByText("Potentially unsafe command")).toBeInTheDocument();
    expect(screen.getByText("env.PORT")).toBeInTheDocument();
    expect(screen.getByText("Invalid variable name")).toBeInTheDocument();
  });

  test("allows switching between errors and warnings tabs", () => {
    const result = {
      valid: false,
      errors: [{ path: "command", message: "Missing command" }],
      warnings: [{ path: "env.PORT", message: "Invalid variable name" }],
    };

    render(<ValidationDetails validationResult={result} />);

    // Should start with errors tab
    expect(screen.getByText("Errors (1)")).toBeInTheDocument();
    expect(screen.getByText("Missing command")).toBeInTheDocument();

    // Switch to warnings tab
    fireEvent.click(screen.getByText("Warnings (1)"));

    // Should show warnings
    expect(screen.getByText("Invalid variable name")).toBeInTheDocument();

    // Switch back to errors tab
    fireEvent.click(screen.getByText("Errors (1)"));

    // Should show errors again
    expect(screen.getByText("Missing command")).toBeInTheDocument();
  });

  test("renders fix buttons for issues with suggestions", () => {
    const result = {
      valid: false,
      errors: [
        {
          path: "command",
          message: "Missing command property",
          suggestion: {
            action: "add",
            value: "python",
            description: "Add a command",
          },
        },
        {
          path: "args",
          message: "args must be an array",
          // No suggestion
        },
      ],
      warnings: [],
    };

    render(<ValidationDetails validationResult={result} />);

    // Should have one fix button for the issue with a suggestion
    const fixButtons = screen.getAllByText("Fix");
    expect(fixButtons).toHaveLength(1);
  });

  test("calls onApplyFix when fix button is clicked", () => {
    const mockApplyFix = jest.fn();
    const issue = {
      path: "command",
      message: "Missing command property",
      suggestion: {
        action: "add",
        value: "python",
        description: "Add a command",
      },
    };

    const result = {
      valid: false,
      errors: [issue],
      warnings: [],
    };

    render(
      <ValidationDetails validationResult={result} onApplyFix={mockApplyFix} />,
    );

    // Click the fix button
    fireEvent.click(screen.getByText("Fix"));

    // Should call onApplyFix with the issue
    expect(mockApplyFix).toHaveBeenCalledTimes(1);
    expect(mockApplyFix).toHaveBeenCalledWith(issue);
  });

  test("calls onClose when close button is clicked", () => {
    const mockClose = jest.fn();
    const result = {
      valid: true,
      errors: [],
      warnings: [],
    };

    render(<ValidationDetails validationResult={result} onClose={mockClose} />);

    // Click the close button
    fireEvent.click(screen.getByText("×"));

    // Should call onClose
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  test("renders validation summary in footer", () => {
    const invalidResult = {
      valid: false,
      errors: [{ path: "command", message: "Missing command" }],
      warnings: [{ path: "env.PORT", message: "Invalid variable name" }],
    };

    render(<ValidationDetails validationResult={invalidResult} />);

    // Should show summary in footer
    expect(
      screen.getByText("Configuration has validation errors"),
    ).toBeInTheDocument();
  });
});
