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
if (!newChatButton) {
    console.error('New Chat Button not found');
} else {
    newChatButton.addEventListener('click', () => {
        console.log('New chat button clicked');
        vscode.postMessage({ command: 'ottollama.newChat', chatId: undefined });
    });
}

const chatHistoryButton = document.getElementById('chatHistoryButton');
chatHistoryButton.addEventListener('click', () => {
    const chatHistoryDiv = document.getElementById('chatHistoryDiv');
    chatHistoryDiv.style.display = chatHistoryDiv.style.display === 'none' ? 'block' : 'none';
});

const closeHistoryButton = document.getElementById('closeHistoryButton');
closeHistoryButton.addEventListener('click', () => {
    const chatHistoryDiv = document.getElementById('chatHistoryDiv');
    chatHistoryDiv.style.display = 'none';
});

window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'userMessage') {
        const chatMessagesContainer = document.querySelector('.chat-messages');
        const newMessageHtml = `
            <div class="message user">
                <div class="text">${message.text}</div>
            </div>
        `;
        chatMessagesContainer.innerHTML = newMessageHtml + chatMessagesContainer.innerHTML;
    } else if (message.type === 'response') {
        const chatMessagesContainer = document.querySelector('.chat-messages');
        const newMessageHtml = `
            <div class="message assistant">
                <div class="text">${message.text}</div>
            </div>
        `;
        chatMessagesContainer.innerHTML = newMessageHtml + chatMessagesContainer.innerHTML;
        document.getElementById('promptInput').value = '';
    } else if (message.type === 'error') {
        document.getElementById('responseArea').innerText = 'Error: ' + message.text;
    } else if (message.type === 'loadingState') {
        setLoadingState(message.isLoading);
    }
});

window.onload = () => {
    setLoadingState(false);
};
