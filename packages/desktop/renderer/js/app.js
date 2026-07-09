/**
 * LocalCircus Desktop - Renderer
 */

// State
let currentView = 'home';
let isChatOpen = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎪 LocalCircus Desktop initializing...');
  
  await loadStatus();
  setupNavigation();
  setupChat();
  setupNotifications();
  setupQuickActions();
  setupForge();
  
  console.log('✓ LocalCircus Desktop ready!');
});

// Load system status
async function loadStatus() {
  try {
    if (window.localcircus) {
      const status = await window.localcircus.getStatus();
      updateStatusDisplay(status);
    }
  } catch (error) {
    console.error('Failed to load status:', error);
  }
}

function updateStatusDisplay(status) {
  if (!status) return;
  
  document.getElementById('stat-memory').textContent = status.memory?.working || 0;
  document.getElementById('stat-tasks').textContent = status.scheduler?.totalTasks || 0;
  document.getElementById('status-text').textContent = status.status === 'healthy' ? 'Online' : 'Offline';
}

// Navigation
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      if (view) {
        switchView(view);
        
        // Update active state
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });
}

function switchView(viewId) {
  currentView = viewId;
  
  // Update views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  document.getElementById(`${viewId}-view`)?.classList.add('active');
  
  // Update title
  const titles = {
    home: 'Home',
    zoo: 'Artifact Zoo',
    forge: 'Artifact Forge',
    workflows: 'Workflows',
    canvas: 'Big Top Canvas',
    codex: 'Codex'
  };
  document.getElementById('view-title').textContent = titles[viewId] || viewId;
}

// Chat
function setupChat() {
  const chatPanel = document.getElementById('chat-panel');
  const chatClose = document.getElementById('chat-close');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  
  // Open chat with button click
  document.addEventListener('keydown', (e) => {
    if (e.key === 'b' && e.metaKey) {
      e.preventDefault();
      toggleChat();
    }
  });
  
  chatClose?.addEventListener('click', () => {
    chatPanel.classList.remove('open');
    isChatOpen = false;
  });
  
  chatSend?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

function toggleChat() {
  const chatPanel = document.getElementById('chat-panel');
  isChatOpen = !isChatOpen;
  chatPanel?.classList.toggle('open', isChatOpen);
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  
  const text = input?.value.trim();
  if (!text) return;
  
  // Add user message
  addMessage('user', text);
  input.value = '';
  
  // Simulate response
  setTimeout(() => {
    addMessage('system', getAIResponse(text));
  }, 500);
}

function addMessage(type, text) {
  const messages = document.getElementById('chat-messages');
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.innerHTML = `<p>${escapeHtml(text)}</p>`;
  messages?.appendChild(message);
  messages?.scrollTo(0, messages.scrollHeight);
}

function getAIResponse(input) {
  const lower = input.toLowerCase();
  
  if (lower.includes('help')) {
    return "I can help you with: browsing artifacts (Zoo), creating new artifacts (Forge), managing workflows, and searching through memories. What would you like to do?";
  }
  if (lower.includes('artifact') || lower.includes('create')) {
    return "To create an artifact, go to the Forge section. Select the artifact type, give it a name, and describe what it should do. I'll help you generate the artifact DNA!";
  }
  if (lower.includes('workflow')) {
    return "Workflows let you automate repetitive tasks. Check the Workflows section to see existing ones or create new ones!";
  }
  if (lower.includes('memory') || lower.includes('remember')) {
    return "I can remember things for you! Just tell me what to store and I'll save it to your local memory store.";
  }
  
  return "I'm here to help you create amazing things! Try asking about artifacts, workflows, or memories.";
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Notifications
function setupNotifications() {
  const btn = document.getElementById('notifications-btn');
  const panel = document.getElementById('notifications-panel');
  const close = document.getElementById('notifications-close');
  
  btn?.addEventListener('click', () => {
    panel?.classList.toggle('hidden');
  });
  
  close?.addEventListener('click', () => {
    panel?.classList.add('hidden');
  });
}

// Quick Actions
function setupQuickActions() {
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      switch (action) {
        case 'browse':
          switchView('zoo');
          document.querySelector('[data-view="zoo"]')?.classList.add('active');
          break;
        case 'create':
          switchView('forge');
          document.querySelector('[data-view="forge"]')?.classList.add('active');
          break;
        case 'workflow':
          switchView('workflows');
          document.querySelector('[data-view="workflows"]')?.classList.add('active');
          break;
      }
    });
  });
}

// Forge
function setupForge() {
  const createBtn = document.getElementById('forge-create');
  
  createBtn?.addEventListener('click', async () => {
    const type = document.getElementById('artifact-type')?.value;
    const name = document.getElementById('artifact-name')?.value;
    const desc = document.getElementById('artifact-desc')?.value;
    
    if (!name) {
      alert('Please enter a name for your artifact');
      return;
    }
    
    createBtn.textContent = '✨ Creating...';
    createBtn.disabled = true;
    
    // Simulate artifact creation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Store in memory if available
    if (window.localcircus) {
      await window.localcircus.memory.set(`artifact:${name}`, {
        type,
        name,
        description: desc,
        createdAt: Date.now()
      });
    }
    
    createBtn.textContent = '✓ Created!';
    setTimeout(() => {
      createBtn.textContent = '✨ Create Artifact';
      createBtn.disabled = false;
    }, 2000);
    
    // Clear form
    document.getElementById('artifact-name').value = '';
    document.getElementById('artifact-desc').value = '';
  });
}

// Listen for IPC events
if (window.localcircus) {
  window.localcircus.on('action', (data) => {
    switchView(data);
    document.querySelector(`[data-view="${data}"]`)?.classList.add('active');
  });
}
