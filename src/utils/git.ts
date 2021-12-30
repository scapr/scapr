import execa from 'execa';

class Git {
    private runCommand(args: string) {
        return execa('git', args.split(' '));
    }

    public clone(url: string, path: string) {
        return this.runCommand(`clone ${url} ${path}`);
    }
}

export default new Git();
