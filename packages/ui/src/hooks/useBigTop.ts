/**
 * useBigTop Hook
 * 
 * React hook for Big Top state management.
 */

import { useState, useEffect, useCallback } from 'react';
import { BigTop, Node, Connection, Viewport } from '@localcircus/bigtop';

export interface UseBigTopReturn {
  bigtop: BigTop;
  nodes: Node[];
  connections: Connection[];
  viewport: Viewport;
  selectedNodes: Node[];
  addNode: (type: string, position: { x: number; y: number }) => void;
  removeNode: (nodeId: string) => void;
  moveNode: (nodeId: string, position: { x: number; y: number }) => void;
  connect: (sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string) => void;
  disconnect: (connectionId: string) => void;
  selectNode: (nodeId: string, addToSelection?: boolean) => void;
  deselectAll: () => void;
  deleteSelected: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToContent: () => void;
  resetView: () => void;
  export: () => any;
  import: (data: any) => void;
  clear: () => void;
}

export function useBigTop(name: string): UseBigTopReturn {
  const [bigtop] = useState(() => new BigTop(name));
  const [nodes, setNodes] = useState<Node[]>(() => bigtop.getNodes().getAllNodes());
  const [connections, setConnections] = useState<Connection[]>(() => bigtop.getConnections().getAllConnections());
  const [viewport, setViewport] = useState<Viewport>(() => bigtop.getCanvas().getViewport());
  const [selectedNodes, setSelectedNodes] = useState<Node[]>(() => bigtop.getSelectedNodes());

  // Subscribe to events
  useEffect(() => {
    const eventBus = bigtop.getEventBus();

    const unsubViewport = eventBus.on('viewport:change', () => {
      setViewport(bigtop.getCanvas().getViewport());
    });

    const unsubNodes = eventBus.on('node:created', () => {
      setNodes(bigtop.getNodes().getAllNodes());
      setSelectedNodes(bigtop.getSelectedNodes());
    });

    const unsubNodeUpdated = eventBus.on('node:updated', () => {
      setNodes(bigtop.getNodes().getAllNodes());
      setSelectedNodes(bigtop.getSelectedNodes());
    });

    const unsubNodeDeleted = eventBus.on('node:deleted', () => {
      setNodes(bigtop.getNodes().getAllNodes());
      setSelectedNodes(bigtop.getSelectedNodes());
    });

    const unsubSelection = eventBus.on('node:selected', () => {
      setSelectedNodes(bigtop.getSelectedNodes());
    });

    const unsubDeselection = eventBus.on('selection:cleared', () => {
      setSelectedNodes(bigtop.getSelectedNodes());
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
      unsubSelection();
      unsubDeselection();
      unsubConnectionCreated();
      unsubConnectionDeleted();
    };
  }, [bigtop]);

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    bigtop.addNodeByType(type as any, position);
  }, [bigtop]);

  const removeNode = useCallback((nodeId: string) => {
    bigtop.removeNode(nodeId);
  }, [bigtop]);

  const moveNode = useCallback((nodeId: string, position: { x: number; y: number }) => {
    bigtop.moveNode(nodeId, position);
  }, [bigtop]);

  const connect = useCallback((
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
  ) => {
    bigtop.startConnection(sourceNodeId, sourcePortId);
    bigtop.completeConnection(targetNodeId, targetPortId);
  }, [bigtop]);

  const disconnect = useCallback((connectionId: string) => {
    bigtop.removeConnection(connectionId);
  }, [bigtop]);

  const selectNode = useCallback((nodeId: string, addToSelection = false) => {
    bigtop.selectNode(nodeId, addToSelection);
  }, [bigtop]);

  const deselectAll = useCallback(() => {
    bigtop.deselectAll();
  }, [bigtop]);

  const deleteSelected = useCallback(() => {
    bigtop.deleteSelected();
  }, [bigtop]);

  const zoomIn = useCallback(() => {
    bigtop.zoomIn();
  }, [bigtop]);

  const zoomOut = useCallback(() => {
    bigtop.zoomOut();
  }, [bigtop]);

  const fitToContent = useCallback(() => {
    bigtop.fitToContent();
  }, [bigtop]);

  const resetView = useCallback(() => {
    bigtop.resetView();
  }, [bigtop]);

  const exportData = useCallback(() => {
    return bigtop.export();
  }, [bigtop]);

  const importData = useCallback((data: any) => {
    bigtop.import(data);
  }, [bigtop]);

  const clear = useCallback(() => {
    bigtop.clear();
  }, [bigtop]);

  return {
    bigtop,
    nodes,
    connections,
    viewport,
    selectedNodes,
    addNode,
    removeNode,
    moveNode,
    connect,
    disconnect,
    selectNode,
    deselectAll,
    deleteSelected,
    zoomIn,
    zoomOut,
    fitToContent,
    resetView,
    export: exportData,
    import: importData,
    clear,
  };
}

export default useBigTop;
