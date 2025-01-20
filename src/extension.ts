import * as vscode from 'vscode';
import axios from 'axios';

interface OllamaMessage {
    command: string;
    model: string;
    text?: string;
}

let panel: vscode.WebviewPanel | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "ottollama" is now active!');

    let disposable = vscode.commands.registerCommand('ottollama.start', async () => {
        if (!panel) {
            panel = vscode.window.createWebviewPanel(
                'modelSelector',
                'Model Selector',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true
                }
            );

            try {
                const response = await axios.get('http://localhost:11434/api/tags');
                console.log(response.data);
                const models = response.data.models; // models dizisine erişim

                if (!Array.isArray(models)) {
                    throw new Error('API response is not an array');
                }

                // JSON verisini stringe dönüştürerek göster
                vscode.window.showInformationMessage(`API Response: ${JSON.stringify(response.data)}`);

                const modelOptions = models.map((model: any) => `<option value="${model.model}">${model.name}</option>`).join('');
                panel.webview.html = getWebviewContent(modelOptions);

                // Move message handling inside panel creation block
                panel.webview.onDidReceiveMessage(async (message: OllamaMessage) => {
                    if (message.command === 'sendPrompt') {
                        try {
                            const response = await axios.post('http://0.0.0.0:11434/api/chat', {
                                model: message.model,
                                messages: [{ role: 'user', content: message.text }],
                                stream: false // "stream": false parametresini ekledik
                            });

                            console.log('API Response:', response.data); // API yanıtını kontrol et

                            panel?.webview.postMessage({
                                type: 'response',
                                text: response.data.message.content // Doğru anahtarı kullanarak yanıtı al
                            });
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                            if (panel) {
                                panel.webview.postMessage({
                                    type: 'error',
                                    text: errorMessage
                                });
                            }
                        }
                    }
                });
                
                panel.onDidDispose(() => {
                    panel = undefined;
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Failed to fetch models: ${errorMessage}`);
            }
        }
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(modelOptions: string): string {
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
            /* padding: 10px; */
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
            /* Tek satır yüksekliği */
            max-height: 120px;
            /* Maksimum genişleme */
            background: #1e1e2f;
            color: #d1d5db;
            overflow-y: auto;
            /* Kaydırma etkin */
        }

        .chat-input textarea::-webkit-scrollbar {
            display: none;
            /* Scrollbar gizli */
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

        // .controls button {
        //     background: none;
        //     border: none;
        //     color: white;
        //     font-size: 25px;
        //     cursor: pointer;
        //     margin-right: 20px;

        // }

        // .controls button:hover {
        //     background: none;
        // }

        // .controls button:before {
        //     content: \'\\21d2';
        //     /* Unicode right arrow */
        // }

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


    </style>
</head>

<body>
    <div class="chat-container">
        <div id="responseArea"></div>
        <div class="chat-input-container">
            <div class="chat-input">
                <textarea id="promptInput" placeholder="Type your message here..." style="resize: none;" oninput="autoResize(this)"></textarea>
            </div>

            <div class="controls">
                <select id="modelSelect">
                    ${modelOptions}
                </select>
                <button id="sendButton"></button>
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
            const model = document.getElementById('modelSelect').value;
            const prompt = document.getElementById('promptInput').value;

            // Yükleme durumuna geç
            setLoadingState(true);

            vscode.postMessage({ command: 'sendPrompt', model, text: prompt });
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
                document.getElementById('responseArea').innerText = 'Response: ' + message.text;
            } else if (message.type === 'error') {
                document.getElementById('responseArea').innerText = 'Error: ' + message.text;
            }

            // Yükleme durumundan çık
            setLoadingState(false);
        });

        // Sayfa yüklendiğinde ok simgesini göster
        window.onload = () => {
            setLoadingState(false);
        };

    </script>
</body>

</html>
    `;
}

export function deactivate() {
    if (panel) {
        panel.dispose();
    }
}