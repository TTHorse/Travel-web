
---

### 方式二：HTML 一键下载器（更省事）

如果你正在使用电脑浏览器，复制以下代码保存为 `download_trip_md.html`，双击打开，点击页面中的按钮即可直接下载 `.md` 文件：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>下载行程规划文档</title>
    <style>
        body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: #f0f2f5; margin: 0; }
        .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; }
        button { background: #4F46E5; color: white; border: none; padding: 12px 32px; border-radius: 8px; font-size: 18px; cursor: pointer; transition: 0.2s; }
        button:hover { background: #4338CA; transform: scale(1.02); }
        p { color: #6B7280; margin-top: 16px; }
    </style>
</head>
<body>
<div class="card">
    <h2>📄 行程规划复刻方案</h2>
    <p>点击下方按钮下载 <code>.md</code> 文档</p>
    <button id="downloadBtn">⬇️ 下载 Markdown 文档</button>
    <p style="font-size:14px; color:#9CA3AF;">文件名称：TripPlanner_Spec.md</p>
</div>
<script>
    document.getElementById('downloadBtn').addEventListener('click', function() {
        const content = `# 行程规划页面（AI 行程助手）复刻方案

> 基于视觉稿逆向分析，面向全栈开发者的 VibeCoding 实现文档  
> 目标：快速复刻一个“新建行程”表单页，并接入 AI 规划能力

---

## 1. 页面概览

| 属性 | 描述 |
|------|------|
| 页面名称 | 新建行程（行程规划表单） |
| 核心任务 | 用户填写行程基础信息，点击“AI规划行程”获取智能推荐路线 |
| 交互风格 | 表单 + 标签选择 + 搜索输入 + 底部按钮 |
| 适配端 | 移动端为主（H5 / 小程序 / App），同时兼容桌面 |

---

## 2. 功能模块拆解

### 2.1 日期范围
- **控件**：两个日期选择器（开始日期 / 结束日期）
- **占位提示**：\`年/月/日\`
- **交互**：点击弹出日历选择器，选择后自动计算天数（可选展示）

### 2.2 目的地
- **控件**：文本输入框 + 联想下拉列表
- **占位提示**：\`输入城市名称\`
- **下拉数据源**：示例中出现“尔伯联合、斯里兰卡、密克罗尼西亚联邦、马绍尔群岛”等（可对接地理 API 或本地预设热门目的地）

### 2.3 预算（可选）
- **控件**：数字输入框或滑块，带货币符号
- **标注**“（可选）”，允许用户留空

### 2.4 人数
- **控件**：数字步进器（Stepper）或下拉选择
- **默认值**：\`不限\`（即 0 或 -1 表示不限人数）

### 2.5 行程模式（多选标签）
- **标签列表**（圆角胶囊样式）：
  - 特种兵打卡（高强度）
  - 休闲模式（轻松）
  - 度假模式（酒店度假）
  - 美食之旅
  - 文化探索
- **交互**：点击切换选中状态，支持多选（或互斥？视觉上为多选，可设计为多选组合）

### 2.6 核心行动按钮
- **“+AI规划行程”** 主按钮，显眼位置
- 点击后触发 AI 生成行程计划（需后端对接 LLM / 行程规划引擎）

---

## 3. UI 组件清单（适合 VibeCoding 组件库）

| 组件名 | 类型 | 备注 |
|--------|------|------|
| \`DateRangePicker\` | 复合组件 | 两个日期弹窗，联动校验 |
| \`CityInput\` | 带联想的下拉输入框 | 支持模糊搜索，防抖请求 |
| \`NumberStepper\` | 增减按钮 + 数字显示 | 最小值为 0，最大不限 |
| \`TagGroup\` | 可复选标签组 | 点击切换 \`active\` 状态 |
| \`BudgetInput\` | 数字输入 + 单位符号 | 可选字段 |
| \`PrimaryButton\` | 带图标的主按钮 | 内置 loading 状态，调用 AI 接口 |
| \`PageContainer\` | 布局容器 | 顶部标题 + 滚动表单 + 底部固定按钮（可选） |

---

## 4. 数据模型（前端表单状态）

\`\`\`typescript
interface TripFormData {
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  destination: string;     // 城市名称（或 ID）
  budget?: number;         // 可选，单位元
  peopleCount: number;     // 0 表示“不限”
  modes: Array<             // 选中的行程模式
    'intensive' | 'relax' | 'resort' | 'food' | 'culture'
  >;
}
\`\`\`

---

## 5. API 设计建议

### 5.1 目的地联想接口
\`\`\`
GET /api/destinations?keyword={query}
Response: { items: [{ name, country, id }] }
\`\`\`

### 5.2 AI 行程规划接口
\`\`\`
POST /api/trip/plan
Request Body: TripFormData
Response: {
  tripId: string,
  itinerary: [{
    day: number,
    activities: [{ time, title, location, notes }]
  }],
  totalCost?: number,
  tips?: string
}
\`\`\`

### 5.3 保存行程（可选）
\`\`\`
POST /api/trip/save
Request Body: { ...TripFormData, itinerary }
\`\`\`

---

## 6. 技术实现路线（VibeCoding 友好）

| 层级 | 推荐选型 | 理由 |
|------|----------|------|
| 前端框架 | React + TypeScript（或 Vue 3 + TS） | 生态丰富，组件化复用性强 |
| 样式方案 | Tailwind CSS + 预置设计系统 | 快速实现圆角胶囊、间距、颜色 |
| 日期组件 | \`react-datepicker\` 或 \`dayjs\` + 自研 | 轻量可控 |
| 联想输入 | 使用 \`react-select\` 或 \`downshift\` | 支持异步请求 + 防抖 |
| 状态管理 | Zustand 或 Pinia（Vue） | 轻量，适合表单场景 |
| 后端框架 | Node.js（Express/Nest）或 Python（FastAPI） | 对接 LLM API（如 OpenAI / 国内大模型） |
| AI 集成 | 封装统一适配层，支持 Prompt 工程 | 根据模式、天数、人数生成个性化行程 |

---

## 7. 交互流程（关键路径）

1. 用户进入页面，看到空表单
2. 依次填写日期、目的地、预算（可选）、人数
3. 选择一个或多个行程模式（至少选一个）
4. 点击 **“+AI规划行程”**
   - 按钮进入 loading 状态，禁用重复点击
   - 前端校验必填项（日期、目的地、模式）
   - 调用后端 AI 接口
   - 后端组装 Prompt，调用 LLM，解析返回结果
   - 返回结构化行程数据
5. 前端跳转至“行程详情页”或弹窗展示生成的行程
6. 用户可编辑调整，最终保存

---

## 8. 扩展点（可迭代功能）

- 行程天数自动根据日期范围计算
- 预算智能推荐（基于目的地和天数）
- 多人分担费用模式
- 导出行程为 PDF / 分享
- 保存为草稿，历史记录

---

## 9. 开发任务拆分（VibeCoding 阶段）

| 阶段 | 任务 | 工时估算 |
|------|------|----------|
| 第1天 | 静态页面搭建（HTML + CSS 组件） | 4h |
| 第2天 | 表单状态管理与交互逻辑（日期、标签、步进器） | 4h |
| 第3天 | 目的地联想接口 + 前端集成 | 3h |
| 第4天 | AI 规划接口开发（Prompt + 返回解析） | 6h |
| 第5天 | 联调 + 异常处理 + 加载状态 + 跳转 | 3h |

---

## 10. 注意事项

- 移动端适配优先，触控区域 ≥ 44px
- 日期范围需校验：开始日期不能晚于结束日期
- 人数“不限”用 0 表示，后端特殊处理
- AI 返回结果需做 Schema 校验，防止格式错误
- 考虑 Token 消耗优化，缓存常用目的地行程模板

---

**下一步建议**：可直接基于该文档生成项目脚手架，开始 VibeCoding 实现。`;

        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'TripPlanner_Spec.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
</script>
</body>
</html>