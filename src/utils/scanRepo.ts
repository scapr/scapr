import clone from 'git-clone/promise';
import path from 'path';
import fs from 'fs';
import yaml from 'yaml';
import { hubFolder } from './index';
import { ScanError, ScanResult, Template } from '../types';

const gitUrlRegex = /^(?:(?:(?:https?\:\/\/)(?:(?:(?:(?:[a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})\/))|(?:(?:ssh\:\/\/)?git\@)(?:(?:(?:(?:[a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})(?:\:)))([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})(?:\/)([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})(?:(?:\.git)?)$/;

const scanRepo = async (url: string): Promise<ScanResult> => {
	const matches = url.match(gitUrlRegex);
	matches.shift();

	// Dissect the username and repo from the URL
	const [ username, repo ] = matches;

	// ? what if the username and/or repo does not have a match?

	// If the hub has not already been cloned, do so
	const hubDir = path.join(hubFolder, username, repo);

	if (!fs.existsSync(hubDir)) {
		// ? what if the user does not have git installed already
		try {
			await clone(url, hubDir);
		} catch (error) {
			// todo: handle this error better
			console.error(error);
		}
	}

	// Cancel out of the search if there is no hub metadata
	const metadataPath = path.join(hubDir, 'scapr.yml');

	if (!fs.existsSync(metadataPath)) {
		// Cleanup
		fs.rmSync(hubDir, { recursive: true, force: true });

		return {
			error: ScanError.NoBaseConfig,
			path: hubDir
		}
	}

	// Crawl the templates directory
	const templates: Template[] = [];
	const templatesPath = path.join(hubDir, 'templates');

	if (fs.existsSync(templatesPath)) {
		fs.readdirSync(templatesPath).forEach(template => {
			const templatePath = path.join(templatesPath, template);
			let addedToList = false;
		
			fs.readdirSync(templatePath).forEach(file => {
				const [fileName, extension] = file.split('.');

				// ? maybe the file naming convention should be less strict?
				if (fileName.toLowerCase() === 'scapr-template' && extension.toLowerCase() === 'yml') {
					const configPath = path.join(templatePath, 'scapr-template.yml');
					const templateConfig = yaml.parse(fs.readFileSync(configPath, 'utf-8'));
					
					// Push the config to the templates list
					addedToList = true;

					templates.push({
						name: template,
						hasConfig: true,
						description: templateConfig?.description,
						extends: templateConfig?.extends,
						private: templateConfig?.private ?? false,
					})
				}
			})

			// If no config has been added to the list for this template, push an empty object
			if (!addedToList)
				templates.push({
					name: template,
					hasConfig: false
				})
		})
	}

	// Crawl the licenses directory
	const licenses: string[] = [];
	const licensesPath = path.join(hubDir, 'licenses');

	if (fs.existsSync(licensesPath)) {
		fs.readdirSync(licensesPath).forEach(license => {
			const [ licenseName, extension ] = license.split('.');
			licenses.push(licenseName);
		})
	}

	// Read the hub's metadata
	const metadata = yaml.parse(fs.readFileSync(path.join(hubDir, 'scapr.yml'), 'utf-8'));
	
	return {
		error: ScanError.None,
		path: hubDir,
		name: metadata?.name ?? `${username}/${repo}`,
		description: metadata?.description,
		templates,
		licenses
	}
}

export default scanRepo;

scanRepo('https://github.com/newtykins/templates').then(d => console.log(d))
