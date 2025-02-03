import * as vscode from 'vscode';
import * as path from 'path';
import axios from 'axios';

const defaultBaseUrl = 'http://localhost:11434';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('Ollama Extension');
    outputChannel.show(true); // Show the output channel

    // Sidebar'ı oluştur
    const sidebarProvider = new OllamaSidebarProvider(context.extensionUri, outputChannel);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('ottollamaSidebar.chatView', sidebarProvider)
    );

    // Webview'den gelen mesajları dinle
    context.subscriptions.push(
        vscode.window.registerWebviewPanelSerializer('ottollamaSidebar.chatView', {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                webviewPanel.webview.onDidReceiveMessage(async (message) => {
                    if (message.command === 'sendPrompt') {
                        try {
                            const response = await sendChatMessage(message.baseUrl || defaultBaseUrl, message.model, message.text);
                            webviewPanel.webview.postMessage({ type: 'response', text: response.data });
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            outputChannel.appendLine(`Error sending chat message: ${errorMessage}`);
                            webviewPanel.webview.postMessage({ type: 'error', text: errorMessage });
                        }
                    }
                });
            }
        })
    );
}

async function fetchModels(baseUrl: string): Promise<any[]> {
    try {
        const response = await axios.get(`${baseUrl}/api/tags`);
        return response.data;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error fetching models: ${error.message}`);
        } else {
            throw new Error('Error fetching models');
        }
    }
}

async function sendChatMessage(baseUrl: string, model: string, text: string): Promise<any> {
    try {
        const response = await axios.post(`${baseUrl}/api/chat`, {
            model,
            messages: [{ role: 'user', content: text }],
            stream: false
        });
        return response;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Error sending chat message: ${error.message}`);
        } else {
            throw new Error('Error sending chat message');
        }
    }
}

class OllamaSidebarProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri, private readonly outputChannel: vscode.OutputChannel) {}

    async resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
        this.outputChannel.appendLine('resolveWebviewView called');
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
        };

        try {
            const models = await fetchModels(defaultBaseUrl);
            const modelOptions = models.map((model: any) => `<option value="${model.model}">${model.name}</option>`).join('');
            webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, modelOptions);
            this.outputChannel.appendLine('Webview HTML set');
        } catch (error) {
            this.outputChannel.appendLine(`Error resolving webview view: ${(error as any).message}`);
            webviewView.webview.html = `<div>Error loading models: ${(error as any).message}</div>`;
        }

        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'sendPrompt') {
                try {
                    const response = await sendChatMessage(message.baseUrl || defaultBaseUrl, message.model, message.text);
                    webviewView.webview.postMessage({ type: 'response', text: response.data });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.outputChannel.appendLine(`Error sending chat message: ${errorMessage}`);
                    webviewView.webview.postMessage({ type: 'error', text: errorMessage });
                }
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview, modelOptions: string): string {
        this.outputChannel.appendLine('Generating HTML for webview');
        // CSS ve JS dosyalarının yolunu belirle
        const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'styles.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

        // HTML içeriğini oluştur
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Chat Dialog</title>
            <link href="${cssUri}" rel="stylesheet">
            <meta name="color-scheme" content="dark light">
        </head>
        <body class="vscode-dark">
            <div class="navbar">
                <div class="navbar-left">
                    <button class="icon-button" id="chatHistoryButton">History</button>
                    <button class="icon-button" id="newChatButton">+</button>
                    <button class="icon-button" id="showHistory"><span class="codicon codicon-history"></span> History</button>
                    <button class="icon-button" id="startNewChat"><span class="codicon codicon-add"></span> New Chat</button>
                </div>
                <label for="baseUrlInput">Base URL:<input type="text" id="baseUrlInput" value="${defaultBaseUrl}"></label>
            </div>
            <div class="chat-container">
                <div class="chat-messages"></div>
                <div id="responseArea">
                    <pre><code class="language-javascript"></code></pre>
                </div>
                <div class="chat-input-container">
                    <div class="chat-input">
                        <textarea id="promptInput" placeholder="Type your message here..." style="resize: none;"></textarea>
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
        </html>`;
    }
}

export function deactivate() {}