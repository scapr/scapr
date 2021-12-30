import { config } from './config';
import path from 'node:path';

/**
 * The folder in which all of the hubs are contained
 */
export const hubFolder = path.join(path.dirname(config.path), 'hubs');
