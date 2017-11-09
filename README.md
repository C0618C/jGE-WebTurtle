# Web Turtle
> Web Turtle 是基于:dragon:jGE的一个小程序，关于:dragon:jGE的内容，请到:dragon:jGE页面查看。  
    
#你还记得当年的小海龟么# 或许对很多人来说，成为程序员只是偶然；但我，在多年前认识小海龟的那个下午，就已经注定了。感谢Logo语言，让我在程序员的路上越走越远。

部署地址：<http://www.vmwed.com/sb/webturtle/>  

## 关于Logo流派、Web Turtle所用语法及说明
Logo的发展史及流派可看维基百科[Logo(programming_language)](https://en.wikipedia.org/wiki/Logo_%28programming_language%29)  
Web Turtle支持如下的流派：
* [BERKELEY LOGO(UCBLogo)](https://people.eecs.berkeley.edu/~bh/v2ch14/manual.html)
* PC Logo
* MSWLogo  

尽管BERKELEY LOGO有详尽的手册，但国内大部分Logo的教材和例子基于PC Logo和MSWLogo，所以支持的指令优先以这两种为准。但又因为这两者缺乏手册，所以部分指令是按照教材上对结果的描述，反推出来的（尤其对应BERKELEY LOGO中没有的指令如stampoval、stamprect、setw等），所以可能会导致一种糅合的语法而且不被上述三种所识别，这种现象我会尽量消除。
但因为采用兼容性语法，可能会导致在Web Turtle上能成功的作品在上述三种程序中均有各自的错误，针对此，我将做一个语法开关，和提供相应的风格校验、转换工具。

## 操作指引
1. 在页面底部有指令输入栏，用于输入指令。
1. 输入指令如 `fd 10` 并按回车，屏幕中海龟将执行向前走10步的指令。
1. 指令的参数若为数字，则可以输入算式表达式，如 `rt 360/24` 等价于 `rt 15`。
1. 每次可以同时输入多个指令，不同指令中间用空格隔开；多个指令组合为一个指令组。
1. 可在指令输入栏按上、下方向键，翻查历史指令记录。
1. 使用help指令获取指令列表，用help + 其它指令（如：`help rt`）获取对应指令的说明。

## 基础指令
指令 | 参数 | 中文指令 | 举例 | 意义
----|------|----------|----------|----------
fd  | 步数（数字） | 前进 | fd 10 | 向前走10步
lt  | 步数（数字） | 左转 | lt 90 | 左转90度
rt  | 角度（数字） | 右转 | rt 45 | 右转45度
bk  | 角度（数字） | 后退 | bk 35 | 后退35步
repeat | 次数（数字） | 重复 | repeat 4[ 其它指令组[*] ] | 重复执行其它指令组4次
home| 无 | 回家 | home | 回初始点，绘画内容保留
cs | 无 | 清屏 | cs | 擦除屏幕所有内容并回归初始点
clean | 无 | 清空 | clean | 擦除屏幕所有内容，位置角度不变
pu | 无 | 抬笔 | pu | 把笔提起， 不留痕迹
pd | 无 | 落笔 | pd | 把笔放下， 会留痕迹
setpc | 颜色代码或颜色数组[**] | 笔色 | setpc 10 | 设置笔迹颜色，支持颜色编号和颜色数组[**]
setbg | 颜色代码或颜色数组[**] | 底色 | setbg [45 55 100] | 设置背景颜色，支持颜色编号和颜色数组[**]
setw | 宽度（数字） | 笔粗 | setw 1 | 将笔粗设为1像素
width | 无 | | width | 查询当前笔宽
random | 数字 | 随机 | random 30 | 产生一个0到30之间的随机数

  
[*]: # "多个指令组合一起，中间用空格隔开。如：fd 100 rt 90"
[**]: #颜色代码和颜色数组 "详情参考 颜色代码 一节。"

## 进阶教程  
### 循环
### 过程定义
### 条件判断
### 随机数
### 动画

## 代码举例
描述 | 代码
--|--
复杂花纹|fd 200 clean repeat 12 [repeat 75 [fd 100 bk 100 rt 2] fd 250]
花纹 | repeat 4000 [repeat 34 [fd 12 rt 10] rt 90]
雨伞 | `rp 180[rt 1 fd 60*pi/180] rt 90 pu fd 120 rt 90 pd rp 3[rp 180[rt 1 fd 20*pi/180] rt 180] pu fd 68 rt 90 bk 60 rt 90 pd fd 8 pu fd 40 pd fd 80 rp 180[rt 1 fd 9*pi/180]` 
蒲公英 | repeat 24[fd 40 lt 45 fd 15 bk 15 rt 90 fd 15 bk 15  lt 45 bk 40 rt 360/24] bk 200
蒲公英 | 重复 24[前进 40 左转 45 前进 15 后退 15 右转 90 前进 15 后退 15  左转 45 后退 40 右转 360/24] 后退 200
五角星(定义过程) | `to lwjx :b rt 18 repeat 5[fd :b rt 144 fd :b rt 54 fd :b*1.9 bk :b*1.9 lt 126] end lwjx 150`
五角花 | repeat 1800 [fd 10 rt repcount + .1]
花环 | rp 3600 [ fd 5 rt repcount+0.4 ]
花 | rp 3600 [ fd 10 rt repcount+0.2 ]
花纹 | rp 45 [ setpc random 16 fd 250 rt 178 fd 250 lt 182 ]
花纹 | repeat 15 [ lt 360/15 fd 80 repeat 20 [ fd 20 lt 45 fd 10 bk 10 rt 90 fd 10 bk 10 lt 45 bk 20 rt 360/20 ] bk 80 ]
花纹 | repeat 8 [rt 45 repeat 6 [repeat 90 [fd 4 rt 2]rt 90]]
直线圆 | rp 45 [ setpc random 16 fd 300 rt 128 ] 
花朵 | rp 6[lt 45 rp 4[rp 9[fd 5 rt 10] rp 9[fd 5 lt 10] rt 90]rt 105]
矩形纹 | rp 8[fd 30 lt 45 rp 4 [fd 25 rt 90] rt 45 fd 10 lt 45 rp 4 [fd 50 rt 90] rt 45 bk 40 rt 360/8]
矩形纹 | repeat 8 [repeat 4 [rt 90 fd 100] bk 100 lt 45]
彩笔示范 | setw 20 fd 50 setpc 4 fd 50 setpc 6 fd 50 setpc [20 20 100] fd 50
涂鸦（会卡）| rp 100[rp 100 [ setpc random 16 fd random 200 rt random 360 ] home ]
原子模型 | rp 4 [ stampoval 100 50 rt 45 ]
网状环 | rp 60[stampoval 200 100 rt 3 ]
环线管 | rp 60[stampoval 100 50 rt 3 fd 10]
海螺 | rp 120 [ stampoval 100 50 rt 3 fd 5 ] rp 60[stampoval 100 50 rt 3 fd 10]
放射线 | repeat 180 [fd 500 bk 500 rt 2]
线 | repeat 25 [repeat 15 [fd 100 bk 100 rt 5] fd 100] 
线框图 | for [x 1 150] [fd :x rt 89]
线圈 | for [i 0.01 4 0.05] [repeat 180 [fd :i rt 1]]

注:部分例子摘录于 Logo 15-word challenge [参考1]  

[参考1]: http://www.mathcats.com/gallery/15wordcontest.html "Write a Logo one-liner using 15 or fewer words, not counting square brackets and parentheses, to produce the most beautiful, complex, and interesting picture."


### 网友作品
```
;Denius 2017-04-03
cs pd setw 1
fd 100 rt 90 fd 25 repeat 180[fd ((π*50)/180) rt 1] fd 25 
pu 
bk 100 rt 90 fd 25
pd
rt 90 fd 25 lt 90 repeat 270[fd ((π*25)/180) lt 1] fd 30 
lt 90 fd 50 bk 25 repeat 180[fd ((π*25)/180) rt 1] fd 25 
pu 
lt 90 fd 10 lt 90
pd
fd 50 pu fd 10 pd setw 2 fd 2 setw 1
pu 
bk 2+10 rt 90 fd 10 rt 90
pd
fd 25 repeat 180[fd ((π*25)/180) lt 1] fd 25
pu 
rt 90 fd 6+(25/2)+25/1.414 rt 90 fd 5 rt 90+45
pd 
repeat (180+45)[fd ((π*(25/2))/180) lt 1]
repeat (180+45)[fd ((π*(25/2))/180) rt 1] repeat 10[fd 1 lt 4]
pu 
fd 3000
```

## 颜色代码和颜色数组
### 颜色代码
`setpc` 和 `setbg` 需要用到颜色代码（0-15），代码与颜色对照如下表：
```
	 0  black	 1  blue	 2  green	 3  cyan
	 4  red		 5  magenta	 6  yellow	 7 white
	 8  brown	 9  tan		10  forest	11  aqua
	12  salmon	13  purple	14  orange	15  grey
```
### 颜色数组
在支持使用颜色数组的地方，可以用 [R G B] 方式表示颜色。其中R、G、B分别为红、绿、蓝在颜色中的比例，取值为0～100。
示例：
```
setbg [100 50 50] setpc [10 100 10]
```


## TODO List
* 支持指令 ht、st
* 支持指令 ~~for~~、wait、go、~~repcount~~
* 支持多行录入、行尾`;`注释
* 支持~~setxy、seth~~、fill
* 支持更多的数据类型
* 播放绘画过程


## 版本记录
* v2.3.0    2017-04-22
    新增指令for。已能画出大部分Logo 15-word challenge的图案。
* v2.2.0    2017-04-16
    新增setx sety setxy seth
* v2.1.1    2017-04-9
    $undo、$redo
    修正home
* v2.0.0　　2017-04-2  
    正式更名为Web Turtle
    调整解释器，为‘多线程’画图作准备  
    新增setpc、setw、$turtle、random  
    支持更换海龟图形，默认使用经典海龟
* v1.7.0　　2017-03-31  
    新增clean、ct
* v1.6.0　　2017-03-30  
    新增setbg
* v1.5.0　　2017-03-28  
    重构国际化部分，支持根据浏览器语言选择显示语言。
* v1.4.0　　2017-03-28  
    支持To ... END方式自定义过程；修复复杂算术表达式分词失败问题；
* v1.3.0　　2017-03-27  
    加入pu pd指令；
* v1.2.0　　2017-03-26  
    优化内部指令描述；增加home，cs指令支持；记录历史指令；
* v1.1.0　　2017-03-25  
    加入中文指令支持。
* v1.0.0　　2017-03-25  
    支持5个基础的画图指令。

# License
You may use the jGE (or Steering Behaviors or Web Turtle) under the MIT license. See LICENSE.
