import { AiNodeTemplate } from '@noodl-models/AiAssistant/interfaces';
import { ToastLayer } from '../../../views/ToastLayer/ToastLayer';
import { ChatMessageType } from '@noodl-models/AiAssistant/ChatHistory';
import { AiCopilotContext } from '../AiCopilotContext';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { NodeGraphModel } from '@noodl-models/nodegraphmodel/NodeGraphModel';
import { OpenAiStore } from '@noodl-store/AiAssistantStore';

export const template: AiNodeTemplate = {
  type: 'green',
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

      // 프로젝트 구조 분석 - 더 체계적으로
      let projectContext = '';
      let nodesByType: { [key: string]: string[] } = {};
      
      if (context.node && context.node.owner) {
        const nodeGraph: NodeGraphModel = context.node.owner;
        
        nodeGraph.forEachNode((node: NodeGraphNode) => {
          if (node.typename !== 'ChatAssistant' && node.id !== 'ChatAssistant') {
            const nodeType = node.typename || 'Unknown';
            const nodeName = node.label || node.id || 'Unnamed';
            
            if (!nodesByType[nodeType]) {
              nodesByType[nodeType] = [];
            }
            nodesByType[nodeType].push(nodeName);
          }
          return false;
        });

        // 프로젝트 컨텍스트 생성
        if (Object.keys(nodesByType).length > 0) {
          projectContext = `Current project analysis:

Node types in use:
${Object.entries(nodesByType).map(([type, nodes]) => 
  `- ${type}: ${nodes.length} node(s) (${nodes.slice(0, 3).join(', ')}${nodes.length > 3 ? '...' : ''})`
).join('\n')}

`;
        }
      }

      // Noodl 문서 참조 - Context7 데이터 기반 (하드코딩 부분 주석처리)
      // const docContext = searchNoodlDocs(userPrompt);
      // let noodlDocumentation = '';
      // if (docContext) {
      //   noodlDocumentation = `Relevant Noodl documentation:\n${docContext}\n\n`;
      // }

      // 노드 연결 제안 생성 (하드코딩 부분 주석처리)
      // const nodeConnectionSuggestion = generateNodeConnectionAdvice(userPrompt, nodesByType);

      // 시스템 컨텍스트 구성 - 실제 AI가 모든 답변 생성
      const systemContext = `You are a helpful Noodl development assistant. You help users build web applications using the Noodl low-code platform.

${projectContext}

Instructions:
- You are an expert in Noodl low-code development
- Provide specific, actionable guidance for Noodl development
- When suggesting node connections, be precise about input/output ports
- Reference the user's existing project structure when relevant
- Include step-by-step instructions for complex workflows
- Suggest specific node types and their configurations
- Explain both the "what" and "why" of your suggestions
- For node connections, use format: "Connect [Source Node]'s '[Output Port]' to [Target Node]'s '[Input Port]'"
- Common Noodl nodes include: Group, Text, Button, Image, Function, Object, Variable, List, Repeater, Router, Navigate, State
- Common ports: Button has 'Clicked' output, Text has 'Text' input, Navigate has 'Navigate' input
- For data storage use Object nodes with properties, for persistence use JSONStorage in Function nodes
- For lists use List + Repeater pattern, for navigation use Router + Navigate pattern

Focus on practical, implementable solutions that work with Noodl's visual programming approach.`;

      // 사용자 AI 룰 가져오기 (한국어로 대답 등)
      const aiRules = OpenAiStore.getAiRules();
      
      // 대화 히스토리 준비
      const history = context.chatHistory.messages.slice(0, -1).map((x) => ({
        role: String(x.type),
        content: x.content
      }));

      // 메시지 구성 (AI 룰이 있으면 시스템 컨텍스트에 포함)
      const messages = [
        {
          role: 'system',
          content: aiRules ? `${aiRules}\n\n${systemContext}` : systemContext
        },
        ...history,
        {
          role: 'user',
          content: userPrompt
        }
      ];

      // 실제 AI API 호출
      context.chatHistory.add({ type: ChatMessageType.Assistant, content: '' });

      const aiResponse = await context.chatStream({
        provider: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          max_tokens: 2048
        },
        messages,
        onStream(fullText) {
          context.chatHistory.updateLast({
            content: fullText
          });
        }
      });

      context.chatHistory.removeActivity(activityId);
    } catch (error) {
      ToastLayer.showError(error.message);
      context.chatHistory.clearActivities();
    }
  }
};

// --- Context7 기반 실제 Noodl 문서 검색 (하드코딩 부분 주석처리) ---
/*
function searchNoodlDocs(query: string): string | null {
    const lowerCaseQuery = query.toLowerCase();
    
    // Context7에서 가져온 실제 OpenNoodl 문서 정보
    const noodlDocs = [
        {
            title: "Node Connection",
            description: "Connect nodes using input/output ports. Example: Connect Button's 'Clicked' output to Text's 'Text' input.",
            keywords: ["connect", "connection", "port", "input", "output", "wire"],
            example: "To connect a Button to a Text node: Drag from Button's 'Clicked' output port to Text's 'Text' input port."
        },
        {
            title: "Page Navigation",
            description: "Use Router Navigate node to navigate between pages. Set target page in parameters.",
            keywords: ["navigate", "page", "router", "navigation", "route"],
            example: "Create a Navigate node, set 'target' parameter to '/Page 2', connect Button's 'Clicked' to Navigate's 'Navigate' input."
        },
        {
            title: "Data Storage",
            description: "Use Object nodes to store data, Variable nodes for simple values. JSON Storage for persistence.",
            keywords: ["data", "store", "object", "variable", "storage", "save"],
            example: "Create Object node with properties like 'url,author'. Use JSONStorage.set('key', value) for persistent storage."
        },
        {
            title: "List and Repeater",
            description: "Create dynamic lists using List and Repeater nodes together.",
            keywords: ["list", "repeat", "repeater", "dynamic", "array"],
            example: "Connect data array to List node, create UI components inside Repeater node for each item."
        },
        {
            title: "API Integration",
            description: "Use Function nodes for custom JavaScript. Access external APIs with fetch.",
            keywords: ["api", "function", "javascript", "fetch", "external"],
            example: "Create Function node, use fetch() in script to call APIs, connect outputs to other nodes."
        },
        {
            title: "Visual Components",
            description: "Group, Text, Button, Image are basic visual components. Use Group for layout containers.",
            keywords: ["group", "text", "button", "image", "visual", "component", "layout"],
            example: "Create Group node as container, add Text and Button as children for UI layout."
        },
        {
            title: "State Management",
            description: "Use State nodes to manage component states with transitions and values.",
            keywords: ["state", "states", "transition", "values", "manage"],
            example: "Create State node with states like 'Visible,Hidden' and values like 'Opacity' for animations."
        }
    ];

    // 키워드 매칭으로 관련 문서 찾기
    for (const doc of noodlDocs) {
        const hasKeywordMatch = doc.keywords.some(keyword => 
            lowerCaseQuery.includes(keyword) || keyword.includes(lowerCaseQuery)
        );
        
        if (hasKeywordMatch) {
            return `**${doc.title}**: ${doc.description}\n\nExample: ${doc.example}`;
        }
    }

    return null;
}
*/

// --- 노드 연결 조언 생성 (하드코딩 부분 주석처리) ---
/*
function generateNodeConnectionAdvice(prompt: string, nodesByType: { [key: string]: string[] }): string {
    const lowerPrompt = prompt.toLowerCase();
    const existingNodeTypes = Object.keys(nodesByType);
    
    let advice = '';

    // 사용자가 가진 노드를 기반으로 연결 제안
    if (existingNodeTypes.length > 0) {
        advice += `\nBased on your existing nodes (${existingNodeTypes.join(', ')}), here are connection suggestions:\n`;
    }

    // 특정 기능별 노드 연결 가이드
    if (lowerPrompt.includes('button') && lowerPrompt.includes('click')) {
        advice += `\nFor button interactions:
1. Use Button node's 'Clicked' output port
2. Connect to target node's input (e.g., Text's 'Text' input for text changes)
3. For navigation: Connect to Navigate node's 'Navigate' input
4. For state changes: Connect to State node's state transition inputs\n`;
    }

    if (lowerPrompt.includes('data') || lowerPrompt.includes('store')) {
        advice += `\nFor data management:
1. Object nodes: Create properties and connect to UI elements
2. Variable nodes: Store single values
3. For persistence: Use Function node with JSONStorage.set('key', value)
4. Connect Object's property outputs to Text's 'Text' input to display data\n`;
    }

    if (lowerPrompt.includes('list') || lowerPrompt.includes('repeat')) {
        advice += `\nFor dynamic lists:
1. Create List node with data array
2. Add Repeater node as child
3. Create UI components inside Repeater (Text, Button, etc.)
4. Connect List's 'Items' output to Repeater's 'Items' input
5. Use Repeater's 'Item' output to access individual items\n`;
    }

    if (lowerPrompt.includes('page') || lowerPrompt.includes('navigate')) {
        advice += `\nFor page navigation:
1. Create Router node in main component
2. Add pages to Router's 'pages' parameter
3. Use Navigate nodes for navigation
4. Connect Button's 'Clicked' to Navigate's 'Navigate' input
5. Set Navigate's 'target' parameter to destination page path\n`;
    }

    return advice;
}
*/ 