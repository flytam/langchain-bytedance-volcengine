# langchain-bytedance-volcengine

> 施工中

Bytedance volcengine chat model integration for langchain | Langchain 字节跳动火山引擎Chat Model集成

## Usage

Install dependencies

```bash
# npm
npm i langchain-bytedance-volcengine

# pnpmyarn
yarn add langchain-bytedance-volcengine

# pnpm
pnpm add langchain-bytedance-volcengine
```

Instantiate the model

```typescript
import { ChatVolcengine } from 'langchain-bytedance-volcengine'

import { HumanMessage } from '@langchain/core/messages'

const model = new ChatVolcengine({
  // see https://www.volcengine.com/docs/82379/1302013
  volcengineApiHost: 'https://ark.cn-beijing.volces.com',
  // see https://www.volcengine.com/docs/82379/1298459
  volcengineApiKey: 'xxx',
  /**
   * model endpoint
   * see https://www.volcengine.com/docs/82379/1099522
   */
  model: '',
})

await model.invoke([new HumanMessage({ content: 'Hi! I\'m Bob' })])
```
