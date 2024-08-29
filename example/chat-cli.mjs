/* eslint-disable antfu/no-import-dist */
/* eslint-disable import/order */

import readline from 'node:readline'
import process, { stdin, stdout } from 'node:process'
import { EventEmitter } from 'node:events'

import { ChatVolcengine } from '../dist/index.mjs'
import 'dotenv/config'
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'

import { InMemoryChatMessageHistory } from '@langchain/core/chat_history'
import { RunnableWithMessageHistory } from '@langchain/core/runnables'

class ChatCli extends EventEmitter {
  constructor() {
    super()

    this.input = stdin
    this.output = stdout
    this.input.setEncoding('utf-8')
    this.output.setEncoding('utf-8')

    this.chatModel = new ChatVolcengine({
      volcengineApiHost: process.env.VOLCENGINE_HOST,
      volcengineApiKey: process.env.VOLCENGINE_API_KEY,
      model: process.env.VOLCENGINE_MODEL,
    })
  }

  async runInputLoop() {
    const _prompt = await this.prompt('请输入 prompt\n > ')

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', _prompt],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
    ])

    const chain = prompt.pipe(this.chatModel)

    const messageHistories = {}
    const withMessageHistory = new RunnableWithMessageHistory({
      runnable: chain,
      getMessageHistory: async (sessionId) => {
        if (messageHistories[sessionId] === undefined) {
          messageHistories[sessionId] = new InMemoryChatMessageHistory()
        }
        return messageHistories[sessionId]
      },
      inputMessagesKey: 'input',
      historyMessagesKey: 'chat_history',
    })

    return new Promise((resolve) => {
      const rl = readline.createInterface(this.input, this.output)

      rl.setPrompt('> ')
      rl.prompt()

      const config = {
        configurable: {
          sessionId: `${Date.now()}`,
        },
      }

      rl.on('line', async (line) => {
        if (line === '\\clear') {
          config.configurable.sessionId = `${Date.now()}`
        }
        else {
          const stream = await withMessageHistory.stream({
            input: line,
          }, config)

          for await (const chunk of stream) {
            this.write(chunk.content)
          }
          this.write('\n')
        }

        rl.prompt()
      })

      rl.on('close', resolve)

      rl.on('SIGINT', () => {
        rl.close()
        process.emit('SIGINT', 'SIGINT')
      })
    })
  }

  write(data) {
    this.output.write(data)
  }

  prompt(query = '> ') {
    return new Promise((resolve) => {
      const rl = readline.createInterface(this.input, this.output)
      rl.question(query, (answer) => {
        resolve(answer)
        rl.close()
      })
    })
  }
}

const cli = new ChatCli()

cli.runInputLoop()
