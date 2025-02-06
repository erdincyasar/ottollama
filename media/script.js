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
    });
} else {
    console.error('New Chat Button not found');
}

const chatHistoryButton = document.getElementById('chatHistoryButton');
if (chatHistoryButton) {
    chatHistoryButton.addEventListener('click', () => {
        const chatHistoryDiv = document.getElementById('chatHistoryDiv');
        chatHistoryDiv.style.display = chatHistoryDiv.style.display === 'none' ? 'block' : 'none';
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
    } 
});

window.onload = () => {
    setLoadingState(false);
};
