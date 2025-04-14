import { spawnSync } from 'child_process';
import { matcher } from 'matcher';

const DIFF_MAP = {
    'A': 'Added',
    'C': 'Copied',
    'D': 'Deleted',
    'M': 'Modified',
    'R': 'Renamed',
    'T': 'Type-Change',
    'U': 'Unmerged',
    'X': 'Unknown',
    'B': 'Broken',
} as const;

function filterFiles(files: Array<string>, formats: Array<string>) {
    return formats.reduce((result, format) => {
        const matchedFiles = files.filter(file => {
            return matcher(Array.of(file), Array.of(format)).length >= 1;
        });
        return [...result, ...matchedFiles];
    }, [] as Array<string>);
}

function formatOutput(files: Array<string>) {
    return files.map(file => {
        const temp = file.split('\t');
        return {
            'filename': temp[1],
            'status': DIFF_MAP[temp[0] as keyof typeof DIFF_MAP]
        };
    });
}

export function getChangedFiles(formats?: Array<string>) {
    const [ bin, ...args ] = 'git diff --name-status --staged'.split(' ');
    const changedFiles = spawnSync(bin, args);

    let files = changedFiles.stdout.toString().split('\n').filter(e => e);

    return formats
        ? formatOutput(filterFiles(files, formats))
        : formatOutput(files);
}
