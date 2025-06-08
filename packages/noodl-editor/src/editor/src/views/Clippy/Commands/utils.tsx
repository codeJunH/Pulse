import path from 'node:path';
import { OpenAiStore } from '@noodl-store/AiAssistantStore';
import { filesystem } from '@noodl/platform';

import { ProjectModel } from '@noodl-models/projectmodel';
import FileSystem from '@noodl-utils/filesystem';
import { guid } from '@noodl-utils/utils';

export async function makeImageGenerationRequest(prompt: string): Promise<{ type: string; data: Buffer }> {
  const OPENAI_API_KEY = OpenAiStore.getApiKey();
  const response = await fetch(`https://api.openai.com/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + OPENAI_API_KEY
    },
    body: JSON.stringify({
      prompt,
      n: 1,
      size: '512x512',
      response_format: 'b64_json'
    })
  });

  const json = await response.json();

  if (json.error) {
    console.error(json.error);
    throw new Error(json.error);
  }

  const b64_json = json.data[0].b64_json;

  return { data: Buffer.from(b64_json, 'base64'), type: 'png' };
}

export async function saveImageDataToDisk(imageData: { type: string; data: Buffer }): Promise<string> {
  const projectFolder = ProjectModel.instance._retainedProjectDirectory;
  if (!projectFolder) throw new Error('Project has no folder');

  const filename = `image-${guid()}.${imageData.type}`;
  const folder = 'generated-images';
  const relativeFilePath = path.join(folder, filename);
  const absolutePath = path.join(projectFolder, relativeFilePath);

  await filesystem.makeDirectory(path.join(projectFolder, folder));
  await filesystem.writeFile(absolutePath, imageData.data);

  return relativeFilePath;
}

export async function makeChatRequest(model: string, messages: unknown[]) {
  const OPENAI_API_KEY = OpenAiStore.getApiKey();
  
  // endpoint 설정
  let endpoint = 'https://api.openai.com/v1/chat/completions';
  if (OpenAiStore.getVersion() === 'openrouter') {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  } else if (OpenAiStore.getVersion() === 'enterprise') {
    endpoint = OpenAiStore.getEndpoint();
  }
  
  // 헤더 설정
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + OPENAI_API_KEY
  };
  
  // OpenRouter는 특수 헤더가 필요하므로 다시 추가
  if (OpenAiStore.getVersion() === 'openrouter') {
    headers['HTTP-Referer'] = 'https://pulse-editor.local';
    headers['X-Title'] = 'Pulse Editor';
  }
  
  // AI 룰 적용
  const aiRules = OpenAiStore.getAiRules();
  console.log('Clippy AI Rules Debug:', {
    aiRules,
    hasRules: !!aiRules,
    version: OpenAiStore.getVersion(),
    endpoint: endpoint
  });
  const messagesWithRules = aiRules ? [{ role: 'system', content: aiRules }, ...messages] : messages;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: OpenAiStore.getVersion() === 'openrouter' || OpenAiStore.getVersion() === 'enterprise' 
        ? OpenAiStore.getModel() || model 
        : model,
      messages: messagesWithRules,
      temperature: 0.5,
      max_tokens: 2048
    })
  });

  const json = await response.json();
  if (json.error) {
    console.error(json.error);
    return null;
  } else {
    const promptTokenCost = model === 'gpt-4o-mini' ? 0.03 : 0.002;
    const completionTokenCost = model === 'gpt-4o-mini' ? 0.06 : 0.002;
    let cost =
      (json.usage.completion_tokens * completionTokenCost) / 1000 + (json.usage.prompt_tokens * promptTokenCost) / 1000;

    cost = Math.round(cost * 10000) / 10000; //round to 4 decimals

    console.log('prompt cost', `$${cost}`);

    return {
      content: json.choices[0].message.content,
      usage: json.usage
    };
  }
}
