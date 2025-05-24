"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const sdk_1 = require("@anthropic-ai/sdk");
let anthropic = null;
let chatPanel = null;
function activate(context) {
    console.log('Claude AI Assistant extension is now active!');
    // Initialize Anthropic client
    initializeAnthropic();
    // Register commands
    const openChatCommand = vscode.commands.registerCommand('claude.openChat', () => {
        openChatPanel(context);
    });
    const explainCodeCommand = vscode.commands.registerCommand('claude.explainCode', async () => {
        await handleCodeAction('explain');
    });
    const reviewCodeCommand = vscode.commands.registerCommand('claude.reviewCode', async () => {
        await handleCodeAction('review');
    });
    const generateTestsCommand = vscode.commands.registerCommand('claude.generateTests', async () => {
        await handleCodeAction('test');
    });
    // Register configuration change listener
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('claude.apiKey')) {
            initializeAnthropic();
        }
    });
    context.subscriptions.push(openChatCommand, explainCodeCommand, reviewCodeCommand, generateTestsCommand, configChangeListener);
}
exports.activate = activate;
function initializeAnthropic() {
    const config = vscode.workspace.getConfiguration('claude');
    const apiKey = config.get('apiKey');
    if (apiKey) {
        anthropic = new sdk_1.default({ apiKey });
    }
    else {
        anthropic = null;
        vscode.window.showWarningMessage('Claude API key not configured. Please set it in settings.');
    }
}
async function handleCodeAction(action) {
    if (!anthropic) {
        vscode.window.showErrorMessage('Claude API key not configured.');
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }
    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    if (!selectedText) {
        vscode.window.showErrorMessage('No code selected.');
        return;
    }
    const fileName = editor.document.fileName;
    const language = editor.document.languageId;
    let prompt = '';
    switch (action) {
        case 'explain':
            prompt = `Please explain this ${language} code from ${fileName}:\n\n${selectedText}`;
            break;
        case 'review':
            prompt = `Please review this ${language} code from ${fileName} and suggest improvements:\n\n${selectedText}`;
            break;
        case 'test':
            prompt = `Please generate unit tests for this ${language} code from ${fileName}:\n\n${selectedText}`;
            break;
    }
    try {
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Claude is ${action === 'explain' ? 'explaining' : action === 'review' ? 'reviewing' : 'generating tests for'} your code...`,
            cancellable: false
        }, async () => {
            const config = vscode.workspace.getConfiguration('claude');
            const model = config.get('model') || 'claude-sonnet-4-20250514';
            const maxTokens = config.get('maxTokens') || 4000;
            const response = await anthropic.messages.create({
                model,
                max_tokens: maxTokens,
                messages: [{ role: 'user', content: prompt }]
            });
            const responseText = response.content[0].type === 'text' ? response.content[0].text : 'No response';
            // Show response in a new document
            const doc = await vscode.workspace.openTextDocument({
                content: responseText,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
        });
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error communicating with Claude: ${error}`);
    }
}
function openChatPanel(context) {
    if (chatPanel) {
        chatPanel.reveal();
        return;
    }
    chatPanel = vscode.window.createWebviewPanel('claudeChat', 'Claude Chat', vscode.ViewColumn.Beside, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    chatPanel.webview.html = getChatWebviewContent();
    // Handle messages from the webview
    chatPanel.webview.onDidReceiveMessage(async (message) => {
        switch (message.type) {
            case 'sendMessage':
                await handleChatMessage(message.text);
                break;
        }
    });
    chatPanel.onDidDispose(() => {
        chatPanel = null;
    });
}
async function handleChatMessage(text) {
    if (!anthropic || !chatPanel) {
        return;
    }
    try {
        const config = vscode.workspace.getConfiguration('claude');
        const model = config.get('model') || 'claude-sonnet-4-20250514';
        const maxTokens = config.get('maxTokens') || 4000;
        const response = await anthropic.messages.create({
            model,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: text }]
        });
        const responseText = response.content[0].type === 'text' ? response.content[0].text : 'No response';
        chatPanel.webview.postMessage({
            type: 'response',
            text: responseText
        });
    }
    catch (error) {
        chatPanel.webview.postMessage({
            type: 'error',
            text: `Error: ${error}`
        });
    }
}
function getChatWebviewContent() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Chat</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        #chatContainer {
            height: 70vh;
            overflow-y: auto;
            border: 1px solid var(--vscode-panel-border);
            padding: 10px;
            margin-bottom: 10px;
            background-color: var(--vscode-panel-background);
        }
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 5px;
        }
        .user-message {
            background-color: var(--vscode-textCodeBlock-background);
            border-left: 3px solid var(--vscode-textLink-foreground);
        }
        .claude-message {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-left: 3px solid var(--vscode-charts-green);
        }
        .error-message {
            background-color: var(--vscode-inputValidation-errorBackground);
            border-left: 3px solid var(--vscode-inputValidation-errorBorder);
        }
        #inputContainer {
            display: flex;
            gap: 10px;
        }
        #messageInput {
            flex: 1;
            padding: 10px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            color: var(--vscode-input-foreground);
        }
        #sendButton {
            padding: 10px 20px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
        }
        #sendButton:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        #sendButton:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 10px;
            border-radius: 3px;
            overflow-x: auto;
        }
        code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 4px;
            border-radius: 2px;
        }
    </style>
</head>
<body>
    <div id="chatContainer"></div>
    <div id="inputContainer">
        <input type="text" id="messageInput" placeholder="Ask Claude anything..." />
        <button id="sendButton">Send</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const chatContainer = document.getElementById('chatContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        function addMessage(text, type) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${type}-message\`;
            
            if (type === 'claude') {
                // Simple markdown-like formatting
                text = text
                    .replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>')
                    .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
                    .replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>')
                    .replace(/\\*([^\\*]+)\\*/g, '<em>$1</em>')
                    .replace(/\\n/g, '<br>');
            }
            
            messageDiv.innerHTML = text;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function sendMessage() {
            const text = messageInput.value.trim();
            if (!text) return;

            addMessage(text, 'user');
            messageInput.value = '';
            sendButton.disabled = true;
            sendButton.textContent = 'Sending...';

            vscode.postMessage({
                type: 'sendMessage',
                text: text
            });
        }

        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'response':
                    addMessage(message.text, 'claude');
                    break;
                case 'error':
                    addMessage(message.text, 'error');
                    break;
            }
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
        });

        // Welcome message
        addMessage('Hello! I\\'m Claude, your AI assistant. How can I help you today?', 'claude');
    </script>
</body>
</html>`;
}
function deactivate() {
    if (chatPanel) {
        chatPanel.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map