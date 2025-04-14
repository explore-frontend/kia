import { identify } from '../lib/identify/index';
import { getOpaque } from '../lib/getOpaque';
import { extname } from 'path';

export { tinyCompress } from './tinypng';
export { svgCompress } from './svg';

export async function canCompress(fileName: string) {
    // 对于带有.nozip的图片暂时不做压缩
    if (fileName.includes('.nozip')) {
        console.log(`跳过对 "${fileName}" 的处理`);
        return false;
    }

    if (extname(fileName) === '.svg') {
        return true;
    }

    const fileInfo = identify(fileName);
    // 通过色盘判断
    if (fileInfo.type === 'png' && fileInfo.plet_length > -1) {
        console.log(`"${fileName}" 已是压缩后的图片，无需再次处理`);
        return false;
    }

    if (fileInfo.type === 'jpg' && fileInfo.quality && fileInfo.quality < 90) {
        console.log(`"${fileName}" 已是压缩后的图片，无需再次处理，可酌情根据体积情况进行缩减`);
        return false;
    }
    const opaque = await getOpaque(fileName);
    if (fileInfo.type === 'png' && opaque) {
        throw new Error(`文件 "${fileName}" 并无透明通道，应替换为jpg格式以节省体积`);
    }
    return true;
}