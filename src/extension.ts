import * as vscode from 'vscode';
import axios from 'axios';
import { ChatHistory } from './chatHistory';
import { builtinModules } from 'module'

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
    console.log('Activating extension...');
    const chatHistory = new ChatHistory(context);

    console.log('ChatHistory instance created.');

    context.subscriptions.push(
        vscode.commands.registerCommand('ottollama.start', () => startChat(context, chatHistory))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ottollama.newChat', () => {
            console.log('New chat command executed');
            startChat(context, chatHistory, undefined); // chatId parametresini boş olarak geçiriyoruz
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ottollama.switchChat', (chatId: string) => {
            console.log('Switch chat command executed with chatId:', chatId);
            startChat(context, chatHistory, chatId);
        })
    );

    // Log the chat IDs on activation
    const chatIds = chatHistory.getAllChatIds();
    console.log('Chat IDs on activation:', chatIds);
}

async function startChat(context: vscode.ExtensionContext, chatHistory: ChatHistory, chatId?: string) {
    chatId = chatId || `chat-${Date.now()}`;
    const panel = vscode.window.createWebviewPanel(
        'modelSelector',
        'Model Selector',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],
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
        panel.webview.html = getWebviewContent(panel, context, modelOptions, defaultBaseUrl, chatHistory.getChatHistory(chatId));

        panel.webview.onDidReceiveMessage(async (message: OllamaMessage) => {
            await handleWebviewMessage(chatId!, message, panel, chatHistory, defaultBaseUrl);
        });

        panel.onDidDispose(() => {
            delete panels[chatId!];
        });

        updateHistoryPanel(panel, chatHistory);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to fetch models: ${errorMessage}`);
    }
}

function updateHistoryPanel(panel: vscode.WebviewPanel, chatHistory: ChatHistory) {
    const chatIds = chatHistory.getAllChatIds();
    const historyHtml = chatIds.map(chatId => `
        <div class="chat-history-item" data-chat-id="${chatId}">
            <span>${chatId}</span>
            <button class="delete-chat-button" data-chat-id="${chatId}">Delete</button>
        </div>
    `).join('');

    panel.webview.postMessage({
        type: 'updateHistoryPanel',
        historyHtml: historyHtml
    });
}

function getWebviewContent(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, modelOptions: string, defaultBaseUrl: string, chatHistory: ChatMessage[]): string {
    const cssPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'styles.css');
    const cssUri = panel.webview.asWebviewUri(cssPath);

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
    <link href="${cssUri}" rel="stylesheet">
</head>
<body>
    <div class="navbar">
        <div class="navbar-left">
            <button class="icon-button" id="chatHistoryButton">History</button>
            <button class="icon-button" id="newChatButton">+</button>
        </div>
        <label for="baseUrlInput">Base URL:<input type="text" id="baseUrlInput" value="${defaultBaseUrl}"></label>
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
    <div class="history-panel" id="chatHistoryDiv">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px;">
            <h3>Chat History</h3>
            <button class="icon-button" id="closeHistoryButton">✖</button> 
        </div>
        <div id="historyContainer"></div>
    </div>

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
            } else if (message.type === 'updateHistoryPanel') {
                const historyContainer = document.getElementById('historyContainer');
                historyContainer.innerHTML = message.historyHtml;
                historyContainer.querySelectorAll('.chat-history-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const chatId = item.getAttribute('data-chat-id');
                        vscode.postMessage({ command: 'ottollama.switchChat', chatId: chatId });
                    });
                });
                historyContainer.querySelectorAll('.delete-chat-button').forEach(button => {
                    button.addEventListener('click', (event) => {
                        event.stopPropagation();
                        const chatId = button.getAttribute('data-chat-id');
                        vscode.postMessage({ command: 'deleteChat', chatId: chatId });
                    });
                });
            } else if (message.type === 'loadChatHistory') {
                const chatMessagesContainer = document.querySelector('.chat-messages');
                chatMessagesContainer.innerHTML = message.history.map(msg => \`
                    <div class="message \${msg.role}">
                        <div class="text">\${msg.content}</div>
                    </div>
                \`).join('');
            } else if (message.type === 'chatDeleted') {
                const chatHistoryDiv = document.getElementById('chatHistoryDiv');
                const chatItem = chatHistoryDiv.querySelector(\`.chat-history-item[data-chat-id="\${message.chatId}"]\`);
                if (chatItem) {
                    chatItem.remove();
                }
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
    } else if (message.command === 'deleteChat') {
        console.log(`Delete chat command received for chatId: ${chatId}`);
        vscode.window.showInformationMessage(`Deleting chat: ${chatId}`);
        try {
            await chatHistory.deleteChat(chatId);
            console.log(`Chat ${chatId} deleted`);
            updateHistoryPanel(panel, chatHistory);
            panel.webview.postMessage({
                type: 'chatDeleted',
                chatId: chatId
            });
        } catch (error) {
            console.error(`Failed to delete chat ${chatId}`, error);
            vscode.window.showErrorMessage(`Failed to delete chat: ${chatId}`);
        }
    }
}

export function deactivate() {
    Object.values(panels).forEach(panel => panel.dispose());
    panels = {};
}