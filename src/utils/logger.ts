import chalk from 'chalk';
import figures from 'figures';

const Logger = {
    error: (message: string) => console.log(chalk.red(`${chalk.bold(figures.cross)}  ${message}`))
};

export default Logger;
