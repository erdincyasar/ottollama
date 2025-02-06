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
  text: string;
  model: string;
  baseUrl?: string;
}

export async function handleWebviewMessage(chatId: string, message: OllamaMessage, panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
  const baseUrl = message.baseUrl || 'http://localhost:11434';
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

      const historyPath = vscode.Uri.joinPath(context.globalStorageUri, 'chat-history.json');
      const chatHistory = { id: chatId, messages: [userMessage, assistantMessage] };
      await vscode.workspace.fs.writeFile(historyPath, Buffer.from(JSON.stringify(chatHistory, null, 2)));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      panel.webview.postMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      panel.webview.postMessage({
        type: 'loadingState',
        isLoading: false
      });
    }
  }
}
