"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHistory = void 0;
class ChatHistory {
    constructor(context) {
        this.chatHistoryKeyPrefix = 'chatHistory-';
        this.context = context;
    }
    addMessage(chatId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const chatHistory = this.getChatHistory(chatId);
            chatHistory.push(message);
            yield this.context.globalState.update(this.chatHistoryKeyPrefix + chatId, chatHistory);
        });
    }
    getChatHistory(chatId) {
        return this.context.globalState.get(this.chatHistoryKeyPrefix + chatId, []);
    }
    clearHistory(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.context.globalState.update(this.chatHistoryKeyPrefix + chatId, []);
        });
    }
    getAllChatIds() {
        const keys = this.context.globalState.keys();
        console.log('Global state keys:', keys);
        const chatIds = keys
            .filter(key => key.startsWith(this.chatHistoryKeyPrefix))
            .map(key => key.replace(this.chatHistoryKeyPrefix, ''));
        console.log('Chat IDs:', chatIds);
        return chatIds;
    }
    deleteChat(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Deleting chat history for chatId: ${chatId}`);
            try {
                yield this.context.globalState.update(this.chatHistoryKeyPrefix + chatId, undefined);
                console.log('Key deleted:', this.chatHistoryKeyPrefix + chatId);
            }
            catch (error) {
                console.error(`Failed to delete chat history for chatId: ${chatId}`, error);
            }
        });
    }
}
exports.ChatHistory = ChatHistory;
//# sourceMappingURL=chatHistory.js.map