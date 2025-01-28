import * as vscode from 'vscode';
import axios from 'axios';

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
    context.subscriptions.push(
        vscode.commands.registerCommand('ottollama.start', () => startChat(context))
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ottollama.newChat', () => {
            console.log('New chat command executed');
            startChat(context, undefined);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('ottollama.switchChat', (chatId: string) => {
            console.log('Switch chat command executed with chatId:', chatId);
            startChat(context, chatId);
        })
    );
}

async function startChat(context: vscode.ExtensionContext, chatId?: string) {
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
        panel.webview.html = getWebviewContent(panel, context, modelOptions, defaultBaseUrl);

        panel.webview.onDidReceiveMessage(async (message: OllamaMessage) => {
            await handleWebviewMessage(chatId!, message, panel, defaultBaseUrl);
        });

        panel.onDidDispose(() => {
            delete panels[chatId!];
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to fetch models: ${errorMessage}`);
    }
}

function getWebviewContent(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, modelOptions: string, defaultBaseUrl: string): string {
    const cssPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'styles.css');
    const cssUri = panel.webview.asWebviewUri(cssPath);
    const scriptPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'script.js');
    const scriptUri = panel.webview.asWebviewUri(scriptPath);

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

    <script src="${scriptUri}"></script>
</body>
</html>
    `;
}

async function handleWebviewMessage(chatId: string, message: OllamaMessage, panel: vscode.WebviewPanel, defaultBaseUrl: string) {
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
    }
}

export function deactivate() {
    Object.values(panels).forEach(panel => panel.dispose());
    panels = {};
}