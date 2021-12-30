import Conf, { Schema } from 'conf';
import { Config } from '../types';

/**
 * Conf schema
 */
export const schema: Schema<Config> = {
	firstRun: {
		type: 'boolean',
		default: true
	}
}

/**
 * Conf instance used to power the CLI
 */
export const config = new Conf();
export default config;
