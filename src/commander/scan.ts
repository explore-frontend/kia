/**
 * @author FlashSoft | fangchao@kuaishou.com
 */
import fs from 'fs'
import path from 'path'
import open from 'open'
import express from 'express';
import { identify, identifyList } from '../lib/identify'
import { getOpaquePNGList } from '../lib/getOpaque'
import { getSimilarList } from '../lib/getSimilar'
import { listImages } from '../lib/util'

const app = express()
//------------------------------------------------------------------------------------------------------------------------------------------
// http服务端口
// 5000端口被新版的Mac应用“勿扰模式”占了……
const APP_PORT = 5100 || process.env.PORT
//------------------------------------------------------------------------------------------------------------------------------------------

export async function scan(
  in_path: string,
  options: {
    checkCompress: boolean;
    checkCompressJpegQuality: number;
    checkOpaque: boolean;
    checkSimilar: boolean;
    checkSimilarHashlen: number;
    checkSimilarDistance: number;
    stdoutResult: boolean;
  },
) {
  if (!path.isAbsolute(in_path)) { in_path = path.resolve('./', in_path) }
  try {
    if (!fs.statSync(in_path).isDirectory()) { throw `"${in_path}"并非文件夹` }
  } catch (err) {
    console.log(`文件夹不存在: ${err}`)
    return
  }
  process.stderr.write(`IN_PATH: ${in_path}\n`)
  process.stderr.write(`OPTIONS: ${JSON.stringify(options)}\n`)
  // 获取图片列表
  const list = listImages(in_path)
  // 判断图片是否压缩过
  let compress_list: ReturnType<typeof identifyList> = []
  if (options.checkCompress) {
    const identify_list = identifyList(list)
    compress_list = identify_list.filter(item => {
      if (item.type == 'png' && item.color_type == 3) {
        return true
      }
      if (
        item.type == 'jpg'
        && options.checkCompressJpegQuality
        && item.quality
        && item.quality <= options.checkCompressJpegQuality
      ) {
        return true
      }
      return false
    })
  }

  // 判断非透明png图片
  let opaque_list: Array<{
    file: string;
    opaque: boolean;
  }> = []
  if (options.checkOpaque) {
    opaque_list = await getOpaquePNGList(list)
    // 补基础信息
    opaque_list = opaque_list.map(item => ({ ...item, ...identify(item.file) }))
  }

  // 计算图片相似度
  let similar_list: Array<{
    file: string;
    hash: string;
    list: Array<{
        file: string;
        dist: number;
    }>;
  }> = []
  const similar_list_result: Array<{
    file: string;
    hash: string;
    list: Array<{
        file: string;
        dist: number;
    }>;
  } & ReturnType<typeof identify>> = [];
  if (options.checkSimilar) {
    similar_list = await getSimilarList(list, options)
    // 采集图片基本信息
    similar_list.forEach(item => {
      const info = identify(item.file)
      similar_list_result.push({
        ...item,
        list: item.list.map(it => {
          const info = identify(it.file)
          return {
            ...it,
            ...info
          };
        }),
        ...info,
      });
    })
  }
  process.stderr.write('DONE\n')
  const result = {
    path: in_path,
    compress_list,
    opaque_list,
    similar_list: options.checkSimilar
      ? similar_list_result
      : similar_list_result,
  }
  if (options.stdoutResult) {
    process.stdout.write(JSON.stringify(result))
  }
  else {
    app.get('/', (request, response) => {
      const content = fs
        .readFileSync(path.join(__dirname, '../../index.html'))
        .toString()
        .replace(/var\s*data\s*=\s*\{\}/, `var data = ${JSON.stringify(result)}`)
      response.end(content)
    })
    app.use(express.static(in_path))
    app.listen(APP_PORT)
    await open(`http://127.0.0.1:${APP_PORT}`)
  }
}
