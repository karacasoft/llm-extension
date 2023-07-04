// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { OpenAILLMInterface } from './llm/openai';
import { llmPrompt } from './commands/llm_prompt';
import { Message } from './llm/llm';
import { getLLMViewContent } from './view/llm_view';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-llm-extension" is now active!');

	const config = vscode.workspace.getConfiguration();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-llm-extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vscode-llm-extension!');
		console.log(vscode.workspace.getConfiguration('vscode-llm-extension')
			.get('codellm.llm'));
		console.log(vscode.workspace.getConfiguration('vscode-llm-extension').get('codellm.openai.apikey'));
	});

	let setApiKeyDisposable = vscode.commands.registerCommand('vscode-llm-extension.setOpenAIApiKey', () => {
		vscode.window.showInputBox({
			placeHolder: 'OpenAI API Key',
			prompt: 'Paste your OpenAI API key here',
			title: 'Set OpenAI API key',
			value: config.has('codellm.openai.apikey') ? config.get('codellm.openai.apikey') : '',
		}).then(value => {
			return config.update('codellm.openai.apikey', value, vscode.ConfigurationTarget.Workspace);
		});
	});

	let llmPromptDisposable = vscode.commands.registerCommand('vscode-llm-extension.promptllm', () => {
		vscode.window.showInputBox({
			placeHolder: 'Enter your prompt',
			prompt: 'Enter your LLM prompt here',
			title: 'Prompt',
		}).then(value => {
			if(value) {
				const textEditor = vscode.window.activeTextEditor;
				if(textEditor) {
					const language = textEditor.document.languageId;
					const contents = textEditor.document.getText();
					const selected = textEditor.document.getText(textEditor.selection);
					const hints = {
						language,
						currentFileContents: contents,
						selectedPart: selected,
					};
					const llm = new OpenAILLMInterface(config.get('codellm.openai.apikey') ?? '');
					llmPrompt(llm, value, hints);
				}
			}
		});
		
	});



	let startLLMSession = vscode.commands.registerCommand('vscode-llm-extension.startllmsession', () => {
		const currentDocument: vscode.TextDocument | null = null;
		const conversation: Message[] = [];
		const webView = vscode.window.createWebviewPanel('llmWebView',
			'LLM Session',
			vscode.ViewColumn.Beside,
			{});
		
		webView.webview.html = getLLMViewContent(conversation);
	})

	context.subscriptions.push(disposable);
	context.subscriptions.push(setApiKeyDisposable);
	context.subscriptions.push(llmPromptDisposable);
	context.subscriptions.push(startLLMSession);
}



// This method is called when your extension is deactivated
export function deactivate() {}
