/**
 * @author FlashSoft | fangchao@kuaishou.com
 */
import sharp from 'sharp';
import leven from "leven";
import assert from 'assert';
import progressbar from 'progress';

// 哈希的长度(图片的高度)
let hash_len = 8
// 空白的哈希值
let blank_hash = Array(hash_len * hash_len / 4).fill('0').join('')
// 距离
let distance = 1

// binary转hex
function binaryToHex(s: string) {
  let output = ''
  for (let i = 0; i < s.length; i += 4) {
    const bytes = s.substr(i, 4)
    const decimal = parseInt(bytes, 2)
    const hex = decimal.toString(16)
    output += hex
  }
  return output
}
function px(pixels: Buffer, width: number, x: number, y: number) {
  const pixel = width * y + x
  assert(pixel < pixels.length)
  return pixels[pixel]
}
// hash计算
// http://www.hackerfactor.com/blog/?/archives/529-Kind-of-Like-That.html
async function differenceHash(file: string) {
  const width = hash_len + 1
  const height = hash_len
  // 计算图片特征哈希
  return sharp(file)
    .grayscale()
    .resize(width, height)
    .raw()
    .toBuffer()
    .then(pixels => {
      let difference = ''
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < height; col++) {
          difference += px(pixels, width, col, row) < px(pixels, width, col + 1, row) ? 1 : 0
        }
      }
      return binaryToHex(difference)
    })
}

// 计算dhash列表
async function differenceHashList(list: Array<string>) {
  const bar = new progressbar('differenceHashList [:bar] :current/:total :percent :elapseds', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: list.length
  })
  const hash_list: Array<{
    file: string;
    hash: string;
  }> = []
  await Promise.all(list.map(async file => {
    bar.tick()
    hash_list.push({ file, hash: await differenceHash(file) })
  }))
  return hash_list
}
// 根据数组生成排重哈希表
function uniqueList(list: Array<{ file: string; hash: string; }>) {
  const bar = new progressbar('uniqueList [:bar] :current/:total :percent :elapseds', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: list.length * list.length
  })
  // 缓存列表
  const cache_hash: Record<string, {
    file: string;
    hash: string;
    file2: string;
    hash2: string;
  }> = {}
  list.map(({ file, hash }) => {
    list.map(({ file: file2, hash: hash2 }) => {
      bar.tick()
      if (file === file2) {
        return
      }
      const key = [file, file2].sort().join('')
      if (!cache_hash[key]) cache_hash[key] = { file, hash, file2, hash2 }
    })
  })
  return cache_hash
}
function distList(list: Record<string, {
  file: string;
  hash: string;
  file2: string;
  hash2: string;
}>) {
  const bar = new progressbar('distList [:bar] :current/:total :percent :elapseds', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: Object.keys(list).length
  })
  // 根据排重哈希表计算最终输出列表
  const dist_hash: Record<string, {
    file: string;
    hash: string;
    list: Array<{
      file: string;
      dist: number;
    }>
  }> = {}// 最终输出的列表
  const caled_hash: Record<string, boolean> = {}// 已计算的哈希表
  Object.keys(list).map(key => {
    bar.tick()
    const { file, hash, file2, hash2 } = list[key]
    if (hash == blank_hash) return
    if (hash2 == blank_hash) return
    if (caled_hash[file2]) return
    const dist = leven(hash, hash2)
    if (dist > distance) return
    if (!dist_hash[file]) dist_hash[file] = { file, hash, list: [] }
    dist_hash[file].list.push({ file: file2, dist })
    caled_hash[file2] = true
  })
  return Object.keys(dist_hash).map(key => dist_hash[key])
}

export async function getSimilarList(
  list: Array<string>,
  options: {
    checkSimilarHashlen: number;
    checkSimilarDistance: number;
  },
) {

  // 参数调整
  hash_len = options.checkSimilarHashlen
  blank_hash = Array(hash_len * hash_len / 4).fill('0').join('')
  distance = options.checkSimilarDistance
  // 计算dHash
  const hash_list = await differenceHashList(list)
  // 排重
  const unique_list = uniqueList(hash_list)
  // 计算距离
  const dist_list = distList(unique_list)
  return dist_list
}
