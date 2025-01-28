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

function sendMessage() {
    const baseUrl = document.getElementById('baseUrlInput').value;
    const model = document.getElementById('modelSelect').value;
    const prompt = document.getElementById('promptInput').value;

    setLoadingState(true);

    vscode.postMessage({ command: 'sendPrompt', baseUrl, model, text: prompt });
}

document.getElementById('sendButton').addEventListener('click', sendMessage);

document.getElementById('promptInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

const newChatButton = document.getElementById('newChatButton');
if (newChatButton) {
    newChatButton.addEventListener('click', () => {
        console.log('New chat button clicked'); // Debug konsoluna yazdır
        vscode.postMessage({ command: `ottollama.newChat`});
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

const closeHistoryButton = document.getElementById('closeHistoryButton');
if (closeHistoryButton) {
    closeHistoryButton.addEventListener('click', () => {
        const chatHistoryDiv = document.getElementById('chatHistoryDiv');
        chatHistoryDiv.style.display = 'none';
    });
}

window.addEventListener('message', (event) => {
    const message = event.data;
    const chatMessagesContainer = document.querySelector('.chat-messages');
    if (message.type === 'userMessage') {
        const newMessageDiv = document.createElement('div');
        newMessageDiv.classList.add('message', 'user');
        newMessageDiv.textContent = message.text;
        chatMessagesContainer.prepend(newMessageDiv);
    } else if (message.type === 'response') {
        const newMessageDiv = document.createElement('div');
        newMessageDiv.classList.add('message', 'assistant');
        newMessageDiv.textContent = message.text;
        chatMessagesContainer.prepend(newMessageDiv);
        document.getElementById('promptInput').value = '';
    } else if (message.type === 'error') {
        document.getElementById('responseArea').textContent = 'Error: ' + message.text;
    } else if (message.type === 'loadingState') {
        setLoadingState(message.isLoading);
    } 
});

window.onload = () => {
    setLoadingState(false);
};
