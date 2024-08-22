import { type BaseMessage, ChatMessage } from '@langchain/core/messages'
import type { BindToolsInput } from '@langchain/core/language_models/chat_models'
import { isLangChainTool } from '@langchain/core/utils/function_calling'
import { isOpenAITool } from '@langchain/core/language_models/base'
import type { ToolParam, VolcengineMessageRole } from './types'

export function messageToRole(message: BaseMessage): VolcengineMessageRole {
  const type = message._getType()
  switch (type) {
    case 'ai':
      return 'assistant'
    case 'human':
      return 'user'
    case 'system':
      return 'system'
    case 'tool':
      return 'tool'
    case 'function':
      throw new Error('Function messages not supported yet')
    case 'generic': {
      if (!ChatMessage.isInstance(message)) {
        throw new Error('Invalid generic chat message')
      }
      if (['system', 'assistant', 'user', 'tool'].includes(message.role)) {
        return message.role
      }
      throw new Error(`Unknown message type: ${type}`)
    }
    default:
      throw new Error(`Unknown message type: ${type}`)
  }
}

export function formatTools(tools: BindToolsInput[]): ToolParam[] {
  if (!tools || !tools.length) {
    return []
  }

  return tools.map((tc) => {
    if (isLangChainTool(tc)) {
      return ({
        type: 'function',
        function: {
          name: tc.name,
          description: tc.description,
          parameters: tc.schema,
        },
      })
    }

    if (isOpenAITool(tc)) {
      return ({
        type: 'function',
        function: {
          name: tc.function.name,
          description: tc.function.description,
          parameters: tc.function.parameters,
        },
      })
    }

    throw new Error('Invalid tool format received.')
  })
}
