/**
 * Toolbar Component
 * 
 * Toolbar for the Big Top canvas editor.
 */

import React from 'react';
import { BigTop, NodeType } from '@localcircus/bigtop';

export interface ToolbarProps {
  bigtop: BigTop;
  className?: string;
  style?: React.CSSProperties;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  bigtop,
  className,
  style,
}) => {
  const [selectedNodeType, setSelectedNodeType] = React.useState<NodeType | null>(null);

  const handleAddNode = (type: NodeType) => {
    // Add node at center of canvas
    const viewport = bigtop.getCanvas().getViewport();
    const canvasCenter = {
      x: (500 - viewport.offset.x) / viewport.zoom,
      y: (300 - viewport.offset.y) / viewport.zoom,
    };

    bigtop.addNodeByType(type, canvasCenter);
  };

  const handleZoomIn = () => bigtop.zoomIn();
  const handleZoomOut = () => bigtop.zoomOut();
  const handleFitToContent = () => bigtop.fitToContent();
  const handleResetView = () => bigtop.resetView();
  const handleDeleteSelected = () => bigtop.deleteSelected();
  const handleDeselectAll = () => bigtop.deselectAll();
  const handleClear = () => bigtop.clear();

  const nodeTypes: { type: NodeType; icon: string; label: string }[] = [
    { type: 'trigger', icon: '🚀', label: 'Trigger' },
    { type: 'input', icon: '📥', label: 'Input' },
    { type: 'action', icon: '⚡', label: 'Action' },
    { type: 'transform', icon: '🔄', label: 'Transform' },
    { type: 'condition', icon: '🔀', label: 'Condition' },
    { type: 'loop', icon: '🔁', label: 'Loop' },
    { type: 'function', icon: '📜', label: 'Function' },
    { type: 'output', icon: '📤', label: 'Output' },
  ];

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        backgroundColor: '#1a1a2e',
        borderRadius: 8,
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        ...style,
      }}
    >
      {/* Add Node Section */}
      <div>
        <div style={{ color: '#888', fontSize: 10, marginBottom: 4, textTransform: 'uppercase' }}>
          Add Node
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {nodeTypes.map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => handleAddNode(type)}
              title={label}
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selectedNodeType === type ? '#6366f1' : '#2a2a4e',
                border: '1px solid #4a4a7e',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 16,
                transition: 'background-color 0.2s',
              }}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: '#4a4a7e' }} />

      {/* View Controls */}
      <div>
        <div style={{ color: '#888', fontSize: 10, marginBottom: 4, textTransform: 'uppercase' }}>
          View
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <ToolButton onClick={handleZoomIn} title="Zoom In">
            +
          </ToolButton>
          <ToolButton onClick={handleZoomOut} title="Zoom Out">
            −
          </ToolButton>
          <ToolButton onClick={handleFitToContent} title="Fit to Content">
            ⊡
          </ToolButton>
          <ToolButton onClick={handleResetView} title="Reset View">
            ⌂
          </ToolButton>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: '#4a4a7e' }} />

      {/* Selection Controls */}
      <div>
        <div style={{ color: '#888', fontSize: 10, marginBottom: 4, textTransform: 'uppercase' }}>
          Selection
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <ToolButton onClick={handleDeleteSelected} title="Delete Selected">
            🗑
          </ToolButton>
          <ToolButton onClick={handleDeselectAll} title="Deselect All">
            ⊝
          </ToolButton>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: '#4a4a7e' }} />

      {/* Canvas Controls */}
      <div>
        <div style={{ color: '#888', fontSize: 10, marginBottom: 4, textTransform: 'uppercase' }}>
          Canvas
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <ToolButton onClick={handleClear} title="Clear Canvas" danger>
            ✕
          </ToolButton>
        </div>
      </div>
    </div>
  );
};

interface ToolButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  children,
  onClick,
  title,
  danger,
}) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: danger ? '#dc2626' : '#2a2a4e',
      border: '1px solid #4a4a7e',
      borderRadius: 4,
      cursor: 'pointer',
      color: '#fff',
      fontSize: 14,
      transition: 'background-color 0.2s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = danger ? '#ef4444' : '#3a3a5e';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = danger ? '#dc2626' : '#2a2a4e';
    }}
  >
    {children}
  </button>
);

export default Toolbar;
