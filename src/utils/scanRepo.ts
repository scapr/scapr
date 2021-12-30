import Conf from 'conf';
import clone from 'git-clone/promise';
import path from 'path';
import fs from 'fs';
import yaml from 'yaml';

const gitUrlRegex = /^(?:(?:(?:https?\:\/\/)(?:(?:(?:(?:[a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})\/))|(?:(?:ssh\:\/\/)?git\@)(?:(?:(?:(?:[a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})(?:\:)))([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})(?:\/)([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})(?:(?:\.git)?)$/;

// Initialise an instance of conf to find the directory data is stored in
const config = new Conf();
const configFolder = path.dirname(config.path);
const hubFolder = path.join(configFolder, 'hubs');

enum ScanError {
	None,
	NoGit,
	NoBaseConfig
}

interface ScanResult {
	error: ScanError;
	path: string;
	name?: string;
	description?: string;
	templates?: Template[];
}

interface Template {
	name: string;
	hasConfig: boolean;
	description?: string;
	extends?: string;
	private?: boolean;
}

const scanRepo = async (url: string): Promise<ScanResult> => {
	const matches = url.match(gitUrlRegex);
	matches.shift();

	// Dissect the username and repo from the URL
	const [ username, repo ] = matches;
	const directory = path.join(hubFolder, username, repo);

	// ? what if the username and/or repo does not have a match?

	// If the hub has not already been cloned, do so
	if (!fs.existsSync(directory)) {
		// ? what if the user does not have git installed already
		try {
			await clone(url, directory);
		} catch (error) {
			// todo: handle this error better
			console.error(error);
		}
	}

	// Cancel out of the search if there is no hub metadata
	const metadataPath = path.join(directory, 'scapr.yml');

	if (!fs.existsSync(metadataPath)) {
		// Cleanup
		fs.rmSync(directory, { recursive: true, force: true });

		return {
			error: ScanError.NoBaseConfig,
			path: directory
		}
	}

	// Read the hub config
	const { name, description } = yaml.parse(fs.readFileSync(path.join(directory, 'scapr.yml'), 'utf-8'));

	// Crawl the templates directory
	const templates: Template[] = [];
	const templatesDirectory = path.join(directory, 'templates');

	if (fs.existsSync(templatesDirectory)) {
		fs.readdirSync(templatesDirectory).forEach(template => {
			const templatePath = path.join(templatesDirectory, template);
			let addedToList = false;
		
			fs.readdirSync(templatePath).forEach(file => {
				const [fileName, extension] = file.split('.');

				// ? maybe the file naming convention should be less strict?
				if (fileName.toLowerCase() === 'scapr-template' && extension.toLowerCase() === 'yml') {
					const templateConfigPath = path.join(templatePath, 'scapr-template.yml');
					const { description, private: isPrivate, extends: extension } = yaml.parse(fs.readFileSync(templateConfigPath, 'utf-8'));
					
					templates.push({
						name: template,
						hasConfig: true,
						description,
						extends: extension,
						private: isPrivate ?? false,
					})

					addedToList = true;
				}
			})

			if (!addedToList)
				templates.push({
					name: template,
					hasConfig: false
				})
		})
	}
	
	return {
		error: ScanError.None,
		path: directory,
		name: name,
		description: description,
		templates
	}
}

export default scanRepo;
