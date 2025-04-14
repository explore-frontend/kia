/**
 * @author FlashSoft | fangchao@kuaishou.com
 */
import fs from 'fs';
import { identify } from '../lib/identify';
import { listImages } from '../lib/util';

export async function identifyCLI(file: string) {
  const isDir = fs.statSync(file).isDirectory()
  if (!isDir) {
    const result = { file, ...identify(file) }
    console.log(JSON.stringify(result, null, 2))
    return result
  }
  const list = listImages(file)
  const result = list.map(file => {
    return { file, ...identify(file) }
  })
  console.log(JSON.stringify(result, null, 2))
  return result
}
