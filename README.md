## Kwai Image Assistant

一个非常简单的小工具,主要用于项目中素材的调优

可以查找项目中被压缩过的图片、相似图片以及非透明的PNG图片


### 安装
```shell
npm -g i kia
```

### 使用
```shell
快手图片小助手(v1.1.4)
Author:FlashSoft

Usage: kia command [options]

Options:
  -V, --version         output the version number
  -h, --help            display help for command

Commands:
  scan [options] <dir>  扫描分析出项目中相似图片、非透明png图片以及被压缩过的图片。
                        以json格式输出或者使用http网页服务对外输出
  identify <file>       识别图片相关信息，主要用来获取图片的尺寸信息以及品质信息等
  help [command]        display help for command
```
```shell
快手图片小助手(v1.1.4)
Author:FlashSoft

Usage: kia scan [options] <dir>

扫描分析出项目中相似图片、非透明png图片以及被压缩过的图片。
以json格式输出或者使用http网页服务对外输出

Options:
  -ns, --no-check-similar                       不分析相似图片
       --check-similar-hashlen <hashlen>        在开启--check-similar选项时，分析相似图片时候的哈希长度，这个值越大越精确也越慢，建议取值8-16区间 (default: 16)
       --check-similar-distance <distance>      在开启--check-similar选项时，分析相似图片时判定的海明距离值 (default: 1)
  -no, --no-check-opaque                        不分析非透明PNG图片
  -nc, --no-check-compress                      不分析分析图片是否被压缩过
       --check-compress-jpeg-quality <quality>  在开启--check-compress选项时，分析JPEG图片是否被压缩的阈值 (default: 90)
  -result, --stdout-result                      终端输出结果(开启终端输出时不启动http服务) (default: false)
  --debug                                       开启debug模式 (default: false)
  -h, --help  
```

```shell
快手图片小助手(v1.1.4)
Author:FlashSoft

Usage: kia identify [options] <file>

识别图片相关信息，主要用来获取图片的尺寸信息以及品质信息等

Options:
  -h, --help  display help for command
```

### 功能规划

- [x] 素材分析（是否压缩(jpg、png)、是否相似、是否有非透明PNG）
- [ ] 素材分析诊断报告（联动webhook）
- [ ] 调整图片分辨率
- [ ] 压缩图片（tinypng、pngquant、jpegoptim）
- [ ] 压缩音频（mp3）


### 截图
被压缩过的JPG图片
![被压缩过的JPG图片](http://kwaicdn.flashsoft.cn/image-20210804210832952.png)

被压缩过的PNG图片
![被压缩过的PNG图片](http://kwaicdn.flashsoft.cn/image-20210804210917027.png)

非透明的PNG图片
![非透明的PNG图片](http://kwaicdn.flashsoft.cn/image-20210804210952438.png)

相似图片
![相似图片](http://kwaicdn.flashsoft.cn/image-20210804211056573.png)
