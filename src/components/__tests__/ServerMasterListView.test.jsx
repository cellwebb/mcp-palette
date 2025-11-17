import React from 'react';
import { render, screen } from '@testing-library/react';
import ServerMasterListView from '../ServerMasterListView';

// Mock child components
jest.mock('../ServerMasterList', () => {
  return function MockServerMasterList() {
    return <div data-testid="server-master-list">ServerMasterList</div>;
  };
});

jest.mock('../MasterServerForm', () => {
  return function MockMasterServerForm() {
    return <div data-testid="master-server-form">MasterServerForm</div>;
  };
});

jest.mock('../JsonEditor', () => {
  return function MockJsonEditor({ json, readOnly, isProfileView }) {
    return (
      <div data-testid="json-editor" data-readonly={readOnly} data-profile-view={isProfileView}>
        {json}
      </div>
    );
  };
});

describe('ServerMasterListView', () => {
  const mockServerMasterList = {
    'server-1': { name: 'Server 1', command: 'node', args: ['-v'] },
    'server-2': { name: 'Server 2', command: 'bun', args: [] },
  };

  const mockProfiles = [
    { id: '1', name: 'Profile 1', servers: {} },
    { id: '2', name: 'Profile 2', servers: {} },
  ];

  const mockProps = {
    serverMasterList: mockServerMasterList,
    selectedServerMaster: null,
    isAddingServer: false,
    viewingServerJson: false,
    profiles: mockProfiles,
    editMode: 'form',
    setEditMode: jest.fn(),
    onSelectServer: jest.fn(),
    onAddMasterServer: jest.fn(),
    onSaveMasterServer: jest.fn(),
    onUpdateMasterServer: jest.fn(),
    onDeleteMasterServer: jest.fn(),
    onViewServerJson: jest.fn(),
    onCancelServerForm: jest.fn(),
    onBackFromJson: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders tabs', () => {
    render(<ServerMasterListView {...mockProps} />);

    expect(screen.getByText('Form View')).toBeInTheDocument();
    expect(screen.getByText('JSON View')).toBeInTheDocument();
  });

  test('form tab is active when editMode is form', () => {
    render(<ServerMasterListView {...mockProps} editMode="form" />);

    const tabs = document.querySelectorAll('.tab');
    expect(tabs[0]).toHaveClass('active');
    expect(tabs[1]).not.toHaveClass('active');
  });

  test('json tab is active when editMode is json', () => {
    render(<ServerMasterListView {...mockProps} editMode="json" />);

    const tabs = document.querySelectorAll('.tab');
    expect(tabs[0]).not.toHaveClass('active');
    expect(tabs[1]).toHaveClass('active');
  });

  test('clicking form tab calls setEditMode with form', () => {
    render(<ServerMasterListView {...mockProps} />);

    const tabs = document.querySelectorAll('.tab');
    tabs[0].click();

    expect(mockProps.setEditMode).toHaveBeenCalledWith('form');
  });

  test('clicking json tab calls setEditMode with json', () => {
    render(<ServerMasterListView {...mockProps} />);

    const tabs = document.querySelectorAll('.tab');
    tabs[1].click();

    expect(mockProps.setEditMode).toHaveBeenCalledWith('json');
  });

  test('renders ServerMasterList when in form view and not adding/editing', () => {
    render(<ServerMasterListView {...mockProps} />);

    expect(screen.getByTestId('server-master-list')).toBeInTheDocument();
  });

  test('renders MasterServerForm when adding server', () => {
    render(<ServerMasterListView {...mockProps} isAddingServer={true} />);

    expect(screen.getByTestId('master-server-form')).toBeInTheDocument();
    expect(screen.queryByTestId('server-master-list')).not.toBeInTheDocument();
  });

  test('renders MasterServerForm when editing server', () => {
    render(<ServerMasterListView {...mockProps} selectedServerMaster="server-1" />);

    expect(screen.getByTestId('master-server-form')).toBeInTheDocument();
    expect(screen.queryByTestId('server-master-list')).not.toBeInTheDocument();
  });

  test('renders individual server JSON viewer when viewingServerJson is true', () => {
    render(
      <ServerMasterListView
        {...mockProps}
        viewingServerJson={true}
        selectedServerMaster="server-1"
      />
    );

    expect(screen.getByText('Back to Form')).toBeInTheDocument();
    expect(screen.getByTestId('json-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('server-master-list')).not.toBeInTheDocument();
  });

  test('clicking Back to Form button calls onBackFromJson', () => {
    render(
      <ServerMasterListView
        {...mockProps}
        viewingServerJson={true}
        selectedServerMaster="server-1"
      />
    );

    const backButton = screen.getByText('Back to Form');
    backButton.click();

    expect(mockProps.onBackFromJson).toHaveBeenCalled();
  });

  test('renders JSON editor in JSON view mode', () => {
    render(<ServerMasterListView {...mockProps} editMode="json" />);

    const jsonEditor = screen.getByTestId('json-editor');
    expect(jsonEditor).toBeInTheDocument();
    expect(jsonEditor).toHaveAttribute('data-readonly', 'true');
    expect(jsonEditor).toHaveAttribute('data-profile-view', 'false');
  });

  test('JSON view shows formatted server list', () => {
    render(<ServerMasterListView {...mockProps} editMode="json" />);

    const jsonEditor = screen.getByTestId('json-editor');
    const jsonContent = jsonEditor.textContent;

    // Should contain mcpServers
    expect(jsonContent).toContain('mcpServers');
    // Should be formatted
    expect(jsonContent).toContain('Server 1');
    expect(jsonContent).toContain('Server 2');
  });

  test('individual server JSON view shows single server formatted', () => {
    render(
      <ServerMasterListView
        {...mockProps}
        viewingServerJson={true}
        selectedServerMaster="server-1"
      />
    );

    const jsonEditor = screen.getByTestId('json-editor');
    expect(jsonEditor).toBeInTheDocument();

    const jsonContent = jsonEditor.textContent;
    expect(jsonContent).toContain('Server 1');
  });

  test('does not render individual server JSON viewer when selectedServerMaster is null', () => {
    render(
      <ServerMasterListView
        {...mockProps}
        viewingServerJson={true}
        selectedServerMaster={null}
      />
    );

    // Should fall back to showing the server master list
    expect(screen.queryByText('Back to Form')).not.toBeInTheDocument();
    expect(screen.getByTestId('server-master-list')).toBeInTheDocument();
  });

  test('prioritizes viewingServerJson over isAddingServer', () => {
    render(
      <ServerMasterListView
        {...mockProps}
        viewingServerJson={true}
        selectedServerMaster="server-1"
        isAddingServer={true}
      />
    );

    // Should show JSON viewer, not the form
    expect(screen.getByText('Back to Form')).toBeInTheDocument();
    expect(screen.queryByTestId('master-server-form')).not.toBeInTheDocument();
  });

  test('prioritizes selectedServerMaster over isAddingServer when not viewing JSON', () => {
    render(
      <ServerMasterListView
        {...mockProps}
        selectedServerMaster="server-1"
        isAddingServer={true}
      />
    );

    // Should show the form (for editing the selected server)
    expect(screen.getByTestId('master-server-form')).toBeInTheDocument();
  });
});
