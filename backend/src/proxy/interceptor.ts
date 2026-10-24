import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { insertAuditLog } from '../db/client';
import { broadcast } from '../ws/socket';

export interface PendingRequestHolder {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

// Global in-memory Map holding unresolved HTTP requests
export const pendingRequests = new Map<string, PendingRequestHolder>();

const router = Router();

async function handleMcpIntercept(req: Request, res: Response): Promise<void> {
  const id = uuidv4();
  const agentName = req.body.agent_name || req.body.agentName || 'autonomous-agent';
  const actionType = req.body.action_type || req.body.actionType || req.body.tool || 'mcp_tool_call';
  const payloadData = req.body.payload !== undefined ? req.body.payload : req.body;
  const payloadString = typeof payloadData === 'string' ? payloadData : JSON.stringify(payloadData, null, 2);

  // 1. Save to SQLite with status 'pending'
  insertAuditLog(id, agentName, actionType, payloadString, 'pending');

  // 2. Emit WebSocket event to React frontend with UUID and payload
  const requestEvent = {
    type: 'NEW_PENDING_REQUEST',
    id,
    agent_name: agentName,
    action_type: actionType,
    payload: payloadString,
    status: 'pending',
    timestamp: new Date().toISOString()
  };
  broadcast(requestEvent);

  console.log(`[Proxy-Interceptor] Intercepted MCP call [${id}] from agent "${agentName}" (${actionType}). Holding request.`);

  // 3. Return Promise and store resolve/reject callbacks in the Map
  try {
    const resolvedData = await new Promise((resolve, reject) => {
      pendingRequests.set(id, { resolve, reject });
    });

    console.log(`[Proxy-Interceptor] MCP call [${id}] approved by human operator.`);
    res.status(200).json({
      status: 'success',
      decision: 'approved',
      id,
      data: resolvedData
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Execution rejected by human operator';
    console.warn(`[Proxy-Interceptor] MCP call [${id}] rejected by human operator: ${errorMsg}`);
    res.status(403).json({
      status: 'forbidden',
      decision: 'rejected',
      id,
      error: errorMsg
    });
  }
}

// Support both /api/mcp and /api/mcp/execute
router.post('/execute', handleMcpIntercept);
router.post('/', handleMcpIntercept);

// Health check / inspection for pending requests
router.get('/pending', (_req: Request, res: Response) => {
  const ids = Array.from(pendingRequests.keys());
  res.status(200).json({
    success: true,
    pendingCount: ids.length,
    pendingIds: ids
  });
});

export default router;
