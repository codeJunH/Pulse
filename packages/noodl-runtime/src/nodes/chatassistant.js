'use strict';

module.exports = {
  node: {
    name: 'ChatAssistant',
    shortDesc: 'AI 채팅 어시스턴트 노드입니다. Noodl 공식 문서와 프로젝트 구조를 분석하여 질문에 답변합니다.',
    docs: 'https://docs.noodl.net/',
    category: 'Data',
    color: 'data',
    allowAsChild: true,
    allowAsExportRoot: true,
    hasVisual: false,
    isVisual: false,
    initialize: function() {
      this._internal = this._internal || {};
      this._internal.messages = [];
    },
    inputs: {
      prompt: {
        type: 'string',
        displayName: 'Prompt',
        set: function(value) {
          this._internal.currentPrompt = value;
        }
      },
      send: {
        type: 'signal',
        displayName: 'Send',
        valueChangedToTrue: function() {
          this.scheduleAfterInputsHaveUpdated(() => {
            this.processMessage();
          });
        }
      }
    },
    outputs: {
      response: {
        type: 'string',
        displayName: 'Response',
        getter: function() {
          return this._internal.lastResponse || '';
        }
      },
      processing: {
        type: 'boolean',
        displayName: 'Processing',
        getter: function() {
          return this._internal.isProcessing || false;
        }
      },
      responseReady: {
        type: 'signal',
        displayName: 'Response Ready'
      },
      error: {
        type: 'signal',
        displayName: 'Error'
      }
    },
    methods: {
      processMessage: function() {
        if (!this._internal.currentPrompt) {
          this.sendSignalOnOutput('error');
          return;
        }

        this._internal.isProcessing = true;
        this.flagOutputDirty('processing');

        // AI 처리 로직은 에디터에서 처리됩니다
        // 여기서는 기본 구조만 제공합니다
        
        setTimeout(() => {
          this._internal.lastResponse = `질문에 대한 답변: ${this._internal.currentPrompt}`;
          this._internal.isProcessing = false;
          this.flagOutputDirty('response');
          this.flagOutputDirty('processing');
          this.sendSignalOnOutput('responseReady');
        }, 1000);
      },
      // ChatAssistant는 화면에 렌더링하지 않음
      render: function() {
        return null;
      }
    }
  }
}; 