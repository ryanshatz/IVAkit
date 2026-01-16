/**
 * Session Manager
 * 
 * In-memory session storage implementation.
 * For production, replace with Redis or database-backed storage.
 */

import type { SessionState } from '@ivakit/shared';
import type { SessionStorage } from './types';

export class SessionManager implements SessionStorage {
    private sessions: Map<string, SessionState> = new Map();

    async get(sessionId: string): Promise<SessionState | null> {
        return this.sessions.get(sessionId) || null;
    }

    async set(session: SessionState): Promise<void> {
        this.sessions.set(session.id, session);
    }

    async delete(sessionId: string): Promise<void> {
        this.sessions.delete(sessionId);
    }

    /**
     * Get all active sessions (for debugging/admin)
     */
    async getAll(): Promise<SessionState[]> {
        return Array.from(this.sessions.values());
    }

    /**
     * Clear all sessions
     */
    async clear(): Promise<void> {
        this.sessions.clear();
    }

    /**
     * Get session count
     */
    get count(): number {
        return this.sessions.size;
    }
}
