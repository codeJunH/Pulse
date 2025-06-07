import { AiNodeTemplate } from '@noodl-models/AiAssistant/interfaces';
import { ToastLayer } from '../../../views/ToastLayer/ToastLayer';
import { ChatMessageType } from '@noodl-models/AiAssistant/ChatHistory';
import { AiCopilotContext } from '../AiCopilotContext';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { NodeGraphModel } from '@noodl-models/nodegraphmodel/NodeGraphModel';

export const template: AiNodeTemplate = {
  type: 'green', // Or another appropriate color
  name: 'ChatAssistant',
  onMessage: async (context) => {
    const activityId = 'processing';

    context.chatHistory.addActivity({
      id: activityId,
      name: 'Processing your request...'
    });

    try {
      const userPrompt = context.chatHistory.messages[context.chatHistory.messages.length - 1]?.content;

      if (!userPrompt) {
        throw new Error('No prompt found.');
      }

      // --- 1. Noodl 공식 문서 참조 (Context7을 통해 가져온 실제 스니펫 활용) ---
      const simulatedDocSearchResult = searchNoodlDocs(userPrompt); // Context7 스니펫을 활용하는 가상 함수 호출

      // --- 2. 사용자의 프로젝트 구조 분석 (NodeGraphModel을 통해 시뮬레이션) ---
      let projectAnalysisResult: string | null = null;
      if (context.node && context.node.owner) {
        const nodeGraph: NodeGraphModel = context.node.owner;
        let nodesInfo: string[] = [];
        nodeGraph.forEachNode((node: NodeGraphNode) => {
          if (node.typename !== 'ChatAssistant' && node.id !== 'ChatAssistant') {
            nodesInfo.push(`  - 노드 이름: ${node.typename || node.id}`);
          }
          return false; // 모든 노드를 순회하기 위해 false 반환
        });
        if (nodesInfo.length > 0) {
          projectAnalysisResult = `현재 프로젝트에는 다음과 같은 노드들이 있습니다:\n${nodesInfo.join('\n')}`;
        } else {
          projectAnalysisResult = `현재 프로젝트에 노드가 없습니다.`;
        }
      } else {
        projectAnalysisResult = `프로젝트 구조를 분석할 수 없습니다.`;
      }

      // --- 3. AI 답변 생성 ---
      let aiResponse = '';
      if (simulatedDocSearchResult || projectAnalysisResult) {
        aiResponse = `사용자님의 질문 \"${userPrompt}\"에 대해 Noodl 공식 문서와 프로젝트 구조를 바탕으로 답변을 준비했습니다.\n\n`;
        if (simulatedDocSearchResult) {
          aiResponse += `**문서 참조:** ${simulatedDocSearchResult}\n\n`;
        }
        if (projectAnalysisResult) {
          aiResponse += `**프로젝트 분석:** ${projectAnalysisResult}\n\n`;
        }
        // 노드 생성 및 연결에 대한 답변 예시를 포함
        const nodeSuggestion = generateNoodlNodeSuggestion(userPrompt); // 가상의 함수 호출
        if (nodeSuggestion) {
            aiResponse += `**제안:** ${nodeSuggestion}`;
        } else {
            aiResponse += `더 구체적인 도움이 필요하시면 언제든지 말씀해 주세요! 예를 들어:\n• 버튼 클릭 이벤트 처리\n• 데이터 저장 및 불러오기\n• API 호출 방법\n• UI 컴포넌트 연결\n• 사용자 인증 구현\n\n원하시는 기능을 알려주시면 더 자세한 가이드를 제공해드리겠습니다.`;
        }

      } else {
        aiResponse = `죄송합니다. \"${userPrompt}\"에 대한 구체적인 정보를 찾을 수 없었습니다.\n\n하지만 다음과 같은 일반적인 작업들에 대해서는 도움을 드릴 수 있습니다:\n• 노드 생성 및 연결\n• 데이터 바인딩\n• 이벤트 처리\n• 컴포넌트 구조 설계\n• Noodl 기본 기능 활용\n\n더 구체적인 질문을 해주시면 정확한 가이드를 제공해드리겠습니다!`;
      }


      context.chatHistory.add({ type: ChatMessageType.Assistant, content: aiResponse });
      context.chatHistory.removeActivity(activityId);
    } catch (error) {
      ToastLayer.showError(error.message);
      context.chatHistory.clearActivities();
    }
  }
};

// --- 가상의 함수 정의 (Context7을 통해 가져온 실제 스니펫을 기반으로 업데이트) ---
function searchNoodlDocs(query: string): string | null {
    const lowerCaseQuery = query.toLowerCase();
    const relevantSnippets: { title: string; description: string; source: string }[] = [
        {
            title: "Build and Run Noodl Editor from Source",
            description: "These npm commands are used for managing the Noodl Editor when building from source.",
            source: "https://github.com/the-low-code-foundation/opennoodl/blob/main/README.md#_snippet_1"
        },
        {
            title: "Read JSON File using Noodl Filesystem",
            description: "This snippet illustrates how to read a JSON file using the Noodl platform's `filesystem` module.",
            source: "https://github.com/the-low-code-foundation/opennoodl/blob/main/packages/noodl-platform/README.md#_snippet_4"
        },
        {
            title: "Perform Noodl JSON Storage Operations",
            description: "This TypeScript example demonstrates common operations with Noodl's `JSONStorage` for persistent configuration.",
            source: "https://github.com/the-low-code-foundation/opennoodl/blob/main/packages/noodl-platform/README.md#_snippet_5"
        },
        {
            title: "Register Sidebar Panel with Noodl SidebarModel",
            description: "Registers the previously defined `UndoQueuePanelView` as a new sidebar panel within the Noodl application.",
            source: "https://github.com/the-low-code-foundation/opennoodl/blob/main/packages/noodl-editor/docs/sidebar.md#_snippet_1"
        },
        {
            title: "JSON Condition: Check Node Existence by Path",
            description: "Defines a JSON condition to verify the existence or non-existence of a node at a specified path.",
            source: "https://github.com/the-low-code-foundation/opennoodl/blob/main/packages/noodl-editor/docs/interactive-lessons.md#_snippet_5"
        },
        {
            title: "JSON Condition: Check Node Connection",
            description: "Defines a JSON condition to verify if a connection exists between two specified nodes and their respective ports.",
            source: "https://github.com/the-low-code-foundation/opennoodl/blob/main/packages/noodl-editor/docs/interactive-lessons.md#_snippet_6"
        }
    ];

    for (const snippet of relevantSnippets) {
        if (lowerCaseQuery.includes(snippet.title.toLowerCase()) || lowerCaseQuery.includes(snippet.description.toLowerCase())) {
            return `${snippet.title} (${snippet.source}): ${snippet.description}`;
        }
    }
    return null;
}

// 사용자 질문에 따라 Noodl 노드 생성 및 연결을 제안하는 로직
function generateNoodlNodeSuggestion(prompt: string): string | null {
    const lowerCasePrompt = prompt.toLowerCase();

    if (lowerCasePrompt.includes('버튼') && lowerCasePrompt.includes('클릭') && lowerCasePrompt.includes('액션')) {
        return "버튼 클릭 시 동작을 수행하려면 'Button' 노드의 'Clicked' 출력 포트를 'Action' 노드의 'Run' 입력 포트에 연결해야 합니다. 특정 로직을 구현하려면 Action 노드의 'Function' 속성에 JavaScript 코드를 추가하세요.";
    } else if (lowerCasePrompt.includes('텍스트') && lowerCasePrompt.includes('표시') && lowerCasePrompt.includes('동적')) {
        return "동적인 텍스트를 표시하려면 'Text' 노드를 사용하고, 텍스트 소스로 'Variable' 노드 또는 'Object' 노드의 속성을 'Text' 노드의 'Text' 입력 포트에 연결하세요.";
    } else if (lowerCasePrompt.includes('데이터') && lowerCasePrompt.includes('저장') && lowerCasePrompt.includes('클라우드')) {
        return "클라우드에 데이터를 저장하려면 'Create Record' 노드를 사용하세요. 먼저 'Cloud Service'를 설정하고, 'Class'를 정의한 다음, Create Record 노드의 'Class' 속성에 해당 클래스를 지정하고 'Data' 속성에 저장할 데이터를 연결하세요.";
    } else if (lowerCasePrompt.includes('리스트') && lowerCasePrompt.includes('반복') && lowerCasePrompt.includes('데이터')) {
        return "데이터 목록을 반복하여 UI 요소를 생성하려면 'List' 노드와 'Repeater' 노드를 함께 사용하세요. List 노드의 출력에 데이터 배열을 연결하고, Repeater 노드 내부에 반복될 UI 컴포넌트를 생성하세요.";
    } else if (lowerCasePrompt.includes('api') && lowerCasePrompt.includes('호출') && lowerCasePrompt.includes('외부')) {
        return "외부 API를 호출하려면 'Fetch API' 노드를 사용하세요. 'URL' 입력 포트에 API 엔드포인트를 지정하고, 필요한 경우 'Headers' 및 'Body' 속성을 설정하세요. API 응답은 'Response' 출력 포트로 연결됩니다.";
    } else if (lowerCasePrompt.includes('파일') && lowerCasePrompt.includes('읽기') && lowerCasePrompt.includes('json')) {
        return "JSON 파일을 읽으려면 @noodl/platform에서 filesystem 모듈을 가져와 filesystem.readJson(\"path/to/file.json\") 메서드를 사용하세요. 이 메서드는 파싱된 JSON 콘텐츠를 반환하는 Promise를 반환합니다. (Read JSON File using Noodl Filesystem)";
    } else if (lowerCasePrompt.includes('데이터') && lowerCasePrompt.includes('저장') && lowerCasePrompt.includes('영구') && lowerCasePrompt.includes('구성')) {
        return "영구 구성을 위해 데이터를 저장하려면 @noodl/platform에서 JSONStorage를 가져와 JSONStorage.set(\"my-key\", { key: \"value\" }) 메서드를 사용하세요. 데이터를 검색하려면 JSONStorage.get(\"my-key\")를 사용하고, 제거하려면 JSONStorage.remove(\"my-key\")를 사용하세요. (Perform Noodl JSON Storage Operations)";
    } else if (lowerCasePrompt.includes('사용자 인증') || lowerCasePrompt.includes('로그인') || lowerCasePrompt.includes('회원가입')) {
        return "Noodl에서 사용자 인증을 구현하려면 'User' 노드와 'Cloud Service'를 활용할 수 있습니다. 예를 들어, 로그인 기능을 만들려면 User 노드의 'Login' 액션 포트를 사용하고, 사용자 입력(이메일, 비밀번호)을 연결해야 합니다. 회원가입은 'Signup' 액션 포트를 통해 구현할 수 있습니다. 자세한 내용은 Noodl의 사용자 관리 관련 문서를 참조하거나, Cloud Service 설정을 확인하세요.";
    }
    return null;
} 