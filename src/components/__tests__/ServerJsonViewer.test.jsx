/**
 * Tests for ServerJsonViewer component with validation integration
 *
 * These tests verify that the ServerJsonViewer correctly integrates
 * with the validation system and displays validation results.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ServerJsonViewer from "../ServerJsonViewer";
import * as mcpValidator from "../../utils/validation/mcpValidator";

// Mock the JsonEditor component since it's complex and not the focus of these tests
jest.mock("../JsonEditor", () => {
  return function MockJsonEditor({ json }) {
    return <div data-testid="json-editor" data-json={json} />;
  };
});

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
  ValidationDetails: ({ validationResult, onApplyFix, onClose }) => (
    <div
      data-testid="validation-details"
      data-valid={validationResult?.valid}
      data-errors={validationResult?.errors?.length}
      data-warnings={validationResult?.warnings?.length}
    >
      Validation Details
      <button data-testid="close-details" onClick={onClose}>
        Close
      </button>
      {validationResult?.errors?.map((error, i) => (
        <div key={i} data-testid={`error-${i}`}>
          {error.path}: {error.message}
          {error.suggestion && (
            <button
              data-testid={`apply-fix-${i}`}
              onClick={() => onApplyFix(error)}
            >
              Apply Fix
            </button>
          )}
        </div>
      ))}
    </div>
  ),
}));

describe("ServerJsonViewer", () => {
  // Sample server data for testing
  const serverData = {
    name: "test-server",
    command: "python",
    args: ["-m", "server"],
    env: {
      PORT: "8000",
      DEBUG: "true",
    },
  };

  beforeEach(() => {
    // Mock the validation functions
    jest
      .spyOn(mcpValidator, "validateMcpServerConfig")
      .mockImplementation(() => ({
        errors: [
          {
            path: "command",
            message: "Test error",
            suggestion: { action: "fix" },
          },
        ],
        warnings: [{ path: "env.PORT", message: "Test warning" }],
      }));

    jest
      .spyOn(mcpValidator, "formatSingleServerConfig")
      .mockImplementation((config) => ({ ...config }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders with validation badge", () => {
    render(
      <ServerJsonViewer
        server={serverData}
        serverId="server-123"
        onBack={() => {}}
      />,
    );

    // Should render the ServerJsonViewer with title
    expect(
      screen.getByText(/MCP Configuration JSON - Server:/),
    ).toBeInTheDocument();

    // Should show the validation badge
    const badge = screen.getByTestId("validation-badge");
    expect(badge).toBeInTheDocument();

    // Badge should have validation data
    expect(badge.dataset.errors).toBe("1");
    expect(badge.dataset.warnings).toBe("1");
  });

  test("shows validation details when badge is clicked", async () => {
    render(
      <ServerJsonViewer
        server={serverData}
        serverId="server-123"
        onBack={() => {}}
      />,
    );

    // Validation details should not be shown initially
    expect(screen.queryByTestId("validation-details")).not.toBeInTheDocument();

    // Click the validation badge
    fireEvent.click(screen.getByTestId("validation-badge"));

    // Validation details should now be shown
    await waitFor(() => {
      expect(screen.getByTestId("validation-details")).toBeInTheDocument();
    });
  });

  test("hides validation details when close button is clicked", async () => {
    render(
      <ServerJsonViewer
        server={serverData}
        serverId="server-123"
        onBack={() => {}}
      />,
    );

    // Click the validation badge to show details
    fireEvent.click(screen.getByTestId("validation-badge"));

    // Validation details should be shown
    await waitFor(() => {
      expect(screen.getByTestId("validation-details")).toBeInTheDocument();
    });

    // Click the close button
    fireEvent.click(screen.getByTestId("close-details"));

    // Validation details should be hidden
    await waitFor(() => {
      expect(
        screen.queryByTestId("validation-details"),
      ).not.toBeInTheDocument();
    });
  });

  test("handles applying fixes", async () => {
    const mockUpdateServer = jest.fn();

    render(
      <ServerJsonViewer
        server={serverData}
        serverId="server-123"
        onBack={() => {}}
        onUpdateServer={mockUpdateServer}
      />,
    );

    // Click the validation badge to show details
    fireEvent.click(screen.getByTestId("validation-badge"));

    // Validation details should be shown
    await waitFor(() => {
      expect(screen.getByTestId("validation-details")).toBeInTheDocument();
    });

    // Mock the auto-correction function
    jest.spyOn(mcpValidator, "applyAutoCorrections").mockImplementation(() => ({
      ...serverData,
      command: "python-fixed",
    }));

    // Should show apply fix button
    const applyFixButton = screen.getByTestId("apply-fix-0");
    expect(applyFixButton).toBeInTheDocument();

    // Click the apply fix button
    fireEvent.click(applyFixButton);

    // Should call the auto-correction function
    expect(mcpValidator.applyAutoCorrections).toHaveBeenCalled();
  });

  test("displays formatted MCP JSON", () => {
    render(
      <ServerJsonViewer
        server={serverData}
        serverId="server-123"
        onBack={() => {}}
      />,
    );

    // Should call formatSingleServerConfig
    expect(mcpValidator.formatSingleServerConfig).toHaveBeenCalledWith(
      expect.any(Object),
    );

    // Should pass the formatted JSON to JsonEditor
    const jsonEditor = screen.getByTestId("json-editor");
    expect(jsonEditor).toBeInTheDocument();

    // JSON should contain the server name
    const jsonData = JSON.parse(jsonEditor.dataset.json);
    expect(Object.keys(jsonData)[0]).toBe("test-server");
  });

  test("calls onBack when back button is clicked", () => {
    const mockOnBack = jest.fn();

    render(
      <ServerJsonViewer
        server={serverData}
        serverId="server-123"
        onBack={mockOnBack}
      />,
    );

    // Click the back button
    fireEvent.click(screen.getByText("Back to Form"));

    // Should call onBack
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  test("validates server data when it changes", async () => {
    const { rerender } = render(
      <ServerJsonViewer
        server={serverData}
        serverId="server-123"
        onBack={() => {}}
      />,
    );

    // Should have called validateMcpServerConfig
    expect(mcpValidator.validateMcpServerConfig).toHaveBeenCalledTimes(1);

    // Reset mock
    mcpValidator.validateMcpServerConfig.mockClear();

    // Update server data
    const updatedServerData = {
      ...serverData,
      command: "node",
      args: ["server.js"],
    };

    // Re-render with updated data
    rerender(
      <ServerJsonViewer
        server={updatedServerData}
        serverId="server-123"
        onBack={() => {}}
      />,
    );

    // Should have called validateMcpServerConfig again
    expect(mcpValidator.validateMcpServerConfig).toHaveBeenCalledTimes(1);

    // Should have been called with updated data
    expect(mcpValidator.validateMcpServerConfig).toHaveBeenCalledWith(
      expect.objectContaining({ command: "node", args: ["server.js"] }),
      expect.any(String),
    );
  });
});
