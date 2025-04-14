import { svgCompress, tinyCompress, canCompress } from '../compress';
import { extname } from 'path';
import { statSync } from 'fs';
import { listImages } from '../lib/util';
import { getChangedFiles } from '../lib/changedFiles';
import { spawnSync } from 'child_process';

export async function compress(file: string) {
    const isDir = statSync(file).isDirectory()
    if (!isDir) {
        return extname(file) === '.svg'
            ? svgCompress(file)
            : tinyCompress(file);
    }

    const fileList = listImages(file);

    const allTask = fileList.map(file => {
        return extname(file) === '.svg'
            ? svgCompress(file)
            : canCompress(file).then(needCompress => {
                if (needCompress) {
                    return tinyCompress(file);
                }
            });
    });

    await Promise.all(allTask);
}

export async function preCommitHook() {
    try {
        const files = getChangedFiles([
            '*.png',
            '*.svg',
            '*.jpg',
            '*.jpeg',
        ]).filter(info => {
            return info.status === 'Added'
                || info.status === 'Modified';
        }).map(async info => {
            const needCompress = await canCompress(info.filename);
            return needCompress
                ? info.filename
                : null
        });
        const compressFiles = (await Promise.all(files)).filter(item => {
            return item !== null;
        }) as Array<string>;

        const compressTasks = compressFiles.map(file => {
            return file ? compress(file) : true;
        })

        await Promise.all(compressTasks);

        const res = spawnSync('git', ['add', ...compressFiles]);
        if (res.status !== 0) {
            throw res.error;
        }
    } catch (e) {
        throw e;
    }
}