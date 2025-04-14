import path from 'path';
import { identify as identifyJPEG } from './jpeg';
import { identify as identifyPNG } from './png';

export function identify(file: string) {
  const extname = path.extname(file)
  if (extname == '.jpg' || extname == '.jpeg') {
    return identifyJPEG(file)
  }
  if (extname == '.png') {
    return identifyPNG(file)
  }
  throw new Error(`File "${file}" is not support`)
}

type JPGIdentify = {
  file: string
} & ReturnType<typeof identifyJPEG>

type PNGIdentify = {
  file: string
} & ReturnType<typeof identifyPNG>

export function identifyList(list: Array<string>) {
  return list.map(file => {
    return {
      file,
      ...identify(file)
    } as JPGIdentify | PNGIdentify;
  })
}

export {
  identifyJPEG,
  identifyPNG,
}