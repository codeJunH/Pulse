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
      let nodesByType: { [key:string]: { name: string, id: string }[] } = {};
      const nodeConnections: string[] = [];
      const nodeMap = new Map<string, NodeGraphNode>();
      
      if (context.node && context.node.owner) {
        const nodeGraph: NodeGraphModel = context.node.owner;

        nodeGraph.forEachNode((node: NodeGraphNode) => {
          nodeMap.set(node.id, node);
          
          if (node.typename !== 'ChatAssistant' && node.id !== 'ChatAssistant') {
            const nodeType = node.typename || 'Unknown';
            const nodeName = node.label || node.id || 'Unnamed';
            
            if (!nodesByType[nodeType]) {
              nodesByType[nodeType] = [];
            }
            nodesByType[nodeType].push({ name: nodeName, id: node.id });
          }
          return false;
        });

        if (nodeGraph.connections) {
          for (const connection of nodeGraph.connections) {
            if (nodeConnections.length < 10) {
              const fromNode = nodeMap.get(connection.fromId);
              const toNode = nodeMap.get(connection.toId);

              if(fromNode && toNode) {
                const fromNodeName = fromNode.label || fromNode.typename;
                const toNodeName = toNode.label || toNode.typename;
                nodeConnections.push(`- ${fromNodeName}:'${connection.fromProperty}' -> ${toNodeName}:'${connection.toProperty}'`);
              }
            } else {
              break;
            }
          }
        }
        
        // 프로젝트 컨텍스트 생성
        let contextParts: string[] = [];

        if (Object.keys(nodesByType).length > 0) {
          const nodeSummary = Object.entries(nodesByType).map(([type, nodes]) => 
            `- ${type}: ${nodes.length} node(s) (${nodes.slice(0, 3).map(n => n.name).join(', ')}${nodes.length > 3 ? '...' : ''})`
          ).join('\n');
          contextParts.push(`Node types in use:\n${nodeSummary}`);
        }

        if (nodeConnections.length > 0) {
          contextParts.push(`\nNode Connections:\n${nodeConnections.join('\n')}`);
        }
        
        if(contextParts.length > 0) {
          projectContext = `Current project analysis:\n\n${contextParts.join('\n')}\n`;
        }
      }

      // 향상된 시스템 컨텍스트
      const systemContext = `You are an expert Noodl low-code development assistant. Your goal is to provide clear, concise, and actionable guidance to help users build web applications with Noodl.

Analyze the user's query and the provided project context. Structure your response in two parts: "Summary" and "Actionable Steps".

**1. Summary:**
Start with a brief, high-level summary of the solution or explanation.

**2. Actionable Steps:**
Provide a detailed, step-by-step guide to implement the solution. Use specific Noodl terminology.

- When suggesting node connections, use the format: "Connect [Source Node]'s '[Output Port]' to [Target Node]'s '[Input Port]'".
- Reference the user's existing project structure from the "Current project analysis" when relevant.
- Suggest specific node types (e.g., Group, Text, Button, Function, Object, Variable, List, Repeater, Router, Navigate, State) and their important parameters.
- Explain the "what" and the "why" of your suggestions.

Here is an example of the desired output format:

<example>
**Summary:**
To display a list of products from a database, you need to query the records, and then use a Repeater to dynamically create the UI for each product.

**Actionable Steps:**
1.  **Query Products:** Use a "Query Records" node to fetch data from your 'Products' collection.
2.  **Create a List:** Add a "List" node and connect the "Items" output from the "Query Records" node to the "Items" input of the "List" node.
3.  **Use a Repeater:** Place a "Repeater" node inside a "Group" or other container. Connect the "Items" output of the "List" node to the "Items" input of the "Repeater".
4.  **Design the Item UI:** Inside the "Repeater", design how each product will look. For example, add a "Text" node.
5.  **Display Data:** Connect the "Item" output of the "Repeater" to the "Object" input of the "Text" node. Then, set the "Text" node's "Text" parameter to \`item.name\` to display the product name.
</example>

${projectContext}
`;

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
          model: 'gpt-4o-mini',
          temperature: 0.2,
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