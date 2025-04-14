/**
 * @author FlashSoft | fangchao@kuaishou.com
 */

import path from 'path';
import progressbar from 'progress';
import sharp from 'sharp';

// 获取图片是否透明
export async function getOpaque(file: string) {
  const extname = path.extname(file)
  if (extname != '.png') {
    return true
  }
  // 计算是否不透明
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })

  let alpha = false
  if (info.channels == 4) {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 255) {
        alpha = true
        break
      }
    }
  }
  // 如果不透明并且是png后缀
  const opaque = !alpha
  return opaque
}

// 获取不透明的PNG列表
export async function getOpaquePNGList(list: Array<string>) {
  const opaque_list: Array<{
    file: string;
    opaque: boolean;
  }> = []
  const bar = new progressbar('getOpaquePNGList [:bar] :current/:total :percent :elapseds', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: list.length
  })
  await Promise.all(list.map(async file => {
    const extname = path.extname(file)
    const opaque = await getOpaque(file)
    if (extname == '.png' && opaque) opaque_list.push({ file, opaque })
    bar.tick()
  }))
  return opaque_list
}
