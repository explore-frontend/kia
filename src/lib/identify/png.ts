/**
 * @author FlashSoft | fangchao@kuaishou.com
 * 资料:
 * https://blog.csdn.net/xiangzilv1987/article/details/9346789
 */
import fs from 'fs';

export function identify(file: string) {
  const buffer = fs.readFileSync(file)
  const isPNG = !Array.prototype.some.call([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], (element, index) => element != buffer[index])
  if (!isPNG) {
    throw new Error(`File "${file}" is not a png picture`);
  }

  // IHDR位置
  const ihdr_index = buffer.indexOf(Buffer.from('IHDR', 'utf8'))
  // 宽
  const width = buffer.readInt32BE(ihdr_index + 4)
  // 高
  const height = buffer.readInt32BE(ihdr_index + 8)
  // 图像深度
  // 索引彩色图像：1，2，4或8
  // 灰度图像：1，2，4，8或16
  // 真彩色图像：8或16
  const bit_detph = buffer.readInt8(ihdr_index + 12)
  // 颜色类型
  // 0：灰度图像, 1，2，4，8或16
  // 2：真彩色图像，8或16
  // 3：索引彩色图像，1，2，4或8
  // 4：带α通道数据的灰度图像，8或16
  // 6：带α通道数据的真彩色图像，8或16
  const color_type = buffer.readInt8(ihdr_index + 13)
  // 压缩方法(LZ77派生算法)
  const compression_method = buffer.readInt8(ihdr_index + 14)
  // 滤波器方法
  const filter_method = buffer.readInt8(ihdr_index + 15)
  // 隔行扫描方法
  // 0：非隔行扫描
  // 1： Adam7(由Adam M. Costello开发的7遍隔行扫描方法)
  const interlace_method = buffer.readInt8(ihdr_index + 16)

  // PLTE位置
  const plet_index = buffer.indexOf(Buffer.from('PLTE', 'utf8'))
  // 根据色盘标志位反查色盘长度,色盘中存储的信息为rgb格式占用3个字节,故色盘中长度/3为颜色数
  // 如果不是色盘模式则返回值为-1
  const plet_length = plet_index > -1 ? buffer.readInt32BE(plet_index - 4) / 3 : -1

  return {
    width,
    height,
    bit_detph,
    color_type,
    compression_method,
    filter_method,
    interlace_method,
    plet_length,
    type: 'png',
    size: fs.statSync(file).size,
  } as {
    width: number;
    height: number;
    bit_detph: number;
    color_type: number;
    compression_method: number;
    filter_method: number;
    interlace_method: number;
    plet_length: number;
    type: 'png';
    size: number;
  }
}
