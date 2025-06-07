import { AiNodeTemplate } from '@noodl-models/AiAssistant/interfaces';

import * as ChartTemplate from './templates/chart';
import * as FunctionTemplate from './templates/function';
import * as FunctionCrud from './templates/function-crud';
import * as FunctionQueryDatabase from './templates/function-query-database';
import { template as ChatTemplate } from './templates/chat';

export const aiNodeTemplates: Record<string, AiNodeTemplate> = {
  ['function-crud']: FunctionCrud.template,
  ['function-query-database']: FunctionQueryDatabase.template,
  function: FunctionTemplate.template,
  chart: ChartTemplate.template,
  chat: ChatTemplate
};
