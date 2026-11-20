# 改动点分析

## 作用文档

本文只服务 `overview.yaml`（`.lingchuang/<branchDir>/tasks/overview.yaml`），只改其中**一个**目标 `change` 的 `impacts` 与 `checks`，必要时新增 `defs`。`TASKS.md`、代码和其他改动点都不在写入范围内。审查时看什么见 [内置审查规则](rules-core.md)。

仅当用户要求审查某个改动点，或刷新已有分析时读取本文。

## 完整示例

```yaml
version: 3
root:
  title: 用户中心
defs:
  - id: avatar
    title: 头像组件
    kind: component
    file: components/Avatar/index.tsx
  - id: upload-avatar
    title: 上传头像接口
    kind: endpoint
    route: POST /api/avatar
  - id: profile-page
    title: 个人资料页
    kind: page
    file: pages/profile/index.tsx
changes:
  - ref: profile-page
    desc: 个人资料页改用头像组件的默认头像兜底，不再自行拼空白头像地址。
    tasks: [T-001]
    impacts:                    # 本次改动实际影响的节点 id
      - avatar
      - upload-avatar
    checks:                     # 审查结论
      - title: 头像地址存在第三方来源风险
        severity: critical
        desc: >-
          头像地址直接取自接口返回值，服务端下发外链时页面会向第三方发请求。
      - title: 头像资源路径有加载风险
        severity: suggest
        desc: 部署到子路径时头像会加载失败。
```

| 位置 | 写什么 |
| --- | --- |
| `changes[].impacts` | 被本次改动实际影响的节点 `id` 字符串数组，必须存在于 `defs` |
| `changes[].checks` | 该改动点的审查结论，每项标题自由命名 |
| `defs[]` | 节点身份；分析要引用的节点必须先在这里存在 |

## 字段约束

- `impacts` 可选字符串数组，同一数组内不重复，每项必须是 `defs` 里已有的 `id`。没有确认影响时写 `[]`。
- `checks` 可选数组，每项仅允许 `title`、`severity`、`desc`，没有 `status`，也没有「通过」项。没有发现问题时写 `checks: []`。
  - `title`：非空文本。
  - `severity`：`block` / `critical` / `nit` / `suggest`，含义见下表。
  - `desc`：非空字符串。
- `defs` 每项仅允许 `id`、`title`、`kind`、`file`、`symbol`、`route`、`desc`；`id` 唯一、非空、无首尾空白且不为 `root`，`kind` 取 `function`、`component`、`page`、`endpoint`、`config`、`data`、`feature`。
- 不修改 `version`、`root`、已有定义、目标改动点的其他字段或其他 `change`；不要把影响节点写进 `changes`。

## 严重等级

| severity | 界面显示 | 含义 | 使用条件 | 是否导致任务审查不通过 |
| --- | --- | --- | --- | --- |
| `block` | 阻塞 | 必须修，合并前处理 | 代码支持可能造成明显功能失败、数据损坏、安全漏洞 | 是 |
| `critical` | 重要 | 应当修，有异议需讨论 | 代码支持一个具体的缺陷或边界问题，会在真实场景触发，但不至于立即破坏功能 | 是 |
| `nit` | 优化 | 小改进，可改可不改 | 命名、风格、可读性等不影响行为的细节 | 否 |
| `suggest` | 建议 | 可考虑的替代方案 | 有更好的实现思路，当前实现可接受 | 否 |

任务级的「审查未通过」只由 `block` 与 `critical` 触发。证据不足、路径未被测试覆盖、只有一般性建议时，最高只能判 `suggest`，不得升级为 `critical`。

## 检查怎么写

一个改动点写 0–5 条，只写这次改动独有、代码里有依据的问题。

- 标题一针见血地指出问题所在，写清「哪方面 + 是什么问题」，例如「文件查询性能隐患」「文件判断逻辑有绕过风险」。不要写「分页下推」「正确性」「安全」这类抽象名词、技术术语或分类名。判断标准：没读过代码的同事看到标题就知道哪有风险。
- `desc` 只描述问题本身：触发条件和具体后果，不提供修复建议，不用「保障」「赋能」「兜底方案」之类的词，也不写「演示」字样。
- 不重复罗列影响节点，也不复述改动描述本身。
- 同样的问题不要在多个改动点重复堆砌。
- 先写影响最大的问题；同一等级内按重要性排序。

## 分析步骤

宁缺毋滥：少数有把握的结论，好过一长串猜测。

1. **定位**：读取 `<overviewPath>` 与 `<taskPath>`，按字符串 `ref` 定位目标 `change` 及其定义；文档不是第 3 版或 `ref` 无效时先说明问题，不扩大写入范围。
2. **发现**：读源码、调用方、使用页面或接口实现和相关测试，只保留有代码依据的影响，区分「接口被调用」和「接口行为实际改变」。按 [内置审查规则](rules-core.md) 的维度过一遍，记下可疑点。
3. **验证并过滤**：对每个可疑点回到代码确认，没通过的直接丢弃。
   - 必须能说出具体场景：什么输入或状态会导致什么错误结果。说不出来就不写。
   - 重新核对前提：调用方是否存在、值是否真的可能为空、代码是否真的会被执行到。
   - 区分「本次改动引入」与「原本就有」，后者不写；规则里「不要报告」的内容也不写。
   - 没运行验证过的，`desc` 里不要写成已确认的结论。
4. **写入**：复用已有 `defs` 的 `id`；确需新节点时补一条定义，不为层级完整性虚构页面。写入 `impacts` 与 `checks`。过滤后没有剩余就写 `checks: []`，零发现是合法结果。

## 结束检查

- 每条 `desc` 都点明是哪个文件、函数或接口，写出触发条件和后果。
- 严重等级与真实影响匹配，不把细节问题抬高；证据不足就降级。
- 同一个根因只写一次，不在多个改动点重复。
- 每条 `title` 非空、`severity` 在枚举内、`desc` 非空且不含修复建议；没有使用旧的 `status` 字段或 `passed`、`warning`、`danger` 取值。

## 结束方式

简要说明目标改动点的分析已更新、有无新增定义、`block` / `critical` / `nit` / `suggest` 各几项。不要顺带维护其他改动点；已有分析可展开，用户也可再次刷新。
