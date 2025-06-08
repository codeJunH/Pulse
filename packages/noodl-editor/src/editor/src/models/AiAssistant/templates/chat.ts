import { AiNodeTemplate } from '@noodl-models/AiAssistant/interfaces';
import { ToastLayer } from '../../../views/ToastLayer/ToastLayer';
import { ChatMessageType } from '@noodl-models/AiAssistant/ChatHistory';
import { AiCopilotContext } from '../AiCopilotContext';
import { NodeGraphNode } from '@noodl-models/nodegraphmodel';
import { NodeGraphModel } from '@noodl-models/nodegraphmodel/NodeGraphModel';
import { OpenAiStore } from '@noodl-store/AiAssistantStore';

// 심화 분석을 위한 헬퍼 함수들
function analyzeNodeRole(nodeType: string): string {
  const uiNodes = ['Text', 'Button', 'Image', 'Group', 'Columns', 'Input'];
  const logicNodes = ['Function', 'Object', 'Variable', 'State'];
  const navigationNodes = ['Router', 'Navigate', 'Page'];
  const dataNodes = ['List', 'Repeater', 'RestRequest', 'CloudFunction'];
  
  if (uiNodes.includes(nodeType)) return 'UI';
  if (logicNodes.includes(nodeType)) return 'Logic';
  if (navigationNodes.includes(nodeType)) return 'Navigation';
  if (dataNodes.includes(nodeType)) return 'Data';
  return 'Other';
}

function calculateNodeImportance(nodeType: string): number {
  const criticalNodes = ['Router', 'Page', 'Component'];
  const importantNodes = ['Function', 'Object', 'RestRequest', 'CloudFunction'];
  const moderateNodes = ['List', 'Repeater', 'State', 'Variable'];
  
  if (criticalNodes.includes(nodeType)) return 10;
  if (importantNodes.includes(nodeType)) return 8;
  if (moderateNodes.includes(nodeType)) return 6;
  return 4;
}

function analyzeDataFlowPattern(fromNode: NodeGraphNode, toNode: NodeGraphNode, connection: any, patterns: string[]): void {
  const fromType = fromNode.typename;
  const toType = toNode.typename;
  const property = connection.fromProperty;

  // 일반적인 데이터 플로우 패턴 감지
  if (fromType === 'Object' && property === 'item' && toType === 'Text') {
    patterns.push('Object → Text data binding detected');
  }
  if (fromType === 'List' && toType === 'Repeater') {
    patterns.push('List → Repeater pattern for dynamic content');
  }
  if (fromType === 'Function' && property === 'result' && toType === 'Object') {
    patterns.push('Function → Object result processing');
  }
  if (fromType === 'Button' && property === 'clicked' && toType === 'Navigate') {
    patterns.push('Button → Navigate interaction pattern');
  }
}

function detectArchitecturalIssues(fromNode: NodeGraphNode, toNode: NodeGraphNode, connection: any, issues: string[]): void {
  const fromType = fromNode.typename;
  const toType = toNode.typename;

  // UI 노드가 직접 데이터 노드에 연결된 경우
  if (['Button', 'Text', 'Input'].includes(fromType) && ['Object', 'Variable'].includes(toType)) {
    issues.push(`Direct UI → Data coupling: ${fromType} → ${toType} (consider using intermediate logic)`);
  }
  
  // 과도한 연결 복잡성
  // 이는 dependencyGraph에서 별도로 체크
}

function detectCircularDependencies(dependencyGraph: Map<string, any>, issues: string[]): void {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      issues.push(`Circular dependency detected involving node: ${nodeId}`);
      return true;
    }
    
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const deps = dependencyGraph.get(nodeId);
    if (deps) {
      for (const depId of deps.dependsOn) {
        if (dfs(depId)) {
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const nodeId of dependencyGraph.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId);
    }
  }
}

function analyzeOptimizationOpportunities(nodesByType: any, dependencyGraph: Map<string, any>, opportunities: string[]): void {
  // 사용되지 않는 노드 감지
  let unusedNodes = 0;
  for (const [nodeId, deps] of dependencyGraph.entries()) {
    if (deps.dependents.length === 0 && deps.dependsOn.length === 0) {
      unusedNodes++;
    }
  }
  if (unusedNodes > 0) {
    opportunities.push(`${unusedNodes} potentially unused nodes detected`);
  }

  // 과도한 Function 노드 사용
  if (nodesByType['Function'] && nodesByType['Function'].length > 5) {
    opportunities.push('Consider consolidating multiple Function nodes for better maintainability');
  }

  // State 관리 최적화
  if (nodesByType['Variable'] && nodesByType['Variable'].length > 10) {
    opportunities.push('Consider using Object nodes instead of multiple Variables for related data');
  }
}

// Context7을 통한 Noodl 공식 문서 검색 함수
async function searchNoodlDocsWithContext7(query: string): Promise<string | null> {
  // 키워드 기반 토픽 결정
  const lowerQuery = query.toLowerCase();
  let topic = '';
  
  if (lowerQuery.includes('connect') || lowerQuery.includes('connection') || lowerQuery.includes('port')) {
    topic = 'node connections ports';
  } else if (lowerQuery.includes('navigate') || lowerQuery.includes('page') || lowerQuery.includes('router')) {
    topic = 'navigation routing pages';
  } else if (lowerQuery.includes('data') || lowerQuery.includes('object') || lowerQuery.includes('variable')) {
    topic = 'data management storage';
  } else if (lowerQuery.includes('list') || lowerQuery.includes('repeat')) {
    topic = 'list repeater dynamic content';
  } else if (lowerQuery.includes('function') || lowerQuery.includes('javascript')) {
    topic = 'function javascript logic';
  } else if (lowerQuery.includes('ui') || lowerQuery.includes('layout') || lowerQuery.includes('group')) {
    topic = 'UI layout components';
  } else {
    topic = 'general noodl usage patterns';
  }

  try {
    // 실제 환경에서는 Context7 MCP 도구를 사용해야 하지만,
    // 여기서는 미리 가져온 문서 정보를 활용
    const noodlKnowledge = [
      {
        title: "Node Connections",
        content: "Connect nodes using input/output ports. Example: Connect Button's 'Clicked' output to Text's 'Text' input. Drag from source output port to target input port.",
        keywords: ["connect", "connection", "port", "input", "output", "wire", "drag"]
      },
      {
        title: "Page Navigation", 
        content: "Use Router and Navigate nodes for page navigation. Router manages pages, Navigate triggers transitions. Set Router's 'pages' parameter, connect Button's 'Clicked' to Navigate's 'Navigate' input.",
        keywords: ["navigate", "page", "router", "navigation", "route", "transition"]
      },
      {
        title: "Data Management",
        content: "Object nodes store structured data with properties. Variable nodes store single values. For persistence, use JSONStorage.set('key', value) in Function nodes. Connect Object property outputs to UI inputs.",
        keywords: ["data", "store", "object", "variable", "storage", "save", "properties", "json"]
      },
      {
        title: "Dynamic Lists",
        content: "Create dynamic lists using List and Repeater nodes together. List holds array data, Repeater creates instances. Connect List's 'Items' output to Repeater's 'Items' input. Add UI components inside Repeater.",
        keywords: ["list", "repeat", "repeater", "dynamic", "array", "items"]
      },
      {
        title: "JavaScript Functions",
        content: "Function nodes enable custom JavaScript logic. Define inputs/outputs, write code in editor. Use for API calls with fetch(), data processing, complex logic. Connect inputs/outputs to other nodes.",
        keywords: ["function", "javascript", "logic", "api", "fetch", "custom", "code"]
      },
      {
        title: "UI Layout",
        content: "Group nodes act as containers for layout. Text, Button, Image are basic visual components. Use Columns for horizontal layout. Set positioning with align properties, sizing with width/height.",
        keywords: ["ui", "layout", "group", "text", "button", "image", "visual", "component", "container"]
      },
      {
        title: "State Management",
        content: "State nodes manage component states with transitions. Define states (e.g., 'Visible,Hidden') and values (e.g., 'Opacity'). Connect state changes to trigger animations and UI updates.",
        keywords: ["state", "states", "transition", "values", "animation", "manage"]
      }
    ];

    // 키워드 매칭으로 관련 문서 찾기
    for (const doc of noodlKnowledge) {
      const hasKeywordMatch = doc.keywords.some(keyword => 
        lowerQuery.includes(keyword) || keyword.includes(lowerQuery.split(' ')[0])
      );
      
      if (hasKeywordMatch) {
        return `**${doc.title}**: ${doc.content}`;
      }
    }

    // 키워드 매칭이 없으면 일반적인 가이드 제공
    return "**General Guidance**: Use visual node-based programming. Connect output ports to input ports. Group related functionality. Test connections and data flow.";
    
  } catch (error) {
    console.error('Context7 search failed:', error);
    return null;
  }
}

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

      // 심화 프로젝트 구조 분석 - 종속성, 패턴, 아키텍처 분석
      let projectContext = '';
      let nodesByType: { [key:string]: { name: string, id: string }[] } = {};
      const nodeConnections: string[] = [];
      const nodeMap = new Map<string, NodeGraphNode>();
      let projectComplexity = 'Simple';
      let suggestedPatterns: string[] = [];
      
      // 심화 분석을 위한 추가 구조
      const dependencyGraph = new Map<string, { 
        dependsOn: string[], 
        dependents: string[],
        role: string,
        importance: number 
      }>();
      const dataFlowPatterns: string[] = [];
      const architecturalIssues: string[] = [];
      const optimizationOpportunities: string[] = [];
      const componentHierarchy: { [key: string]: string[] } = {};
      
      if (context.node && context.node.owner) {
        const nodeGraph: NodeGraphModel = context.node.owner;
        let totalNodes = 0;
        let totalConnections = 0;

        // 심화 노드 분석
        nodeGraph.forEachNode((node: NodeGraphNode) => {
          nodeMap.set(node.id, node);
          
          if (node.typename !== 'ChatAssistant' && node.id !== 'ChatAssistant') {
            totalNodes++;
            const nodeType = node.typename || 'Unknown';
            const nodeName = node.label || node.id || 'Unnamed';
            
            if (!nodesByType[nodeType]) {
              nodesByType[nodeType] = [];
            }
            nodesByType[nodeType].push({ name: nodeName, id: node.id });

            // 종속성 그래프 초기화
            dependencyGraph.set(node.id, {
              dependsOn: [],
              dependents: [],
              role: analyzeNodeRole(nodeType),
              importance: calculateNodeImportance(nodeType)
            });

            // 컴포넌트 계층 구조 분석
            if (node.parent) {
              const parentId = node.parent.id;
              if (!componentHierarchy[parentId]) {
                componentHierarchy[parentId] = [];
              }
              componentHierarchy[parentId].push(node.id);
            }
          }
          return false;
        });

        // 심화 연결 및 종속성 분석
        if (nodeGraph.connections) {
          totalConnections = nodeGraph.connections.length;
          
          for (const connection of nodeGraph.connections) {
            const fromNode = nodeMap.get(connection.fromId);
            const toNode = nodeMap.get(connection.toId);

            if(fromNode && toNode) {
              const fromNodeName = fromNode.label || fromNode.typename;
              const toNodeName = toNode.label || toNode.typename;
              
              // 기본 연결 정보 수집
              if (nodeConnections.length < 15) {
                nodeConnections.push(`- ${fromNodeName} → '${connection.fromProperty}' → ${toNodeName} → '${connection.toProperty}'`);
              }

              // 종속성 그래프 업데이트
              const fromDep = dependencyGraph.get(connection.fromId);
              const toDep = dependencyGraph.get(connection.toId);
              
              if (fromDep && toDep) {
                fromDep.dependents.push(connection.toId);
                toDep.dependsOn.push(connection.fromId);
              }

              // 데이터 플로우 패턴 분석
              analyzeDataFlowPattern(fromNode, toNode, connection, dataFlowPatterns);
              
              // 아키텍처 문제 감지
              detectArchitecturalIssues(fromNode, toNode, connection, architecturalIssues);
            }
          }

          // 순환 종속성 검사
          detectCircularDependencies(dependencyGraph, architecturalIssues);
          
          // 최적화 기회 분석
          analyzeOptimizationOpportunities(nodesByType, dependencyGraph, optimizationOpportunities);
        }

        // 프로젝트 복잡도 평가
        if (totalNodes > 20 || totalConnections > 30) {
          projectComplexity = 'Complex';
        } else if (totalNodes > 8 || totalConnections > 12) {
          projectComplexity = 'Intermediate';
        }

        // 패턴 인식 및 제안
        const nodeTypes = Object.keys(nodesByType);
        if (nodeTypes.includes('Router') && nodeTypes.includes('Navigate')) {
          suggestedPatterns.push('Navigation pattern detected - consider using consistent page structure');
        }
        if (nodeTypes.includes('List') && nodeTypes.includes('Repeater')) {
          suggestedPatterns.push('List/Repeater pattern found - ensure proper data binding');
        }
        if (nodeTypes.includes('Object') || nodeTypes.includes('Variable')) {
          suggestedPatterns.push('Data management nodes present - consider state organization');
        }
        if (nodeTypes.includes('Function')) {
          suggestedPatterns.push('Custom logic detected - ensure proper error handling');
        }
        
        // 풍부한 프로젝트 컨텍스트 생성
        let contextParts: string[] = [];

        if (Object.keys(nodesByType).length > 0) {
          const nodeSummary = Object.entries(nodesByType)
            .sort(([,a], [,b]) => b.length - a.length) // 가장 많이 사용된 노드 타입부터
            .map(([type, nodes]) => 
              `- **${type}**: ${nodes.length} node(s) (${nodes.slice(0, 3).map(n => n.name).join(', ')}${nodes.length > 3 ? `... +${nodes.length - 3} more` : ''})`
            ).join('\n');
          
          contextParts.push(`**Project Structure Analysis:**
📊 Complexity: ${projectComplexity} (${totalNodes} nodes, ${totalConnections} connections)

**Node Inventory:**
${nodeSummary}`);
        }

        if (nodeConnections.length > 0) {
          contextParts.push(`\n**Key Connections:**
${nodeConnections.join('\n')}${totalConnections > nodeConnections.length ? `\n... and ${totalConnections - nodeConnections.length} more connections` : ''}`);
        }

        if (suggestedPatterns.length > 0) {
          contextParts.push(`\n**Detected Patterns:**
${suggestedPatterns.map(pattern => `💡 ${pattern}`).join('\n')}`);
        }

        // 데이터 플로우 패턴 분석 결과
        if (dataFlowPatterns.length > 0) {
          contextParts.push(`\n**Data Flow Analysis:**
${dataFlowPatterns.map(pattern => `🔄 ${pattern}`).join('\n')}`);
        }

        // 종속성 분석 결과
        const criticalNodes = Array.from(dependencyGraph.entries())
          .filter(([_, deps]) => deps.importance >= 8)
          .sort(([_, a], [__, b]) => b.importance - a.importance)
          .slice(0, 5);
        
        if (criticalNodes.length > 0) {
          const criticalSummary = criticalNodes.map(([nodeId, deps]) => {
            const node = nodeMap.get(nodeId);
            const nodeName = node ? (node.label || node.typename) : nodeId;
            return `🔑 ${nodeName} (${deps.role}, importance: ${deps.importance})`;
          }).join('\n');
          
          contextParts.push(`\n**Critical Nodes:**
${criticalSummary}`);
        }

        // 아키텍처 이슈
        if (architecturalIssues.length > 0) {
          contextParts.push(`\n**Architectural Concerns:**
${architecturalIssues.map(issue => `⚠️ ${issue}`).join('\n')}`);
        }

        // 최적화 기회
        if (optimizationOpportunities.length > 0) {
          contextParts.push(`\n**Optimization Opportunities:**
${optimizationOpportunities.map(opp => `🚀 ${opp}`).join('\n')}`);
        }

        // 컴포넌트 계층 구조
        if (Object.keys(componentHierarchy).length > 0) {
          const hierarchySummary = Object.entries(componentHierarchy)
            .map(([parentId, children]) => {
              const parent = nodeMap.get(parentId);
              const parentName = parent ? (parent.label || parent.typename) : parentId;
              return `📁 ${parentName} (${children.length} children)`;
            }).join('\n');
          
          contextParts.push(`\n**Component Hierarchy:**
${hierarchySummary}`);
        }
        
        if(contextParts.length > 0) {
          projectContext = `\n${contextParts.join('\n\n')}\n`;
        }
      }

      // 향상된 시스템 컨텍스트 - 더 상세하고 구체적인 프롬프트
      const systemContext = `You are Pulse AI, an expert low-code development assistant specialized in Noodl/Pulse Editor. You understand the visual programming paradigm and help users build web applications efficiently.

**Your Core Responsibilities:**
1. Analyze user queries in the context of their current project structure
2. Provide practical, step-by-step solutions that users can immediately implement
3. Explain complex concepts in simple terms while being technically accurate
4. Suggest best practices and alternative approaches when relevant
5. Always consider the existing nodes and connections in the user's project

**Analysis Framework:**
- UNDERSTAND: What is the user trying to achieve?
- ASSESS: What do they currently have in their project? (structure, dependencies, patterns)
- IDENTIFY: Any architectural issues, optimization opportunities, or risks?
- RECOMMEND: What specific steps should they take? (considering best practices)
- VALIDATE: How can they verify their solution works and maintains good architecture?

**Response Structure:**
Use this format for all responses:

**Summary:**
[One clear sentence explaining what we'll accomplish]

**Current Situation:**
[Brief analysis of their existing project context, if available]

**Solution Steps:**
[Numbered list with specific, actionable instructions]

**Key Connections:**
[Specific port connections needed, using format: Node → 'Port' → Target Node → 'Port']

**Best Practices:**
[Additional tips, alternative approaches, and architectural considerations]

**Risk Assessment:**
[Any potential issues, dependencies, or architectural concerns to consider]

**Common Patterns in Noodl/Pulse:**
- **Data Flow**: Object nodes store data → connect to UI elements via specific ports
- **Navigation**: Router nodes manage pages → Navigate nodes trigger transitions
- **Lists**: List node holds array → Repeater node creates instances → UI components display items
- **Events**: User interactions (clicks, inputs) → connect to logic nodes → update state/data
- **Functions**: JavaScript Function nodes for custom logic → connect inputs/outputs carefully

**Technical Context Guidelines:**
- Always specify exact port names in quotes (e.g., 'Clicked', 'Text', 'Items')
- Consider data types when suggesting connections
- Mention parameter settings when relevant
- Suggest testing methods for verification

${projectContext}

Remember: Be specific, be practical, and always explain WHY as well as HOW.`;

      // Context7을 통한 Noodl 공식 문서 검색
      let noodlDocsContext = '';
      try {
        const relevantDocs = await searchNoodlDocsWithContext7(userPrompt);
        if (relevantDocs) {
          noodlDocsContext = `\n**📚 Noodl Documentation Reference:**\n${relevantDocs}\n`;
        }
      } catch (error) {
        console.warn('Failed to fetch Noodl docs:', error);
      }

      // 사용자 AI 룰 가져오기 (한국어로 대답 등)
      const aiRules = OpenAiStore.getAiRules();
      
      // 대화 히스토리 준비
      const history = context.chatHistory.messages.slice(0, -1).map((x) => ({
        role: String(x.type),
        content: x.content
      }));

      // 메시지 구성 (AI 룰과 Noodl 문서를 시스템 컨텍스트에 포함)
      const enhancedSystemContext = `${systemContext}${projectContext}${noodlDocsContext}`;
      const messages = [
        {
          role: 'system',
          content: aiRules ? `${aiRules}\n\n${enhancedSystemContext}` : enhancedSystemContext
        },
        ...history,
        {
          role: 'user',
          content: userPrompt
        }
      ];

      // 실제 AI API 호출 with streaming
      context.chatHistory.add({ type: ChatMessageType.Assistant, content: '' });

      let fullResponse = '';

      await context.chatStream({
        provider: {
          model: 'gpt-4o-mini',
          temperature: 0.3, // 약간 더 창의적인 응답을 위해 증가
          max_tokens: 3072 // 더 상세한 응답을 위해 증가
        },
        messages,
        onStream(fullText, incrementalText) {
          if (incrementalText && incrementalText.length > 0) {
            fullResponse = fullText;
            
            // UI에 실시간으로 업데이트
            context.chatHistory.updateLast({
              content: fullResponse
            });
          }
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