import React, { useState } from 'react';
import { PendingRequest } from '../hooks/useWebSocket';
import { DiffViewer } from './DiffViewer';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Terminal,
  FileCode2,
  Clock,
  Bot,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface RequestCardProps {
  request: PendingRequest;
  onDecision: (id: string, decision: 'approved' | 'rejected', reason?: string) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, onDecision }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const formattedTime = new Date(request.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const isTerminalAction =
    request.action_type.toLowerCase().includes('command') ||
    request.action_type.toLowerCase().includes('bash') ||
    request.action_type.toLowerCase().includes('terminal') ||
    request.action_type.toLowerCase().includes('exec');

  const handleApprove = () => {
    setIsSubmitting(true);
    onDecision(request.id, 'approved');
  };

  const handleReject = () => {
    setIsSubmitting(true);
    onDecision(request.id, 'rejected', rejectReason || 'Operator rejected this action');
  };

  return (
    <div className="bg-[#111726] border border-slate-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 hover:border-slate-700">
      {/* Header */}
      <div className="bg-slate-900/60 px-5 py-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-100 flex items-center gap-1.5 text-sm">
                <Bot className="w-4 h-4 text-sky-400" />
                {request.agent_name}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium tracking-wide bg-sky-950/80 text-sky-300 border border-sky-800/50 flex items-center gap-1">
                {isTerminalAction ? <Terminal className="w-3 h-3 text-amber-400" /> : <FileCode2 className="w-3 h-3 text-emerald-400" />}
                {request.action_type}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {formattedTime}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-500 text-[11px] truncate max-w-[200px]" title={request.id}>
                ID: {request.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-amber-950/50 text-amber-400 border border-amber-800/40 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Awaiting Approval
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={expanded ? 'Collapse Payload' : 'Expand Payload'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-5 space-y-4">
          <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Review requested action payload before granting execution permission:</span>
          </div>

          <DiffViewer payload={request.payload} />

          {/* Optional rejection reason input */}
          {showRejectInput && (
            <div className="mt-3 p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 space-y-2">
              <label className="block text-xs font-medium text-rose-300">
                Rejection Reason (Returned to autonomous agent as error):
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Unauthorized filesystem modification outside workspace sandbox"
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="bg-slate-900/80 px-5 py-3 border-t border-slate-800 flex items-center justify-between gap-3">
        <span className="text-xs text-slate-400 font-mono">
          Strict-Control Gate: <span className="text-sky-400">Zero-Trust Active</span>
        </span>

        <div className="flex items-center space-x-3">
          {!showRejectInput ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowRejectInput(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/60 transition-all flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Reject Action
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowRejectInput(false)}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleReject}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Confirm Rejection
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleApprove}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve Action
          </button>
        </div>
      </div>
    </div>
  );
};
