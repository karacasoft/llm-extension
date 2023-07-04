import { Message } from '../llm/llm';

export function getLLMViewContent(conversation: Message[]) {
    return /**html*/`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LLM Session</title>
    </head>
    <body>
        <p>Burada LLM olacak</p>
    </body>
    </html>`
}