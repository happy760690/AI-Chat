/**
 * @module presentation/components/ModelSelector
 * @layer presentation
 *
 * 模型切换下拉选择器。
 */

import { useStore } from '../../store';
import { getSupportedModels, switchModel } from '../services/engineService';

const MODELS = getSupportedModels();

interface Props {
  sessionId: string;
}

export function ModelSelector({ sessionId }: Props) {
  const session = useStore(s => s.sessions.get(sessionId));
  const currentModel = session?.modelConfig.modelId ?? MODELS[0];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    switchModel(sessionId, e.target.value);
  }

  return (
    <select
      value={currentModel}
      onChange={handleChange}
      className="text-xs bg-gray-800 text-gray-300 border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
    >
      {MODELS.map(m => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  );
}
