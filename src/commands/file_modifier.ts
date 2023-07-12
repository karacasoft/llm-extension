import { LLMInterface } from "../llm/llm";


export async function modifyFile(prompt: string, fileContents: string, fileName: string, llm: LLMInterface) {
    llm.prompt([{
        name: 'system',
        content: 'Modify the given file contents according to the given prompt and return it directly without any code blocks',
    }, {
        name: 'user',
        content: `${prompt}
${fileName}:
\`\`\`
${fileContents}
\`\`\``
    }])
}