# Tutorial: Your First Plugin

> Build a LocalCircus plugin (Performer) in 10 minutes.

## Prerequisites

- Node.js 18+
- npm or yarn
- LocalCircus installed

## Step 1: Create Project

```bash
# Create a new plugin
circus codeforge create my-first-plugin --type plugin

# Navigate to directory
cd my-first-plugin

# Install dependencies
npm install
```

## Project Structure

```
my-first-plugin/
├── plugin.yaml          # Plugin manifest
├── src/
│   └── index.ts         # Main plugin code
├── dist/                # Compiled output
├── package.json
└── tsconfig.json
```

## Step 2: Define Manifest

Edit `plugin.yaml`:

```yaml
plugin:
  id: my-first-plugin
  name: My First Plugin
  version: 0.1.0
  description: A simple plugin that says hello
  
  main: dist/index.js
  
  capabilities:
    - command:say-hello
    - tool:greet
  
  permissions:
    - ui:notification
```

## Step 3: Write Plugin Code

Edit `src/index.ts`:

```typescript
import { definePlugin } from '@localcircus/plugin-sdk';

// Define the plugin
export default definePlugin({
  id: 'my-first-plugin',
  name: 'My First Plugin',
  version: '0.1.0',
  
  // Called when plugin loads
  onLoad(context) {
    context.logger.info('Plugin loaded!');
    
    // Register a command
    context.api.commands.register({
      id: 'my-first-plugin:say-hello',
      name: 'Say Hello',
      description: 'Display a greeting message',
      
      category: 'My Plugin',
      
      handler: async () => {
        context.api.notifications.show({
          title: 'Hello! 👋',
          message: 'Welcome to LocalCircus!'
        });
      }
    });
    
    // Register a tool (for AI agents)
    context.api.tools.register({
      id: 'my-first-plugin:greet',
      name: 'Greet User',
      description: 'Send a personalized greeting',
      
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name to greet'
          }
        },
        required: ['name']
      },
      
      handler: async (params) => {
        const name = params.name as string;
        
        return {
          success: true,
          output: `Hello, ${name}! Welcome to LocalCircus! 🎪`
        };
      }
    });
  },
  
  // Called when plugin unloads
  onUnload() {
    context.logger.info('Plugin unloaded');
  }
});
```

## Step 4: Build

```bash
# Compile TypeScript
npm run build

# Check output
ls dist/
# index.js  index.d.ts
```

## Step 5: Test Locally

```bash
# Enable dev mode
circus plugin dev

# Or load locally
circus plugin load ./dist
```

## Step 6: Use Your Plugin

### Command Palette

1. Press `Cmd+K` to open command palette
2. Type "Say Hello"
3. Click the command

### From an Agent

Agents can call your tool:

```
User: Ask the agent to greet "Alice"

Agent: *calls greet tool with {name: "Alice"}*
Result: "Hello, Alice! Welcome to LocalCircus! 🎪"
```

## Adding Features

### Add a Panel

```typescript
// Register a panel
context.api.panels.register({
  id: 'my-first-plugin:dashboard',
  name: 'My Dashboard',
  location: 'right',
  
  component: DashboardPanel,
  
  size: { width: 400 },
  resizable: true
});

// Open panel
context.api.panels.open('my-first-plugin:dashboard');
```

### Add Settings

```typescript
context.api.settings.register({
  id: 'my-first-plugin',
  name: 'My Plugin',
  
  sections: [{
    id: 'general',
    name: 'General',
    fields: [
      {
        id: 'greeting',
        type: 'text',
        name: 'Greeting Message',
        default: 'Hello'
      },
      {
        id: 'showIcon',
        type: 'boolean',
        name: 'Show Icon',
        default: true
      }
    ]
  }]
});
```

### Store Data

```typescript
// Save data
await context.storage.global.set('lastRun', Date.now());

// Read data
const lastRun = await context.storage.global.get('lastRun');
```

## Debugging

### Enable Debug Logging

```typescript
context.logger.debug('Detailed info:', { data });
context.logger.info('Normal info');
context.logger.warn('Warning');
context.logger.error('Error', { error });
```

### View Logs

```bash
# View plugin logs
circus logs --plugin my-first-plugin
```

## Publishing

### 1. Generate DNA

```bash
circus codeforge generate-dna
```

### 2. Sign

```bash
circus codeforge sign --key my-publisher
```

### 3. Publish

```bash
circus marketplace submit --category plugin
```

## Complete Example

```typescript
import { definePlugin } from '@localcircus/plugin-sdk';

export default definePlugin({
  id: 'my-first-plugin',
  name: 'My First Plugin',
  version: '0.1.0',
  
  onLoad(context) {
    // Commands
    context.api.commands.register({
      id: 'my-first-plugin:say-hello',
      name: 'Say Hello',
      handler: async () => {
        context.api.notifications.show({
          title: 'Hello!',
          message: 'Welcome!'
        });
      }
    });
    
    // Tools
    context.api.tools.register({
      id: 'my-first-plugin:greet',
      name: 'Greet User',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      },
      handler: async (params) => {
        return {
          success: true,
          output: `Hello, ${params.name}!`
        };
      }
    });
  },
  
  onUnload() {
    // Cleanup
  }
});
```

## Next Steps

- [Build a Custom Agent](./custom-agent.md)
- [Create Workflow Automation](./workflow-automation.md)
- [Plugin SDK Reference](../../13-Plugin-SDK/README.md)

## Troubleshooting

### Plugin not loading?

```bash
# Check plugin status
circus plugin list

# Check for errors
circus plugin debug my-first-plugin
```

### Build errors?

```bash
# Clear cache
npm run clean

# Rebuild
npm install && npm run build
```
