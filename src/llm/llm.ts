
export interface Message {
    name: string;
    content: string;
}

export interface Response {
    content: string;
}

export abstract class LLMInterface {

    abstract prompt(messages: Message[]): Promise<Response>;
    abstract promptWithStopTokens(messages: Message[], stopSequences: string[]): Promise<Response>;
}