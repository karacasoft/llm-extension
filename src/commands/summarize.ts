import { LLMInterface } from "../llm/llm";


export async function summarize(text: string, llm: LLMInterface) {

    const res = await llm.prompt([{
        name: 'system',
        content: `Summarize the following text or block of code:
\`\`\`
${text}
\`\`\`
`
    }]);
    return res.content;
}

export async function summarizePart(text: string, part: string, llm: LLMInterface) {

    const res = await llm.prompt([{
        name: 'system',
        content: `Strip the ${part} of the following code. Return only that part. Do not write anything else:
\`\`\`
${text}
\`\`\`
`
    }]);
    return res.content;
}