import Conf, { Schema } from 'conf';
import { Config } from '../types';

/**
 * Conf schema
 */
export const schema: Schema<Config> = {};

/**
 * Conf instance used to power the CLI
 */
export const config = new Conf<Config>({ schema });
export default config;
