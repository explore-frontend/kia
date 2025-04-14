#!/usr/bin/env node

import path from 'path'
import { createCommand } from 'commander'
import { identifyCLI } from './commander/identify'
import { scan } from './commander/scan'
import { readFileSync } from 'fs'
import { compress, preCommitHook } from './commander/compress';

const pkg = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));

const commander = createCommand();

commander.version(pkg.version)
  .name(pkg.name)
  .usage("command [options]")

// 扫描资源,分析相似性、非透明PNG、图片是否被压缩
commander
  .command('scan <dir>')
  .description('扫描分析出项目中相似图片、非透明png图片以及被压缩过的图片。\n以json格式输出或者使用http网页服务对外输出')

  .option(
    '-ns, --no-check-similar',
    '不分析相似图片',
  )
  .option(
    '     --check-similar-hashlen <hashlen>',
    '在开启--check-similar选项时，分析相似图片时候的哈希长度，这个值越大越精确也越慢，建议取值8-16区间',
    '16',
  )
  .option(
    '     --check-similar-distance <distance>',
    '在开启--check-similar选项时，分析相似图片时判定的海明距离值',
    '1',
  )

  .option(
    '-no, --no-check-opaque',
    '不分析非透明PNG图片',
  )

  .option(
    '-nc, --no-check-compress',
    '不分析分析图片是否被压缩过',
  )
  .option(
    '     --check-compress-jpeg-quality <quality>',
    '在开启--check-compress选项时，分析JPEG图片是否被压缩的阈值',
    '90',
  )

  .option('-result, --stdout-result', '终端输出结果(开启终端输出时不启动http服务)', false)
  .option('--debug', '开启debug模式', false)
  .action((dir, options) => {
    options.checkCompressJpegQuality = parseInt(options.checkCompressJpegQuality, 10)
    options.checkSimilarHashlen = parseInt(options.checkSimilarHashlen, 10)
    options.checkSimilarDistance = parseInt(options.checkSimilarDistance, 10)
    scan(path.resolve(dir), options)
  })


// 分析图片相关信息
commander
  .command('identify <file|dir>')
  .description('识别图片相关信息，主要用来获取图片的尺寸信息以及品质信息等')
  .action((file) => {
    identifyCLI(file)
  })

commander
  .command('compress <file|dir>')
  .description('对原始图片进行压缩替换，使用svgo和tinypng，需要保持网络畅通')
  .action((file) => {
    compress(file)
  })

commander
  .command('pre-commit')
  .description('gitHook，在pre-commit阶段对图片资源进行识别&压缩')
  .action(() => {
    preCommitHook();
  });


// 呈现统一的头信息
commander.addHelpText('beforeAll', `${pkg.description}(v${pkg.version})\nAuthor:${pkg.author}\n`)

commander.parse()
