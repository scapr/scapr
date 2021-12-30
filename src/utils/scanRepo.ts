import path from 'path';
import fs from 'fs';
import yaml from 'yaml';
import { hubsFolder } from './hubs';
import { ScanError, ScanResult, Template } from '../types';
import git from './git';
import commandExists from 'command-exists';
import Logger from './logger';

const gitUrlRegex =
	/^(?:(?:ht{2}ps?:\/{2}(?:[\dA-Za-z][\w-]{1,252}\.){1,8}[A-Za-z]{2,63}\/)|(?:s{2}h:\/{2})?git@(?:[\dA-Za-z][\w-]{1,252}\.){1,8}[A-Za-z]{2,63}:)([\dA-Za-z][\w-]{1,36})\/([\dA-Za-z][\w-]{1,36})(?:\.git)?$/;

const scanRepo = async (url: string): Promise<ScanResult> => {
	const matches = url.match(gitUrlRegex);
	matches.shift();

	// Dissect the username and repo from the URL
	const [username, repo] = matches;

	// ? what if the username and/or repo does not have a match?

	// If the hub has not already been cloned, do so
	const hubDir = path.join(hubsFolder, username, repo);

	if (!fs.existsSync(hubDir)) {
		if (await commandExists('git')) {
			await git.clone(url, hubDir);
		} else {
			// todo: make a better error message for this, provide installation for git!
			Logger.error(
				'I could not find an installation of git on this computer! Please ensure that you have it installed, as it is a key dependency of scapr!'
			);

			return {
				error: ScanError.NoGit,
				path: hubDir
			};
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
		};
	}

	// Crawl the templates directory
	const templates: Template[] = [];
	const templatesPath = path.join(hubDir, 'templates');

	if (fs.existsSync(templatesPath)) {
		for (const template of fs.readdirSync(templatesPath)) {
			const templatePath = path.join(templatesPath, template);
			let addedToList = false;

			for (const file of fs.readdirSync(templatePath)) {
				const [fileName, extension] = file.split('.');

				// ? maybe the file naming convention should be less strict?
				if (
					fileName.toLowerCase() === 'scapr-template' &&
					extension.toLowerCase() === 'yml'
				) {
					const configPath = path.join(templatePath, 'scapr-template.yml');
					const templateConfig = yaml.parse(fs.readFileSync(configPath, 'utf-8'));

					// Push the config to the templates list
					addedToList = true;

					templates.push({
						name: template,
						hasConfig: true,
						description: templateConfig?.description,
						extends: templateConfig?.extends,
						private: templateConfig?.private ?? false
					});
				}
			}

			// If no config has been added to the list for this template, push an empty object
			if (!addedToList)
				templates.push({
					name: template,
					hasConfig: false
				});
		}
	}

	// Crawl the licenses directory
	const licenses: string[] = [];
	const licensesPath = path.join(hubDir, 'licenses');

	if (fs.existsSync(licensesPath)) {
		for (const license of fs.readdirSync(licensesPath)) {
			const [licenseName] = license.split('.');
			licenses.push(licenseName);
		}
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
	};
};

export default scanRepo;

//scanRepo('https://github.com/newtykins/templates').then(d => console.log(d));
