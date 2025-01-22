function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

const vscode = acquireVsCodeApi();

function setLoadingState(isLoading) {
    const sendButton = document.getElementById('sendButton');
    if (isLoading) {
        // Butonu yükleme durumuna geçir (nokta animasyonu)
        sendButton.innerHTML = '<span class="icon loading-icon">●</span>';
        sendButton.disabled = true;
    } else {
        // Butonu eski haline getir (ok simgesi)
        sendButton.innerHTML = '<span class="icon">➔</span>';
        sendButton.disabled = false;
    }
}

function sendMessage() {
    const baseUrl = document.getElementById('baseUrlInput').value;
    const model = document.getElementById('modelSelect').value;
    const prompt = document.getElementById('promptInput').value;

    // Yükleme durumuna geç
    setLoadingState(true);

    vscode.postMessage({ command: 'sendPrompt', baseUrl, model, text: prompt });
}

document.getElementById('sendButton').addEventListener('click', sendMessage);

document.getElementById('promptInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Enter tuşunun varsayılan işlevini engelle
        sendMessage();
    }
});

window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'response') {
        const responseArea = document.getElementById('responseArea');
        const newMessage = document.createElement('div');
        newMessage.innerText = `Model: ${message.model}\nResponse: ${message.text}`;
        responseArea.appendChild(newMessage);
    } else if (message.type === 'error') {
        const responseArea = document.getElementById('responseArea');
        const newMessage = document.createElement('div');
        newMessage.innerText = `Error: ${message.text}`;
        responseArea.appendChild(newMessage);
    } else if (message.type === 'clearInput') {
        document.getElementById('promptInput').value = '';
    }

    // Yükleme durumundan çık
    setLoadingState(false);
});

// Sayfa yüklendiğinde ok simgesini göster
window.onload = () => {
    setLoadingState(false);
};
