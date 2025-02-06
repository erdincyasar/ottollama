"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveChatRecord = exports.deleteChatRecord = exports.loadChatRecords = exports.appendToActiveChatRecord = exports.saveChatRecord = exports.startNewChatRecord = void 0;
const path = require("path");
const fs = require("fs");
const chatHistoryDir = path.join(__dirname, 'chatHistory');
if (!fs.existsSync(chatHistoryDir)) {
    fs.mkdirSync(chatHistoryDir);
}
let activeChatRecord = null;
function formatTitle(title) {
    const date = new Date();
    const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear().toString().slice(-2)}_${date.getHours()}-${date.getMinutes()}`;
    return `${title}__${formattedDate}`;
}
function startNewChatRecord(title) {
    activeChatRecord = {
        title: formatTitle(title),
        timestamp: new Date().toISOString(),
        messages: []
    };
    saveChatRecord(activeChatRecord);
}
exports.startNewChatRecord = startNewChatRecord;
function saveChatRecord(record) {
    const filePath = path.join(chatHistoryDir, `${record.title}.json`);
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
}
exports.saveChatRecord = saveChatRecord;
function appendToActiveChatRecord(message) {
    if (activeChatRecord) {
        activeChatRecord.messages.push(message);
        saveChatRecord(activeChatRecord);
    }
}
exports.appendToActiveChatRecord = appendToActiveChatRecord;
function loadChatRecords() {
    const files = fs.readdirSync(chatHistoryDir);
    return files.map(file => {
        const content = fs.readFileSync(path.join(chatHistoryDir, file), 'utf-8');
        return JSON.parse(content);
    });
}
exports.loadChatRecords = loadChatRecords;
function deleteChatRecord(title) {
    const filePath = path.join(chatHistoryDir, `${title}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}
exports.deleteChatRecord = deleteChatRecord;
function getActiveChatRecord() {
    return activeChatRecord;
}
exports.getActiveChatRecord = getActiveChatRecord;
//# sourceMappingURL=chatHistoryManager.js.map