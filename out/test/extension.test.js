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
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const extension_1 = require("../extension");
const axios_1 = __importDefault(require("axios"));
const mocha_1 = require("mocha");
const sinon_1 = __importDefault(require("sinon"));
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    let mockPanel;
    let axiosGetStub;
    (0, mocha_1.beforeEach)(() => {
        mockPanel = {
            dispose: () => { },
            webview: {
                html: '',
                postMessage: () => Promise.resolve(true),
                onDidReceiveMessage: () => ({ dispose: () => { } })
            }
        };
        axiosGetStub = sinon_1.default.stub(axios_1.default, 'get');
    });
    (0, mocha_1.afterEach)(() => {
        mockPanel.dispose();
        axiosGetStub.restore();
    });
    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });
    test('Activate function', () => {
        assert.strictEqual(typeof extension_1.activate, 'function');
    });
    test('Deactivate function', () => {
        assert.strictEqual(typeof extension_1.deactivate, 'function');
    });
    test('Should handle API errors gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockError = new Error('API Error');
        axiosGetStub.rejects(mockError);
        const mockContext = {
            subscriptions: [],
            workspaceState: {},
            globalState: Object.assign(Object.assign({}, {}), { setKeysForSync: (keys) => { } }),
            secrets: {},
            extensionUri: vscode.Uri.parse(''),
            environmentVariableCollection: {
                getScoped: (scope) => ({
                    replace: () => { },
                    append: () => { },
                    prepend: () => { },
                    get: () => undefined,
                    forEach: () => { },
                    clear: () => { },
                    delete: () => { }
                }),
                persistent: true,
                replace: () => { },
                append: () => { },
                prepend: () => { },
                get: () => undefined,
                forEach: () => { },
                clear: () => { },
                delete: () => { },
                forEachInScope: () => { }
            },
            storageUri: undefined,
            globalStorageUri: vscode.Uri.parse(''),
            logUri: vscode.Uri.parse(''),
            extensionMode: vscode.ExtensionMode.Test,
            extensionPath: '',
            asAbsolutePath: (relativePath) => '',
            storagePath: undefined,
            globalStoragePath: '',
            logPath: '',
            extension: {},
            languageModelAccessInformation: {}
        };
        (0, extension_1.activate)(mockContext);
        assert.strictEqual(mockContext.subscriptions.length, 1);
    }));
    test('New chat command', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockContext = {
            subscriptions: [],
            workspaceState: {},
            globalState: Object.assign(Object.assign({}, {}), { setKeysForSync: (keys) => { } }),
            secrets: {},
            extensionUri: vscode.Uri.parse(''),
            environmentVariableCollection: {
                getScoped: (scope) => ({
                    replace: () => { },
                    append: () => { },
                    prepend: () => { },
                    get: () => undefined,
                    forEach: () => { },
                    clear: () => { },
                    delete: () => { }
                }),
                persistent: true,
                replace: () => { },
                append: () => { },
                prepend: () => { },
                get: () => undefined,
                forEach: () => { },
                clear: () => { },
                delete: () => { },
                forEachInScope: () => { }
            },
            storageUri: undefined,
            globalStorageUri: vscode.Uri.parse(''),
            logUri: vscode.Uri.parse(''),
            extensionMode: vscode.ExtensionMode.Test,
            extensionPath: '',
            asAbsolutePath: (relativePath) => '',
            storagePath: undefined,
            globalStoragePath: '',
            logPath: '',
            extension: {},
            languageModelAccessInformation: {}
        };
        (0, extension_1.activate)(mockContext);
        yield vscode.commands.executeCommand('ottollama.newChat');
        assert.strictEqual(mockContext.subscriptions.length, 2);
    }));
    test('Switch chat command', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockContext = {
            subscriptions: [],
            workspaceState: {},
            globalState: Object.assign(Object.assign({}, {}), { setKeysForSync: (keys) => { } }),
            secrets: {},
            extensionUri: vscode.Uri.parse(''),
            environmentVariableCollection: {
                getScoped: (scope) => ({
                    replace: () => { },
                    append: () => { },
                    prepend: () => { },
                    get: () => undefined,
                    forEach: () => { },
                    clear: () => { },
                    delete: () => { }
                }),
                persistent: true,
                replace: () => { },
                append: () => { },
                prepend: () => { },
                get: () => undefined,
                forEach: () => { },
                clear: () => { },
                delete: () => { },
                forEachInScope: () => { }
            },
            storageUri: undefined,
            globalStorageUri: vscode.Uri.parse(''),
            logUri: vscode.Uri.parse(''),
            extensionMode: vscode.ExtensionMode.Test,
            extensionPath: '',
            asAbsolutePath: (relativePath) => '',
            storagePath: undefined,
            globalStoragePath: '',
            logPath: '',
            extension: {},
            languageModelAccessInformation: {}
        };
        (0, extension_1.activate)(mockContext);
        yield vscode.commands.executeCommand('ottollama.switchChat', 'chat-12345');
        assert.strictEqual(mockContext.subscriptions.length, 2);
    }));
});
//# sourceMappingURL=extension.test.js.map