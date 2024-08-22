import type { BaseChatModelCallOptions, BaseChatModelParams } from '@langchain/core/language_models/chat_models'

export type VolcengineMessageRole =
  | (string & NonNullable<unknown>)
  | 'system'
  | 'user'
  | 'assistant'
  | 'tool'

export interface MessageParam {
  role: VolcengineMessageRole
  content?: string
  tool_calls?: MessageToolCallParam[]
  tool_call_id?: string
}

export interface MessageToolCallParam {
  id: string
  type: string
  function: FunctionParam
}

export interface FunctionParam {
  name: string
  arguments: string
}

export interface ToolParam {
  type: string
  function: FunctionDefinition
}

export interface FunctionDefinition {
  name: string
  description?: string
  parameters?: Record<string, any>
}

export interface StreamOptionsParam {
  include_usage?: boolean
}

export interface Choice {
  index: number
  finish_reason: string
  message: Message
  logprobs?: ChoiceLogprobs
}

export interface Message {
  role: string
  content: string
  tool_calls?: MessageToolCall[]
}

export interface MessageToolCall {
  id: string
  type: string
  function: _Function
}

export interface _Function {
  name: string
  arguments?: string
}

export interface ChoiceLogprobs {
  content: TokenLogprob[]
}

export interface TokenLogprob {
  token: string
  bytes: number[]
  logprob: number
  top_logprobs?: TopLogprob[]
}

export interface TopLogprob {
  token: string
  bytes: number[]
  logprob: number
}

export interface Usage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface StreamChoice {
  index: number
  finish_reason: string
  delta: ChoiceDelta
  logprobs?: ChoiceLogprobs
}

export interface ChoiceDelta {
  role: string
  content: string
  tool_calls?: ChoiceDeltaToolCall[]
}

export interface ChoiceDeltaToolCall {
  index: number
  id: string
  type: string
  function: _Function
}

export interface ChatCompletionRequest {
  model: string
  messages: MessageParam[]
  stream?: boolean
  stream_options?: StreamOptionsParam
  max_tokens?: number
  stop?: string[]
  frequency_penalty?: number
  temperature?: number
  top_p?: number
  logprobs?: boolean
  top_logprobs?: number
  logit_bias?: Record<string, number>
  tools?: ToolParam[]
}

export interface ErrorMessage {
  code: string
  message: string
  param: string
  type: string
}

export interface SimpleChatCompletionResponse {
  id: string
  model: string
  created: number
  object: string
  choices: Choice[]
  usage: Usage
  error?: ErrorMessage
}

export interface StreamChatCompletionResponse {
  id: string
  model: string
  created: number
  object: string
  choices: StreamChoice[]
  usage?: Usage
  error?: ErrorMessage
}

export interface VolcengineChatInput {
  /**
   * API key to use when making requests. Defaults to the value of
   * `VOLCENGINE_API_KEY` environment variable.
   * Alias for `apiKey`
   * https://www.volcengine.com/docs/82379/1298459
   */
  volcengineApiKey?: string

  /**
   * See https://www.volcengine.com/docs/82379/1302013
   */
  volcengineApiHost: string

  model: string

  enableStream?: boolean
  streamOptions?: StreamOptionsParam

  maxTokens?: number

  stop?: string[]
  frequencyPenalty?: number
  temperature?: number
  topP?: number

  logitBias?: Record<string, number>

  logprobs?: boolean
  topLogprobs?: number

  tools?: ToolParam[]
}

export interface ChatVolcengineFields
  extends VolcengineChatInput,
  BaseChatModelParams {}

export interface VolcengineChatCallOptions extends BaseChatModelCallOptions {
  tools?: ToolParam[]
}
