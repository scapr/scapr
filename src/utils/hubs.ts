import fs from 'fs';
import path from 'path';
import { config } from './config';

interface HubInfo {
	author: string;
	repo: string;
}

/**
 * The folder in which all of the hubs are contained
 */
export const hubsFolder = path.join(path.dirname(config.path), 'hubs');

export const templatesInHub = (hubInfo: HubInfo): string[] => {
	const templatesFolder = path.join(hubsFolder, hubInfo.author, hubInfo.repo, 'templates');

	if (fs.existsSync(templatesFolder))
		return fs.readdirSync(templatesFolder).map(template => template);
	else return null;
};

export const licensesInHub = (hubInfo: HubInfo): string[] => {
	const licensesFolder = path.join(hubsFolder, hubInfo.author, hubInfo.repo, 'licenses');

	if (fs.existsSync(licensesFolder))
		return fs.readdirSync(licensesFolder).map(license => license.split('.')[0]);
	else return null;
};
