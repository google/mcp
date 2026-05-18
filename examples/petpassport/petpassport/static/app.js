const userId = 'demo-user';
let sessionId = 'session-' + Math.random().toString(36).substring(2, 11);
const appName = 'agent';
let isSending = false;

const chatMessages = document.getElementById('chat-messages');
const pathsList = document.getElementById('paths-list');
const chatContainer = document.getElementById('chat-container');
const detailsContainer = document.getElementById('details-container');
const detailsContent = document.getElementById('details-content');
const backBtn = document.getElementById('back-btn');

// Interactive Selector Setup
let selectedBreed = 'Golden Retriever';
let selectedLocation = 'Central Park (10024)';
let selectedPrefs = [];

// Breed Toggling
const breedButtons = document.querySelectorAll('#breed-control .segment-btn');
breedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        breedButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedBreed = btn.getAttribute('data-value');
    });
});

// Location Toggling
const locationButtons = document.querySelectorAll('#location-control .segment-btn');
locationButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        locationButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedLocation = btn.getAttribute('data-value');
    });
});

// Preferences Pill Toggling
const pillButtons = document.querySelectorAll('#prefs-control .pill-btn');
pillButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const val = btn.getAttribute('data-value');
        if (btn.classList.contains('active')) {
            if (!selectedPrefs.includes(val)) selectedPrefs.push(val);
        } else {
            selectedPrefs = selectedPrefs.filter(p => p !== val);
        }
    });
});

// Optional Photo Upload Handling
const petImageInput = document.getElementById('pet-image');
const uploadLabel = document.getElementById('upload-label');
if (petImageInput && uploadLabel) {
    petImageInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
            uploadLabel.textContent = '✅ Dog Photo Selected';
            uploadLabel.classList.add('uploaded');
        } else {
            uploadLabel.textContent = '📸 Upload Dog Photo (Optional)';
            uploadLabel.classList.remove('uploaded');
        }
    });
}

// Walk Trigger
const walkBtn = document.getElementById('walk-btn');
if (walkBtn) {
    walkBtn.addEventListener('click', startWalkProcess);
}

const selectorCard = document.getElementById('selector-card');
const selectorToggleBtn = document.getElementById('selector-toggle-btn');
if (selectorToggleBtn && selectorCard) {
    selectorToggleBtn.addEventListener('click', () => {
        selectorCard.classList.toggle('collapsed');
    });
}

// Load initial paths on startup
loadPaths();

const newWalkBtn = document.getElementById('new-walk-btn');
if (newWalkBtn) {
    newWalkBtn.addEventListener('click', resetSession);
}

const clearAllBtn = document.getElementById('clear-all-btn');
if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllPaths);
}

async function loadPaths() {
    try {
        const response = await fetch(`/api/paths?user_id=${userId}`);
        const paths = await response.json();
        renderPaths(paths);
    } catch (error) {
        console.error('Error loading paths:', error);
    }
}

function resetSession() {
    sessionId = 'session-' + Math.random().toString(36).substring(2, 11);
    
    chatMessages.innerHTML = `
        <div class="message agent">
            <div class="message-content">
                Hello! I'm the Pet Passport Agent. Tell me about your dog (breed, location) and what kind of walk you'd like to plan today!
            </div>
        </div>
    `;
    
    detailsContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    
    // Auto-expand custom walk planner card
    if (selectorCard) selectorCard.classList.remove('collapsed');
    
    // Reset selection states
    selectedBreed = 'Golden Retriever';
    selectedLocation = 'Central Park (10024)';
    selectedPrefs = [];
    
    breedButtons.forEach((b, idx) => {
        b.classList.toggle('active', idx === 0);
    });
    locationButtons.forEach((b, idx) => {
        b.classList.toggle('active', idx === 0);
    });
    pillButtons.forEach(b => {
        b.classList.remove('active');
    });
    
    if (petImageInput) petImageInput.value = '';
    if (uploadLabel) {
        uploadLabel.textContent = '📸 Upload Dog Photo (Optional)';
        uploadLabel.classList.remove('uploaded');
    }
}

async function clearAllPaths() {
    if (!confirm("Are you sure you want to delete all walking passports?")) return;
    try {
        const response = await fetch(`/api/paths?user_id=${userId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            loadPaths();
            detailsContainer.classList.add('hidden');
            chatContainer.classList.remove('hidden');
        } else {
            alert("Failed to clear paths.");
        }
    } catch (error) {
        console.error('Error clearing paths:', error);
        alert("Error clearing paths.");
    }
}

function renderPaths(paths) {
    if (typeof paths === 'string') {
        try {
            paths = JSON.parse(paths);
        } catch (e) {
            pathsList.innerHTML = `<div class="error">Error parsing paths string: ${e.message}</div>`;
            return;
        }
    }

    if (!Array.isArray(paths)) {
        pathsList.innerHTML = '<div class="error">Error: paths is not an array</div>';
        return;
    }

    if (paths.length === 0) {
        pathsList.innerHTML = '<div class="empty-state">No paths generated yet.</div>';
        return;
    }

    pathsList.innerHTML = '';
    try {
        const reversedPaths = [...paths].reverse();
        reversedPaths.forEach(path => {
            const card = document.createElement('div');
            card.className = 'path-card';
            card.innerHTML = `
                <h3>${path.breed} Walk</h3>
                <p>${path.postal_code}</p>
                <div class="path-actions">
                    <span class="walked-badge">${path.walked ? 'Walked' : 'Not Walked'}</span>
                </div>
            `;
            card.addEventListener('click', () => {
                showDetails(path);
            });
            pathsList.appendChild(card);
        });
    } catch (e) {
        console.error('Error rendering paths:', e);
        pathsList.innerHTML = `<div class="error">Error rendering paths: ${e.message}</div>`;
    }
}

function showDetails(path) {
    chatContainer.classList.add('hidden');
    detailsContainer.classList.remove('hidden');

    let imagesHtml = '';
    if (path.image_paths && path.image_paths.length > 0) {
        path.image_paths.forEach(src => {
            let url = src;
            if (url.startsWith('file:///tmp/')) {
                url = url.replace('file:///tmp/', '/tmp/');
            }
            imagesHtml += `<img src="${url}" alt="${path.breed} image" style="max-width: 300px; border-radius: 8px; margin-top: 8px;">`;
        });
    }

    detailsContent.innerHTML = `
        <h2>🐾 ${path.breed} Walk Passport 🐾</h2>
        <p><strong>Location:</strong> ${path.postal_code}</p>
        <div class="itinerary-content">
            ${processText(path.route_details)}
        </div>
        <div class="images-container">
            ${imagesHtml}
        </div>
        <div class="modal-actions">
            <span class="walked-badge">${path.walked ? 'Walked' : 'Not Walked'}</span>
            <button id="toggle-walk-status-btn" class="toggle-walk-status-btn">
                ${path.walked ? '🐾 Mark as Unwalked' : '✅ Mark as Walked'}
            </button>
        </div>
    `;

    const toggleWalkBtn = document.getElementById('toggle-walk-status-btn');
    if (toggleWalkBtn) {
        toggleWalkBtn.addEventListener('click', async () => {
            await toggleWalked(path);
            showDetails(path);
        });
    }
}

backBtn.addEventListener('click', () => {
    detailsContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
});

async function toggleWalked(path) {
    path.walked = !path.walked;
    try {
        await fetch(`/api/paths?user_id=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(path)
        });
        loadPaths();
    } catch (error) {
        console.error('Error updating path:', error);
    }
}

async function startWalkProcess() {
    if (isSending) return;
    
    // Construct structured text prompt
    let text = `I want to walk my ${selectedBreed} in ${selectedLocation}`;
    if (selectedPrefs.length > 0) {
        text += ` with: ${selectedPrefs.join(', ')}`;
    }
    text += `.`;

    const fileInput = document.getElementById('pet-image');
    const file = fileInput ? fileInput.files[0] : null;

    isSending = true;
    if (selectorCard) selectorCard.classList.add('collapsed');
    walkBtn.disabled = true;
    walkBtn.textContent = '🐾 Planning...';

    let promptText = text;

    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadResponse.json();
            promptText += ` [Pet Photo Uploaded: ${uploadData.file_path}]`;
        } catch (error) {
            console.error('Error uploading file:', error);
            appendMessage('agent', '❌ Failed to upload image. Proceeding with text only.');
        }
    }

    // Append user selected choice to message history
    appendMessage('user', `Walk my ${selectedBreed} in ${selectedLocation}` + (selectedPrefs.length > 0 ? ` with ${selectedPrefs.join(', ')}` : ''));
    
    // Reset image uploader state
    if (fileInput) fileInput.value = ''; 
    if (uploadLabel) {
        uploadLabel.textContent = '📸 Upload Dog Photo (Optional)';
        uploadLabel.classList.remove('uploaded');
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message agent thinking-bubble';
    msgDiv.innerHTML = `
        <div class="message-content">
            <div class="thinking-loader">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('/run_sse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_name: appName,
                user_id: userId,
                session_id: sessionId,
                new_message: { parts: [{ text: promptText }] },
                streaming: true
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: !done });
            const lines = buffer.split('\n');
            buffer = lines.pop(); 

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(trimmed.substring(6));
                        processEvent(data);
                    } catch (e) {
                        console.error('Failed to parse JSON line:', trimmed, e);
                    }
                }
            }
        }

        if (buffer.trim().startsWith('data: ')) {
            try {
                const data = JSON.parse(buffer.trim().substring(6));
                processEvent(data);
            } catch (e) {
                console.error('Failed to parse final buffer:', buffer, e);
            }
        }

        msgDiv.remove();
        if (currentMessageText) {
            appendMessage('agent', currentMessageText);
            currentMessageText = ''; 
        }

    } catch (error) {
        console.error('Error sending message:', error);
        msgDiv.innerHTML = '<div class="message-content">Error: Could not connect to agent.</div>';
    } finally {
        isSending = false;
        walkBtn.disabled = false;
        walkBtn.textContent = "🐾 Let's Walk! 🐾";
        loadPaths();
    }
}

let currentMessageDiv = null;
let currentMessageText = '';
let lastMessageRole = '';

function processEvent(event) {
    if (event.partial === true) {
        return; // Ignore progressive stream updates to avoid duplication
    }
    if (event.content && event.content.parts) {
        event.content.parts.forEach(part => {
            if (part.functionCall) {
                appendDebugMessage('call', part.functionCall.name, part.functionCall.args);
                return;
            }

            if (part.functionResponse) {
                const response = part.functionResponse.response;
                appendDebugMessage('result', part.functionResponse.name || 'Tool Response', response);
                return;
            }

            if (part.text) {
                currentMessageText += part.text;
            }
        });
    }
}

function appendMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.innerHTML = `<div class="message-content">${processText(text)}</div>`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
}

function processText(text) {
    if (!text) return '';
    return marked.parse(text);
}



const toolToServerMap = {
    'execute_sql_readonly': { source: 'BigQuery MCP', icon: '🗄️' },
    'search_places': { source: 'Google Maps MCP', icon: '📍' },
    'compute_routes': { source: 'Google Maps MCP', icon: '🗺️' },
    'save_pet_passport': { source: 'Local Tool', icon: '💾' },
    'generate_pet_passport_photo': { source: 'Local Tool', icon: '🎨' }
};

function appendDebugMessage(type, name, payload) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message agent-thought';
    
    const icon = type === 'call' ? '🛠️' : '📥';
    const label = type === 'call' ? 'Tool Call' : 'Tool Result';
    
    const sourceInfo = toolToServerMap[name] || { source: 'Model Context Protocol', icon: '⚡' };
    
    msgDiv.innerHTML = `
        <div class="message-content">
            <div>${icon} ${label}: <strong>${name}</strong></div>
            <div class="debug-server-info">${sourceInfo.icon} <span>${sourceInfo.source}</span></div>
            <div class="debug-bubble-meta">
                <span>inspect payload</span>
                <span class="inspect-txt">🔍 View</span>
            </div>
        </div>
    `;
    
    msgDiv.addEventListener('click', () => {
        showDebugModal(name, payload);
    });
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
}

const debugModal = document.getElementById('debug-modal');
const debugJson = document.getElementById('debug-json');
const closeDebugBtn = document.getElementById('close-debug-btn');

function syntaxHighlightJson(jsonObj) {
    let jsonStr = typeof jsonObj === 'string' ? jsonObj : JSON.stringify(jsonObj, null, 2);
    try {
        if (typeof jsonObj === 'string') {
            jsonStr = JSON.stringify(JSON.parse(jsonObj), null, 2);
        }
    } catch (e) {}
    jsonStr = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return jsonStr.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
    });
}

const mcpExplanations = {
    'execute_sql_readonly': `
        <span class="mcp-advantage-tag">Dynamic Schema Discovery</span>
        <p><strong>Standard Integration:</strong> Usually, you'd have to import the BigQuery Python SDK, authenticate using active keys, structure queries, handle raw rows parsing, and hardcode the schemas inside the LLM client.</p>
        <p><strong>The MCP Way:</strong> The client dynamically discovers the tool and the table's metadata schemas directly from the BigQuery MCP server. BigQuery execution runs entirely remotely via a standard, unified protocol message.</p>
        <div class="mcp-doc-link-container">
            <a href="https://cloud.google.com/bigquery/docs" target="_blank" class="mcp-doc-link">📖 Read BigQuery Documentation ↗</a>
        </div>
    `,
    'search_places': `
        <span class="mcp-advantage-tag">Unified Protocol Access</span>
        <p><strong>Standard Integration:</strong> Usually requires importing the Google Maps Places API SDK, configuring API clients, handling geocoding, managing API credential contexts, and parsing JSON maps structures manually.</p>
        <p><strong>The MCP Way:</strong> The Maps MCP server manages places search remotely. The agent queries it using a standardized JSON-RPC tool-call. No maps libraries or custom client geocoding glue code are imported!</p>
        <div class="mcp-doc-link-container">
            <a href="https://developers.google.com/maps/ai/code-assist" target="_blank" class="mcp-doc-link">📖 Read Google Maps MCP Docs ↗</a>
        </div>
    `,
    'compute_routes': `
        <span class="mcp-advantage-tag">Zero Client-Side Overhead</span>
        <p><strong>Standard Integration:</strong> Involves writing custom handlers to geocode origins/destinations, calling directions APIs, calculating meters to miles, and structuring formatted walk times.</p>
        <p><strong>The MCP Way:</strong> The agent leverages a standard Routes tool call. The MCP server calculates routes, distances, and walking times remotely, and passes the unified response back in seconds.</p>
        <div class="mcp-doc-link-container">
            <a href="https://developers.google.com/maps/ai/code-assist" target="_blank" class="mcp-doc-link">📖 Read Google Maps MCP Docs ↗</a>
        </div>
    `,
    'save_pet_passport': `
        <span class="mcp-advantage-tag">Dynamic Tool Register</span>
        <p><strong>Standard Integration:</strong> Custom database or profile saving APIs require hardcoded client endpoints, custom fetch scripts, and rigid server structures.</p>
        <p><strong>The MCP Way:</strong> Local custom functions (like saving details to Cloud Storage) are registered dynamically as local tools. The LLM invokes them seamlessly inside the same loop as remote GCP MCP tools.</p>
    `,
    'generate_pet_passport_photo': `
        <span class="mcp-advantage-tag">Integrated GenAI Tools</span>
        <p><strong>Standard Integration:</strong> Direct coding involves instantiating Imagen/Gemini clients, passing raw binary file data, and writing bespoke GCS upload scripts.</p>
        <p><strong>The MCP Way:</strong> Dynamically exposed as a visual tool. The agent automatically invokes it with GCS signed URLs when appropriate, blending local custom AI tools with external API tools.</p>
    `
};

function showDebugModal(title, payload) {
    if (!debugModal || !debugJson) return;
    
    const highlightedHtml = syntaxHighlightJson(payload);
    debugJson.innerHTML = highlightedHtml;
    
    const mcpExplanationEl = document.getElementById('mcp-explanation');
    if (mcpExplanationEl) {
        const key = String(title).trim();
        mcpExplanationEl.innerHTML = mcpExplanations[key] || `
            <span class="mcp-advantage-tag">Standard Protocol Tool</span>
            <p>The tool <strong>${title}</strong> was dynamically discovered and executed through the unified Model Context Protocol interface, providing clean JSON data to the agent with zero bespoke client-side code!</p>
            <div class="mcp-doc-link-container">
                <a href="https://modelcontextprotocol.io" target="_blank" class="mcp-doc-link">📖 Learn about Model Context Protocol ↗</a>
            </div>
        `;
    }
    
    debugModal.classList.remove('hidden');
}

function closeDebugModal() {
    if (debugModal) {
        debugModal.classList.add('hidden');
    }
}

if (closeDebugBtn) {
    closeDebugBtn.addEventListener('click', closeDebugModal);
}

if (debugModal) {
    debugModal.addEventListener('click', (e) => {
        if (e.target === debugModal) {
            closeDebugModal();
        }
    });
}
