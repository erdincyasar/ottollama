import * as vscode from 'vscode';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    model: string;
}

export class ChatHistory {
    private context: vscode.ExtensionContext;
    private historyKey: string = 'chatHistory';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public async addMessage(message: ChatMessage): Promise<void> {
        const history = this.getHistory();
        history.push(message);
        await this.context.globalState.update(this.historyKey, history);
    }

    public getHistory(): ChatMessage[] {
        return this.context.globalState.get<ChatMessage[]>(this.historyKey, []);
    }

    public async clearHistory(): Promise<void> {
        await this.context.globalState.update(this.historyKey, []);
    }

    public async saveChat(chatId: string, messages: ChatMessage[]): Promise<void> {
        await this.context.globalState.update(`${this.historyKey}-${chatId}`, messages);
    }

    public getChat(chatId: string): ChatMessage[] {
        return this.context.globalState.get<ChatMessage[]>(`${this.historyKey}-${chatId}`, []);
    }

    public getAllChats(): string[] {
        return this.context.globalState.keys().filter(key => key.startsWith(this.historyKey));
    }
}
