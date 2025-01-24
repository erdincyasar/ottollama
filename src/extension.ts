import * as vscode from 'vscode';
import axios from 'axios';
import { ChatHistory } from './chatHistory';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    model: string;
    timestamp: string;
    title: string;
}

interface OllamaMessage {
    command: string;
    model: string;
    text?: string;
    baseUrl?: string;
}

let panels: { [key: string]: vscode.WebviewPanel } = {};

// Modularize the activation function
export function activate(context: vscode.ExtensionContext) {
    const chatHistory = new ChatHistory(context);

    context.subscriptions.push(
        vscode.commands.registerCommand('ottollama.start', () => startChat(context, chatHistory))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ottollama.newChat', () => {
            console.log('New chat command executed');
            startChat(context, chatHistory);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ottollama.switchChat', (chatId: string) => {
            console.log('Switch chat command executed with chatId:', chatId);
            startChat(context, chatHistory, chatId);
        })
    );
}

async function startChat(context: vscode.ExtensionContext, chatHistory: ChatHistory, chatId?: string) {
    chatId = chatId || `chat-${Date.now()}`;
    const panel = vscode.window.createWebviewPanel(
        'modelSelector',
        'Model Selector',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true
        }
    );

    panels[chatId] = panel;

    const defaultBaseUrl = 'http://localhost:11434';

    try {
        const response = await axios.get(`${defaultBaseUrl}/api/tags`);
        const models = response.data.models;

        if (!Array.isArray(models)) {
            throw new Error('API response is not an array');
        }

        const modelOptions = models.map((model: any) => `<option value="${model.model}">${model.name}</option>`).join('');
        panel.webview.html = getWebviewContent(context, modelOptions, defaultBaseUrl, chatHistory.getChatHistory(chatId));

        panel.webview.onDidReceiveMessage(async (message: OllamaMessage) => {
            await handleWebviewMessage(chatId!, message, panel, chatHistory, defaultBaseUrl);
        });

        panel.onDidDispose(() => {
            delete panels[chatId!];
        });

        updateHistoryDropdown(panel, chatHistory);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to fetch models: ${errorMessage}`);
    }
}

function updateHistoryDropdown(panel: vscode.WebviewPanel, chatHistory: ChatHistory) {
    const chatIds = chatHistory.getAllChatIds();
    panel.webview.postMessage({
        type: 'updateHistory',
        history: chatIds
    });
}

function getWebviewContent(context: vscode.ExtensionContext, modelOptions: string, defaultBaseUrl: string, chatHistory: ChatMessage[]): string {
    const chatMessagesHtml = chatHistory.map(message => `
        <div class="message ${message.role}">
            <div class="text">${message.content}</div>
        </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Dialog</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #1e1e2f;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: #d1d5db;
        }

        .chat-container {
            position: fixed;
            width: 100%;
            bottom: 0;
            max-height: 700px;
            background: #2c2c3e;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .chat-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            background: #1e1e2f;
            display: flex;
            flex-direction: column-reverse;
        }

        .message {
            margin-bottom: 15px;
        }

        .message.user {
            text-align: right;
        }

        .message.assistant {
            text-align: left;
        }

        .message .text {
            display: inline-block;
            padding: 10px 15px;
            border-radius: 15px;
            max-width: 70%;
        }

        .message.user .text {
            background: #4f46e5;
            color: white;
        }

        .message.assistant .text {
            background: #3c3c4f;
            color: #d1d5db;
        }

        .chat-input-container {
            background: #2c2c3e;
            border-top: 1px solid #3c3c4f;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
        }

        .chat-input {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .chat-input textarea {
            flex: 1;
            border: 1px solid #3c3c4f;
            border-radius: 5px;
            padding: 10px;
            outline: none;
            font-size: 12px;
            resize: none;
            height: 24px;
            max-height: 120px;
            background: #1e1e2f;
            color: #d1d5db;
            overflow-y: auto;
        }

        .chat-input textarea::-webkit-scrollbar {
            display: none;
        }

        .controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
        }
        .controls select {
            border: 1px solid #3c3c4f;
            border-radius: 5px;
            background: #1e1e2f;
            color: #d1d5db;
            font-size: 12px;
            padding: 5px;
            margin-left: auto;
            margin-right: 20px;
        }

        #sendButton {
            background: none;
            border: none;
            color: white;
            font-size: 25px;
            cursor: pointer;
        }

        #sendButton .icon {
            display: inline-block;
        }

        .loading-icon {
            display: inline-block;
            animation: loading 1s infinite;
            font-size: 25px;
            color: white;
        }

        @keyframes loading {
            0% {
                transform: translateX(-5px);
            }
            50% {
                transform: translateX(5px);
            }
            100% {
                transform: translateX(-5px);
            }
        }
        .navbar {
            width: 100%;
            top: 0;
            position: fixed;
            background: #2c2c3e;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            overflow: hidden;
            padding: 10px;
            font-size: small;
        }
        .navbar-left {
            display: flex;
            align-items: center;
        }
        .baseurl input {
            border: 1px solid #3c3c4f;
            border-radius: 5px;
            outline: none;
            resize: none;
            background: #1e1e2f;
            color: #d1d5db;
            overflow-y: auto;
        }
        .icon-button {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            margin-right: 10px;
        }

    </style>
</head>
<body>

        <div class="navbar">
            <div class="navbar-left">
                <button class="icon-button" id="newChatButton">+</button>
                <select id="historySelect">
                    <!-- Options for previous chats will be populated here -->
                </select>
            </div>
            <label for="baseUrlInput">Base URL:<input type="text" id="baseUrlInput" value="${defaultBaseUrl}" ></label>
        </div>
        <div class="chat-container">
            <div class="chat-messages">
                ${chatMessagesHtml}
            </div>
        <div id="responseArea"></div>
        <div class="chat-input-container">
            <div class="chat-input">
                <textarea id="promptInput" placeholder="Type your message here..." style="resize: none;" oninput="autoResize(this)"></textarea>
            </div>

            <div class="controls">
                <select id="modelSelect">
                    ${modelOptions}
                </select>
                <button id="sendButton"><span class="icon">➔</span></button>
            </div>
        </div>
    </div>

    <script>
    function autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }
    </script>
    <script>
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

        document.getElementById('newChatButton').addEventListener('click', () => {
            console.log('New chat button clicked');
            vscode.postMessage({ command: 'ottollama.newChat' });
        });

        document.getElementById('historySelect').addEventListener('change', (event) => {
            const selectedChatId = event.target.value;
            console.log('History select changed:', selectedChatId);
            vscode.postMessage({ command: 'ottollama.switchChat', chatId: selectedChatId });
        });

        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.type === 'userMessage') {
                const chatMessagesContainer = document.querySelector('.chat-messages');
                const newMessageHtml = \`
                    <div class="message user">
                        <div class="text">\${message.text}</div>
                    </div>
                \`;
                chatMessagesContainer.innerHTML = newMessageHtml + chatMessagesContainer.innerHTML;
            } else if (message.type === 'response') {
                const chatMessagesContainer = document.querySelector('.chat-messages');
                const newMessageHtml = \`
                    <div class="message assistant">
                        <div class="text">\${message.text}</div>
                    </div>
                \`;
                chatMessagesContainer.innerHTML = newMessageHtml + chatMessagesContainer.innerHTML;
                document.getElementById('promptInput').value = '';
            } else if (message.type === 'error') {
                document.getElementById('responseArea').innerText = 'Error: ' + message.text;
            } else if (message.type === 'loadingState') {
                setLoadingState(message.isLoading);
            } else if (message.type === 'updateHistory') {
                const historySelect = document.getElementById('historySelect');
                historySelect.innerHTML = message.history.map(chatId => \`
                    <option value="\${chatId}">\${chatId}</option>
                \`).join('');
            } else if (message.type === 'loadChatHistory') {
                const chatMessagesContainer = document.querySelector('.chat-messages');
                chatMessagesContainer.innerHTML = message.history.map(msg => \`
                    <div class="message \${msg.role}">
                        <div class="text">\${msg.content}</div>
                    </div>
                \`).join('');
            }
        });

        window.onload = () => {
            setLoadingState(false);
        };

    </script>
</body>

</html>
    `;
}

async function handleWebviewMessage(chatId: string, message: OllamaMessage, panel: vscode.WebviewPanel, chatHistory: ChatHistory, defaultBaseUrl: string) {
    const baseUrl = message.baseUrl || defaultBaseUrl;
    if (message.command === 'sendPrompt') {
        try {
            const userMessage: ChatMessage = {
                role: 'user',
                content: message.text || '',
                model: message.model,
                title: 'User Message',
                timestamp: new Date().toISOString()
            };
            await chatHistory.addMessage(chatId, userMessage);

            panel.webview.postMessage({
                type: 'userMessage',
                text: userMessage.content,
                model: userMessage.model
            });

            const response = await axios.post(`${baseUrl}/api/chat`, {
                model: message.model,
                messages: [{ role: 'user', content: message.text }],
                stream: false
            });

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.data.message.content,
                model: response.data.model,
                title: 'Assistant Response',
                timestamp: new Date().toISOString()
            };
            await chatHistory.addMessage(chatId, assistantMessage);

            panel.webview.postMessage({
                type: 'response',
                text: assistantMessage.content,
                model: assistantMessage.model
            });

            panel.webview.postMessage({
                type: 'clearInput'
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (panel) {
                panel.webview.postMessage({
                    type: 'error',
                    text: errorMessage
                });
            }
        } finally {
            panel.webview.postMessage({
                type: 'loadingState',
                isLoading: false
            });
        }
    } else if (message.command === 'loadChatHistory') {
        const history = chatHistory.getChatHistory(chatId);
        panel.webview.postMessage({
            type: 'loadChatHistory',
            history: history
        });
    }
}

export function deactivate() {
    Object.values(panels).forEach(panel => panel.dispose());
    panels = {};
}