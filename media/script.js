function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

const vscode = acquireVsCodeApi();

function setLoadingState(isLoading) {
    const sendButton = document.getElementById('sendButton');
    sendButton.innerHTML = isLoading ? '<span class="icon loading-icon">●</span>' : '<span class="icon">➔</span>';
    sendButton.disabled = isLoading;
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

function setupButton(buttonId, callback) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.addEventListener('click', callback);
    } else {
        console.error(`${buttonId} not found`);
    }
}

setupButton('newChatButton', () => {
    console.log('Yeni sohbet butonuna tıklandı');
    vscode.postMessage({ command: 'ottollama.newChat' });
});

setupButton('chatHistoryButton', () => {
    const chatHistoryDiv = document.getElementById('chatHistoryDiv');
    chatHistoryDiv.style.display = chatHistoryDiv.style.display === 'none' ? 'block' : 'none';
});

setupButton('closeHistoryButton', () => {
    document.getElementById('chatHistoryDiv').style.display = 'none';
});

setupButton('clearHistoryButton', () => {
    vscode.postMessage({ command: 'clearHistory' });
});

document.getElementById('showHistory')?.addEventListener('click', () => {
    vscode.postMessage({ command: 'toggleHistory' });
});

document.getElementById('startNewChat')?.addEventListener('click', () => {
    vscode.postMessage({ command: 'newChatSession' });
});


window.addEventListener('message', (event) => {
    const message = event.data;
    const chatMessagesContainer = document.querySelector('.chat-messages');
    const newMessageDiv = document.createElement('div');

    if (message.command === 'toggleHistory') {
        const chatHistoryDiv = document.getElementById('chatHistoryDiv');
        chatHistoryDiv.style.display = chatHistoryDiv.style.display === 'none' ? 'block' : 'none';
    } else if (message.type === 'userMessage' || message.type === 'response') {
        newMessageDiv.classList.add('message', message.type === 'userMessage' ? 'user' : 'assistant');
        newMessageDiv.textContent = message.text;
        chatMessagesContainer.prepend(newMessageDiv);
        if (message.type === 'response') {
            document.getElementById('promptInput').value = '';
        }
    } else if (message.type === 'error') {
        document.getElementById('responseArea').textContent = 'Error: ' + message.text;
    } else if (message.type === 'loadingState') {
        setLoadingState(message.isLoading);
    }
});

window.onload = () => setLoadingState(false);
