import { readFileSync, createWriteStream, unlinkSync, renameSync } from 'fs';
import axios from 'axios';
import { getSize } from '../lib/util';

const TINYIMG_URL = ['tinyjpg.com', 'tinypng.com'];

function randomIp() {
    return new Array(4)
        .fill(0)
        .map(() => Math.floor(Math.random() * 256))
        .join('.');
}

function randomTiny() {
    return TINYIMG_URL[Math.round(Math.random())]!;
}

const UA_LIST = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_7;en-us) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Safari/530.17',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.49 Safari/537.36',
];

function randomUA() {
    return UA_LIST[Math.floor(UA_LIST.length * Math.random())]!;
}

type TinyResponse = {
    input: {
        size: number;
        type: 'image/png' | 'image/jpg';
    };
    output: {
        size: number;
        type: 'image/png' | 'image/jpg';
        width: number;
        height: number;
        ratio: number;
        url: string;
    };
};

// const PROXY_INFO = {
//     host: 'oversea-squid4.sgp.txyun',
//     port: 11080,
// };

async function uploadImage(data: Buffer) {
    const res = await axios({
        timeout: Math.max(10000, data.length / 10), // 设网速 10k/s
        method: 'post',
        url: `https://${randomTiny()}/web/shrink`,
        data,
        headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Postman-Token': `${Date.now()}`,
            'User-Agent': randomUA(),
            'X-Forwarded-For': randomIp(),
        },
    });
    return res.data as TinyResponse;
}

function downloadImage(url: string, filePath: string) {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    return new Promise((resolve, reject) => {
        const out = createWriteStream(filePath, {
            emitClose: true,
        });

        let t: NodeJS.Timeout;
        out.on('close', () => {
            t && clearTimeout(t);
            resolve(1);
        });
        out.on('error', () => {
            t && clearTimeout(t);
            reject(new Error('Write error'));
        });
        axios({
            timeout: 20000, // 20s
            method: 'get',
            url,
            cancelToken: source.token,
            responseType: 'stream',
            // proxy: PROXY_INFO,
        }).then((response) => {
            t = setTimeout(() => {
                out.end();
                source.cancel('download timeout cancel req');
                reject(new Error('download timeout'));
            }, 60000); // 1min
            response.data.pipe(out);
        }).catch(reject);
    });
}

async function compressByTiny(fileName: string) {
    const file = readFileSync(fileName);
    const tempFile = `${fileName}.temp`;

    try {
        // console.log(`+开始压缩[${info.added}/${info.total}]: '${shortName}'`);
        const res = await uploadImage(file);
        await downloadImage(res.output.url, tempFile);
        unlinkSync(fileName);
        renameSync(tempFile, fileName);

        console.log(`图片 "${fileName}" 压缩完毕，压缩前：${getSize(res.input.size)}，压缩后：${getSize(res.output.size)}`);

    } catch (err) {
        console.error(`压缩失败: '${fileName}'`);
        console.error(err);
        unlinkSync(tempFile);
    }
}

function createTinyCompressPool({
    limit,
    retry,
} = {
    limit: 5,
    retry: 3,
}) {
    const queue: Array<{
        resolve: (value: unknown) => void;
        reject: (reason?: any) => void;
        fileName: string;
        retryCount: number;
    }> = [];
    let count = 0;

    function doCompress() {
        if (count > limit) {
            return;
        }
        const item = queue.shift();
        if (!item) {
            return;
        }
        count++;
        compressByTiny(item.fileName).then(v => {
            item.resolve(v);
            count--;
            doCompress();
        }).catch(e => {
            console.error(e);
            item.retryCount++;
            if (item.retryCount < retry) {
                console.error(`图片 ${item.fileName} 重试第${item.retryCount}次`);
                queue.push(item);
            } else {
                item.reject(e);
            }
            count--;
            doCompress();
        });
    }

    return (fileName: string) => {
        return new Promise((resolve, reject) => {
            queue.push({
                resolve,
                reject,
                fileName,
                retryCount: 0,
            });
            doCompress();
        });
    }
}

export const tinyCompress = createTinyCompressPool();
