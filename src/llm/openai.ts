import { LLMInterface, Message, Response } from "./llm";
import { Configuration, OpenAIApi } from "openai";

export class OpenAILLMInterface extends LLMInterface {
    openai: OpenAIApi;

    constructor(apiKey: string) {
        super();
        this.openai = new OpenAIApi(new Configuration({
            apiKey,
        }));
    }

    async prompt(messages: Message[]): Promise<Response> {
        const result = await this.openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: messages.map(m => ({
                role: m.name === 'assistant' ? 'assistant' : 'user',
                name: m.name,
                content: `${m.name}: ${m.content}`,
            })),
        });
        return {
            content: result.data.choices[0].message?.content ?? "",
        };
    }

    async promptWithStopTokens(messages: Message[], stopSequences: string[]): Promise<Response> {
        const result = await this.openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: messages.map(m => ({
                role: "user",
                name: m.name,
                content: m.content,
            })),
            stop: stopSequences,
        });
        return {
            content: result.data.choices[0].message?.content ?? "",
        };
    }

}