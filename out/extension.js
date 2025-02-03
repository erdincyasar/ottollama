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
const defaultBaseUrl = 'http://localhost:11434';
function activate(context) {
    const outputChannel = vscode.window.createOutputChannel('Ollama Extension');
    outputChannel.show(true); // Show the output channel
    // Sidebar'ı oluştur
    const sidebarProvider = new OllamaSidebarProvider(context.extensionUri, outputChannel);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('ottollamaSidebar.chatView', sidebarProvider));
    // Webview'den gelen mesajları dinle
    context.subscriptions.push(vscode.window.registerWebviewPanelSerializer('ottollamaSidebar.chatView', {
        deserializeWebviewPanel(webviewPanel, state) {
            return __awaiter(this, void 0, void 0, function* () {
                webviewPanel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
                    if (message.command === 'sendPrompt') {
                        try {
                            const response = yield sendChatMessage(message.baseUrl || defaultBaseUrl, message.model, message.text);
                            webviewPanel.webview.postMessage({ type: 'response', text: response.data });
                        }
                        catch (error) {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            outputChannel.appendLine(`Error sending chat message: ${errorMessage}`);
                            webviewPanel.webview.postMessage({ type: 'error', text: errorMessage });
                        }
                    }
                }));
            });
        }
    }));
}
exports.activate = activate;
function fetchModels(baseUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(`${baseUrl}/api/tags`);
            return response.data;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error fetching models: ${error.message}`);
            }
            else {
                throw new Error('Error fetching models');
            }
        }
    });
}
function sendChatMessage(baseUrl, model, text) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post(`${baseUrl}/api/chat`, {
                model,
                messages: [{ role: 'user', content: text }],
                stream: false
            });
            return response;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Error sending chat message: ${error.message}`);
            }
            else {
                throw new Error('Error sending chat message');
            }
        }
    });
}
class OllamaSidebarProvider {
    constructor(_extensionUri, outputChannel) {
        this._extensionUri = _extensionUri;
        this.outputChannel = outputChannel;
    }
    resolveWebviewView(webviewView, context, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            this.outputChannel.appendLine('resolveWebviewView called');
            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
            };
            try {
                const models = yield fetchModels(defaultBaseUrl);
                const modelOptions = models.map((model) => `<option value="${model.model}">${model.name}</option>`).join('');
                webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, modelOptions);
                this.outputChannel.appendLine('Webview HTML set');
            }
            catch (error) {
                this.outputChannel.appendLine(`Error resolving webview view: ${error.message}`);
                webviewView.webview.html = `<div>Error loading models: ${error.message}</div>`;
            }
            webviewView.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
                if (message.command === 'sendPrompt') {
                    try {
                        const response = yield sendChatMessage(message.baseUrl || defaultBaseUrl, message.model, message.text);
                        webviewView.webview.postMessage({ type: 'response', text: response.data });
                    }
                    catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        this.outputChannel.appendLine(`Error sending chat message: ${errorMessage}`);
                        webviewView.webview.postMessage({ type: 'error', text: errorMessage });
                    }
                }
            }));
        });
    }
    _getHtmlForWebview(webview, modelOptions) {
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
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map