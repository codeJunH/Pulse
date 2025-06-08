import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source';
import { OpenAiStore } from '@noodl-store/AiAssistantStore';

import { AiCopilotChatProviders, AiCopilotChatStreamArgs } from '@noodl-models/AiAssistant/interfaces';

function toChatProvider(provider: AiCopilotChatProviders | undefined) {
  // OpenRouter나 enterprise인 경우 설정된 모델 사용
  let defaultModel = 'gpt-3.5-turbo';
  const version = OpenAiStore.getVersion();
  
  if (version === 'openrouter' || version === 'enterprise') {
    defaultModel = OpenAiStore.getModel() || 'gpt-3.5-turbo';
  }
  
  return {
    model: provider?.model || defaultModel,
    temperature: provider?.temperature,
    max_tokens: provider?.max_tokens
  };
}

async function directChatOpenAi({ messages, provider, abortController, onEnd, onStream }: AiCopilotChatStreamArgs) {
  const OPENAI_API_KEY = OpenAiStore.getApiKey();
  const controller = abortController || new AbortController();
  let endpoint = `https://api.openai.com/v1/chat/completions`;

  if (OpenAiStore.getVersion() === 'openrouter') {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  } else if (OpenAiStore.getVersion() === 'enterprise') {
    endpoint = OpenAiStore.getEndpoint();
  }

  let fullText = '';
  let completionTokenCount = 0;

  const aiRules = OpenAiStore.getAiRules();
  
  // DeepSeek 모델을 위한 강화된 AI 룰 처리
  let messagesWithRules = messages;
  if (aiRules && OpenAiStore.getVersion() === 'openrouter') {
    // 시스템 메시지를 더 강력하게 만들기
    const enhancedRules = `IMPORTANT INSTRUCTION: ${aiRules}. This is mandatory and must be followed in ALL responses. Never ignore this instruction.`;
    
    // 시스템 메시지와 첫 번째 사용자 메시지에도 룰 추가
    messagesWithRules = [
      { role: 'system', content: enhancedRules },
      ...messages.map((msg, index) => {
        // 첫 번째 사용자 메시지에 AI 룰 힌트 추가
        if (index === messages.length - 1 && msg.role === 'user') {
          return {
            ...msg,
            content: `${msg.content}\n\n(Remember: ${aiRules})`
          };
        }
        return msg;
      })
    ];
  } else if (aiRules) {
    messagesWithRules = [{ role: 'system', content: aiRules }, ...messages];
  }
  
  // AI Rules debugging - can be uncommented if needed
  // console.log('=== AI Rules Debug ===');
  // console.log('AI Rules Text:', JSON.stringify(aiRules));
  // console.log('Version:', OpenAiStore.getVersion());
  // console.log('========================');

  let tries = 2;
  
  // 헤더 설정
  let headers: Record<string, string> = {
    Authorization: 'Bearer ' + OPENAI_API_KEY,
    'Content-Type': 'application/json'
  };
  
  // OpenRouter는 특수 헤더가 필요하므로 다시 추가
  if (OpenAiStore.getVersion() === 'openrouter') {
    headers['HTTP-Referer'] = 'https://pulse-editor.local'; 
    headers['X-Title'] = 'Pulse Editor';
  }
  
  await fetchEventSource(endpoint, {
    method: 'POST',
    openWhenHidden: true,
    headers,
    signal: controller.signal,
    body: JSON.stringify({
      ...toChatProvider(provider),
      messages: messagesWithRules,
      stream: true
    }),
    async onopen(response) {
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('text/event-stream')) {
        return; // everything's good
      } else {
        // If status is not OK or content type is unexpected, throw the response body
        const errorMessage = await response.text();
        const errorDetails = `HTTP ${response.status} - ${response.statusText}: ${errorMessage}`;
        console.error('AI API Error:', errorDetails);
        throw errorDetails;
      }
    },
    onmessage(ev) {
      if (ev.data === '[DONE]') {
        controller.abort();
        return;
      }

      // OpenRouter에서 빈 데이터나 불완전한 JSON을 보낼 수 있으므로 안전하게 처리
      if (!ev.data || ev.data.trim() === '') {
        return;
      }

      try {
        const json = JSON.parse(ev.data);
        
        // 응답 구조 검증
        if (!json.choices || !json.choices[0] || !json.choices[0].delta) {
          return;
        }
        
        const delta = json.choices[0].delta.content;
        if (delta) {
          completionTokenCount++;
          fullText += delta;
          onStream && onStream(fullText, delta);
        }
      } catch (error) {
        // JSON 파싱 오류는 무시하고 계속 진행
      }
    },
    onclose() {
      onEnd && onEnd();
    },
    onerror(err) {
      if (tries <= 0) {
        throw err;
      }
      tries--;
    }
  });

  return {
    fullText,
    completionTokenCount
  };
}

export namespace Ai {
  export async function chatStream(args: AiCopilotChatStreamArgs): Promise<string> {
    let fullText = '';

    const version = OpenAiStore.getVersion();
    if (['full-beta', 'enterprise', 'openrouter'].includes(version)) {
      const result = await directChatOpenAi(args);
      fullText = result.fullText;
    } else {
      throw 'Invalid AI version.';
    }

    return fullText;
  }
}
