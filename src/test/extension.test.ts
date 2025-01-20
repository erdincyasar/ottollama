import * as assert from 'assert';
import * as vscode from 'vscode';
import { activate, deactivate } from '../extension';
import axios from 'axios';
import { beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    let mockPanel: vscode.WebviewPanel;
    let axiosGetStub: sinon.SinonStub;

    beforeEach(() => {
        mockPanel = {
            dispose: () => {},
            webview: {
                html: '',
                postMessage: () => Promise.resolve(true),
                onDidReceiveMessage: () => ({ dispose: () => {} })
            }
        } as any;

        axiosGetStub = sinon.stub(axios, 'get');
    });

    afterEach(() => {
        mockPanel.dispose();
        axiosGetStub.restore();
    });

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });

    test('Activate function', () => {
        assert.strictEqual(typeof activate, 'function');
    });

    test('Deactivate function', () => {
        assert.strictEqual(typeof deactivate, 'function');
    });

    test('Should handle API errors gracefully', async () => {
        const mockError = new Error('API Error');
        axiosGetStub.rejects(mockError);
        
        const mockContext: vscode.ExtensionContext = {
            subscriptions: [],
            workspaceState: {} as vscode.Memento,
            globalState: {
                ...{} as vscode.Memento,
                setKeysForSync: (keys: readonly string[]) => {}
            },
            secrets: {} as vscode.SecretStorage,
            extensionUri: vscode.Uri.parse(''),
            environmentVariableCollection: {
                getScoped: (scope: vscode.EnvironmentVariableScope) => ({
                    replace: () => {},
                    append: () => {},
                    prepend: () => {},
                    get: () => undefined,
                    forEach: () => {},
                    clear: () => {},
                    delete: () => {}
                }),
                persistent: true,
                replace: () => {},
                append: () => {},
                prepend: () => {},
                get: () => undefined,
                forEach: () => {},
                clear: () => {},
                delete: () => {},
                forEachInScope: () => {}
            } as unknown as vscode.GlobalEnvironmentVariableCollection, // Ensure the correct type is used
            storageUri: undefined,
            globalStorageUri: vscode.Uri.parse(''),
            logUri: vscode.Uri.parse(''),
            extensionMode: vscode.ExtensionMode.Test,
            extensionPath: '',
            asAbsolutePath: (relativePath: string) => '',
            storagePath: undefined,
            globalStoragePath: '',
            logPath: '',
            extension: {} as vscode.Extension<any>,
            languageModelAccessInformation: {} as any
        };
        
        activate(mockContext);
        assert.strictEqual(mockContext.subscriptions.length, 1);
    });
});