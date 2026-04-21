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

async function loadPaths() {
    try {
        const response = await fetch(`/api/paths?user_id=${userId}`);
        const paths = await response.json();
        renderPaths(paths);
    } catch (error) {
        console.error('Error loading paths:', error);
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
        paths.forEach(path => {
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
                toggleWalked(path);
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
        </div>
    `;
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
