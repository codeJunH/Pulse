import React, { useEffect, useState, useRef } from 'react';

import { OpenAiStore } from '@noodl-store/AiAssistantStore';
import { EditorSettings } from '@noodl-utils/editorsettings';
import { tracker } from '@noodl-utils/tracker';
import { verifyOpenAiApiKey } from '@noodl-models/AiAssistant/api';

import { BasePanel } from '@noodl-core-ui/components/sidebar/BasePanel';
import { Center } from '@noodl-core-ui/components/layout/Center';
import { ScrollArea } from '@noodl-core-ui/components/layout/ScrollArea';
import { Text, TextType, TextSize } from '@noodl-core-ui/components/typography/Text';
import { Label, LabelSize } from '@noodl-core-ui/components/typography/Label';
import { TextArea } from '@noodl-core-ui/components/inputs/TextArea';
import { PrimaryButton, PrimaryButtonSize } from '@noodl-core-ui/components/inputs/PrimaryButton';
import { Icon, IconName, IconSize } from '@noodl-core-ui/components/common/Icon';

import { AiAssistantModel } from '../../../models/AiAssistant';
import { handleCommand } from '../../Clippy/HackyClippyBackend';
import { 
  PopupItemType, 
  promptToNodeCommands, 
  copilotNodeCommands, 
  comingSoonCommands,
  copilotNodeInstaPromptable 
} from '../../Clippy/ClippyCommandsMetadata';
import { NodeGraphContextTmp } from '@noodl-contexts/NodeGraphContext/NodeGraphContext';
import { ToastLayer } from '../../ToastLayer/ToastLayer';

// Command Tag Component
interface CommandTagProps {
  title: string;
  description: string;
  type: PopupItemType;
  icon: IconName;
  isHighlighted?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

function CommandTag({ title, description, type, icon, isHighlighted, isDisabled, onClick }: CommandTagProps) {
  return (
    <div
      style={{
        padding: '8px',
        borderRadius: '4px',
        cursor: isDisabled ? 'default' : 'pointer',
        backgroundColor: isHighlighted ? 'var(--theme-color-bg-1)' : 'transparent',
        opacity: isDisabled ? 0.5 : 1,
        border: '1px solid var(--theme-color-bg-1)',
        marginBottom: '4px'
      }}
      onClick={isDisabled ? undefined : onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            backgroundColor: type === PopupItemType.Visual ? '#6366F1' : 
                           type === PopupItemType.Data ? '#10B981' : '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon icon={icon} size={IconSize.Tiny} variant={TextType.DefaultContrast} />
        </div>
        <div style={{ flex: 1 }}>
          <Label variant={TextType.Proud} size={LabelSize.Small}>{title}</Label>
          <Text size={TextSize.Small} textType={TextType.Shy}>{description}</Text>
        </div>
      </div>
    </div>
  );
}

// Section Title Component
function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ margin: '12px 0 8px 0' }}>
      <Label variant={TextType.Shy} size={LabelSize.Small}>
        {title}
      </Label>
    </div>
  );
}

export function AiChatPanel() {
  const [enableAi, setEnableAi] = useState(OpenAiStore.getVersion() !== 'disabled');
  const [inputValue, setInputValue] = useState('/');
  const [isThinking, setIsThinking] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasGPT4, setHasGPT4] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const group = {};
    EditorSettings.instance.on(
      'updated',
      () => {
        setEnableAi(OpenAiStore.getVersion() !== 'disabled');
      },
      group
    );
    return function () {
      EditorSettings.instance.off(group);
    };
  }, []);

  // API Key와 GPT4 상태 확인
  useEffect(() => {
    const version = OpenAiStore.getVersion();
    console.log('AiChatPanel useEffect - version:', version);
    
    if (version === 'enterprise') {
      setHasApiKey(true);
      setHasGPT4(OpenAiStore.getModel() === 'gpt-4o-mini');
    } else if (version === 'openrouter') {
      const apiKey = OpenAiStore.getApiKey();
      console.log('AiChatPanel OpenRouter API Key exists:', !!apiKey);
      setHasApiKey(!!apiKey);
      setHasGPT4(true); // OpenRouter는 다양한 모델 지원
    } else if (version === 'full-beta') {
      setHasApiKey(OpenAiStore.getIsAiApiKeyVerified());
      setHasGPT4(false); // 초기값, 아래 useEffect에서 검증
    } else {
      setHasGPT4(false);
      setHasApiKey(false);
    }
  }, [enableAi]);

  useEffect(() => {
    if (!hasApiKey) return;

    async function checkGPT4() {
      const version = OpenAiStore.getVersion();
      if (version === 'enterprise') {
        setHasGPT4(OpenAiStore.getModel() === 'gpt-4o-mini');
      } else if (version === 'openrouter') {
        setHasGPT4(true); // OpenRouter는 다양한 모델 지원
        console.log('AiChatPanel OpenRouter hasGPT4 set to true');
      } else if (version === 'full-beta') {
        try {
          const models = await verifyOpenAiApiKey(OpenAiStore.getApiKey());
          setHasGPT4(!!models['gpt-4o-mini']);
        } catch (e) {
          setHasGPT4(false);
        }
      }
    }

    checkGPT4();
  }, [hasApiKey]);

  // 명령어 필터링
  const nodeGraphContext = NodeGraphContextTmp;
  const isFrontend = nodeGraphContext.active === 'frontend';
  const currentVersion = OpenAiStore.getVersion();
  const commandFilter = (x) =>
    ((x.availableOnFrontend && isFrontend) || (x.availableOnBackend && !isFrontend)) &&
    (!x.requireGPT4 || (x.requireGPT4 && hasGPT4) || 
     (currentVersion === 'enterprise' || currentVersion === 'openrouter') && x.title !== '/Image');

  const promptToNode = promptToNodeCommands.filter(commandFilter);
  const copilotNodes = copilotNodeCommands.filter(commandFilter);
  const comingSoonItems = comingSoonCommands.filter(commandFilter);
  const disabledDueToGpt3Items = promptToNodeCommands
    .concat(copilotNodeCommands)
    .concat(comingSoonCommands)
    .filter((x) => x.requireGPT4 && !hasGPT4 && 
             (currentVersion !== 'enterprise' && currentVersion !== 'openrouter' || x.title === '/Image'));

  const ALL_OPTIONS = [...promptToNode, ...copilotNodes];

  // 입력값이 / 로 시작하는지 확인
  const isCommandMode = inputValue.startsWith('/');
  const highlightedOption = isCommandMode 
    ? ALL_OPTIONS.find((item) => item.title.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1)
    : null;

  const selectedOption = selectedCommand ? ALL_OPTIONS.find((item) => item.title === selectedCommand) : null;

  const handleSubmit = async () => {
    if (!inputValue.trim() || isThinking || inputValue === '/') return;

    // 명령어 모드인 경우
    if (isCommandMode && !selectedCommand) {
      if (highlightedOption) {
        setSelectedCommand(highlightedOption.title);
        setInputValue('');
        return;
      }
    }

    const prompt = inputValue.trim();
    const command = selectedOption?.title.toLowerCase() || 'chat';
    
    setInputValue('/');
    setIsThinking(true);

    try {
      const id = new Date().getTime().toString();
      
      tracker.track('AI Command', {
        command,
        prompt
      });

      AiAssistantModel.instance.addActivity({
        id,
        type: selectedOption?.type || PopupItemType.Custom,
        title: selectedOption?.title || 'Chat',
        prompt,
        graph: NodeGraphContextTmp.nodeGraph.activeComponent
      });

      if (selectedOption && copilotNodeInstaPromptable.includes(selectedOption.title.toLowerCase())) {
        // 즉시 프롬프트 가능한 명령어인 경우
        await handleCommand(command, prompt, { nodeGraph: NodeGraphContextTmp.nodeGraph }, (status) => {
          // Status updates can be handled here if needed
        });
      } else if (selectedOption) {
        // 노드 생성이 필요한 명령어인 경우
        const panAndScale = NodeGraphContextTmp.nodeGraph.getPanAndScale();
        const x = Math.round(Math.random() * 100 + 50);
        const y = Math.round(Math.random() * 100 + 50);
        const scaledPos = {
          x: x / panAndScale.scale - panAndScale.x,
          y: y / panAndScale.scale - panAndScale.y
        };

        const copilotCommand = copilotNodes.find(cmd => cmd.title === selectedOption.title);
        if (copilotCommand) {
          AiAssistantModel.instance.createNode(copilotCommand.templateId, null, scaledPos);
        }
      } else {
        // 일반 채팅
        await handleCommand(command, prompt, { nodeGraph: NodeGraphContextTmp.nodeGraph }, (status) => {
          // Status updates can be handled here if needed
        });
      }

      AiAssistantModel.instance.removeActivity(id);
      setSelectedCommand(null);
    } catch (e) {
      console.log(e);
      ToastLayer.showError(e.toString());
    } finally {
      setIsThinking(false);
      inputRef.current?.focus();
    }
  };

  const handleCommandSelect = (command: any) => {
    if (copilotNodeInstaPromptable.includes(command.title.toLowerCase())) {
      setSelectedCommand(command.title);
      setInputValue('');
    } else {
      // 노드 생성
      const panAndScale = NodeGraphContextTmp.nodeGraph.getPanAndScale();
      const x = Math.round(Math.random() * 100 + 50);
      const y = Math.round(Math.random() * 100 + 50);
      const scaledPos = {
        x: x / panAndScale.scale - panAndScale.x,
        y: y / panAndScale.scale - panAndScale.y
      };

      const copilotCommand = copilotNodes.find(cmd => cmd.title === command.title);
      if (copilotCommand) {
        AiAssistantModel.instance.createNode(copilotCommand.templateId, null, scaledPos);
      }
    }
  };

  const isFullBeta = ['full-beta', 'enterprise', 'openrouter'].includes(currentVersion);
  let isCommandsEnabled = false;
  
  if (currentVersion === 'enterprise') {
    isCommandsEnabled = true;
  } else if (currentVersion === 'openrouter') {
    // OpenRouter의 경우 API 키만 있으면 활성화
    isCommandsEnabled = !!hasApiKey;
    console.log('AiChatPanel OpenRouter - hasApiKey:', hasApiKey, 'isCommandsEnabled:', isCommandsEnabled);
  } else if (isFullBeta) {
    if (hasGPT4 && hasApiKey) {
      isCommandsEnabled = true;
    }
  }
  
  console.log('AiChatPanel Debug - version:', currentVersion, 'hasApiKey:', hasApiKey, 'hasGPT4:', hasGPT4, 'isCommandsEnabled:', isCommandsEnabled);

  if (!enableAi) {
    return (
      <BasePanel title="Ask Pulse AI">
        <Center>
          <Text textType={TextType.Shy}>AI is disabled. Enable it in the Editor Settings panel.</Text>
        </Center>
      </BasePanel>
    );
  }

  const footerContent = (
    <div style={{ 
      padding: '12px', 
      borderTop: '1px solid var(--theme-color-bg-1)', 
      backgroundColor: 'var(--theme-color-bg-0)'
    }}>
      {selectedCommand && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Text size={TextSize.Small} textType={TextType.Proud}>
            {selectedCommand}
          </Text>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px'
            }}
            onClick={() => {
              setSelectedCommand(null);
              setInputValue('/');
            }}
          >
            <Icon icon={IconName.Close} size={IconSize.Tiny} />
          </button>
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <TextArea
          UNSAFE_className="clippy-textarea"
          value={inputValue}
          UNSAFE_style={{
            minHeight: '60px',
            resize: 'none',
            overflowY: 'auto'
          }}
          onChange={(e) => {
            setInputValue(e.currentTarget.value)
            // Auto-resize
            const textarea = e.currentTarget;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
            if (e.key === 'Escape') {
              setSelectedCommand(null);
              setInputValue('/');
            }
          }}
          placeholder={
            isThinking ? "AI is thinking..." : 
            selectedCommand ? selectedOption?.placeholder || "Enter your prompt..." :
            "Type / for commands or ask anything..."
          }
          isDisabled={isThinking}
        />
        
        <div style={{ display: 'flex' }}>
            <PrimaryButton
                size={PrimaryButtonSize.Small}
                label={isThinking ? "Thinking..." : "Send"}
                isDisabled={!inputValue.trim() || inputValue === '/' || isThinking}
                onClick={handleSubmit}
                UNSAFE_style={{ width: '100%' }}
            />
        </div>
      </div>
    </div>
  );

  return (
    <BasePanel title="Ask Pulse AI" isFill hasContentScroll footerSlot={footerContent}>
      {/* 명령어 목록 영역 */}
      <div style={{ padding: '8px' }}>
        {isCommandMode && isCommandsEnabled && (
          <div>
            {Boolean(copilotNodes.length) && (
              <>
                <SectionTitle title="Copilot nodes" />
                {copilotNodes.map((item) => (
                  <CommandTag
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    type={item.type}
                    icon={item.icon}
                    isHighlighted={highlightedOption?.title === item.title}
                    onClick={() => handleCommandSelect(item)}
                  />
                ))}
              </>
            )}

            {Boolean(promptToNode.length) && (
              <>
                <SectionTitle title="Experimental features" />
                {promptToNode.map((item) => (
                  <CommandTag
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    type={item.type}
                    icon={item.icon}
                    isHighlighted={highlightedOption?.title === item.title}
                    onClick={() => setSelectedCommand(item.title)}
                  />
                ))}
              </>
            )}

            {Boolean(disabledDueToGpt3Items.length) && (
              <>
                <SectionTitle title="Requires a key with GPT4 support" />
                {disabledDueToGpt3Items.map((item) => (
                  <CommandTag
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    type={item.type}
                    icon={item.icon}
                    isDisabled={true}
                  />
                ))}
              </>
            )}

            {Boolean(comingSoonItems.length) && (
              <>
                <SectionTitle title="Coming soon" />
                {comingSoonItems.map((item) => (
                  <CommandTag
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    type={item.type}
                    icon={item.icon}
                    isDisabled={true}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {selectedCommand && (
          <div>
            <SectionTitle title={`Selected: ${selectedCommand}`} />
            <Text size={TextSize.Small} textType={TextType.Shy} style={{ marginBottom: '12px' }}>
              {selectedOption?.description}
            </Text>
            {selectedOption?.examples && (
              <>
                <SectionTitle title="Example prompts" />
                {selectedOption.examples.map((example, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid var(--theme-color-bg-1)',
                      marginBottom: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setInputValue(example)}
                  >
                    <Text size={TextSize.Small}>"{example}"</Text>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {!isCommandMode && !selectedCommand && (
          <div style={{ padding: '8px' }}>
            <Text textType={TextType.Shy} size={TextSize.Small}>
              Ask me anything about Noodl or type / to see available commands.
            </Text>
          </div>
        )}
      </div>
    </BasePanel>
  );
} 