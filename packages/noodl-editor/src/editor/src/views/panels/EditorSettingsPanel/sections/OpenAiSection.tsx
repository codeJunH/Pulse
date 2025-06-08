import { AiModel, AiVersion, OpenAiStore } from '@noodl-store/AiAssistantStore';
import React, { useState, useEffect } from 'react';
import { platform } from '@noodl/platform';

import { verifyOpenAiApiKey } from '@noodl-models/AiAssistant/api';

import { PrimaryButton, PrimaryButtonSize, PrimaryButtonVariant } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Box } from '@noodl-core-ui/components/layout/Box';
import { VStack } from '@noodl-core-ui/components/layout/Stack';
import { PropertyPanelButton } from '@noodl-core-ui/components/property-panel/PropertyPanelButton';
import { PropertyPanelRow } from '@noodl-core-ui/components/property-panel/PropertyPanelInput';
import { PropertyPanelPasswordInput } from '@noodl-core-ui/components/property-panel/PropertyPanelPasswordInput';
import { PropertyPanelSelectInput } from '@noodl-core-ui/components/property-panel/PropertyPanelSelectInput';
import { PropertyPanelTextInput } from '@noodl-core-ui/components/property-panel/PropertyPanelTextInput';
import { TextArea } from '@noodl-core-ui/components/inputs/TextArea';
import { CollapsableSection } from '@noodl-core-ui/components/sidebar/CollapsableSection';
import { Text } from '@noodl-core-ui/components/typography/Text';
import { Title, TitleSize } from '@noodl-core-ui/components/typography/Title';

import { ToastLayer } from '../../../ToastLayer/ToastLayer';

export const AI_ASSISTANT_ENABLED_SUGGESTIONS_KEY = 'aiAssistant.enabledSuggestions';

export function OpenAiSection() {
  const [enabledState, setEnabledState] = useState<AiVersion>(OpenAiStore.getVersion() || 'disabled');
  const [apiKey, setApiKey] = useState(OpenAiStore.getApiKey() || '');
  const [endpoint, setEndpoint] = useState(OpenAiStore.getEndpoint() || '');
  const [model, setModel] = useState<AiModel>(OpenAiStore.getModel() || 'gpt-3');
  const [aiRules, setAiRules] = useState(OpenAiStore.getAiRules() || '');

  // 모드 변경 시 해당 모드의 설정을 로드
  useEffect(() => {
    setApiKey(OpenAiStore.getApiKey() || '');
    setEndpoint(OpenAiStore.getEndpoint() || '');
    setModel(OpenAiStore.getModel());
  }, [enabledState]);

  async function onVerifyApiKey() {
    const models = await verifyOpenAiApiKey(apiKey);
    if (models) {
      const haveGpt4 = !!models['gpt-4o-mini'];
      if (haveGpt4) {
        OpenAiStore.setIsAiApiKeyVerified(true);
        ToastLayer.showSuccess('OpenAI API Key is valid with GPT-4!');
      } else {
        OpenAiStore.setIsAiApiKeyVerified(false);
        ToastLayer.showError('OpenAI API Key is missing gpt-4 model Support!');
      }
    } else {
      OpenAiStore.setIsAiApiKeyVerified(false);
      ToastLayer.showError('OpenAI API Key is invalid!');
    }
  }

  async function onTestOpenRouter() {
    try {
      console.log('Testing OpenRouter API...');
      console.log('API Key:', apiKey);
      console.log('Model:', model);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://pulse-editor.local',
          'X-Title': 'Pulse Editor'
        },
        body: JSON.stringify({
          model: model || 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
          max_tokens: 50,
          stream: false
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        ToastLayer.showSuccess('OpenRouter API is working!');
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        ToastLayer.showError(`OpenRouter API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('OpenRouter test error:', error);
      ToastLayer.showError(`OpenRouter Test Failed: ${error.message}`);
    }
  }

  return (
    <CollapsableSection title="Noodl AI (Beta)">
      <Box hasXSpacing>
        <VStack>
          <PropertyPanelRow label="Provider" isChanged={false}>
            <PropertyPanelSelectInput
              value={enabledState}
              properties={{
                options: [
                  { label: 'Disabled', value: 'disabled' },
                  { label: 'OpenAI', value: 'full-beta' },
                  { label: 'OpenRouter', value: 'openrouter' },
                  { label: 'Custom', value: 'enterprise' }
                ]
              }}
              onChange={(value: AiVersion) => {
                setEnabledState(value);
                OpenAiStore.setVersion(value);
                // 모드 변경 후 설정 재로드
                setApiKey(OpenAiStore.getApiKey() || '');
                setEndpoint(OpenAiStore.getEndpoint() || '');
                setModel(OpenAiStore.getModel());
              }}
            />
          </PropertyPanelRow>

          {enabledState === 'disabled' && (
            <Box hasYSpacing>
              <Text>Noodl AI is currently disabled.</Text>
            </Box>
          )}

          {enabledState === 'full-beta' && (
            <>
              <PropertyPanelRow label="Model" isChanged={false}>
                <PropertyPanelSelectInput
                  value={model || 'gpt-3'}
                  properties={{
                    options: [
                      { label: 'gpt-3', value: 'gpt-3' },
                      { label: 'gpt-4', value: 'gpt-4o-mini' }
                    ]
                  }}
                  onChange={(value: AiModel) => {
                    setModel(value);
                    OpenAiStore.setModel(value);
                  }}
                />
              </PropertyPanelRow>
              <PropertyPanelRow label="API Key" isChanged={false}>
                <PropertyPanelPasswordInput
                  value={apiKey || ''}
                  onChange={(value) => {
                    setApiKey(value);
                    OpenAiStore.setApiKey(value);
                  }}
                />
              </PropertyPanelRow>
              <PropertyPanelRow label="API Key" isChanged={false}>
                <PropertyPanelButton
                  properties={{
                    isPrimary: true,
                    buttonLabel: 'Verify API Key',
                    onClick() {
                      onVerifyApiKey();
                    }
                  }}
                />
              </PropertyPanelRow>
              <Box hasYSpacing>
                <Text>Verify your OpenAI API key to start using AI Commands.</Text>
              </Box>
            </>
          )}

          {enabledState === 'openrouter' && (
            <>
              <PropertyPanelRow label="Model" isChanged={false}>
                <PropertyPanelSelectInput
                  value={model || 'openai/gpt-4o-mini'}
                  properties={{
                    options: [
                      { label: 'GPT-4o', value: 'openai/gpt-4o' },
                      { label: 'GPT-4o Mini', value: 'openai/gpt-4o-mini' },
                      { label: 'Claude 3.5 Sonnet', value: 'anthropic/claude-3.5-sonnet' },
                      { label: 'Claude 3.5 Haiku', value: 'anthropic/claude-3.5-haiku' },
                      { label: 'Claude 3 Haiku', value: 'anthropic/claude-3-haiku' },
                      { label: 'Gemini 2.5 Pro Preview', value: 'google/gemini-2.5-pro-preview' },
                      { label: 'Gemini 2.5 Flash Preview', value: 'google/gemini-2.5-flash-preview-05-20' },
                      { label: 'Gemini 2.0 Flash (Experimental)', value: 'google/gemini-2.0-flash-exp' },
                      { label: 'Gemini Pro 1.5', value: 'google/gemini-pro-1.5' },
                      { label: 'Gemini Flash 1.5', value: 'google/gemini-flash-1.5' },
                      { label: 'DeepSeek V3 0324', value: 'deepseek/deepseek-chat-v3-0324' },
                      { label: 'DeepSeek R1 Qwen3 8B', value: 'deepseek/deepseek-r1-0528-qwen3-8b' },
                      { label: 'DeepSeek R1', value: 'deepseek/deepseek-r1' },
                      { label: 'DeepSeek V3', value: 'deepseek/deepseek-v3' },
                      { label: 'DeepSeek Chat', value: 'deepseek/deepseek-chat' },
                      { label: 'Llama 3.2 90B', value: 'meta-llama/llama-3.2-90b-instruct' },
                      { label: 'Llama 3.1 70B', value: 'meta-llama/llama-3.1-70b-instruct' },
                      { label: 'Llama 3.1 8B', value: 'meta-llama/llama-3.1-8b-instruct' },
                      { label: 'Qwen 2.5 72B', value: 'qwen/qwen-2.5-72b-instruct' }
                    ]
                  }}
                  onChange={(value: AiModel) => {
                    setModel(value);
                    OpenAiStore.setModel(value);
                  }}
                />
              </PropertyPanelRow>
              <PropertyPanelRow label="API Key" isChanged={false}>
                <PropertyPanelPasswordInput
                  value={apiKey || ''}
                  onChange={(value) => {
                    setApiKey(value);
                    OpenAiStore.setApiKey(value);
                  }}
                />
              </PropertyPanelRow>
              <PropertyPanelRow label="Test API" isChanged={false}>
                <PropertyPanelButton
                  properties={{
                    isPrimary: true,
                    buttonLabel: 'Test OpenRouter API',
                    onClick() {
                      onTestOpenRouter();
                    }
                  }}
                />
              </PropertyPanelRow>
              <Box hasYSpacing>
                <Text>Get your OpenRouter API key from your OpenRouter account to access various AI models.</Text>
              </Box>
            </>
          )}

          {enabledState === 'enterprise' && (
            <>
              <PropertyPanelRow label="Model" isChanged={false}>
                <PropertyPanelSelectInput
                  value={model || 'gpt-3'}
                  properties={{
                    options: [
                      { label: 'gpt-3', value: 'gpt-3' },
                      { label: 'gpt-4', value: 'gpt-4o-mini' },
                      { label: 'gpt-4.1', value: 'gpt-4.1' }
                    ]
                  }}
                  onChange={(value: AiModel) => {
                    setModel(value);
                    OpenAiStore.setModel(value);
                  }}
                />
              </PropertyPanelRow>
              <PropertyPanelRow label="API Key" isChanged={false}>
                <PropertyPanelPasswordInput
                  value={apiKey || ''}
                  onChange={(value) => {
                    setApiKey(value);
                    OpenAiStore.setApiKey(value);
                  }}
                />
              </PropertyPanelRow>
              <PropertyPanelRow label="Endpoint" isChanged={false}>
                <PropertyPanelTextInput
                  value={endpoint || ''}
                  onChange={(value) => {
                    setEndpoint(value);
                    OpenAiStore.setEndpoint(value);
                  }}
                />
              </PropertyPanelRow>
            </>
          )}

          {enabledState !== 'disabled' && (
            <PropertyPanelRow label="AI Rules" isChanged={false}>
              <TextArea
                value={aiRules || ''}
                onChange={(e) => {
                  setAiRules(e.target.value);
                  OpenAiStore.setAiRules(e.target.value);
                }}
              />
            </PropertyPanelRow>
          )}

          <Box
            hasXSpacing={3}
            hasYSpacing={3}
            UNSAFE_style={{ borderRadius: '2px', background: 'var(--theme-color-bg-3)' }}
          >
            <Title size={TitleSize.Medium} hasBottomSpacing>
              Noodl AI docs
            </Title>
            <Text hasBottomSpacing>See setup instructions and guides for how to use Noodl AI on our docs.</Text>
            <PrimaryButton
              variant={PrimaryButtonVariant.Muted}
              size={PrimaryButtonSize.Small}
              isGrowing
              label="Open docs"
              onClick={() => {
                platform.openExternal('https://docs.noodl.net/#/docs/getting-started/noodl-ai/');
              }}
            />
          </Box>
        </VStack>
      </Box>
    </CollapsableSection>
  );
}
