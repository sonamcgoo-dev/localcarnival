# Plugin SDK

> Build LocalCircus plugins (Performers).

## Overview

Plugins extend LocalCircus functionality by adding commands, tools, panels, and other features. This SDK provides the APIs needed to build powerful plugins.

## Installation

```bash
npm install @localcircus/plugin-sdk
```

## Quick Start

```typescript
import { definePlugin } from '@localcircus/plugin-sdk';

export default definePlugin({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  
  onLoad(context) {
    // Register commands, tools, etc.
    context.api.commands.register({
      id: 'my-plugin:say-hello',
      name: 'Say Hello',
      handler: async () => {
        context.api.notifications.show({
          title: 'Hello!',
          message: 'Welcome to LocalCircus!'
        });
      }
    });
  },
  
  onUnload() {
    // Cleanup
  }
});
```

## Plugin Structure

### Manifest

Every plugin needs a manifest file:

```yaml
# plugin.yaml
plugin:
  id: my-plugin
  name: My Plugin
  version: 1.0.0
  description: A sample plugin
  
  # Entry point
  main: dist/index.js
  
  # Capabilities
  capabilities:
    - command:my-command
    - tool:my-tool
    - ui:panel
    - ui:sidebar
  
  # Permissions required
  permissions:
    - filesystem:read
    - network:request
    - ui:panel
    - ui:notification
```

### TypeScript Definition

```typescript
import { Plugin, PluginContext } from '@localcircus/plugin-sdk';

export default class MyPlugin implements Plugin {
  id = 'my-plugin';
  name = 'My Plugin';
  version = '1.0.0';
  
  async onLoad(context: PluginContext): Promise<void> {
    // Initialize plugin
  }
  
  async onUnload(): Promise<void> {
    // Cleanup
  }
}
```

## PluginContext

The context object provides access to all LocalCircus APIs.

```typescript
interface PluginContext {
  // Plugin info
  plugin: {
    id: string;
    name: string;
    version: string;
  };
  
  // APIs
  api: LocalCircusAPI;
  
  // Utilities
  logger: Logger;
  storage: StorageAPI;
  secrets: SecretsAPI;
}
```

### Logger

```typescript
// Logging
context.logger.info('Plugin loaded');
context.logger.warn('Something might be wrong');
context.logger.error('An error occurred', { error });

// With formatting
context.logger.info('User %s performed action %s', userId, action);
```

### Storage

```typescript
// Global storage (persists across sessions)
await context.storage.global.set('settings', { theme: 'dark' });
const settings = await context.storage.global.get('settings');

// Workspace storage (per workspace)
await context.storage.workspace.set('cache', myData);
const cached = await context.storage.workspace.get('cache');

// Delete
await context.storage.global.delete('settings');
```

### Secrets

```typescript
// Get a secret
const apiKey = await context.secrets.get('MY_API_KEY');

// Set a secret
await context.secrets.set('MY_API_KEY', 'secret-value');

// Secrets are encrypted and never exposed to the frontend
```

## Commands

Commands appear in the command palette and can have keyboard shortcuts.

```typescript
context.api.commands.register({
  id: 'my-plugin:greet',
  name: 'Greet User',
  description: 'Send a greeting message',
  
  // Keyboard shortcut
  keybinding: {
    primary: 'cmd+shift+g',
    secondary: 'ctrl+shift+g'  // Linux/Windows fallback
  },
  
  // Category in command palette
  category: 'My Plugin',
  
  // Handler
  handler: async (context: CommandContext) => {
    const args = context.args as { name?: string };
    const name = args.name || 'World';
    
    context.api.notifications.show({
      title: 'Hello!',
      message: `Hello, ${name}!`
    });
  }
});
```

### Dynamic Commands

```typescript
// Register with dynamic items
context.api.commands.registerDynamic({
  id: 'my-plugin:open-recent',
  
  handler: async (query: string) => {
    const recentFiles = await getRecentFiles();
    
    return recentFiles
      .filter(f => f.name.includes(query))
      .map(f => ({
        id: `open:${f.id}`,
        name: f.name,
        description: f.path,
        handler: () => openFile(f.id)
      }));
  }
});
```

### Command Palette

Commands are automatically added to the command palette:

```
Cmd+K → Command Palette
↓ My Plugin
  Greet User         ⌘⇧G
  Open Recent File  →
  ...
```

## Tools

Tools are callable by AI agents.

```typescript
context.api.tools.register({
  id: 'my-plugin:search',
  name: 'Search Files',
  description: 'Search for files matching a pattern',
  
  // JSON Schema for parameters
  parameters: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Search pattern (glob or regex)'
      },
      path: {
        type: 'string',
        description: 'Directory to search in',
        default: '.'
      },
      recursive: {
        type: 'boolean',
        description: 'Search subdirectories',
        default: true
      }
    },
    required: ['pattern']
  },
  
  handler: async (params: Record<string, unknown>) => {
    const { pattern, path = '.', recursive = true } = params;
    
    const files = await searchFiles(pattern, { path, recursive });
    
    return {
      success: true,
      output: JSON.stringify(files, null, 2)
    };
  }
});
```

### Tool Result Format

```typescript
interface ToolResult {
  success: boolean;
  output?: string;      // Human-readable output
  data?: any;           // Structured data (optional)
  error?: {
    code: string;
    message: string;
  };
}
```

### Tool Examples

```typescript
// Calculator tool
context.api.tools.register({
  id: 'my-plugin:calculate',
  name: 'Calculate',
  description: 'Evaluate a mathematical expression',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression'
      }
    },
    required: ['expression']
  },
  handler: async ({ expression }) => {
    try {
      const result = math.evaluate(expression);
      return { success: true, output: String(result) };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'EVAL_ERROR', message: String(error) } 
      };
    }
  }
});

// Web search tool
context.api.tools.register({
  id: 'my-plugin:web-search',
  name: 'Web Search',
  description: 'Search the web for information',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      limit: { type: 'number', default: 5 }
    },
    required: ['query']
  },
  handler: async ({ query, limit = 5 }) => {
    const results = await webSearch(query, limit);
    return { 
      success: true, 
      output: formatResults(results) 
    };
  }
});
```

## Panels

Add custom UI panels to LocalCircus.

```typescript
context.api.panels.register({
  id: 'my-plugin:dashboard',
  name: 'My Dashboard',
  
  // Panel location
  location: 'right',  // 'left' | 'right' | 'bottom' | 'top' | 'modal'
  
  // Component
  component: DashboardPanel,
  
  // Size (optional)
  size: {
    width: 400,
    minWidth: 300,
    maxWidth: 800
  },
  
  // Behavior
  resizable: true,
  collapsible: true,
  defaultVisible: true
});
```

### React Component

```tsx
import React from 'react';
import { usePanel } from '@localcircus/plugin-sdk/react';

function DashboardPanel() {
  const { panel } = usePanel();
  
  return (
    <div className="dashboard-panel">
      <h2>{panel.name}</h2>
      <p>Panel ID: {panel.id}</p>
      
      <button onClick={() => panel.close()}>
        Close Panel
      </button>
    </div>
  );
}
```

### Panel API

```typescript
// Within handler
context.api.panels.open('my-plugin:dashboard');

// With arguments
context.api.panels.open('my-plugin:dashboard', {
  initialData: { tab: 'overview' }
});

// Close
context.api.panels.close('my-plugin:dashboard');

// Toggle
context.api.panels.toggle('my-plugin:dashboard');

// Update
context.api.panels.update('my-plugin:dashboard', {
  title: 'Updated Dashboard'
});
```

## Events

Subscribe to LocalCircus events.

```typescript
context.api.events.on('user:action', (event) => {
  context.logger.info('User action:', event);
});

// With filters
context.api.events.on('file:changed', {
  filter: (event) => event.path.endsWith('.ts'),
  handler: (event) => {
    // TypeScript files changed
  }
});
```

### Available Events

```typescript
// File events
'file:created'
'file:modified'
'file:deleted'
'file:renamed'

// Workspace events
'workspace:opened'
'workspace:closed'
'workspace:changed'

// UI events
'command:executed'
'panel:opened'
'panel:closed'

// User events
'user:action'
'user:idle'

// System events
'system:ready'
'system:shutdown'
```

## Settings

Add settings to LocalCircus settings panel.

```typescript
context.api.settings.register({
  id: 'my-plugin',
  name: 'My Plugin',
  
  sections: [
    {
      id: 'general',
      name: 'General',
      fields: [
        {
          id: 'enabled',
          type: 'boolean',
          name: 'Enable Plugin',
          default: true
        },
        {
          id: 'theme',
          type: 'select',
          name: 'Theme',
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
            { label: 'System', value: 'system' }
          ],
          default: 'system'
        },
        {
          id: 'apiKey',
          type: 'secret',
          name: 'API Key',
          placeholder: 'Enter your API key'
        }
      ]
    }
  ]
});
```

## Notifications

Show notifications to users.

```typescript
// Simple notification
context.api.notifications.show({
  title: 'Task Complete',
  message: 'Your backup has finished successfully'
});

// With actions
context.api.notifications.show({
  title: 'Update Available',
  message: 'A new version is available',
  actions: [
    { id: 'update', label: 'Update Now' },
    { id: 'later', label: 'Later' }
  ]
});

// Handle action clicks
context.api.notifications.onAction((action) => {
  if (action.id === 'update') {
    installUpdate();
  }
});

// Notification types
context.api.notifications.show({
  title: 'Warning',
  message: 'Something might be wrong',
  type: 'warning'  // 'info' | 'success' | 'warning' | 'error'
});
```

## HTTP Requests

Make HTTP requests (requires permission).

```typescript
const response = await context.api.http.request({
  method: 'GET',
  url: 'https://api.example.com/data',
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});

if (response.ok) {
  const data = await response.json();
  console.log(data);
}
```

## File System

Access the file system (requires permission).

```typescript
// Read file
const content = await context.api.files.read('/path/to/file.txt');

// Write file
await context.api.files.write('/path/to/new-file.txt', 'Hello, World!');

// List directory
const files = await context.api.files.list('/path/to/directory');

// Check existence
const exists = await context.api.files.exists('/path/to/file.txt');

// Get info
const info = await context.api.files.stat('/path/to/file.txt');
console.log(`Size: ${info.size}, Modified: ${info.modified}`);
```

## Lifecycle

### onLoad

Called when the plugin is loaded.

```typescript
async onLoad(context: PluginContext): Promise<void> {
  // 1. Register extensions
  context.api.commands.register(myCommand);
  context.api.tools.register(myTool);
  
  // 2. Load persisted state
  const settings = await context.storage.global.get('settings');
  
  // 3. Initialize
  this.initialize(settings);
  
  context.logger.info('Plugin loaded successfully');
}
```

### onUnload

Called when the plugin is unloaded.

```typescript
async onUnload(): Promise<void> {
  // 1. Save state
  await context.storage.global.set('settings', this.settings);
  
  // 2. Cleanup
  this.cleanup();
  
  // 3. Remove event listeners
  this.unsubscribe();
  
  context.logger.info('Plugin unloaded');
}
```

## Permissions

Declare required permissions in manifest:

```yaml
permissions:
  - filesystem:read      # Read files
  - filesystem:write     # Write files
  - network:request      # Make HTTP requests
  - network:request:api.example.com  # Specific domain
  - secrets:read         # Read secrets
  - secrets:write        # Write secrets
  - ui:panel             # Add panels
  - ui:sidebar           # Add sidebar items
  - ui:notification      # Show notifications
```

### Permission Checking

```typescript
// Check at runtime
const hasPermission = context.api.permissions.has('filesystem:write');

if (!hasPermission) {
  throw new Error('Permission denied: filesystem:write');
}
```

## Debugging

### Logging

```typescript
context.logger.debug('Detailed info:', { data });
context.logger.info('Normal info');
context.logger.warn('Warning message');
context.logger.error('Error occurred', { error });
```

### Dev Mode

Enable debug mode in development:

```typescript
// In your plugin config
export default definePlugin({
  id: 'my-plugin',
  devMode: true,  // Enables detailed logging
  
  // ...
});
```

### Testing

```typescript
import { createMockContext } from '@localcircus/plugin-sdk/testing';

describe('My Plugin', () => {
  let context: MockPluginContext;
  
  beforeEach(() => {
    context = createMockContext();
  });
  
  it('should register commands', async () => {
    const plugin = new MyPlugin();
    await plugin.onLoad(context);
    
    expect(context.api.commands.register).toHaveBeenCalled();
  });
});
```

## CLI Commands

```bash
# Create new plugin
circus codeforge create my-plugin --type plugin

# Build plugin
circus plugin build

# Watch for changes
circus plugin watch

# Test locally
circus plugin dev

# Package for distribution
circus plugin package

# Validate plugin
circus plugin validate
```

## Related Documents

- [LCA-0008: Plugin Interface](../../localcircus-specs/lca/draft/lca-0008-plugin-interface.md)
- [Tutorial: First Plugin](../../08-Codex/tutorials/first-plugin.md)
