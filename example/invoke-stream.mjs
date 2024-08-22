/* eslint-disable node/prefer-global/process */
/* eslint-disable no-console */
/* eslint-disable antfu/no-import-dist */
import { ChatVolcengine } from '../dist/index.mjs'
import 'dotenv/config'

const chatModel = new ChatVolcengine({
  volcengineApiHost: process.env.VOLCENGINE_HOST,
  volcengineApiKey: process.env.VOLCENGINE_API_KEY,
  model: process.env.VOLCENGINE_MODEL,
  enableStream: true,
})

chatModel.bindTools([])

const res = await chatModel.invoke([['human', 'I am an LLM']], {
})

console.log('ans', res)
