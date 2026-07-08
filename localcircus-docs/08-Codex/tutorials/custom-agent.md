# Tutorial: Build a Custom Agent

> Create an AI agent tailored to your needs.

## Prerequisites

- LocalCircus installed
- Basic understanding of tools and workflows

## What is an Agent?

An **Agent** is an AI that can:
- Use tools to perform actions
- Maintain conversation context
- Access memory and knowledge
- Work autonomously or collaborate

## Step 1: Create Agent Project

```bash
# Create a new agent
circus codeforge create code-reviewer --type agent

# Navigate to directory
cd code-reviewer

# Install dependencies
npm install
```

## Step 2: Define Agent

Edit `agent.yaml`:

```yaml
agent:
  id: code-reviewer
  name: Code Reviewer
  version: 1.0.0
  description: Reviews code for quality and best practices
  
  # Provider configuration
  provider:
    model: gpt-4
    temperature: 0.3
  
  # Capabilities
  capabilities:
    - tool:read-file
    - tool:analyze-code
    - tool:write-comment
    - workflow:review-flow
  
  # Memory
  memory:
    shortTerm: true
    longTerm: true
```

## Step 3: Define Tools

Edit `src/tools.ts`:

```typescript
import { defineTool } from '@localcircus/agent-sdk';

export const readFileTool = defineTool({
  id: 'read-file',
  name: 'Read File',
  description: 'Read the contents of a file',
  
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the file'
      },
      lines: {
        type: 'number',
        description: 'Number of lines to read',
        default: 100
      }
    },
    required: ['path']
  },
  
  handler: async (params) => {
    const fs = await import('fs/promises');
    const content = await fs.readFile(params.path, 'utf-8');
    const lines = content.split('\n').slice(0, params.lines);
    
    return {
      success: true,
      output: lines.join('\n'),
      metadata: {
        path: params.path,
        linesRead: lines.length,
        totalLines: content.split('\n').length
      }
    };
  }
});

export const analyzeCodeTool = defineTool({
  id: 'analyze-code',
  name: 'Analyze Code',
  description: 'Analyze code for quality issues',
  
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      language: { type: 'string' }
    },
    required: ['code']
  },
  
  handler: async (params) => {
    const issues: Issue[] = [];
    
    // Check for common issues
    if (params.code.includes('console.log')) {
      issues.push({
        severity: 'warning',
        type: 'debug-code',
        message: 'Remove console.log statements before production'
      });
    }
    
    // More analysis...
    
    return {
      success: true,
      output: JSON.stringify({ issues }, null, 2)
    };
  }
});
```

## Step 4: Define Agent Logic

Edit `src/agent.ts`:

```typescript
import { defineAgent } from '@localcircus/agent-sdk';
import { readFileTool, analyzeCodeTool } from './tools';

export default defineAgent({
  id: 'code-reviewer',
  name: 'Code Reviewer',
  
  // System prompt
  systemPrompt: `You are an expert code reviewer. Your job is to:
  
  1. Read the code file
  2. Analyze for quality issues
  3. Check for best practices
  4. Provide constructive feedback
  
  Be thorough but constructive. Focus on:
  - Security vulnerabilities
  - Performance issues
  - Code readability
  - Best practices
  - Potential bugs`,
  
  // Tools available to this agent
  tools: [
    readFileTool,
    analyzeCodeTool
  ],
  
  // Memory configuration
  memory: {
    // Remember previous reviews
    episodic: {
      enabled: true,
      maxEntries: 100
    },
    
    // Learn from feedback
    semantic: {
      enabled: true,
      maxEntries: 50
    }
  },
  
  // Behavior
  behavior: {
    // Ask for confirmation before major changes
    confirmDestructive: true,
    
    // Auto-summarize long conversations
    summarizeAfter: 20,  // messages
    maxContext: 10
  }
});
```

## Step 5: Test Agent

```bash
# Start agent
circus agent dev code-reviewer

# Test in chat
> Review the file src/utils.ts
```

## Step 6: Add Workflow Integration

```typescript
import { defineAgent } from '@localcircus/agent-sdk';
import { WorkflowExecutor } from '@localcircus/workflow-sdk';

export default defineAgent({
  id: 'code-reviewer',
  // ...
  
  workflows: {
    'review-flow': {
      steps: [
        { action: 'read-file', path: '{{inputs.file}}' },
        { action: 'analyze-code', code: '{{steps.read.output}}' },
        { action: 'generate-report' }
      ]
    }
  }
});
```

## Complete Example

```typescript
import { defineAgent } from '@localcircus/agent-sdk';

// Define tools
const tools = {
  readFile: defineTool({ ... }),
  analyzeCode: defineTool({ ... }),
  writeComment: defineTool({ ... })
};

// Define agent
export default defineAgent({
  id: 'code-reviewer',
  name: 'Code Reviewer',
  description: 'Reviews code for quality and best practices',
  
  systemPrompt: `You are an expert code reviewer...`,
  
  tools: Object.values(tools),
  
  memory: {
    episodic: true,
    semantic: true
  },
  
  behavior: {
    confirmDestructive: true,
    summarizeAfter: 20
  }
});
```

## Advanced: Multi-Agent

```typescript
// Team of agents
export default defineAgent({
  id: 'review-team',
  name: 'Review Team',
  type: 'team',
  
  members: [
    {
      role: 'lead',
      agent: 'code-reviewer'
    },
    {
      role: 'security',
      agent: 'security-auditor'
    },
    {
      role: 'performance',
      agent: 'perf-analyst'
    }
  ],
  
  behavior: {
    communication: 'hierarchical',
    taskAssignment: 'capability-based'
  }
});
```

## Testing

```typescript
import { testAgent } from '@localcircus/agent-sdk/testing';

testAgent({
  agent: 'code-reviewer',
  
  cases: [
    {
      name: 'Reviews simple file',
      input: { file: 'src/example.ts' },
      expect: {
        contains: ['issues', 'suggestions']
      }
    }
  ]
});
```

## Next Steps

- [Workflow Automation](./workflow-automation.md)
- [Agent SDK Reference](../../09-Agents/README.md)
