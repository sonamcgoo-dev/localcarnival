/**
 * Node Types
 * 
 * Types for the node-based workflow system.
 */

import { Position, Size } from '../canvas/types';

export type NodeType = 
  | 'input'      // Data input
  | 'output'     // Data output
  | 'action'    // Execute action
  | 'transform' // Transform data
  | 'condition' // Conditional logic
  | 'loop'      // Loop/iteration
  | 'function'  // Custom function
  | 'trigger';  // Workflow trigger

export interface NodePort {
  id: string;
  name: string;
  type: 'input' | 'output';
  dataType: string;
  required?: boolean;
  defaultValue?: any;
}

export interface NodeStyle {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  icon?: string;
}

export interface NodeData {
  [key: string]: any;
}

export interface NodeConfig {
  id?: string;
  type: NodeType;
  name?: string;
  position: Position;
  size?: Size;
  ports?: NodePort[];
  style?: NodeStyle;
  data?: NodeData;
}

export interface Node {
  id: string;
  type: NodeType;
  name: string;
  position: Position;
  size: Size;
  ports: NodePort[];
  style: NodeStyle;
  data: NodeData;
  selected: boolean;
  locked: boolean;
}

export interface NodeDefinition {
  type: NodeType;
  name: string;
  description: string;
  category: string;
  icon: string;
  
  // Port definitions
  inputs: Omit<NodePort, 'id'>[];
  outputs: Omit<NodePort, 'id'>[];
  
  // Default configuration
  defaults?: Partial<NodeData>;
  
  // Validation
  validate?: (data: NodeData) => { valid: boolean; errors?: string[] };
  
  // Execution (for runtime)
  execute?: (inputs: Record<string, any>, data: NodeData) => Promise<Record<string, any>>;
}

// Built-in node definitions
export const BUILT_IN_NODES: Record<NodeType, NodeDefinition> = {
  input: {
    type: 'input',
    name: 'Input',
    description: 'Workflow input parameter',
    category: 'Core',
    icon: '📥',
    inputs: [],
    outputs: [
      { name: 'value', type: 'output', dataType: 'any' }
    ]
  },
  
  output: {
    type: 'output',
    name: 'Output',
    description: 'Workflow output',
    category: 'Core',
    icon: '📤',
    inputs: [
      { name: 'value', type: 'input', dataType: 'any', required: true }
    ],
    outputs: []
  },
  
  action: {
    type: 'action',
    name: 'Action',
    description: 'Execute an action',
    category: 'Logic',
    icon: '⚡',
    inputs: [
      { name: 'trigger', type: 'input', dataType: 'any' }
    ],
    outputs: [
      { name: 'done', type: 'output', dataType: 'any' }
    ]
  },
  
  transform: {
    type: 'transform',
    name: 'Transform',
    description: 'Transform data',
    category: 'Logic',
    icon: '🔄',
    inputs: [
      { name: 'input', type: 'input', dataType: 'any', required: true }
    ],
    outputs: [
      { name: 'output', type: 'output', dataType: 'any' }
    ]
  },
  
  condition: {
    type: 'condition',
    name: 'Condition',
    description: 'Conditional branch',
    category: 'Logic',
    icon: '🔀',
    inputs: [
      { name: 'condition', type: 'input', dataType: 'boolean', required: true }
    ],
    outputs: [
      { name: 'true', type: 'output', dataType: 'any' },
      { name: 'false', type: 'output', dataType: 'any' }
    ]
  },
  
  loop: {
    type: 'loop',
    name: 'Loop',
    description: 'Iterate over items',
    category: 'Logic',
    icon: '🔁',
    inputs: [
      { name: 'items', type: 'input', dataType: 'array', required: true },
      { name: 'trigger', type: 'input', dataType: 'any' }
    ],
    outputs: [
      { name: 'item', type: 'output', dataType: 'any' },
      { name: 'done', type: 'output', dataType: 'any' }
    ]
  },
  
  function: {
    type: 'function',
    name: 'Function',
    description: 'Custom JavaScript function',
    category: 'Advanced',
    icon: '📜',
    inputs: [],
    outputs: [
      { name: 'result', type: 'output', dataType: 'any' }
    ],
    defaults: {
      code: '// Transform inputs to outputs\nreturn { result: inputs };'
    }
  },
  
  trigger: {
    type: 'trigger',
    name: 'Trigger',
    description: 'Workflow trigger',
    category: 'Core',
    icon: '🚀',
    inputs: [],
    outputs: [
      { name: 'triggered', type: 'output', dataType: 'any' }
    ]
  }
};
