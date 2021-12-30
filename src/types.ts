/**
 * Represents the config extracted from a template
 */
export interface Template {
    name: string;
    hasConfig: boolean;
    description?: string;
    extends?: string;
    private?: boolean;
}

/**
 * Potential errors of the scanRepo function
 */
export enum ScanError {
    None,
    NoGit,
    NoBaseConfig
}

/**
 * The result of the scanRepo function
 */
export interface ScanResult {
    error: ScanError;
    path: string;
    name?: string;
    description?: string;
    templates?: Template[];
    licenses?: string[];
}

/**
 * Represents the config schema for the CLI
 */
export interface Config {}
