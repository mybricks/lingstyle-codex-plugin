# 任务总览（接口版）

在 [任务总览](task-overview-workflow.md) 基础上，把后端部分按**接口**来组织：接口是需求与代码之间最稳定的锚点，既能对应到具体处理逻辑，也能对应到一次可验证的调用。维护思路、执行步骤、渲染规则均沿用原文档，本文只补接口相关的部分。

## YAML 扩展

```yaml
version: 2
root:
  title: 项目名
endpoints:
  - id: save-agent-version
    title: 保存版本快照
    route: POST /api/mybricks/save-agent-version
    file: src/modules/business-system/lingchuang/version.client.ts
    symbol: saveLingchuangVersion
    tasks: [T-002]
  - id: ai-chat-stream
    title: AI 对话流式输出
    route: POST /api/ai-chat/stream
    file: src/modules/business-system/lingchuang/llm.ts
    tasks: [T-003]
  - id: all-requests
    title: 请求体解析逻辑
    route: "*"
    file: src/main.ts
    tasks: [T-001]
pages: []
components: []
```

## 字段说明

- `endpoints`：接口节点，后端需求的主要归属位置。`id`、`title` 必填。
- `route`：一个字段装下方法和路径，写成 `POST /api/xxx`。方法前缀会被渲染成彩色徽标；只写路径也可以，就不显示徽标。
- `route: "*"`：表示**所有接口**，不带路径，用于跨所有接口生效的变更。
- `parent`：接口默认平铺在 `root` 下。想把接口挂到某个页面或组件下时写 `parent`，适合「这个接口就是为这个页面服务的」这种明确归属。
- `file` / `symbol`：接口对应的实现文件与导出符号，方便从图跳到代码。
- `flow`：可选，Mermaid 流程图源码，用来表达这条接口功能上的变化。有 `flow` 的接口节点右上角会出现一个流程图标，点击在画布上展开一张流程图节点，再点一次或点卡片右上角关闭。
- `tasks`：关联的任务 ID。

## `*` 的用法：

有些变更不属于某一个接口，而是对所有接口生效，例如请求体解析、鉴权中间件、全局超时、错误响应格式。这类变更落在一个 `route: "*"` 的接口节点上：

```yaml
endpoints:
  - id: all-requests
    title: 请求体解析逻辑
    route: "*"
    file: src/main.ts
    tasks: [T-001]
```

好处是它和具体接口区分得开：看总览时一眼能看出「这次改的是全局能力」还是「只动了一条链路」，任务也不会被迫塞进某个不相关的接口下面。

也可以给 `*` 加限定，让作用范围说得更准：

```yaml
endpoints:
  - id: page-requests
    title: 登录页相关接口的鉴权调整
    route: "*"
    parent: login
    tasks: [T-004]
```

## `flow` 的用法：表达接口变化

接口的处理逻辑发生多步变化、或需要说明分支判断时，加 `flow` 让流程一眼可见。写法是标准 Mermaid 流程图源码：

```yaml
endpoints:
  - id: parse-body
    title: 请求体解析
    route: POST /api/x
    flow: |
      graph LR
        A[校验签名] --> B{合法?}
        B -->|是| C[解析 JSON]
        B -->|否| D[返回 400]
    tasks: [T-001]
```

写 `flow` 的几条经验：

- 只画这次需求真正动到的环节，不要复刻整条链路。
- 节点用动词短语（「校验签名」「解析 JSON」），一眼能对上任务描述。
- 分支判断用 `{...}`，正常路径和异常路径都画出来，验证条件才好写。
- 顺序用 `graph LR`（从左到右）通常最省空间；步骤多且纵向差异大时用 `graph TD`。
- 没变化、或变化只有一句话能说清时不用写，`flow` 是补充说明，不是必填项。

## 什么时候建接口节点，什么时候不建

| 场景 | 推荐 |
| --- | --- |
| 新增或修改一条接口的入参、返回值、处理逻辑 | 建接口节点 |
| 一次需求要改多条接口 | 每条接口一个节点，各自挂任务 |
| 全局中间件、请求体解析、鉴权、限流 | 一条 `route: "*"` 节点 |
| 接口只为一个页面服务，归属很明确 | 建接口节点，`parent` 写那个页面 |
| 只改内部函数、工具方法，外部行为不变 | 不建接口节点；任务里写清代码位置即可 |
| 数据库 schema、定时任务、消息消费 | 这类没有对外接口，任务里写清涉及的代码位置 |

判断口径：**外部能直接观测到的行为变化**才值得一个接口节点，**内部实现调整**用任务描述承载。拿不准时优先建接口节点——它对验证条件更友好。

## 维护补充

- 接口 `title` 写业务语义（「保存版本快照」），`route` 写真实路径，两者分工，别把路径塞进 `title`。
- 接口默认平铺，不用刻意造层级。接口多到一屏放不下时，再考虑用 `parent` 收到页面下面，或者按调用方归组。
- 前端调用后端时，任务关联到前端组件或页面即可；后端侧的接口节点只在后端有改动时挂任务，避免一条任务在两个栈上重复出现。
- 联调类任务可以同时关联前端组件和后端接口，此时两侧节点共享同一个任务 ID，图上会同时高亮出这条链路。
- 接口下线或路径变更时，同步更新 `route`，不要留旧节点的空壳。
