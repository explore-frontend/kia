/**
 * @author FlashSoft | fangchao@kuaishou.com
 * 资料:
 * JPEG 图片存储格式与元数据解析 https://zhuanlan.zhihu.com/p/82028761
 * ImageMagick解析JPEG量化表代码 https://github.com/ImageMagick/ImageMagick/blob/05d2ff7ebf21f659f5b11e45afb294e152f4330c/coders/jpeg.c#L795
 * 如何获取JPEG图片质量和预测压缩图片大小 https://blog.csdn.net/tomatomas/article/details/62235963
 */
import fs from 'fs';

// JPEG各种标志释义
export const MARKERS = {
  // Start Of Frame markers, non-hierarchical Huffman coding
  'ffc0': ['SOF0', 'Baseline DCT'],
  'ffc1': ['SOF1', 'Extended sequential DCT'],
  'ffc2': ['SOF2', 'Progressive DCT'],
  'ffc3': ['SOF3', 'Spatial (sequential) lossless'],
  // Huffman table specification
  'ffc4': ['DHT', 'Define Huffman table(s)'],
  // Start Of Frame markers, hierarchical Huffman coding
  'ffc5': ['SOF5', 'Differential sequential DCT'],
  'ffc6': ['SOF6', 'Differential progressive DCT'],
  'ffc7': ['SOF7', 'Differential spatial lossless'],
  // Start Of Frame markers, non-hierarchical arithmetic coding
  'ffc8': ['JPG', 'Reserved for JPEG extensions'],
  'ffc9': ['SOF9', 'Extended sequential DCT'],
  'ffca': ['SOF10', 'Progressive DCT'],
  'ffcb': ['SOF11', 'Spatial (sequential) Lossless'],
  // arithmetic coding conditioning specification
  'ffcc': ['DAC', 'Define arithmetic conditioning table'],
  // Start Of Frame markers, hierarchical arithmetic coding
  'ffcd': ['SOF13', 'Differential sequential DCT'],
  'ffce': ['SOF14', 'Differential progressive DCT'],
  'ffcf': ['SOF15', 'Differential spatial Lossless'],
  // Restart interval termination
  'ffd0': ['RST0', 'Restart with modulo 8 counter m'],
  'ffd1': ['RST1', 'Restart with modulo 8 counter m'],
  'ffd2': ['RST2', 'Restart with modulo 8 counter m'],
  'ffd3': ['RST3', 'Restart with modulo 8 counter m'],
  'ffd4': ['RST4', 'Restart with modulo 8 counter m'],
  'ffd5': ['RST5', 'Restart with modulo 8 counter m'],
  'ffd6': ['RST6', 'Restart with modulo 8 counter m'],
  'ffd7': ['RST7', 'Restart with modulo 8 counter m'],
  // Other marker
  'ffd8': ['SOI', 'Start of image'],
  'ffd9': ['EOI', 'End of image'],
  'ffda': ['SOS', 'Start of scan'],
  'ffdb': ['DQT', 'Define quantization table(s)'],
  'ffdc': ['DNL', 'Define number of lines'],
  'ffdd': ['DRI', 'Define restart interval'],
  'ffde': ['DHP', 'Define hierarchical progression'],
  'ffdf': ['EXP', 'Expand reference image(s)'],
  'ffe0': ['APP0', 'Reserved for application use'],
  'ffe1': ['APP1', 'Reserved for application use'],
  'ffe2': ['APP2', 'Reserved for application use'],
  'ffe3': ['APP3', 'Reserved for application use'],
  'ffe4': ['APP4', 'Reserved for application use'],
  'ffe5': ['APP5', 'Reserved for application use'],
  'ffe6': ['APP6', 'Reserved for application use'],
  'ffe7': ['APP7', 'Reserved for application use'],
  'ffe8': ['APP8', 'Reserved for application use'],
  'ffe9': ['APP9', 'Reserved for application use'],
  'ffea': ['APP10', 'Reserved for application use'],
  'ffeb': ['APP11', 'Reserved for application use'],
  'ffec': ['APP12', 'Reserved for application use'],
  'ffed': ['APP13', 'Reserved for application use'],
  'ffee': ['APP14', 'Reserved for application use'],
  'ffef': ['APP15', 'Reserved for application use'],
  'fff0': ['JPG0', 'Reserved for JPEG extension'],
  'fff1': ['JPG1', 'Reserved for JPEG extension'],
  'fff2': ['JPG2', 'Reserved for JPEG extension'],
  'fff3': ['JPG3', 'Reserved for JPEG extension'],
  'fff4': ['JPG4', 'Reserved for JPEG extension'],
  'fff5': ['JPG5', 'Reserved for JPEG extension'],
  'fff6': ['JPG6', 'Reserved for JPEG extension'],
  'fff7': ['JPG7', 'Reserved for JPEG extension'],
  'fff8': ['JPG8', 'Reserved for JPEG extension'],
  'fff9': ['JPG9', 'Reserved for JPEG extension'],
  'fffa': ['JPG10', 'Reserved for JPEG extension'],
  'fffb': ['JPG11', 'Reserved for JPEG extension'],
  'fffc': ['JPG12', 'Reserved for JPEG extension'],
  'fffd': ['JPG13', 'Reserved for JPEG extension'],
  'fffe': ['COM', 'Comment'],
  // Reserved markers
  'ff01': ['TEM', 'For temporary use in arithmetic coding'],
  'ff02': ['RES', 'Reserved']
} as const;
// 分析图片品质用的量化表
const SINGLE_HASH = [
  510, 505, 422, 380, 355, 338, 326, 318, 311, 305,
  300, 297, 293, 291, 288, 286, 284, 283, 281, 280,
  279, 278, 277, 273, 262, 251, 243, 233, 225, 218,
  211, 205, 198, 193, 186, 181, 177, 172, 168, 164,
  158, 156, 152, 148, 145, 142, 139, 136, 133, 131,
  129, 126, 123, 120, 118, 115, 113, 110, 107, 105,
  102, 100, 97, 94, 92, 89, 87, 83, 81, 79,
  76, 74, 70, 68, 66, 63, 61, 57, 55, 52,
  50, 48, 44, 42, 39, 37, 34, 31, 29, 26,
  24, 21, 18, 16, 13, 11, 8, 6, 3, 2,
  0
]
const SINGLE_SUMS = [
  16320, 16315, 15946, 15277, 14655, 14073, 13623, 13230, 12859,
  12560, 12240, 11861, 11456, 11081, 10714, 10360, 10027, 9679,
  9368, 9056, 8680, 8331, 7995, 7668, 7376, 7084, 6823,
  6562, 6345, 6125, 5939, 5756, 5571, 5421, 5240, 5086,
  4976, 4829, 4719, 4616, 4463, 4393, 4280, 4166, 4092,
  3980, 3909, 3835, 3755, 3688, 3621, 3541, 3467, 3396,
  3323, 3247, 3170, 3096, 3021, 2952, 2874, 2804, 2727,
  2657, 2583, 2509, 2437, 2362, 2290, 2211, 2136, 2068,
  1996, 1915, 1858, 1773, 1692, 1620, 1552, 1477, 1398,
  1326, 1251, 1179, 1109, 1031, 961, 884, 814, 736,
  667, 592, 518, 441, 369, 292, 221, 151, 86,
  64, 0
]
const TWO_HASH = [
  1020, 1015, 932, 848, 780, 735, 702, 679, 660, 645,
  632, 623, 613, 607, 600, 594, 589, 585, 581, 571,
  555, 542, 529, 514, 494, 474, 457, 439, 424, 410,
  397, 386, 373, 364, 351, 341, 334, 324, 317, 309,
  299, 294, 287, 279, 274, 267, 262, 257, 251, 247,
  243, 237, 232, 227, 222, 217, 213, 207, 202, 198,
  192, 188, 183, 177, 173, 168, 163, 157, 153, 148,
  143, 139, 132, 128, 125, 119, 115, 108, 104, 99,
  94, 90, 84, 79, 74, 70, 64, 59, 55, 49,
  45, 40, 34, 30, 25, 20, 15, 11, 6, 4,
  0
]
const TWO_SUMS = [
  32640, 32635, 32266, 31495, 30665, 29804, 29146, 28599, 28104,
  27670, 27225, 26725, 26210, 25716, 25240, 24789, 24373, 23946,
  23572, 22846, 21801, 20842, 19949, 19121, 18386, 17651, 16998,
  16349, 15800, 15247, 14783, 14321, 13859, 13535, 13081, 12702,
  12423, 12056, 11779, 11513, 11135, 10955, 10676, 10392, 10208,
  9928, 9747, 9564, 9369, 9193, 9017, 8822, 8639, 8458,
  8270, 8084, 7896, 7710, 7527, 7347, 7156, 6977, 6788,
  6607, 6422, 6236, 6054, 5867, 5684, 5495, 5305, 5128,
  4945, 4751, 4638, 4442, 4248, 4065, 3888, 3698, 3509,
  3326, 3139, 2957, 2775, 2586, 2405, 2216, 2037, 1846,
  1666, 1483, 1297, 1109, 927, 735, 554, 375, 201,
  128, 0
]
// 文件起始标志
const SOI_BUFFER = Buffer.from('ffd8', 'hex')

type MarkerType = typeof MARKERS[keyof typeof MARKERS]['0'];
type MarkerDesc = typeof MARKERS[keyof typeof MARKERS]['1'];

type Marker = {
  flag: keyof typeof MARKERS;
  marker: MarkerType;
  desc: MarkerDesc;
  length: number;
  buffer: Buffer;
}

/**
 *
 * @param {String | Buffer} file 待解析的图片
 * @returns {Object} 解析后的标记表
 */
export function parseJPEG(file: string) {
  const buffer = fs.readFileSync(file)
  const markers: Record<string, Marker | Array<Marker>> = {}
  let cursor = 0
  const soi = buffer.subarray(cursor, cursor + 2)
  if (!soi.equals(SOI_BUFFER)) {
    return;
  }
  cursor += 2
  // 分段扫描
  while (cursor < buffer.length) {
    // 扫描到的标志位
    const flag = buffer.subarray(cursor, cursor + 2)
    cursor += 2
    // 如果不是ff开头就非合法标志
    if (flag[0] != 0xff) break
    const flag_hex = flag.toString('hex') as keyof typeof MARKERS
    const len = buffer.readUInt16BE(cursor)
    // 取出内容片段
    const segments = buffer.subarray(cursor, cursor + len)
    cursor += len
    // 获取与规范相匹配的释义
    const marker = MARKERS[flag_hex] && MARKERS[flag_hex][0] || ''
    const marker_desc = MARKERS[flag_hex] && MARKERS[flag_hex][1] || ''
    // 输出的数据刨掉长度储存位
    const result = {
      flag: flag_hex,
      marker,
      desc: marker_desc,
      length: len - 2,
      buffer: segments.subarray(2),
    };

    const item = markers[flag_hex];
    // 如果未找到就记录
    if (!item){
      markers[flag_hex] = result
    }
    else if (Array.isArray(item)) {
      item.push(result)
    }
    // 如果是第二次出现则转换成数组存放
    else {
      markers[flag_hex] = [item, result]
    }
  }
  return markers
}
// 通过量化表反查图片品质
function identifyQuality(tables: [Buffer, Buffer]) {
  const sum = tables[0].reduce((a, b) => a + b, 0) + tables[1].reduce((a, b) => a + b, 0)
  // 如果总值是0说明文件类型不正确
  if (sum == 0) return -1
  let hash, sums, qvalue
  if (tables[1].length == 0) {
    // 一个表
    qvalue = tables[0][2] + tables[0][53]
    hash = SINGLE_HASH
    sums = SINGLE_SUMS
  } else {
    // 两个表
    qvalue = tables[0][2] + tables[0][53] + tables[1][0] + tables[1][64 - 1]
    hash = TWO_HASH
    sums = TWO_SUMS
  }
  let quality = 0
  for (let i = 0; i < 100; i++) {
    if (qvalue < hash[i] && sum < sums[i]) continue
    // 此处原为>=50,由于50以下的计算不准确,故去掉这部分逻辑
    if (qvalue <= hash[i] && sum <= sums[i]) quality = i + 1
    break
  }
  return quality
}
// 识别文件
export function identify(file: string) {
  const result: {
    // 类型
    type: 'jpg';
    // 文件大小
    size: number;
    height: number;
    width: number;
    dct?: MarkerType;
    dct_desc?: MarkerDesc;
    quality?: number;
  } = {
    type: 'jpg',
    size: fs.statSync(file).size,
    height: 0,
    width: 0,
  }
  const markers = parseJPEG(file) || {};

  Object.keys(markers).map(key => {
    const item = markers[key]
    // 从各种SOF数据中获取图片高宽信息
    if (!Array.isArray(item) && item.marker.substr(0, 3) == 'SOF') {
      result.height = item.buffer.readUInt16BE(1)
      result.width = item.buffer.readUInt16BE(3)
      // result.nf = item.buffer.readInt8(5)
      result.dct = item.marker
      result.dct_desc = item.desc
    }
    // 从DQT表反推jpeg品质, DQT存储有两种方式
    if (key == 'ffdb') {
      const table: [Buffer, Buffer] = [Buffer.alloc(0), Buffer.alloc(0)];
      if (!Array.isArray(item)) {
        // DQT长度130
        const buffer = item.buffer
        table[buffer[0]] = buffer.subarray(1, 65)
        table[buffer[65]] = buffer.subarray(66)
      }
      else {
        // DQT长度65
        item.map(({ buffer }) => table[buffer[0]] = buffer.subarray(1, 65))
      }
      result.quality = identifyQuality(table)
    }
  })
  return result
}
