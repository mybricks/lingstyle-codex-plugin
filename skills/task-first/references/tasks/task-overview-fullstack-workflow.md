# 任务总览（接口补充）

本文是 [任务总览](task-overview-workflow.md) 的补充，不是独立文档。维护思路、节点维护、执行步骤、`version: 2` 结构、`pages` / `components` / `requirements` 字段全部照常执行，下面只补后端接口相关的部分。

## 补充「YAML 格式」：`endpoints`

在原有结构上新增可选数组 `endpoints`，后端需求按接口归属；暂无内容时可省略或写空数组。

```yaml
version: 2
root:
  title: 项目名
endpoints:
  - id: save-agent-version
    title: 保存版本快照
    route: POST /api/mybricks/save-agent-version
    file: src/modules/lingchuang/version.client.ts
    symbol: saveLingchuangVersion
    tasks: [T-002]
  - id: all-requests
    title: 请求体解析逻辑
    route: "*"
    file: src/main.ts
    tasks: [T-001]
pages: []
components: []
```

| 字段 | 说明 |
| --- | --- |
| `id`、`title` | 必填。`title` 写业务语义（「保存版本快照」），不要把路径塞进去 |
| `route` | `POST /api/xxx`，方法前缀会渲染成彩色徽标；只写路径则不显示徽标。`"*"` 表示所有接口，用于鉴权、请求体解析、全局超时、错误格式等全局变更 |
| `parent` | 默认平铺在 `root` 下；接口明确只为某页面或组件服务时，写那个页面或组件的 ID。`route: "*"` 也可加 `parent` 限定作用范围 |
| `file` / `symbol` | 实现文件与导出符号 |
| `flow` | 可选，Mermaid 流程图源码，表达这条接口处理逻辑的变化；有 `flow` 的节点可在画布上展开流程图 |
| `tasks` | 关联的任务 ID，引用当前 `<taskPath>` 中的任务 |

写入前的检查（ID 唯一、`parent` 无循环、任务 ID 存在）同样覆盖 `endpoints`，且 `endpoints` 的 `id` 与页面、组件的 `id` 在同一命名空间内全局唯一。

`flow` 只画这次需求动到的环节，节点用动词短语，分支判断用 `{...}` 并画出正常和异常路径，一般用 `graph LR`。变化一句话能说清时不必写。

```yaml
    flow: |
      graph LR
        A[校验签名] --> B{合法?}
        B -->|是| C[解析 JSON]
        B -->|否| D[返回 400]
```

## 补充「节点维护」：什么时候建接口节点

| 场景 | 做法 |
| --- | --- |
| 新增或修改接口的入参、返回值、处理逻辑 | 每条接口一个节点，各自挂任务 |
| 全局中间件、请求体解析、鉴权、限流 | 一个 `route: "*"` 节点 |
| 接口只为一个页面服务 | 建节点，`parent` 写该页面 |
| 内部函数、工具方法、schema、定时任务、消息消费 | 不建节点，任务里写清代码位置 |

判断口径：外部能观测到的行为变化才建接口节点，拿不准时优先建。

## 补充「维护思路」：前后端归属

- 前端调用后端时，任务关联到前端组件或页面；后端接口节点只在后端有改动时才挂任务，避免同一条任务在两个栈上重复。
- 联调类任务可同时关联前端组件和后端接口，两侧共享同一任务 ID，图上会高亮这条链路。
- 接口下线或路径变更时同步更新 `route`，不留空壳节点。
