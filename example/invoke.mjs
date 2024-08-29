/* eslint-disable node/prefer-global/process */
/* eslint-disable no-console */
/* eslint-disable antfu/no-import-dist */
import { HumanMessage } from '@langchain/core/messages'
import { ChatVolcengine } from '../dist/index.mjs'
import 'dotenv/config'

const chatModel = new ChatVolcengine({
  volcengineApiHost: process.env.VOLCENGINE_HOST,
  volcengineApiKey: process.env.VOLCENGINE_API_KEY,
  model: process.env.VOLCENGINE_MODEL,
})

const res = await chatModel.invoke([new HumanMessage({ content: 'Hi! I\'m Bob' })])

console.log('ans', res)
