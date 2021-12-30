import { config } from './config';
import path from 'path';

/**
 * The folder in which all of the hubs are contained
 */
export const hubFolder = path.join(path.dirname(config.path), 'hubs');
