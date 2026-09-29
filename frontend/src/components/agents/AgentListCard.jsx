import React from 'react';
import { Server, Wifi, WifiOff, Cpu, Clock } from 'lucide-react';

export const AgentListCard = ({ agents, selectedAgentId, onSelectAgent }) => {
  const formatTime = (timeStr) => {
    if (!timeStr) return 'Never';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString();
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="agent-card shadow-glass">
      <div className="agent-header">
        <div className="flex items-center gap-2">
          <Server size={18} className="text-accent" />
          <span className="font-semibold text-main">Connected Agents ({agents.length})</span>
        </div>
      </div>

      <div className="agent-list">
        {agents.length === 0 ? (
          <div className="agent-empty">No agents registered yet.</div>
        ) : (
          agents.map((agent) => {
            const isOnline = agent.status === 'ONLINE';
            const isSelected = selectedAgentId === agent.agent_id;

            return (
              <div
                key={agent.agent_id}
                onClick={() => onSelectAgent(isSelected ? '' : agent.agent_id)}
                className={`agent-item ${isSelected ? 'agent-item-active' : ''}`}
              >
                <div className="agent-item-left">
                  <div className={`status-dot ${isOnline ? 'dot-online' : 'dot-offline'}`}>
                    {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                  </div>
                  <div className="agent-info">
                    <span className="agent-hostname font-medium text-main">
                      {agent.hostname || 'Agent Node'}
                    </span>
                    <span className="agent-id font-mono text-xs text-muted">
                      {agent.agent_id.substring(0, 18)}...
                    </span>
                  </div>
                </div>

                <div className="agent-item-right">
                  <span className={`status-pill ${isOnline ? 'pill-online' : 'pill-offline'}`}>
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                  <span className="agent-lastseen text-xs text-muted flex items-center gap-1">
                    <Clock size={10} /> {formatTime(agent.last_seen_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
