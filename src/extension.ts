// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { OpenAILLMInterface } from './llm/openai';
import { llmPrompt } from './commands/llm_prompt';
import { setupLLMWebView } from './view/llm_view';

export function activate(context: vscode.ExtensionContext) {

	const config = vscode.workspace.getConfiguration();
	const llm = new OpenAILLMInterface(config.get('codellm.openai.apikey') ?? '');

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
			ignoreFocusOut: true,
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
					
					llmPrompt(llm, value, hints);
				}
			}
		});
		
	});



	let startLLMSession = vscode.commands.registerCommand('vscode-llm-extension.startllmsession', () => {
		const webView = vscode.window.createWebviewPanel('llmWebView',
			'LLM Session',
			vscode.ViewColumn.Beside,
			{
				enableScripts: true,
			});
		setupLLMWebView(webView, llm);
	})

	context.subscriptions.push(setApiKeyDisposable);
	context.subscriptions.push(llmPromptDisposable);
	context.subscriptions.push(startLLMSession);
}



// This method is called when your extension is deactivated
export function deactivate() {}
