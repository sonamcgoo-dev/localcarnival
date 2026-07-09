/**
 * Web Commands
 * 
 * Web server and UI commands.
 */

import chalk from 'chalk';
import http from 'http';
import { createBigTop } from '@localcircus/bigtop';

export function createWebCommands(program: any) {
  const web = program.command('web').description('Web UI commands');

  // Start web UI
  web
    .command('start')
    .description('Start the Big Top web UI')
    .option('-p, --port <port>', 'Port to listen on', '3000')
    .option('-h, --host <host>', 'Host to bind to', 'localhost')
    .action(async (options: any) => {
      const port = parseInt(options.port);
      const host = options.host;

      console.log(chalk.blue(`\n🎪 Starting LocalCircus Big Top UI...\n`));
      console.log(`  Host: ${chalk.cyan(host)}`);
      console.log(`  Port: ${chalk.cyan(port.toString())}`);
      console.log(`  URL:  ${chalk.underline(`http://${host}:${port}`)}`);
      console.log('');

      // Create Big Top instance
      const bigtop = createBigTop('demo');

      // Add some example nodes
      bigtop.addNodeByType('trigger', { x: 100, y: 200 });
      bigtop.addNodeByType('action', { x: 350, y: 200 });
      bigtop.addNodeByType('output', { x: 600, y: 200 });

      // Create simple HTML UI
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LocalCircus Big Top</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0f0f1a; color: #fff; }
    
    .app {
      display: flex;
      height: 100vh;
    }
    
    .sidebar {
      width: 60px;
      background: #1a1a2e;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-right: 1px solid #2a2a4e;
    }
    
    .sidebar-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #2a2a4e;
      border: 1px solid #4a4a7e;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.2s;
    }
    
    .sidebar-btn:hover { background: #3a3a5e; }
    .sidebar-btn.active { background: #6366f1; border-color: #818cf8; }
    
    .canvas-container {
      flex: 1;
      position: relative;
      overflow: hidden;
    }
    
    .canvas {
      position: absolute;
      inset: 0;
      background: #1a1a2e;
    }
    
    .node {
      position: absolute;
      min-width: 180px;
      background: #2a2a4e;
      border: 2px solid #4a4a7e;
      border-radius: 8px;
      padding: 12px;
      cursor: move;
      user-select: none;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    
    .node.selected {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
    }
    
    .node-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .node-icon { font-size: 16px; }
    .node-name { font-size: 14px; font-weight: 600; }
    
    .ports {
      display: flex;
      justify-content: space-between;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 8px 0;
    }
    
    .port {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid #fff;
      cursor: crosshair;
    }
    
    .port.input { background: #6366f1; }
    .port.output { background: #10b981; }
    
    .connections {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: visible;
    }
    
    .connection {
      fill: none;
      stroke: #6366f1;
      stroke-width: 2;
    }
    
    .grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 20px 20px;
      pointer-events: none;
    }
    
    .zoom-indicator {
      position: absolute;
      bottom: 16px;
      right: 16px;
      background: rgba(0,0,0,0.6);
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
    }
    
    .toolbar {
      position: absolute;
      top: 16px;
      left: 16px;
      display: flex;
      gap: 8px;
    }
    
    .toolbar-group {
      display: flex;
      gap: 4px;
      padding: 8px;
      background: #1a1a2e;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    
    .tool-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #2a2a4e;
      border: 1px solid #4a4a7e;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      color: #fff;
      transition: background 0.2s;
    }
    
    .tool-btn:hover { background: #3a3a5e; }
    
    .status {
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: #1a1a2e;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="sidebar">
      <button class="sidebar-btn active" title="Select">⊹</button>
      <button class="sidebar-btn" title="Pan">✋</button>
      <div style="flex: 1;"></div>
      <button class="sidebar-btn" title="Settings">⚙</button>
    </div>
    
    <div class="canvas-container">
      <div class="grid"></div>
      
      <div class="toolbar">
        <div class="toolbar-group">
          <button class="tool-btn" onclick="zoomIn()" title="Zoom In">+</button>
          <button class="tool-btn" onclick="zoomOut()" title="Zoom Out">−</button>
          <button class="tool-btn" onclick="fitToContent()" title="Fit">⊡</button>
        </div>
        <div class="toolbar-group">
          <button class="tool-btn" onclick="addNode('trigger')" title="Add Trigger">🚀</button>
          <button class="tool-btn" onclick="addNode('action')" title="Add Action">⚡</button>
          <button class="tool-btn" onclick="addNode('output')" title="Add Output">📤</button>
        </div>
      </div>
      
      <div class="canvas" id="canvas">
        <svg class="connections" id="connections"></svg>
        ${bigtop.getNodes().getAllNodes().map(n => `
          <div class="node" id="node-${n.id}" style="left:${n.position.x}px;top:${n.position.y}px;">
            <div class="node-header">
              <span class="node-icon">${getNodeIcon(n.type)}</span>
              <span class="node-name">${n.name}</span>
            </div>
            <div class="ports">
              <div class="port input"></div>
              <div class="port output"></div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="zoom-indicator" id="zoom">100%</div>
      <div class="status" id="status">${bigtop.getNodes().getAllNodes().length} nodes • ${bigtop.getConnections().getConnectionCount()} connections</div>
    </div>
  </div>

  <script>
    let zoom = 1;
    let offset = { x: 0, y: 0 };
    let isDragging = false;
    let isPanning = false;
    let draggedNode = null;
    let dragOffset = { x: 0, y: 0 };
    let selectedNode = null;

    const canvas = document.getElementById('canvas');
    const connections = document.getElementById('connections');

    function zoomIn() {
      zoom = Math.min(4, zoom * 1.2);
      updateTransform();
    }

    function zoomOut() {
      zoom = Math.max(0.1, zoom / 1.2);
      updateTransform();
    }

    function fitToContent() {
      zoom = 1;
      offset = { x: 0, y: 0 };
      updateTransform();
    }

    function updateTransform() {
      canvas.style.transform = \`translate(\${offset.x}px, \${offset.y}px) scale(\${zoom})\`;
      connections.style.transform = \`translate(\${offset.x}px, \${offset.y}px) scale(\${zoom})\`;
      document.getElementById('zoom').textContent = Math.round(zoom * 100) + '%';
    }

    function addNode(type) {
      const icons = { trigger: '🚀', input: '📥', output: '📤', action: '⚡', transform: '🔄', condition: '🔀', loop: '🔁', function: '📜' };
      const node = document.createElement('div');
      node.className = 'node';
      node.id = 'node-' + Date.now();
      node.style.left = (300 + Math.random() * 200) + 'px';
      node.style.top = (200 + Math.random() * 200) + 'px';
      node.innerHTML = \`
        <div class="node-header">
          <span class="node-icon">\${icons[type] || '📦'}</span>
          <span class="node-name">\${type}</span>
        </div>
        <div class="ports">
          <div class="port input"></div>
          <div class="port output"></div>
        </div>
      \`;
      
      node.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('port')) return;
        draggedNode = node;
        const rect = node.getBoundingClientRect();
        dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        node.classList.add('selected');
      });
      
      canvas.appendChild(node);
      updateStatus();
    }

    canvas.addEventListener('mousedown', (e) => {
      if (e.target === canvas || e.target.classList.contains('grid')) {
        isPanning = true;
        selectedNode = null;
        document.querySelectorAll('.node.selected').forEach(n => n.classList.remove('selected'));
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isPanning) {
        offset.x += e.movementX;
        offset.y += e.movementY;
        updateTransform();
      }
      if (draggedNode) {
        const canvasRect = canvas.getBoundingClientRect();
        draggedNode.style.left = ((e.clientX - canvasRect.left - offset.x) / zoom - dragOffset.x) + 'px';
        draggedNode.style.top = ((e.clientY - canvasRect.top - offset.y) / zoom - dragOffset.y) + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      isPanning = false;
      draggedNode = null;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      zoom = Math.max(0.1, Math.min(4, zoom * (1 + delta * 0.1)));
      updateTransform();
    });

    function updateStatus() {
      const nodeCount = document.querySelectorAll('.node').length;
      document.getElementById('status').textContent = nodeCount + ' nodes';
    }
  </script>
</body>
</html>`;

      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      });

      server.listen(port, host, () => {
        console.log(chalk.green('✓ Server running!'));
        console.log(chalk.gray(`\nPress Ctrl+C to stop\n`));
      });
    });

  return web;
}

function getNodeIcon(type: string): string {
  const icons: Record<string, string> = {
    trigger: '🚀',
    input: '📥',
    output: '📤',
    action: '⚡',
    transform: '🔄',
    condition: '🔀',
    loop: '🔁',
    function: '📜',
  };
  return icons[type] || '📦';
}
