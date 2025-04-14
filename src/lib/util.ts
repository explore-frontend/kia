import fs from 'fs';
import path from 'path';

// 支持的图片类型
const TYPES = ['.jpg', '.jpeg', '.png']
// 扫描时需忽略的目录列表
const IGNORE_DIR = ['node_modules', '.git']
//------------------------------------------------------------------------------------------------------------------------------------------
// 遍历所有图片资源
export function listImages(dir: string, types = TYPES, list: Array<string> = []) {
  const dir_arr = dir.split(path.sep)
  const last_dir = dir_arr[dir_arr.length - 1]
  // 忽略特定目录
  if (IGNORE_DIR.indexOf(last_dir) > -1) {
    return list
  }
  fs.readdirSync(dir).map(item => {
    const fullpath = path.join(dir, item)
    if (fs.statSync(fullpath).isDirectory()) {
      return listImages(fullpath, types, list)
    }
    if (types.includes(path.extname(fullpath))) {
      list.push(fullpath)
    }
  })
  return list
}


export function getSize(size: number) {
  let count = 0;
  let result = size;
  const SIZE_LIST = ['B', 'KB', 'MB'];
  while (true) {
      if (result < 1024) {
          break;
      } else {
          result = result / 1024;
          count++;
      }
  }
  return `${Math.round(result)}${SIZE_LIST[count]!}`;
}