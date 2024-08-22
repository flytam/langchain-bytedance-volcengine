import type { BindToolsInput } from '@langchain/core/language_models/chat_models'
import { SimpleChatModel } from '@langchain/core/language_models/chat_models'
import { getEnvironmentVariable } from '@langchain/core/utils/env'
import type { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager'
import type { BaseLanguageModelInput } from '@langchain/core/language_models/base'
import type { BaseMessage, BaseMessageChunk } from '@langchain/core/messages'
import { AIMessageChunk } from '@langchain/core/messages'
import { ChatGenerationChunk } from '@langchain/core/outputs'
import { convertEventStreamToIterableReadableDataStream } from '@langchain/core/utils/event_source_parse'
import type { Runnable } from '@langchain/core/runnables'
import type { ChatCompletionRequest, ChatVolcengineFields, MessageParam, SimpleChatCompletionResponse, StreamChatCompletionResponse, StreamOptionsParam, ToolParam, VolcengineChatCallOptions, VolcengineChatInput } from './types'
import { formatTools, messageToRole } from './utils'

export class ChatVolcengine
  extends SimpleChatModel<VolcengineChatCallOptions>
  implements VolcengineChatInput {
  static lc_name(): string {
    return 'ChatVolcengine'
  }

  get callKeys(): string[] {
    return [...super.callKeys]
  }

  lc_serializable = true

  get lc_secrets(): Record<string, string> {
    return {
      volcengineApiKey: 'VOLCENGINE_API_KEY',
    }
  }

  get lc_aliases(): Record<string, string> {
    return {}
  }

  volcengineApiHost: string

  volcengineApiKey: string

  temperature?: number

  topP?: number

  frequencyPenalty?: number

  enableStream = false

  streamOptions?: StreamOptionsParam | undefined

  maxTokens?: number | undefined

  stop?: string[] | undefined

  model: string

  logprobs?: boolean | undefined

  logitBias?: Record<string, number> | undefined

  topLogprobs?: number | undefined

  tools?: ToolParam[]

  constructor(fields: ChatVolcengineFields) {
    super(fields)

    this.volcengineApiKey
        = fields.volcengineApiKey
        ?? getEnvironmentVariable('VOLCENGINE_API_KEY')
        ?? ''
    this.volcengineApiHost = fields.volcengineApiHost

    this.model = fields.model

    this.enableStream = fields.enableStream ?? false
    this.streamOptions = fields.streamOptions
  }

  invocationParams(): Omit<ChatCompletionRequest, 'messages'> {
    return {
      model: this.model,
      stream: this.enableStream,
      stream_options: this.streamOptions,
      max_tokens: this.maxTokens,
      stop: this.stop,
      frequency_penalty: this.frequencyPenalty,
      temperature: this.temperature,
      top_p: this.topP,
      logprobs: this.logprobs,
      logit_bias: this.logitBias,
      tools: this.tools,
    }
  }

  _identifyingParams(): Record<string, any> {
    return this.invocationParams()
  }

  async *_streamResponseChunks(
    _messages: BaseMessage[],
    _options: this['ParsedCallOptions'],
    _runManager?: CallbackManagerForLLMRun,
  ): AsyncGenerator<ChatGenerationChunk> {
    const response = await this._request(_messages, _options, true)

    if (!response.body) {
      throw new Error('No body in response')
    }
    const stream = convertEventStreamToIterableReadableDataStream(response.body)

    for await (const chunk of stream) {
      try {
        if (chunk === '[DONE]') {
          break
        }

        const data: StreamChatCompletionResponse = JSON.parse(chunk)
        const text = data.choices?.[0]?.delta.content
        yield new ChatGenerationChunk({
          text,
          message: new AIMessageChunk({
            content: text,
            additional_kwargs: {
              logprobs: data.choices?.[0].logprobs,
              finish_reason: data.choices?.[0].finish_reason,
            },
            usage_metadata: {
              input_tokens: data.usage?.prompt_tokens ?? 0,
              output_tokens: data.usage?.completion_tokens ?? 0,
              total_tokens: data.usage?.total_tokens ?? 0,
            },
          }),
        })
      }
      catch {
        console.error(`Received a non-JSON parseable chunk: ${chunk}`)
      }
    }
  }

  async _call(messages: BaseMessage[], options: this['ParsedCallOptions'], runManager?: CallbackManagerForLLMRun): Promise<string> {
    if (this.enableStream) {
      let content = ''
      for await (const chunk of this._streamResponseChunks(
        messages,
        options,
        runManager,
      )) {
        content += chunk.text
      }
      return content
    }
    else {
      const res = await this._request(messages, options)
      const data: SimpleChatCompletionResponse = await res.json()
      return data.choices?.[0]?.message?.content
    }
  }

  async _request(messages: BaseMessage[], options: this['ParsedCallOptions'], stream?: boolean): Promise<Response> {
    const parameters = this.invocationParams()
    const messagesMapped: MessageParam[] = messages.map(message => ({
      role: messageToRole(message),
      content: message.content as string,
    }))

    const request: ChatCompletionRequest = {
      ...parameters,
      ...options,
      messages: messagesMapped,
    }

    if (stream) {
      request.stream = stream
    }

    return this.caller.call(async () => {
      const response = await fetch(`${this.volcengineApiHost}/api/v3/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.volcengineApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: options.signal,
      })

      if (!response.ok) {
        const error: SimpleChatCompletionResponse | StreamChatCompletionResponse = await response.json()
        throw new Error(error.error?.message ?? 'Unknown error')
      }

      return response
    })
  }

  override bindTools?(tools: BindToolsInput[]): Runnable<
    BaseLanguageModelInput,
    BaseMessageChunk,
    this['ParsedCallOptions']
  > {
    return this.bind({
      tools: formatTools(tools),
    })
  }

  _llmType(): string {
    return 'volcengine'
  }
}
