/**
 * Canvas Component
 * 
 * React component for the Big Top canvas.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BigTop, Position } from '@localcircus/bigtop';

export interface CanvasProps {
  bigtop: BigTop;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onCanvasClick?: (position: Position) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  bigtop,
  width = 800,
  height = 600,
  className,
  style,
  onNodeClick,
  onNodeDoubleClick,
  onCanvasClick,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState(bigtop.getCanvas().getViewport());
  const [nodes, setNodes] = useState(bigtop.getNodes().getAllNodes());
  const [connections, setConnections] = useState(bigtop.getConnections().getAllConnections());
  const [mode, setMode] = useState<'select' | 'pan' | 'connect'>('select');
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  // Subscribe to events
  useEffect(() => {
    const eventBus = bigtop.getEventBus();

    const unsubViewport = eventBus.on('viewport:change', () => {
      setViewport(bigtop.getCanvas().getViewport());
    });

    const unsubNodes = eventBus.on('node:created', () => {
      setNodes(bigtop.getNodes().getAllNodes());
    });

    const unsubNodeUpdated = eventBus.on('node:updated', () => {
      setNodes(bigtop.getNodes().getAllNodes());
    });

    const unsubNodeDeleted = eventBus.on('node:deleted', () => {
      setNodes(bigtop.getNodes().getAllNodes());
    });

    const unsubConnectionCreated = eventBus.on('connection:created', () => {
      setConnections(bigtop.getConnections().getAllConnections());
    });

    const unsubConnectionDeleted = eventBus.on('connection:deleted', () => {
      setConnections(bigtop.getConnections().getAllConnections());
    });

    return () => {
      unsubViewport();
      unsubNodes();
      unsubNodeUpdated();
      unsubNodeDeleted();
      unsubConnectionCreated();
      unsubConnectionDeleted();
    };
  }, [bigtop]);

  // Handle wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (e.deltaY < 0) {
      bigtop.zoomIn(position);
    } else {
      bigtop.zoomOut(position);
    }
  }, [bigtop]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      // Middle or right click - start panning
      bigtop.getCanvas().setMode('pan');
      setMode('pan');
    } else if (e.button === 0) {
      // Left click
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const canvasPos = bigtop.getCanvas().screenToCanvas(screenPos);
      onCanvasClick?.(canvasPos);
    }
  }, [bigtop, onCanvasClick]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (mode === 'pan' && e.buttons === 1) {
      bigtop.pan({ x: e.movementX, y: e.movementY });
    }

    if (draggingNode) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const canvasPos = bigtop.getCanvas().screenToCanvas(screenPos);
      
      bigtop.moveNode(draggingNode, {
        x: canvasPos.x - dragOffset.x,
        y: canvasPos.y - dragOffset.y,
      });
    }
  }, [bigtop, mode, draggingNode, dragOffset]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (mode === 'pan') {
      bigtop.getCanvas().setMode('select');
      setMode('select');
    }
    setDraggingNode(null);
  }, [bigtop, mode]);

  // Handle node mouse down
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    const node = bigtop.getNodes().getNode(nodeId);
    if (!node || node.locked) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const canvasPos = bigtop.getCanvas().screenToCanvas(screenPos);

    setDraggingNode(nodeId);
    setDragOffset({
      x: canvasPos.x - node.position.x,
      y: canvasPos.y - node.position.y,
    });

    bigtop.selectNode(nodeId, e.shiftKey);
  }, [bigtop]);

  // Handle node click
  const handleNodeClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    onNodeClick?.(nodeId);
  }, [onNodeClick]);

  // Handle node double click
  const handleNodeDoubleClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    onNodeDoubleClick?.(nodeId);
  }, [onNodeDoubleClick]);

  // Handle port click
  const handlePortClick = useCallback((e: React.MouseEvent, nodeId: string, portId: string) => {
    e.stopPropagation();
    bigtop.startConnection(nodeId, portId);
    setMode('connect');
  }, [bigtop]);

  // Calculate transform
  const transform = `translate(${viewport.offset.x}px, ${viewport.offset.y}px) scale(${viewport.zoom})`;

  // Generate grid pattern
  const gridSize = 20;
  const gridOffset = {
    x: viewport.offset.x % (gridSize * viewport.zoom),
    y: viewport.offset.y % (gridSize * viewport.zoom),
  };

  return (
    <div
      ref={canvasRef}
      className={className}
      style={{
        width,
        height,
        backgroundColor: '#1a1a2e',
        overflow: 'hidden',
        position: 'relative',
        cursor: mode === 'pan' ? 'grabbing' : mode === 'connect' ? 'crosshair' : 'default',
        ...style,
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Grid background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize * viewport.zoom}px ${gridSize * viewport.zoom}px`,
          backgroundPosition: `${gridOffset.x}px ${gridOffset.y}px`,
          pointerEvents: 'none',
        }}
      />

      {/* Canvas content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform,
          transformOrigin: '0 0',
        }}
      >
        {/* Connections SVG */}
        <svg
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6366f1"
              />
            </marker>
          </defs>
          
          {connections.map((conn) => {
            const sourcePos = bigtop.getNodes().getPortPosition(conn.source.nodeId, conn.source.portId);
            const targetPos = bigtop.getNodes().getPortPosition(conn.target.nodeId, conn.target.portId);
            
            if (!sourcePos || !targetPos) return null;

            const dx = targetPos.x - sourcePos.x;
            const path = Math.abs(dx) > 100
              ? `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x + dx/2} ${sourcePos.y}, ${targetPos.x - dx/2} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`
              : `M ${sourcePos.x} ${sourcePos.y} L ${targetPos.x} ${targetPos.y}`;

            return (
              <g key={conn.id}>
                <path
                  d={path}
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onClick={(e) => handleNodeClick(e, node.id)}
            onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
            style={{
              position: 'absolute',
              left: node.position.x,
              top: node.position.y,
              width: node.size.width,
              minHeight: node.size.height,
              backgroundColor: node.style.backgroundColor || '#2a2a4e',
              border: `2px solid ${node.selected ? '#6366f1' : node.style.borderColor || '#4a4a7e'}`,
              borderRadius: 8,
              padding: 12,
              cursor: node.locked ? 'not-allowed' : 'move',
              userSelect: 'none',
              boxShadow: node.selected 
                ? '0 0 0 2px rgba(99, 102, 241, 0.3)' 
                : '0 4px 6px rgba(0,0,0,0.3)',
              transition: draggingNode === node.id ? 'none' : 'box-shadow 0.2s, border-color 0.2s',
            }}
          >
            {/* Node header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 16 }}>{getNodeIcon(node.type)}</span>
              <span style={{ 
                color: '#fff', 
                fontSize: 14, 
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {node.name}
              </span>
            </div>

            {/* Ports */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              padding: '8px 0',
            }}>
              {/* Input ports */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                {node.ports
                  .filter(p => p.type === 'input')
                  .map((port) => (
                    <div
                      key={port.id}
                      onClick={(e) => handlePortClick(e, node.id, port.id)}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: '#6366f1',
                        border: '2px solid #fff',
                        cursor: 'crosshair',
                        marginLeft: -18,
                      }}
                      title={port.name}
                    />
                  ))
                }
              </div>

              {/* Output ports */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                {node.ports
                  .filter(p => p.type === 'output')
                  .map((port) => (
                    <div
                      key={port.id}
                      onClick={(e) => handlePortClick(e, node.id, port.id)}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        border: '2px solid #fff',
                        cursor: 'crosshair',
                        marginRight: -18,
                      }}
                      title={port.name}
                    />
                  ))
                }
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Zoom indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: 4,
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      >
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
};

function getNodeIcon(type: string): string {
  const icons: Record<string, string> = {
    input: '📥',
    output: '📤',
    action: '⚡',
    transform: '🔄',
    condition: '🔀',
    loop: '🔁',
    function: '📜',
    trigger: '🚀',
  };
  return icons[type] || '📦';
}

export default Canvas;
