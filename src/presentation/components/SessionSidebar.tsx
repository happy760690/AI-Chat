/**
 * @module presentation/components/SessionSidebar
 * @layer presentation
 *
 * 会话列表侧边栏，支持新建、切换、删除会话。
 */

import { useStore } from '../../store';
import { getSupportedModels, switchModel } from '../services/engineService';

const MODELS = getSupportedModels();

export function SessionSidebar() {
  const sessions       = useStore(s => Array.from(s.sessions.values()));
  const activeId       = useStore(s => s.activeSessionId);
  const createSession  = useStore(s => s.createSession);
  const deleteSession  = useStore(s => s.deleteSession);
  const setActive      = useStore(s => s.setActiveSession);

  function handleNew() {
    const session = createSession(MODELS[0]);
    switchModel(session.id, MODELS[0]);
  }

  return (
    <aside className="w-60 bg-gray-900 text-gray-100 flex flex-col h-full">
      <div className="p-3 border-b border-gray-700">
        <button
          onClick={handleNew}
          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
        >
          + 新建对话
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto py-2">
        {sessions.map(s => (
          <li
            key={s.id}
            className={`group flex items-center justify-between px-3 py-2 mx-2 rounded cursor-pointer text-sm transition-colors ${
              s.id === activeId
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
            onClick={() => setActive(s.id)}
          >
            <span className="truncate flex-1">{s.title}</span>
            <button
              onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
              className="opacity-0 group-hover:opacity-100 ml-2 text-gray-500 hover:text-red-400 transition-opacity"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
