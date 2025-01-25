"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const chatHistory_1 = require("./chatHistory");
let panels = {};
// Modularize the activation function
function activate(context) {
    const chatHistory = new chatHistory_1.ChatHistory(context);
    context.subscriptions.push(vscode.commands.registerCommand('ottollama.start', () => startChat(context, chatHistory)));
    context.subscriptions.push(vscode.commands.registerCommand('ottollama.newChat', () => {
        console.log('New chat command executed');
        startChat(context, chatHistory, undefined); // chatId parametresini boş olarak geçiriyoruz
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ottollama.switchChat', (chatId) => {
        console.log('Switch chat command executed with chatId:', chatId);
        startChat(context, chatHistory, chatId);
    }));
}
exports.activate = activate;
function startChat(context, chatHistory, chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        chatId = chatId || `chat-${Date.now()}`;
        const panel = vscode.window.createWebviewPanel('modelSelector', 'Model Selector', vscode.ViewColumn.Beside, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],
        });
        panels[chatId] = panel;
        const defaultBaseUrl = 'http://localhost:11434';
        try {
            const response = yield axios_1.default.get(`${defaultBaseUrl}/api/tags`);
            const models = response.data.models;
            if (!Array.isArray(models)) {
                throw new Error('API response is not an array');
            }
            const modelOptions = models.map((model) => `<option value="${model.model}">${model.name}</option>`).join('');
            panel.webview.html = getWebviewContent(panel, context, modelOptions, defaultBaseUrl, chatHistory.getChatHistory(chatId));
            panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
                yield handleWebviewMessage(chatId, message, panel, chatHistory, defaultBaseUrl);
            }));
            panel.onDidDispose(() => {
                delete panels[chatId];
            });
            updateHistoryDropdown(panel, chatHistory);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Failed to fetch models: ${errorMessage}`);
        }
    });
}
function updateHistoryDropdown(panel, chatHistory) {
    const chatIds = chatHistory.getAllChatIds();
    panel.webview.postMessage({
        type: 'updateHistory',
        history: chatIds
    });
}
function getWebviewContent(panel, context, modelOptions, defaultBaseUrl, chatHistory) {
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

        const newChatButton = document.getElementById('newChatButton');
        if (!newChatButton) {
            console.error('New Chat Button not found');
        } else {
            newChatButton.addEventListener('click', () => {
                console.log('New chat button clicked');
                vscode.postMessage({ command: 'ottollama.newChat', chatId: undefined });
            });
        }


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
function handleWebviewMessage(chatId, message, panel, chatHistory, defaultBaseUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const baseUrl = message.baseUrl || defaultBaseUrl;
        if (message.command === 'sendPrompt') {
            try {
                const userMessage = {
                    role: 'user',
                    content: message.text || '',
                    model: message.model,
                    title: 'User Message',
                    timestamp: new Date().toISOString()
                };
                yield chatHistory.addMessage(chatId, userMessage);
                panel.webview.postMessage({
                    type: 'userMessage',
                    text: userMessage.content,
                    model: userMessage.model
                });
                const response = yield axios_1.default.post(`${baseUrl}/api/chat`, {
                    model: message.model,
                    messages: [{ role: 'user', content: message.text }],
                    stream: false
                });
                const assistantMessage = {
                    role: 'assistant',
                    content: response.data.message.content,
                    model: response.data.model,
                    title: 'Assistant Response',
                    timestamp: new Date().toISOString()
                };
                yield chatHistory.addMessage(chatId, assistantMessage);
                panel.webview.postMessage({
                    type: 'response',
                    text: assistantMessage.content,
                    model: assistantMessage.model
                });
                panel.webview.postMessage({
                    type: 'clearInput'
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                if (panel) {
                    panel.webview.postMessage({
                        type: 'error',
                        text: errorMessage
                    });
                }
            }
            finally {
                panel.webview.postMessage({
                    type: 'loadingState',
                    isLoading: false
                });
            }
        }
        else if (message.command === 'loadChatHistory') {
            const history = chatHistory.getChatHistory(chatId);
            panel.webview.postMessage({
                type: 'loadChatHistory',
                history: history
            });
        }
    });
}
function deactivate() {
    Object.values(panels).forEach(panel => panel.dispose());
    panels = {};
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map