'use strict';

module.exports = {
  node: {
    name: 'ChatAssistant',
    shortDesc: 'AI chat assistant node. Answers questions by analyzing Noodl official documentation and project structure.',
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

        // AI processing is handled in the editor.
        // This only provides the basic structure.
        
        setTimeout(() => {
          this._internal.lastResponse = `Response to the question: ${this._internal.currentPrompt}`;
          this._internal.isProcessing = false;
          this.flagOutputDirty('response');
          this.flagOutputDirty('processing');
          this.sendSignalOnOutput('responseReady');
        }, 1000);
      },
      // ChatAssistant does not render anything on screen
      render: function() {
        return null;
      }
    }
  }
}; 