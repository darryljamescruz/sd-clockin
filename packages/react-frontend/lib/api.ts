/**
 * @deprecated This file is deprecated. Use imports from '@/lib/api' instead.
 * This file is kept for backward compatibility during migration.
 * 
 * New import pattern:
 * import { studentsAPI, termsAPI, schedulesAPI, checkinsAPI, importAPI } from '@/lib/api'
 * or
 * import api from '@/lib/api'
 */

// Re-export everything from the new API structure
export * from './api/index.js';
export { default } from './api/index.js';
