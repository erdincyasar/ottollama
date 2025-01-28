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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHistory = void 0;
const sqlite3 = __importStar(require("sqlite3"));
class ChatHistory {
    constructor(context) {
        this.context = context;
        const storagePath = context.globalStorageUri.fsPath;
        this.db = new sqlite3.Database(`${storagePath}/chatHistory.db`);
        this.initializeDatabase();
    }
    initializeDatabase() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS chats (
                id TEXT PRIMARY KEY,
                name TEXT
            )
        `);
        this.db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chatId TEXT,
                role TEXT,
                content TEXT,
                model TEXT,
                title TEXT,
                timestamp TEXT,
                FOREIGN KEY(chatId) REFERENCES chats(id)
            )
        `);
        console.log('Database initialized.');
    }
    addMessage(chatId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            this.db.run(`
            INSERT INTO messages (chatId, role, content, model, title, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [chatId, message.role, message.content, message.model, message.title, message.timestamp], (err) => {
                if (err) {
                    console.error('Failed to add message:', err);
                }
                else {
                    console.log('Message added to database.');
                }
            });
        });
    }
    getChatHistory(chatId) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM messages WHERE chatId = ?
            `, [chatId], (err, rows) => {
                if (err) {
                    console.error('Failed to fetch chat history:', err);
                    reject(err);
                }
                else {
                    console.log('Chat history fetched from database.');
                    resolve(rows);
                }
            });
        });
    }
    getAllChatIds() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT id FROM chats
            `, [], (err, rows) => {
                if (err) {
                    console.error('Failed to fetch chat IDs:', err);
                    reject(err);
                }
                else {
                    console.log('Chat IDs fetched from database.');
                    resolve(rows.map((row) => row.id));
                }
            });
        });
    }
    deleteChat(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.db.run(`
            DELETE FROM messages WHERE chatId = ?
        `, [chatId], (err) => {
                if (err) {
                    console.error('Failed to delete messages:', err);
                }
                else {
                    console.log('Messages deleted from database.');
                }
            });
            this.db.run(`
            DELETE FROM chats WHERE id = ?
        `, [chatId], (err) => {
                if (err) {
                    console.error('Failed to delete chat:', err);
                }
                else {
                    console.log('Chat deleted from database.');
                }
            });
        });
    }
    updateChatName(chatId, name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.db.run(`
            UPDATE chats SET name = ? WHERE id = ?
        `, [name, chatId], (err) => {
                if (err) {
                    console.error('Failed to update chat name:', err);
                }
                else {
                    console.log('Chat name updated in database.');
                }
            });
        });
    }
    addChat(chatId, name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.db.run(`
            INSERT INTO chats (id, name) VALUES (?, ?)
        `, [chatId, name], (err) => {
                if (err) {
                    console.error('Failed to add chat:', err);
                }
                else {
                    console.log('Chat added to database.');
                }
            });
        });
    }
}
exports.ChatHistory = ChatHistory;
//# sourceMappingURL=chatHistory.js.map