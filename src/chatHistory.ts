import * as vscode from 'vscode';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    model: string;
    title: string;
    timestamp: string;
}

export class ChatHistory {
    private context: vscode.ExtensionContext;
    private chatHistoryKeyPrefix: string = 'chatHistory-';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async addMessage(chatId: string, message: ChatMessage): Promise<void> {
        const chatHistory = this.getChatHistory(chatId);
        chatHistory.push(message);
        await this.context.globalState.update(this.chatHistoryKeyPrefix + chatId, chatHistory);
    }

    getChatHistory(chatId: string): ChatMessage[] {
        return this.context.globalState.get<ChatMessage[]>(this.chatHistoryKeyPrefix + chatId, []);
    }

    async clearHistory(chatId: string): Promise<void> {
        await this.context.globalState.update(this.chatHistoryKeyPrefix + chatId, []);
    }

    getAllChatIds(): string[] {
        const keys = this.context.globalState.keys();
        console.log('Global state keys:', keys);
        const chatIds = keys
            .filter(key => key.startsWith(this.chatHistoryKeyPrefix))
            .map(key => key.replace(this.chatHistoryKeyPrefix, ''));
        console.log('Chat IDs:', chatIds);
        return chatIds;
    }

    async deleteChat(chatId: string): Promise<void> {
        console.log(`Deleting chat history for chatId: ${chatId}`);
        try {
            await this.context.globalState.update(this.chatHistoryKeyPrefix + chatId, undefined);
            console.log('Key deleted:', this.chatHistoryKeyPrefix + chatId);
        } catch (error) {
            console.error(`Failed to delete chat history for chatId: ${chatId}`, error);
        }
    }
}
