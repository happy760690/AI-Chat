/**
 * @module presentation/App
 * @layer presentation
 *
 * 根组件，组合侧边栏与聊天窗口。
 * 初始化时自动创建第一个会话。
 */

import { useEffect } from 'react';
import { useStore } from '../store';
import { SessionSidebar } from './components/SessionSidebar';
import { ChatWindow } from './components/ChatWindow';
import { getSupportedModels, switchModel } from './services/engineService';

const MODELS = getSupportedModels();

export function App() {
  const activeSessionId = useStore(s => s.activeSessionId);
  const createSession   = useStore(s => s.createSession);

  // 启动时创建默认会话
  useEffect(() => {
    const session = createSession(MODELS[0]);
    switchModel(session.id, MODELS[0]);
  }, []);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <SessionSidebar />
      <main className="flex-1 overflow-hidden">
        {activeSessionId ? (
          <ChatWindow sessionId={activeSessionId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">
            请选择或新建一个对话
          </div>
        )}
      </main>
    </div>
  );
}
