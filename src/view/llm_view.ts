import { existsSync, lstatSync, readFileSync, readdirSync, statfsSync, writeFileSync,  } from 'fs';
import { LLMInterface, Message } from '../llm/llm';
import * as vscode from 'vscode';
import * as showdown from 'showdown';

const markdownConverter = new showdown.Converter();

const llmViewPrompt = `You are a coding assistant. You are helping the user with code snippets. Here's the format you are supposed to answer in:
Thought: <your thoughts about the problem>
Action: <a tool name>
ActionInput: <inputs to the tool>
Observation: <result of the tool you have used>
This sequence may repeat a few times in order to reach a conclusion. When you have found the answer finish with the following:
FinalAnswer: <final answer>
Finished:
Final answer may include multiple lines. It may use markdown and may ask the user for additional information.
Try to reach a conclusion in 3 or 4 steps. If you cannot do it, let the user know about it by finalizing your answer.
If you cannot find an answer, you may ask for details.
Try to guide the user with detailed explanations and code blocks.
Your tools are as below:
* read-dir: Uses a path as input. '.' is always the workspace root directory. Returns the files inside the directory given or the root directory if none given.
* read-file: Reads a file's contents and writes it out. Requires the workspace relative path of the file as input.

Example usage of your tools:
Action: read-dir
ActionInput: .

Action: read-file
ActionInput: ./file.txt

Only the final answer will be shown to the user. Try to be as helpful as possible.
`;

async function doAction(action: string, actionInput: string, codeBlock?: string) {
    const dir = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined;
    if(!dir) {
        return `These commands work only in a workspace. Tell the user to open a workspace to access these features.`;
    }
    const origInput = actionInput;
    if(action === 'read-dir') {
        const file = vscode.Uri.joinPath(dir.uri, actionInput);
        
        actionInput = file.fsPath;
        if(existsSync(actionInput)) {
            if(lstatSync(actionInput).isDirectory()) {
                return `Directories are marked with a (D) at the end.
The files in ${origInput}:
${readdirSync(actionInput, { withFileTypes: true }).map(dirent => {
        return `* ${dirent.name}${dirent.isDirectory() ? '(D)' : ''}`;
}).join('\n')}
`;
            } else {
                return `${origInput} is not a directory`
            }
        } else {
            return "File does not exist";
        }
    } else if(action === 'read-file') {
        const file = vscode.Uri.joinPath(dir.uri, actionInput);
        actionInput = file.fsPath;
        if(!existsSync(actionInput)) {
            return "File does not exist. Check if it exists using *read-dir* tool";
        }
        if(lstatSync(actionInput).isDirectory()) {
            return `${origInput} is a directory`;
        }
        return `Contents of the file:
\`\`\`
${readFileSync(actionInput)}
\`\`\`
`
    } else if(action === 'write-file') {
        if(actionInput === '') {
            return `No file name was provided. Check out the file system using read-dir tool.`;
        }
        const file = vscode.Uri.joinPath(dir.uri, actionInput);
        actionInput = file.fsPath;
        if(!codeBlock) {
            return `Nothing to write to file. In different lines define contents of the file using \`\`\` symbols.`
        }
        writeFileSync(actionInput, codeBlock)
        return `Written ${codeBlock.length} bytes`;
    }
    return "Action not found, action can only be read-file or read-dir";
}

async function chainCall(input: string, llm: LLMInterface, messagesSoFar: Message[] = [], maxChain: number = 8) {
    let prompt = llmViewPrompt;
    const messagesCopy = [...messagesSoFar];

    let response = await llm.promptWithStopTokens([{
        name: 'system',
        content: prompt,
    }, ...messagesCopy], ['Observation:', 'Finished:']);

    while(true) {
        maxChain--;
        const text = response.content;
        console.log(text);
        let action = '';
        let actionInput = '';
        let codeBlockMatch = text.match('```(.*\n*)*```');
        let codeBlock;
        if(codeBlockMatch) {
            codeBlock = codeBlockMatch[0];
        }
        if(text.includes('FinalAnswer:')) {
            return text.substring(text.indexOf("FinalAnswer:")).replace(/FinalAnswer:/g, '');
        }
        for(let line of text.split('\n')) {
            if(line.startsWith('Action:')) {
                action = line.split('Action:')[1].trim();
            } else if(line.startsWith('ActionInput:')) {
                actionInput = line.split('ActionInput:')[1].trim();
            }
        }

        const actionResult = await doAction(action, actionInput, codeBlock);
        console.log("Observation: " + actionResult + "\n\n");

        messagesCopy.push({
            name: 'assistant',
            content: response.content + "\n\nObservation:" + actionResult,
        });

        if(maxChain === 0) {
            return 'I was not able to find an answer';
        }

        response = await llm.promptWithStopTokens([{
            name: 'system',
            content: prompt,
        }, ...messagesCopy], ['Observation:', 'Finished:']);
    }
}

export function setupLLMWebView(webView: vscode.WebviewPanel, llm: LLMInterface) {
    const conversation: Message[] = [];
    webView.webview.onDidReceiveMessage(async message => {
        conversation.push({
            name: 'user',
            content: message.input,
        });
        webView.webview.html = getLLMViewContent(conversation);
        const response = await chainCall(message.input, llm, conversation);
        conversation.push({
            name: 'assistant',
            content: response ?? '',
        });
        webView.webview.html = getLLMViewContent(conversation);
    });
    
    webView.webview.html = getLLMViewContent(conversation);
}

export function getLLMViewContent(conversation: Message[]) {
    const messageList = conversation.map((message: Message) => {
        return `<div><b>${message.name}:</b>${markdownConverter.makeHtml(message.content)}</div>`;
    }).join('\n\n');

    return /*html*/`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LLM Session</title>
        <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
        <script>
            const vscode = acquireVsCodeApi();
            function sendData() {
                const inputValue = document.getElementById("inputField").value;
                vscode.postMessage({ input: inputValue });
            }

            function onSubmit(e) {
                e.preventDefault();
            }
        </script>
    </head>
    <body>
        <div>
            ${messageList}
        </div>
        <form>
            <input type="text" id="inputField">
            <button onsubmit="onSubmit" id="submitButton" onclick="sendData()">Submit</button>
        </form>
    </body>
    </html>`;
}