import { optimize } from 'svgo';
import { readFileSync, writeFileSync } from 'fs';
import { getSize } from '../lib/util';

export async function svgCompress(file: string) {
    const originalContent = readFileSync(file, 'utf-8');
    const { data } = optimize(originalContent);
    writeFileSync(file, data, 'utf-8');
    const before = getSize(originalContent.length);
    const after = getSize(data.length);

    console.log(`svg文件 "${file}" 压缩完毕，压缩前：${before}，压缩后：${after}`);
}
