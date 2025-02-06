import * as path from 'path';
import * as fs from 'fs';

const chatHistoryDir = path.join(__dirname, 'chatHistory');

if (!fs.existsSync(chatHistoryDir)) {
    fs.mkdirSync(chatHistoryDir);
}

interface ChatRecord {
    title: string;
    timestamp: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
}

let activeChatRecord: ChatRecord | null = null;

function formatTitle(title: string): string {
    const date = new Date();
    const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear().toString().slice(-2)}_${date.getHours()}-${date.getMinutes()}`;
    return `${title}__${formattedDate}`;
}

export function startNewChatRecord(title: string) {
    activeChatRecord = {
        title: formatTitle(title),
        timestamp: new Date().toISOString(),
        messages: []
    };
    saveChatRecord(activeChatRecord);
}

export function saveChatRecord(record: ChatRecord) {
    const filePath = path.join(chatHistoryDir, `${record.title}.json`);
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2));
}

export function appendToActiveChatRecord(message: { role: 'user' | 'assistant'; content: string }) {
    if (activeChatRecord) {
        activeChatRecord.messages.push(message);
        saveChatRecord(activeChatRecord);
    }
}

export function loadChatRecords(): ChatRecord[] {
    const files = fs.readdirSync(chatHistoryDir);
    return files.map(file => {
        const content = fs.readFileSync(path.join(chatHistoryDir, file), 'utf-8');
        return JSON.parse(content) as ChatRecord;
    });
}

export function deleteChatRecord(title: string) {
    const filePath = path.join(chatHistoryDir, `${title}.json`);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
}

export function getActiveChatRecord(): ChatRecord | null {
    return activeChatRecord;
}
