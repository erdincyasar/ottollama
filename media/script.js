function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

const vscode = acquireVsCodeApi();

function setLoadingState(isLoading) {
    const sendButton = document.getElementById('sendButton');
    if (isLoading) {
        sendButton.innerHTML = '<span class="icon loading-icon">●</span>';
        sendButton.disabled = true;
    } else {
        sendButton.innerHTML = '<span class="icon">➔</span>';
        sendButton.disabled = false;
    }
}

function hideWelcomeMessage() {
    const welcomeMessageDiv = document.getElementById('welcomeMessage');
    if (welcomeMessageDiv) {
        welcomeMessageDiv.style.display = 'none';
    }
}

function showWelcomeMessage() {
    const welcomeMessageDiv = document.getElementById('welcomeMessage');
    if (welcomeMessageDiv) {
        welcomeMessageDiv.style.display = 'block';
    }
}

function sendMessage() {
    const baseUrl = document.getElementById('baseUrlInput').value;
    const model = document.getElementById('modelSelect').value;
    const prompt = document.getElementById('promptInput').value;

    setLoadingState(true);
    hideWelcomeMessage();

    vscode.postMessage({ command: 'sendPrompt', baseUrl, model, text: prompt });
}

document.getElementById('promptInput').addEventListener('input', (event) => {
    autoResize(event.target);
});

document.getElementById('sendButton').addEventListener('click', sendMessage);

document.getElementById('promptInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

const newChatButton = document.getElementById('newChatButton');
if (newChatButton) {
    newChatButton.addEventListener('click', () => {
        vscode.postMessage({ command: 'ottollama.newChat' });
        document.querySelector('.chat-messages').innerHTML = '';
        document.getElementById('promptInput').value = '';
        document.getElementById('promptInput').style.height = '24px'; // Reset the height
        showWelcomeMessage();
    });
} else {
    console.error('New Chat Button not found');
}

const chatHistoryButton = document.getElementById('chatHistoryButton');
const chatHistoryDiv = document.getElementById('chatHistoryDiv');
if (chatHistoryButton) {
    chatHistoryButton.addEventListener('click', () => {
        chatHistoryDiv.style.display = chatHistoryDiv.style.display === 'block' ? 'none' : 'block';
    });
} else {
    console.error('Chat History Button not found');
}

const closeHistoryButton = document.getElementById('closeHistoryButton');
if (closeHistoryButton) {
    closeHistoryButton.addEventListener('click', () => {
        chatHistoryDiv.style.display = 'none';
    });
} else {
    console.error('Close History Button not found');
}

document.addEventListener('click', (event) => {
    if (!chatHistoryDiv.contains(event.target) && !chatHistoryButton.contains(event.target)) {
        chatHistoryDiv.style.display = 'none';
    }
});

function loadChatHistory() {
    vscode.postMessage({ command: 'loadChatHistory' });
}

function deleteChatRecord(title) {
    vscode.postMessage({ command: 'deleteChatRecord', title });
}

function loadChatRecord(title) {
    vscode.postMessage({ command: 'loadChatRecord', title });
}

function renderChatHistory(records) {
    const historyContainer = document.getElementById('historyContainer');
    historyContainer.innerHTML = '';
    records.reverse().forEach(record => {
        const recordDiv = document.createElement('div');
        recordDiv.classList.add('chat-record');
        recordDiv.innerHTML = `
            <span>${record.title}</span>
            <button onclick="deleteChatRecord('${record.title}')">&#x1F5D1;</button>
            <button onclick="loadChatRecord('${record.title}')">&#x1F504;</button>
        `;
        historyContainer.appendChild(recordDiv);
    });
}

window.addEventListener('message', (event) => {
    const message = event.data;
    const chatMessagesContainer = document.querySelector('.chat-messages');
    const promptInput = document.getElementById('promptInput');
    if (message.type === 'userMessage') {
        const newMessageDiv = document.createElement('div');
        newMessageDiv.classList.add('message', 'user');
        const textDiv = document.createElement('div');
        textDiv.classList.add('text');
        textDiv.textContent = message.text;
        newMessageDiv.appendChild(textDiv);
        chatMessagesContainer.prepend(newMessageDiv);
    } else if (message.type === 'response') {
        const newMessageDiv = document.createElement('div');
        newMessageDiv.classList.add('message', 'assistant');
        const textDiv = document.createElement('div');
        textDiv.classList.add('text');
        textDiv.textContent = message.text;
        newMessageDiv.appendChild(textDiv);
        chatMessagesContainer.prepend(newMessageDiv);
        promptInput.value = '';
        promptInput.style.height = '24px'; // Reset the height
    } else if (message.type === 'error') {
        const newMessageDiv = document.createElement('div');
        newMessageDiv.classList.add('message', 'error');
        const textDiv = document.createElement('div');
        textDiv.classList.add('text');
        textDiv.textContent = message.text;
        newMessageDiv.appendChild(textDiv);
        chatMessagesContainer.prepend(newMessageDiv);
        promptInput.value = '';
        promptInput.style.height = '24px'; // Reset the height
    } else if (message.type === 'loadingState') {
        setLoadingState(message.isLoading);
    } else if (message.type === 'chatHistory') {
        renderChatHistory(message.records);
    } else if (message.type === 'loadChatRecord') {
        chatMessagesContainer.innerHTML = '';
        message.record.messages.forEach(msg => {
            const newMessageDiv = document.createElement('div');
            newMessageDiv.classList.add('message', msg.role);
            const textDiv = document.createElement('div');
            textDiv.classList.add('text');
            textDiv.textContent = msg.content;
            newMessageDiv.appendChild(textDiv);
            chatMessagesContainer.prepend(newMessageDiv);
        });
    } else if (message.type === 'clearChat') {
        chatMessagesContainer.innerHTML = '';
        promptInput.value = '';
        promptInput.style.height = '24px'; // Reset the height
    }
});

// Load chat history on window load
window.onload = () => {
    setLoadingState(false);
    loadChatHistory();
};
