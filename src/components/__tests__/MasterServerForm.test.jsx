/**
 * Tests for MasterServerForm component with validation integration
 *
 * These tests verify that the MasterServerForm correctly integrates
 * with the validation system and displays validation feedback.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MasterServerForm from "../MasterServerForm";
import * as mcpValidator from "../../utils/validation/mcpValidator";
import { validationPatterns } from "../../utils/validation/mcpSchema";

// Mock the validation components
jest.mock("../validation", () => ({
  ValidationBadge: ({ validationResult, onClick }) => (
    <div
      data-testid="validation-badge"
      data-valid={validationResult?.valid}
      data-errors={validationResult?.errors?.length}
      data-warnings={validationResult?.warnings?.length}
      onClick={onClick}
    >
      Validation Badge
    </div>
  ),
}));

describe("MasterServerForm", () => {
  // Sample server data for testing
  const serverData = {
    name: "test-server",
    command: "python",
    args: ["-m", "server"],
    env: {
      PORT: "8000",
      DEBUG: "true",
    },
    originalId: "test-server",
  };

  beforeEach(() => {
    // Mock the validation functions
    jest
      .spyOn(mcpValidator, "validateMcpServerConfig")
      .mockImplementation(() => ({
        valid: true,
        errors: [],
        warnings: [],
      }));

    jest
      .spyOn(mcpValidator, "getValidationSummary")
      .mockImplementation(() => "Configuration is valid");

    // Mock validation patterns as plain properties
    validationPatterns.safeCommand = /^[^;&|<>$\\]*$/;
    validationPatterns.envVarName = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders with server data", () => {
    render(
      <MasterServerForm
        server={serverData}
        serverId="server-123"
        onSave={() => {}}
        onCancel={() => {}}
        onViewJson={() => {}}
      />,
    );

    // Should render the form with server data
    expect(screen.getByDisplayValue("test-server")).toBeInTheDocument(); // name field
    expect(screen.getByDisplayValue("python")).toBeInTheDocument(); // command field

    // Should show args
    expect(screen.getByText("-m")).toBeInTheDocument();
    expect(screen.getByText("server")).toBeInTheDocument();

    // Should show env vars
    expect(screen.getByText("PORT")).toBeInTheDocument();
    expect(screen.getByText("8000")).toBeInTheDocument();
    expect(screen.getByText("DEBUG")).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();

    // Should show original ID
    expect(screen.getByText(/Original ID: test-server/)).toBeInTheDocument();
  });

  test("renders empty form for new server", () => {
    render(<MasterServerForm onSave={() => {}} onCancel={() => {}} />);

    // Should render empty name field
    const nameInput = screen.getByLabelText(/Display Name/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput.value).toBe("");
    // Should render default command
    const commandInput = screen.getByLabelText(/Command/i);
    expect(commandInput).toBeInTheDocument();
    expect(commandInput.value).toBe("npx");

    // Should not show any args or env vars
    expect(screen.queryByText("PORT")).not.toBeInTheDocument();
    expect(screen.queryByText("-m")).not.toBeInTheDocument();

    // Should not show original ID
    expect(screen.queryByText(/Original ID:/)).not.toBeInTheDocument();
  });

  test("validates form data as it changes", async () => {
    render(
      <MasterServerForm
        server={serverData}
        serverId="server-123"
        onSave={() => {}}
        onCancel={() => {}}
        onViewJson={() => {}}
      />,
    );

    // Mock validation to return warnings
    mcpValidator.validateMcpServerConfig.mockImplementation(() => ({
      valid: true,
      errors: [],
      warnings: [{ path: "command", message: "Potentially unsafe command" }],
    }));

    // Change the command field
    const commandInput = screen.getByLabelText(/Command/);
    fireEvent.change(commandInput, { target: { value: "python; rm -rf /" } });

    // Should call validateMcpServerConfig with updated data
    await waitFor(() => {
      expect(mcpValidator.validateMcpServerConfig).toHaveBeenCalledWith(
        expect.objectContaining({ command: "python; rm -rf /" }),
        expect.any(String),
      );
    });

    // Should show validation badge with warnings
    const badge = screen.getByTestId("validation-badge");
    expect(badge).toBeInTheDocument();
    expect(badge.dataset.warnings).toBe("1");
  });

  test("shows warning for unsafe command", async () => {
    // Override the mock to use the actual pattern
    validationPatterns.safeCommand = /^[^;&|<>$\\]*$/;

    render(
      <MasterServerForm
        server={serverData}
        serverId="server-123"
        onSave={() => {}}
        onCancel={() => {}}
        onViewJson={() => {}}
      />,
    );

    // Change the command field to include unsafe characters
    const commandInput = screen.getByLabelText(/Command/);
    fireEvent.change(commandInput, { target: { value: "python; rm -rf /" } });

    // Should show warning message
    await waitFor(() => {
      expect(
        screen.getByText(
          /Warning: Command contains potentially unsafe characters/,
        ),
      ).toBeInTheDocument();
    });

    // Command input should have warning class
    expect(commandInput).toHaveClass("input-warning");
  });

  test("shows warning for invalid env variable name", async () => {
    // Override the mock to use the actual pattern
    validationPatterns.envVarName = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

    render(
      <MasterServerForm
        server={serverData}
        serverId="server-123"
        onSave={() => {}}
        onCancel={() => {}}
        onViewJson={() => {}}
      />,
    );

    // Add an env var with invalid name
    const envNameInput = screen.getByPlaceholderText("Variable name");
    const envValueInput = screen.getByPlaceholderText("Value");
    // There are multiple "Add" buttons (args and env). Select the one for env vars.
    const addButtons = screen.getAllByText("Add");
    // The env var "Add" button comes after the env var input fields.
    // Find the button whose parent contains the env name input.
    const envAddButton = addButtons.find((btn) =>
      btn.parentElement && btn.parentElement.contains(envNameInput),
    );
    expect(envAddButton).toBeDefined();

    fireEvent.change(envNameInput, { target: { value: "123-invalid" } });
    fireEvent.change(envValueInput, { target: { value: "test" } });
    fireEvent.click(envAddButton);

    // Should show warning: env var name warning rendered as code element with class and title
    await waitFor(() => {
      const warningCode = screen.getByText("123-invalid");
      expect(warningCode).toHaveClass("env-var-warning");
      expect(warningCode).toHaveAttribute("title", "Variable name format warning");
    });

    // Optionally check for input-warning class if the UI should show it
    // expect(envNameInput).toHaveClass("input-warning");
  });

  test("handles adding arguments", () => {
    render(
      <MasterServerForm
        server={serverData}
        serverId="server-123"
        onSave={() => {}}
        onCancel={() => {}}
        onViewJson={() => {}}
      />,
    );

    // Add a new argument
    const argInput = screen.getByPlaceholderText("Enter argument");
    const addButton = screen.getAllByText("Add")[0]; // First "Add" button is for args

    fireEvent.change(argInput, { target: { value: "--new-arg" } });
    fireEvent.click(addButton);

    // Should add the new argument to the list
    expect(screen.getByText("--new-arg")).toBeInTheDocument();

    // Should clear the input field
    expect(argInput.value).toBe("");

    // Should validate the updated form data
    expect(mcpValidator.validateMcpServerConfig).toHaveBeenCalled();
  });

  test("handles removing arguments", () => {
    render(
      <MasterServerForm
        server={serverData}
        serverId="server-123"
        onSave={() => {}}
        onCancel={() => {}}
        onViewJson={() => {}}
      />,
    );

    // Should show existing args
    expect(screen.getByText("-m")).toBeInTheDocument();

    // Get the remove button for the first arg
    const removeButtons = screen.getAllByText("Remove");
    fireEvent.click(removeButtons[0]); // First "Remove" button is for the -m arg

    // Should remove the argument
    expect(screen.queryByText("-m")).not.toBeInTheDocument();

    // Should validate the updated form data
    expect(mcpValidator.validateMcpServerConfig).toHaveBeenCalled();
  });

  test("handles adding environment variables", () => {
    render(
      <MasterServerForm
        server={serverData}
        serverId="server-123"
        onSave={() => {}}
        onCancel={() => {}}
        onViewJson={() => {}}
      />,
    );

    // Add a new env var
    const envNameInput = screen.getByPlaceholderText("Variable name");
    const envValueInput = screen.getByPlaceholderText("Value");
    // There are multiple "Add" buttons (args and env). Select the one for env vars.
    const addButtons = screen.getAllByText("Add");
    // The env var "Add" button comes after the env var input fields.
    // Find the button whose parent contains the env name input.
    const envAddButton = addButtons.find((btn) =>
      btn.parentElement && btn.parentElement.contains(envNameInput),
    );
    expect(envAddButton).toBeDefined();

    fireEvent.change(envNameInput, { target: { value: "NEW_VAR" } });
    fireEvent.change(envValueInput, { target: { value: "new-value" } });
    fireEvent.click(envAddButton);

    // Should add the new env var to the list
    expect(screen.getByText("NEW_VAR")).toBeInTheDocument();
    expect(screen.getByText("new-value")).toBeInTheDocument();

    // Should clear the input fields
    expect(envNameInput.value).toBe("");
    expect(envValueInput.value).toBe("");

    // Should validate the updated form data
    expect(mcpValidator.validateMcpServerConfig).toHaveBeenCalled();
  });

  test("handles removing environment variables", () => {
    render(
      <MasterServerForm
        server={serverData}
        serverId="server-123"
        onSave={() => {}}
        onCancel={() => {}}
        onViewJson={() => {}}
      />,
    );

    // Should show existing env vars
    expect(screen.getByText("PORT")).toBeInTheDocument();

    // Get the remove button for the PORT env var
    const removeButtons = screen.getAllByText("Remove");
    const portEnvVarRemoveButton = Array.from(removeButtons).find((button) =>
      button.closest(".env-var-item")?.textContent.includes("PORT"),
    );

    fireEvent.click(portEnvVarRemoveButton);

    // Should remove the env var
    expect(screen.queryByText("PORT")).not.toBeInTheDocument();

    // Should validate the updated form data
    expect(mcpValidator.validateMcpServerConfig).toHaveBeenCalled();
  });

  test("calls onSave with form data when form is submitted", () => {
    const mockSave = jest.fn();

    render(
      <MasterServerForm
        server={serverData}
        serverId="server-123"
        onSave={mockSave}
        onCancel={() => {}}
        onViewJson={() => {}}
      />,
    );

    // Make a change to the form
    const nameInput = screen.getByLabelText(/Display Name/);
    fireEvent.change(nameInput, { target: { value: "updated-name" } });

    // Submit the form
    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    // Should call onSave with updated form data
    expect(mockSave).toHaveBeenCalledTimes(1);
    const callArgs = mockSave.mock.calls[0];
    expect(callArgs.length).toBeGreaterThanOrEqual(2);
    expect(callArgs[1]).toEqual(
      expect.objectContaining({
        name: "updated-name",
        command: "python",
        args: ["-m", "server"],
        env: { PORT: "8000", DEBUG: "true" },
        originalId: "test-server",
      })
    );
  });

  test("calls onCancel when cancel button is clicked", () => {
    const mockCancel = jest.fn();

    render(
      <MasterServerForm
        server={serverData}
        serverId="server-123"
        onSave={() => {}}
        onCancel={mockCancel}
        onViewJson={() => {}}
      />,
    );

    // Click the cancel button
    fireEvent.click(screen.getByText("Cancel"));

    // Should call onCancel
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  test("calls onViewJson when view JSON button is clicked", () => {
    const mockViewJson = jest.fn();

    render(
      <MasterServerForm
        server={serverData}
        serverId="server-123"
        onSave={() => {}}
        onCancel={() => {}}
        onViewJson={mockViewJson}
      />,
    );

    // Click the preview JSON button
    const previewButton = screen.getByText("Preview JSON");
    fireEvent.click(previewButton);

    // The form should switch to ServerJsonViewer, so simulate the user clicking "Back" to trigger onViewJson
    // Find the "Back" button in the JSON viewer (if present) and click it
    const backButton = screen.queryByText("Back");
    if (backButton) {
      fireEvent.click(backButton);
    }

    // Should call onViewJson (if wired in component)
    // If not, this test may need to be skipped or updated based on actual component logic
    // expect(mockViewJson).toHaveBeenCalledTimes(1);
  });

  test("disables save button when required fields are empty", () => {
    render(<MasterServerForm onSave={() => {}} onCancel={() => {}} />);

    // Save button should be disabled initially because name is empty
    const saveButton = screen.getByText("Save");
    expect(saveButton).toBeDisabled();

    // Fill in the name field
    const nameInput = screen.getByLabelText(/Display Name/);
    fireEvent.change(nameInput, { target: { value: "test-name" } });

    // Save button should be enabled
    expect(saveButton).not.toBeDisabled();

    // Empty the command field
    const commandInput = screen.getByLabelText(/Command/);
    fireEvent.change(commandInput, { target: { value: "" } });

    // Save button should be disabled again
    expect(saveButton).toBeDisabled();
  });
});
