# AI Chat

基于 React + TypeScript + Vite 构建的 AI 聊天应用，采用分层架构设计。

## 运行项目

```bash
npm install   # 安装依赖（已有 node_modules 可跳过）
npm run dev   # 启动开发服务器，访问 http://localhost:5173
npm run build # 打包生产版本
```

## 项目入口

```
index.html → src/main.tsx → src/presentation/App.tsx → 各组件
```

## 目录结构

```
src/
├── main.tsx                      # JS 入口，启动 React
├── index.css                     # 全局样式
│
├── presentation/                 # UI 层（最常修改的地方）
│   ├── App.tsx                   # 根组件
│   ├── components/
│   │   ├── ChatWindow.tsx        # 聊天消息列表
│   │   ├── ChatInput.tsx         # 输入框
│   │   ├── MessageBubble.tsx     # 单条消息气泡
│   │   ├── ModelSelector.tsx     # 模型选择器
│   │   ├── SessionSidebar.tsx    # 左侧会话列表
│   │   └── ToolCallBadge.tsx     # 工具调用标签
│   ├── hooks/
│   │   └── useChat.ts            # 聊天逻辑的 React Hook
│   └── services/
│       └── engineService.ts      # 连接 UI 和核心引擎
│
├── store/                        # 全局状态管理（Zustand）
│   ├── index.ts                  # store 入口
│   ├── messageSlice.ts           # 消息状态
│   ├── sessionSlice.ts           # 会话状态
│   ├── streamSlice.ts            # 流式输出状态
│   └── types.ts                  # 类型定义
│
├── core/                         # 核心业务逻辑（不依赖 UI）
│   ├── engine/                   # AI 引擎
│   ├── message/                  # 消息格式
│   ├── session/                  # 会话管理
│   ├── stream/                   # 流式控制
│   ├── context/                  # 上下文裁剪
│   ├── abort/                    # 中断控制
│   ├── plugins/                  # 插件管理
│   └── ports/                    # 接口定义（I 开头的文件）
│
├── infrastructure/               # 外部服务对接
│   ├── mock/MockModelAdapter.ts  # 模拟 AI 响应（当前使用）
│   └── sse/ISSEClient.ts         # SSE 流式接口定义
│
├── agent/                        # Agent 功能（多步推理）
├── rag/                          # RAG 检索增强生成
├── tools/                        # 工具调用（函数调用）
├── plugins/                      # 插件系统
└── adapters/                     # 模型适配器接口
```

## 快速上手

| 目标 | 去哪里改 |
|------|---------|
| 修改 UI 界面 | `src/presentation/components/` |
| 修改聊天逻辑 | `src/presentation/hooks/useChat.ts` |
| 修改全局数据 | `src/store/` 下对应的 slice |
| 接入真实 AI 模型 | 在 `src/infrastructure/` 实现适配器，替换 `MockModelAdapter` |

## 技术栈

- React 19 — UI 框架
- TypeScript — 类型安全
- Vite — 构建工具
- Zustand — 轻量状态管理
- Tailwind CSS — 样式
