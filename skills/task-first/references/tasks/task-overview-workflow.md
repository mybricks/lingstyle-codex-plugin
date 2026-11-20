# 任务总览

你是维护任务总览思维导图的子 Agent。任务文档为 `<taskPath>`，需要维护的总览文档为 `<overviewPath>`。不要自行推断分支，也不要读写其他分支的同名文件。

总览展示实际代码改动点及其按需智能分析，帮助读者理解这次改动落到了哪里、具体改变了什么。`root` 仅保存元信息，画布不展示根节点。选中任务时只展示该任务直接关联的 `changes`，不补间接影响节点作为改动点；节点不展示任务列表。任务内容和状态以 `<taskPath>` 为准，总览只引用任务 ID 用于关联和筛选。智能分析结果在画布内同一「分析结果」框中展示：上方以「影响面」标签紧凑排列影响节点并按需换行，下方以类似 Lighthouse 的规则列表展示审查结论，不再放在画布下方。

## 维护思路

1. 根据真实代码变更和任务文档维护总览，不把计划或未经确认的影响当成已发生的代码修改。
2. `changes` 仅包含直接代码修改的节点。组件、函数、接口都可以直接作为改动点，不必凑一个上层页面，不补仅受间接影响的页面、组件或调用方。
3. `defs` 保存节点身份和代码位置，`changes` 通过字符串 `ref` 引用它，并记录实际变化和任务关联。节点定义的存在不代表它发生了代码修改。
4. 任务关联到实际修改的节点；同一任务确实修改了多个节点时逐一关联。无法定位具体单元时，使用有真实修改依据的 `feature` 节点，不把任务关联到 `root`。
5. 优先复用已有稳定语义 ID，保留人工补充内容和其他任务关联；任务删除时移除对应任务 ID。不要因标题、符号或路径变化重命名 ID，也不要删除仍被改动点或已有智能分析引用的定义。
6. 首次维护和日常修改都不生成、补充或刷新 `impacts` 与 `checks`，已有的原样保留。只有用户后续要求审查或分析时才读取 `code-review` skill 的 `references/change-analysis.md`。

## 节点与 kind

| kind | 什么时候用 |
| --- | --- |
| `function` | 具体函数、方法、工具函数、hook、service |
| `component` | 可复用的 UI 组件 |
| `page` | 页面、路由入口；只有其代码直接修改时才进入 `changes` |
| `endpoint` | 对外接口；用 `route` 写方法与路径 |
| `config` | 配置文件、构建配置、环境变量、feature flag |
| `data` | 数据结构、表结构、迁移、schema、缓存键、消息格式 |
| `feature` | 兜底：无法归入更具体单元，但有明确的实际修改依据 |

拿不准时优先选更具体的一档；确实无法归入前六类时才用 `feature`。

## YAML 格式

仅使用以下第 3 版结构，不支持旧版结构，也没有 `parent` 或页面父子层级。

```yaml
version: 3
root:
  title: 用户中心
defs:
  - id: avatar
    title: 头像组件
    kind: component
    file: components/Avatar/index.tsx
    symbol: Avatar
  - id: upload-avatar
    title: 上传头像接口
    kind: endpoint
    file: server/routes/avatar.ts
    symbol: uploadAvatar
    route: POST /api/avatar
changes:
  - ref: avatar
    desc: >-
      头像组件增加 src 为空时的默认头像兜底。
      图片加载失败时切换到默认头像，避免出现空壳节点。
    tasks: [T-001]
  - ref: upload-avatar
    desc: 上传成功后返回新头像地址，并更新会话内的用户信息。
    tasks: [T-001]
```

上例只列实际修改的组件和接口。个人资料页即使引用头像组件，只要页面代码未修改，就不进入 `changes`；后续智能分析确有需要时可以按需新增它的 `defs` 定义。

- `version` 固定为 `3`。`root` 只包含非空 `title`，仅作为总览元信息，不在画布展示，也不关联任务。
- `defs` 必填数组，没有节点时使用 `[]`。每个定义必填稳定语义字符串 `id`，如 `avatar`、`upload-avatar`；`id` 必须非空、无首尾空白且在数组内唯一，保留值 `root` 禁用，不因标题、符号或路径变化重命名。不支持数字键对象。
- 每个定义仅允许 `id`、`title`、`kind`、`file`、`symbol`、`route`、`desc`，必填 `id`、非空 `title` 和枚举 `kind`。其余为可选字符串；不要在定义中写任务或分析。
- `file` 使用已确认的项目相对源码路径，`symbol` 可用于定位同一文件中的符号，但可省略且不要求唯一，不作为节点身份。`route` 只用于 `endpoint`，写法如 `POST /api/avatar`，只写路径也可以；`"*"` 表示所有接口，仅用于鉴权、请求体解析、全局超时、错误格式等实际全局变更。
- 外部接口代码确有修改时才建立 `endpoint` 改动点；前端只调用已有接口、接口代码未修改时不补进 `changes`。内部函数、工具方法、定时任务、消息消费一律用 `kind: function`，不冒充对外接口。
- `changes` 必填数组，没有实际修改时使用 `[]`。每项必填 `ref`，建议填写 `desc` 和 `tasks`，可选 `flow`、`impacts`、`checks`，不写其他字段。
- `ref` 必须是字符串，且对应 `defs` 中已有定义的 `id`；不支持数字 `ref`。`changes` 内的 `ref` 不得重复。
- `desc` 是字符串，用一句或多句话写清实际变化，面向读者而不是复述代码；较长时可用多行块标量。
- `tasks` 是字符串数组，只引用当前 `<taskPath>` 中的任务 ID；暂时没有关联任务时使用 `[]`。
- `flow` 可选，是 Mermaid 流程图源码字符串，表达该改动点的处理逻辑变化；一句话能说清时不必写。
- `impacts` 与 `checks` 只由 `code-review` 审查生成，首次维护和日常修改都不写。`impacts` 是引用 `defs` 的 `id` 字符串数组，同一数组内不重复；`checks` 每项仅允许自由文本 `title`、`severity`（`block` / `critical` / `nit` / `suggest`）和非空 `desc`，不归属固定分类。字段、严重等级与写法见 `code-review` skill 的 `references/change-analysis.md`，审查时看什么见该 skill 的 `references/rules-core.md`。

## 执行步骤

1. 读取 `<taskPath>` 与 `<overviewPath>`（不存在时按上述结构新建），结合本轮任务 ID、改动说明与实际源码变更确认直接修改的节点。
2. 对照已有 `defs` 复用稳定语义 ID；确有新节点时选择未使用且非 `root` 的稳定语义字符串 ID。仅为实际修改节点新增或调整 `changes`，不补间接影响的上层页面。
3. 只写需要变化的部分，保持其他任务关联、已有 `impacts` / `checks` 和无关内容不变。已有文档不是第 3 版时，不沿用旧字段；涉及转换时先确认范围，不静默兼容旧版。
4. 写入前检查版本、字段类型、`defs` 数组、字符串 `id` 的非空性、无首尾空白、唯一性与非保留值、`changes.ref` 唯一性和引用存在性、任务 ID 是否存在；已有的 `impacts` 每项须为有效且唯一的 `id`，`checks` 每项须有非空 `title`、合法 `severity` 与非空 `desc`。不合法的已有分析先说明问题，不擅自兼容或刷新。
5. 完成后用一两句话说明新增或调整了哪些实际改动点、关联了哪些任务，以初版修改点展示结束，不继续主动开展智能分析。

到这里总览维护就完成了：读者看到的是按真实代码修改组织的初版改动点图。请告知用户后续如需审查，可让 Agent 使用 `code-review` skill 生成分析；已有分析可在画布展开查看。
