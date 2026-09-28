/**
 * ServiceNow Identity & Access — public module surface.
 * Future modules (Incident, Problem, Change, Request, Knowledge) should
 * import ONLY from here, never from Supabase or localStorage directly.
 */
export * from './types';
export * from './authorization';
export * from './authentication';
export * from './identity';
export * from './seed';
