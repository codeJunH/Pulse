// import Store from 'electron-store';

import { EditorSettings } from '@noodl-utils/editorsettings';

// import { decryptString, encryptString } from './_internal/StorageApi';

// const store = new Store<Record<string, string>>({
//   name: 'AiAssistant',
//   encryptionKey: 'b4a5d3b3-5e3e-477e-a978-9d347bc8b834',
//   defaults: {
//     defaultModel: 'gpt-4'
//   }
// });

const AI_ASSISTANT_API_KEY = 'aiAssistant.temporaryApiKey'; // 레거시 키 (full-beta용)
const AI_ASSISTANT_OPENROUTER_API_KEY = 'aiAssistant.openrouter.apiKey';
const AI_ASSISTANT_ENTERPRISE_API_KEY = 'aiAssistant.enterprise.apiKey';
const AI_ASSISTANT_VERSION_KEY = 'aiAssistant.version';
const AI_ASSISTANT_VERIFIED_KEY = 'aiAssistant.verified';
const AI_ASSISTANT_OPENROUTER_VERIFIED_KEY = 'aiAssistant.openrouter.verified';
const AI_ASSISTANT_ENTERPRISE_VERIFIED_KEY = 'aiAssistant.enterprise.verified';
const AI_ASSISTANT_ENDPOINT_KEY = 'aiAssistant.endpoint';
const AI_ASSISTANT_OPENROUTER_ENDPOINT_KEY = 'aiAssistant.openrouter.endpoint';
const AI_ASSISTANT_ENTERPRISE_ENDPOINT_KEY = 'aiAssistant.enterprise.endpoint';
const AI_ASSISTANT_MODEL_KEY = 'aiAssistant.model';
const AI_ASSISTANT_OPENROUTER_MODEL_KEY = 'aiAssistant.openrouter.model';
const AI_ASSISTANT_ENTERPRISE_MODEL_KEY = 'aiAssistant.enterprise.model';
const AI_RULES_KEY = 'aiAssistant.aiRules';

export type AiVersion = 'disabled' | 'full-beta' | 'enterprise' | 'openrouter';

export type AiModel = 
  | 'gpt-3' 
  | 'gpt-4o-mini' 
  | 'gpt-4.1'
  | 'openai/gpt-4o'
  | 'openai/gpt-4o-mini'
  | 'openai/gpt-4o-2024-11-20'
  | 'anthropic/claude-3.5-sonnet'
  | 'anthropic/claude-3.5-sonnet-20241022'
  | 'anthropic/claude-3.5-haiku'
  | 'anthropic/claude-3-haiku'
  | 'google/gemini-2.5-pro-preview'
  | 'google/gemini-2.5-flash-preview-05-20'
  | 'google/gemini-2.0-flash-exp'
  | 'google/gemini-pro-1.5'
  | 'google/gemini-flash-1.5'
  | 'meta-llama/llama-3.1-70b-instruct'
  | 'meta-llama/llama-3.1-8b-instruct'
  | 'meta-llama/llama-3.2-90b-instruct'
  | 'deepseek/deepseek-chat-v3-0324'
  | 'deepseek/deepseek-r1-0528-qwen3-8b'
  | 'deepseek/deepseek-chat'
  | 'deepseek/deepseek-v3'
  | 'deepseek/deepseek-r1'
  | 'qwen/qwen-2.5-72b-instruct';

export const OpenAiStore = {
  isEnabled(): boolean {
    const version = EditorSettings.instance.get(AI_ASSISTANT_VERSION_KEY);
    return version === 'full-beta';
  },
  getVersion(): AiVersion {
    return EditorSettings.instance.get(AI_ASSISTANT_VERSION_KEY) || 'full-beta';
  },
  getPrettyVersion(): string {
    switch (this.getVersion()) {
      case 'full-beta':
        return 'Full Beta';
      case 'enterprise':
        return 'Enterprise';
    }
    return null;
  },
  setVersion(value: AiVersion): void {
    EditorSettings.instance.set(AI_ASSISTANT_VERSION_KEY, value);
  },

  getApiKey() {
    const version = this.getVersion();
    switch (version) {
      case 'openrouter':
        return EditorSettings.instance.get(AI_ASSISTANT_OPENROUTER_API_KEY);
      case 'enterprise':
        return EditorSettings.instance.get(AI_ASSISTANT_ENTERPRISE_API_KEY);
      case 'full-beta':
      default:
        return EditorSettings.instance.get(AI_ASSISTANT_API_KEY);
    }
  },
  async setApiKey(value: string) {
    const version = this.getVersion();
    switch (version) {
      case 'openrouter':
        EditorSettings.instance.set(AI_ASSISTANT_OPENROUTER_API_KEY, value);
        break;
      case 'enterprise':
        EditorSettings.instance.set(AI_ASSISTANT_ENTERPRISE_API_KEY, value);
        break;
      case 'full-beta':
      default:
        EditorSettings.instance.set(AI_ASSISTANT_API_KEY, value);
        break;
    }
  },
  setIsAiApiKeyVerified(value: boolean) {
    const version = this.getVersion();
    switch (version) {
      case 'openrouter':
        EditorSettings.instance.set(AI_ASSISTANT_OPENROUTER_VERIFIED_KEY, value);
        break;
      case 'enterprise':
        EditorSettings.instance.set(AI_ASSISTANT_ENTERPRISE_VERIFIED_KEY, value);
        break;
      case 'full-beta':
      default:
        EditorSettings.instance.set(AI_ASSISTANT_VERIFIED_KEY, value);
        break;
    }
  },
  getIsAiApiKeyVerified() {
    const version = this.getVersion();
    switch (version) {
      case 'openrouter':
        return !!EditorSettings.instance.get(AI_ASSISTANT_OPENROUTER_VERIFIED_KEY);
      case 'enterprise':
        return !!EditorSettings.instance.get(AI_ASSISTANT_ENTERPRISE_VERIFIED_KEY);
      case 'full-beta':
      default:
        return !!EditorSettings.instance.get(AI_ASSISTANT_VERIFIED_KEY);
    }
  },
  setEndpoint(value: string) {
    const version = this.getVersion();
    switch (version) {
      case 'openrouter':
        EditorSettings.instance.set(AI_ASSISTANT_OPENROUTER_ENDPOINT_KEY, value);
        break;
      case 'enterprise':
        EditorSettings.instance.set(AI_ASSISTANT_ENTERPRISE_ENDPOINT_KEY, value);
        break;
      case 'full-beta':
      default:
        EditorSettings.instance.set(AI_ASSISTANT_ENDPOINT_KEY, value);
        break;
    }
  },
  getEndpoint() {
    const version = this.getVersion();
    switch (version) {
      case 'openrouter':
        return EditorSettings.instance.get(AI_ASSISTANT_OPENROUTER_ENDPOINT_KEY);
      case 'enterprise':
        return EditorSettings.instance.get(AI_ASSISTANT_ENTERPRISE_ENDPOINT_KEY);
      case 'full-beta':
      default:
        return EditorSettings.instance.get(AI_ASSISTANT_ENDPOINT_KEY);
    }
  },
  setModel(value: AiModel) {
    const version = this.getVersion();
    switch (version) {
      case 'openrouter':
        EditorSettings.instance.set(AI_ASSISTANT_OPENROUTER_MODEL_KEY, value);
        break;
      case 'enterprise':
        EditorSettings.instance.set(AI_ASSISTANT_ENTERPRISE_MODEL_KEY, value);
        break;
      case 'full-beta':
      default:
        EditorSettings.instance.set(AI_ASSISTANT_MODEL_KEY, value);
        break;
    }
  },
  getModel(): AiModel {
    const version = this.getVersion();
    switch (version) {
      case 'openrouter':
        return EditorSettings.instance.get(AI_ASSISTANT_OPENROUTER_MODEL_KEY) || 'openai/gpt-4o-mini';
      case 'enterprise':
        return EditorSettings.instance.get(AI_ASSISTANT_ENTERPRISE_MODEL_KEY) || 'gpt-4o-mini';
      case 'full-beta':
      default:
        return EditorSettings.instance.get(AI_ASSISTANT_MODEL_KEY) || 'gpt-3';
    }
  },
  getAiRules(): string {
    return EditorSettings.instance.get(AI_RULES_KEY) || '';
  },
  setAiRules(rules: string) {
    EditorSettings.instance.set(AI_RULES_KEY, rules);
  }
};
