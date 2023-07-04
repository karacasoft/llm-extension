import { LLMInterface, Message } from "../llm/llm";
import * as vscode from 'vscode';

export interface CodeContentHints {
    language?: string;
    currentFileContents?: string;
    selectedPart?: string;
}

function contentHintsToPrompt(contentHints?: CodeContentHints) {
    if(!contentHints) return "";
    let result = "Here are some hints about the file you are going to edit.\n";
    if(contentHints.language) {
        result += `The code is in ${contentHints.language}\n`;
    }
    if(contentHints.selectedPart && contentHints.selectedPart.trim() !== '') {
        result += `User has selected the following part:
        
\`\`\`
${contentHints.selectedPart}
\`\`\`
`
    } else if(contentHints.currentFileContents) {
        result += `The file currently has the following contents:
\`\`\`
${contentHints.currentFileContents}
\`\`\`\n`;
    }
    
    return result;
}

export async function llmPrompt(llm: LLMInterface, promptText: string, contentHints?: CodeContentHints) {
    const textEditor = vscode.window.activeTextEditor;
    if(!textEditor) {
        vscode.window.showErrorMessage('You have to have a text editor open to prompt LLM for code.');
        return;
    }
    const prompt = `You are an AI assistant that makes writing code faster.
${contentHintsToPrompt(contentHints)}
Respond only with code. Do not write anything else. If you do not need to change anything you can add a newline at the end. Your response will be used directly on the file. It is important to not include anything other than code.

Replace the given code using the prompt. Here's the user prompt:
${promptText}`;
    console.log(prompt);

    const messages: Message[] = [];
    messages.push({
        name: 'system',
        content: prompt,
    });
    const result = await llm.prompt(messages);
    textEditor.edit((editBuilder) => {
        if(textEditor.selection.isEmpty) {
            const text = textEditor.document.getText();
            const start = textEditor.document.positionAt(0);
            const end = textEditor.document.positionAt(text.length);
            editBuilder.replace(new vscode.Range(start, end), result.content);
        } else {
            editBuilder.replace(textEditor.selection, result.content);
        }
    });
}