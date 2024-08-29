/* eslint-disable import/order */
/* eslint-disable node/prefer-global/process */
/* eslint-disable no-console */
/* eslint-disable antfu/no-import-dist */
import { ChatVolcengine } from '../dist/index.mjs'
import 'dotenv/config'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

const chatModel = new ChatVolcengine({
  volcengineApiHost: process.env.VOLCENGINE_HOST,
  volcengineApiKey: process.env.VOLCENGINE_API_KEY,
  model: process.env.VOLCENGINE_MODEL,
})

const stream = await chatModel.stream([new SystemMessage('中文翻译成英文'), new HumanMessage({ content: '你好' })])

for await (const chunk of stream) {
  console.log(chunk.content)
}
