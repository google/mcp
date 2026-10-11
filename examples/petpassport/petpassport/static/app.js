const userId = 'demo-user';
const sessionId = 'session-' + Math.random().toString(36).substr(2, 9);
const appName = 'agent'; // File name in container

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const pathsList = document.getElementById('paths-list');
const chatContainer = document.getElementById('chat-container');
const detailsContainer = document.getElementById('details-container');
const detailsContent = document.getElementById('details-content');
const backBtn = document.getElementById('back-btn');

// Load initial paths
loadPaths();

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

const pathsById = new Map();
let openPathId = null;

async function loadPaths() {
    try {
        const response = await fetch(`/api/paths?user_id=${userId}`);
        const paths = await response.json();
        renderPaths(paths);
        if (openPathId != null && !detailsContainer.classList.contains('hidden')) {
            const updated = pathsById.get(String(openPathId));
            if (updated) refreshWalkedToggles(updated);
        }
    } catch (error) {
        console.error('Error loading paths:', error);
    }
}

function rememberPaths(paths) {
    pathsById.clear();
    paths.forEach((path) => {
        if (path && path.id != null) pathsById.set(String(path.id), path);
    });
}

function currentPath(path) {
    if (path && path.id != null && pathsById.has(String(path.id))) {
        return pathsById.get(String(path.id));
    }
    return path;
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

    rememberPaths(paths);

    if (paths.length === 0) {
        pathsList.innerHTML = '<div class="empty-state">No paths generated yet.</div>';
        return;
    }

    pathsList.innerHTML = '';
    try {
        paths.forEach(path => {
            const card = document.createElement('article');
            card.className = 'path-card';
            if (path.id != null) card.dataset.pathId = String(path.id);
            if (openPathId != null && String(path.id) === String(openPathId)) {
                card.classList.add('is-open');
            }

            const openButton = document.createElement('button');
            openButton.type = 'button';
            openButton.className = 'path-open';
            openButton.setAttribute('aria-label', `Open ${path.breed || 'pet'} walk`);

            const title = document.createElement('h3');
            title.textContent = `${path.breed || 'Pet'} Walk`;
            const place = document.createElement('p');
            place.textContent = path.postal_code || '';
            openButton.append(title, place);
            openButton.addEventListener('click', () => showDetails(currentPath(path)));

            const actions = document.createElement('div');
            actions.className = 'path-actions';
            actions.append(createWalkedToggle(path));

            card.append(openButton, actions);
            pathsList.appendChild(card);
        });
    } catch (e) {
        console.error('Error rendering paths:', e);
        pathsList.innerHTML = `<div class="error">Error rendering paths: ${e.message}</div>`;
    }
}

function createWalkedToggle(path) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'walked-toggle';
    if (path.id != null) button.dataset.pathId = String(path.id);
    syncWalkedToggle(button, path);
    button.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleWalked(currentPath(path));
    });
    return button;
}

function syncWalkedToggle(button, path) {
    const walked = Boolean(path.walked);
    button.classList.toggle('is-walked', walked);
    button.classList.toggle('is-pending', !walked);
    button.textContent = walked ? 'Walked' : 'Not walked';
    button.setAttribute('aria-pressed', String(walked));
    button.setAttribute('aria-label', walked ? 'Mark as not walked' : 'Mark as walked');
}

function refreshWalkedToggles(path) {
    if (path.id == null) return;
    document.querySelectorAll(`.walked-toggle[data-path-id="${CSS.escape(String(path.id))}"]`).forEach((button) => {
        syncWalkedToggle(button, path);
    });
}

function showDetails(path) {
    openPathId = path.id;
    document.querySelectorAll('.path-card').forEach((card) => {
        card.classList.toggle('is-open', path.id != null && card.dataset.pathId === String(path.id));
    });

    chatContainer.classList.add('hidden');
    detailsContainer.classList.remove('hidden');

    const heading = document.createElement('h2');
    heading.textContent = `🐾 ${path.breed || 'Pet'} Walk Passport 🐾`;

    const location = document.createElement('p');
    const locationLabel = document.createElement('strong');
    locationLabel.textContent = 'Location: ';
    location.append(locationLabel, document.createTextNode(path.postal_code || ''));

    const itinerary = document.createElement('div');
    itinerary.className = 'itinerary-content';
    itinerary.innerHTML = processText(path.route_details);

    const images = document.createElement('div');
    images.className = 'images-container';
    if (path.image_paths && path.image_paths.length > 0) {
        path.image_paths.forEach(src => {
            let url = src;
            if (typeof url === 'string' && url.startsWith('file:///tmp/')) {
                url = url.replace('file:///tmp/', '/tmp/');
            }
            const image = document.createElement('img');
            image.src = url;
            image.alt = `${path.breed || 'Pet'} image`;
            images.appendChild(image);
        });
    }

    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.append(createWalkedToggle(path));

    detailsContent.replaceChildren(heading, location, itinerary, images, actions);
}

backBtn.addEventListener('click', () => {
    openPathId = null;
    document.querySelectorAll('.path-card.is-open').forEach((card) => card.classList.remove('is-open'));
    detailsContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
});

const walkSavesInFlight = new Set();

async function toggleWalked(path) {
    const key = path.id != null ? String(path.id) : path;
    if (walkSavesInFlight.has(key)) return;
    walkSavesInFlight.add(key);

    const previous = Boolean(path.walked);
    path.walked = !previous;
    refreshWalkedToggles(path);
    try {
        const response = await fetch(`/api/paths?user_id=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(path)
        });
        if (!response.ok) {
            throw new Error(`Save failed (${response.status})`);
        }
    } catch (error) {
        path.walked = previous;
        refreshWalkedToggles(path);
        console.error('Error updating path:', error);
    } finally {
        walkSavesInFlight.delete(key);
    }
}

async function sendMessage() {
    const text = userInput.value.trim();
    const fileInput = document.getElementById('pet-image');
    const file = fileInput ? fileInput.files[0] : null;

    if (!text && !file) return;

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

    appendMessage('user', text || 'Uploaded an image');
    userInput.value = '';
    if (fileInput) fileInput.value = ''; // Clear file input
    const uploadLabel = document.getElementById('upload-label');
    if (uploadLabel) uploadLabel.textContent = '📎'; // Reset label

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message agent';
    msgDiv.innerHTML = '<div class="message-content">Thinking...</div>';
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

        msgDiv.remove();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.substring(6));
                        processEvent(data);
                    } catch (e) {
                        console.error('Failed to parse JSON line:', line, e);
                    }
                }
            }
        }

        // Stream is done! Display the buffered text response.
        if (currentMessageText) {
            appendMessage('agent', currentMessageText);
            currentMessageText = ''; // Reset for next message
        }

    } catch (error) {
        console.error('Error sending message:', error);
        msgDiv.innerHTML = '<div class="message-content">Error: Could not connect to agent.</div>';
    } finally {
        loadPaths();
    }
}

let currentMessageDiv = null;
let currentMessageText = '';
let lastMessageRole = '';

function processEvent(event) {
    if (event.content && event.content.parts) {
        event.content.parts.forEach(part => {
            let messageText = '';
            let role = 'agent';

            if (part.functionCall) {
                const args = JSON.stringify(part.functionCall.args);
                messageText = `🛠️ Tool Call: ${part.functionCall.name} with args: ${args}`;
                role = 'agent-thought';
                appendMessage(role, messageText);
                return;
            }

            if (part.functionResponse) {
                const response = part.functionResponse.response;
                let messageText = '📥 Tool Result: ';

                if (response && response.isError) {
                    messageText += '❌ Error: ';
                }

                if (response && response.content && Array.isArray(response.content)) {
                    const texts = response.content.filter(p => p.type === 'text').map(p => p.text);
                    messageText += texts.join(' ');
                } else if (response) {
                    messageText += JSON.stringify(response);
                } else {
                    messageText += 'Empty response';
                }

                role = 'agent-thought';
                appendMessage(role, messageText);
                return;
            }

            if (part.text) {
                const hasToolCall = event.content.parts.some(p => p.functionCall);
                role = hasToolCall ? 'agent-thought' : 'agent';
                messageText = part.text;

                if (role === 'agent-thought') {
                    appendMessage(role, messageText);
                } else {
                    // Accumulate but do NOT display
                    currentMessageText += messageText;
                }
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

document.getElementById('pet-image').addEventListener('change', function (e) {
    const label = document.getElementById('upload-label');
    if (this.files && this.files.length > 0) {
        label.textContent = '📎 File selected';
    } else {
        label.textContent = '📎';
    }
});
