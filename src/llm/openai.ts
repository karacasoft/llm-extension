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
                role: "user",
                name: m.name,
                content: m.content,
            })),
        });
        return {
            content: result.data.choices[0].message?.content ?? "",
        };
    }

}