---
title: 抖音 Web 逆向：X-Bogus 逆向分析
description: 整理抖音 Web X-Bogus 参数的断点定位、补环境、算法分析、乱码生成和最终结果。
---

# 抖音 Web 逆向：X-Bogus 逆向分析

## 声明

本文章中所有内容仅供学习交流，抓包内容、敏感网址、数据接口均已做脱敏处理，严禁用于商业用途和非法用途，否则由此产生的一切后果均与作者无关，若有侵权，请联系我立即删除！

## 前言

此平台 本人 仅限研究。只针对某些算法参数进行研究。网站链接自己去找。

## 流程分析

这里就不多说了

直接看接口。发现有两个字需要我们逆向

**msToken:**

**X-Bogus:**

![](/images/security/douyin-x-bogus-reverse-notes/966701_6QA86953ZBUW9MQ.jpg)

## msToken

这里msToken 跟断点走。往上追栈后发现是直接读取的cookie里的。然后看了一下。然后测试了一下 这个有点像每次请求的token令牌。

这个应该可以模拟生成的。

![](/images/security/douyin-x-bogus-reverse-notes/966701_PSZRW9MSRFDZ2HB.jpg)

不重要 暂时写死都行。这里也提供一份代码。

```text
import random


def get_ms_token(randomlength=107):
    """
    根据传入长度产生随机字符串
    """
    random_str = ''
    base_str = 'ABCDEFGHIGKLMNOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz0123456789='
    length = len(base_str) - 1
    for _ in range(randomlength):
        random_str += base_str[random.randint(0, length)]
    return random_str
```

## xb

这里话也不多说了。

直接讲流程。

首先 如下图所示

![image-20240329104335637](/images/security/douyin-x-bogus-reverse-notes/966701_43MPRK3SQY5NFPY.jpg)

然后跳到断点之后往上找断点。

到达如图所示位置之后

![](/images/security/douyin-x-bogus-reverse-notes/966701_GX6A9QWC6C72TX8.jpg)

这个apply啥意思就不多说了 直接插桩

```text
_0x2458f0['apply'](_0xc26b5e, _0x1f1790)==28(xb的长度)
```

![image-20240329105633962](/images/security/douyin-x-bogus-reverse-notes/966701_36JH5B7RNSK2SYW.jpg)

然后 单点调试下一步 ok 到达了一个JSVMP的方法。然后传的值都是字节码 然后把这些汇编代码转换为JS代码。

![](/images/security/douyin-x-bogus-reverse-notes/966701_NX9NVUWPNEEQ365.jpg)

这里就考虑两种方法了。要不插桩纯算。要不补环境。

### 补环境

先说补环境。

直接全扣下来。

然后在下图位置赋值。

![](/images/security/douyin-x-bogus-reverse-notes/966701_CF4BEXJECFSDB3A.jpg)

然后著名语录： 缺啥补啥。

这里已经补完了 就这么点。

```text
window = global
document = {}
document.addEventListener = function () {}
navigator = {
    "userAgent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.366'
}
```

然后直接得到答案

![](/images/security/douyin-x-bogus-reverse-notes/966701_AD8SF9EEGQXEGZ2.jpg)

至于这个警告。是一个弃用警告。代表这个Buffer这个方法已经不用了。可以通过修改代码

然后看看传参是什么

![](/images/security/douyin-x-bogus-reverse-notes/966701_6JUVNDQENMXM9HU.jpg)

然后给他封装成参数去调用就可以了。

### 算法

这里我们看到这个文件里其实是经过混淆的 非常不利于我们分析加密参数。

所以我们需要使用到ast等工具对他进行解混淆。

然后通过解混淆完了的JS 进行文件重写覆盖。

这里简单讲讲流程。

![](/images/security/douyin-x-bogus-reverse-notes/966701_NN9CM2BXR3Y2SZQ.jpg)

![](/images/security/douyin-x-bogus-reverse-notes/966701_FKRPK5MTTM25G65.jpg)

选择替换内容。浏览器会自动帮我们把js保存到替换的文件夹中。非常方便。

![](/images/security/douyin-x-bogus-reverse-notes/966701_3QYZYYQKCYUUJW3.jpg)

然后就能看到我们的文件了。然后复制文件。到v-tools中

![](/images/security/douyin-x-bogus-reverse-notes/966701_UNNBKFFEVF8S9NH.jpg)

复制出来。cv大法一下就搞定了。

#### 流程分析

这里继续重复上文操作。打上条件断点。然后获取到xb的值。

![](/images/security/douyin-x-bogus-reverse-notes/966701_5K4DS24HVCJZDVF.jpg)

![image-20240329140313200](/images/security/douyin-x-bogus-reverse-notes/966701_R42JMU69RBG5WRG.jpg)

然后继续往上找栈。发现下图就是JSVMP初始化的地方。并且通过执行了W方法 最终获得返回值。

![image-20240329140613594](/images/security/douyin-x-bogus-reverse-notes/966701_GXSSUKEBCJ3E5HG.jpg)

我们这里就直接进入文中这个W方法。

这里进去看可以看到一堆的流程控制语句。

把这个方法复制下来。可以看到。这个方法的走向就是靠判断语句执行的。然后判断语句中又有一堆的流程控制语句。

而且这个判断条件也是由传参的最后一个参数控制的。那这个就很有意思了。

![](/images/security/douyin-x-bogus-reverse-notes/966701_G8RTZRT2C6RE78D.jpg)

这里在这两短流程语句中分别打上日志断点。然后来分析其中的参数。

**第一处断点**

```text
"1", "j>>>", j, "A>>>>", A, "O>>>>>", JSON.stringify(O, function(key, value) {if (value == window) {return undefined} return value})
```

![](/images/security/douyin-x-bogus-reverse-notes/966701_XK28HESKPDFPADK.jpg)

**第二处断点**

```text
"2","j>>>", j, "A>>>>", A, "O>>>>>", JSON.stringify(O, function(key, value) {if (value == window) {return undefined} return value})
```

![](/images/security/douyin-x-bogus-reverse-notes/966701_VPJTKHV9BRCRZYB.jpg)

这里一定要注意debugger不要乱删 不然很容易卡死 。打出来的数据非常之大。

如下图。把所有的日志断点保存 然后往上找第一个X-Bogus 生成的地方。

![](/images/security/douyin-x-bogus-reverse-notes/966701_CSSFZKVUSRVN5CM.jpg)

可以看到 如下图所示。是赋值 值给 X-Bogus的地方。那我们去搜索这个值

![](/images/security/douyin-x-bogus-reverse-notes/966701_V9354UVRCZJ9CQ9.jpg)

可以看到 这个地方应该就是初始值生成处

![](/images/security/douyin-x-bogus-reverse-notes/966701_4TEDHJCPF5FQN57.jpg)

这里就可以看到 。越往上 这个X-Bogus的值就越少。那我们大概就明白了。

这就意味着xb是一个字一个字的根据算法生成。

这里在浏览器看 不是很方便。我们把控制台另存为到文件中方便我们调试。

（这里浏览器卡死了。xb的值可能不固定，不要在意细节）

首先分析下这个3 是如何生成的。

![](/images/security/douyin-x-bogus-reverse-notes/966701_ZFQBXKS5YCGP8NC.jpg)

```text
2 j>>> 16 A>>>> 716 O>>>>> [null,[null,{},null,null,"\u0002ÿ-%.*¯Ë^9õ²\u000b&7\u0012","s2","=",{"s0":"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=","s1":"Dkdpgh4ZKsQB80/Mfvw36XI1R25+WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=","s2":"Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe="},"Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=","DFSzswVOPSzANro1t-KBsNAwgYo",1214867,21],"DFSzswVOPSzANro1t-KBsNAwgYo","3","Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=",[19],63,21]
```

也就是代表 要通过 上面这些值 拿到 `3`

我们打个条件断点。去看看最后一个的生成逻辑

![image-20240329223848278](/images/security/douyin-x-bogus-reverse-notes/966701_E426XBBWHVZRQ4U.jpg)

然后断住打断点继续往下走。

这里注意 要注意我们的O 里是否会有 如上值。如下图 才能正确单步调试。

![](/images/security/douyin-x-bogus-reverse-notes/966701_DQKMK38BFN5XSDM.jpg)

这里单步调试到下图位置。基本可以得到结论了

![](/images/security/douyin-x-bogus-reverse-notes/966701_KZEM98VZT2DP87K.jpg)

我们的xb值为 **DFSzswVOPSzANro1t-KBsNAwgYo3**

由于我们目标是获得数值**3**。 用以下代码可以做到

```text
"Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=".charAt(19)
>> 3
```

同理 获得倒数第二位。继续看我们的日志

这里是 **o，38位**

![](/images/security/douyin-x-bogus-reverse-notes/966701_YMQM5UR4CMS4ATG.jpg)

那这样基本其他值也可以用这个方法了。

![](/images/security/douyin-x-bogus-reverse-notes/966701_UDXF5EYWHK5UE4S.jpg)

根据断点可知 xb4个为一组。

charAt后面的值就是我们所需要的值。

这里 就不废话太多了

```text
str1 = "Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe="

// 19 = (1214867 & 63) >> 0
str1.charAt((1214867 & 63) >> 0)
//结果:3


// 38 = (1214867 & 4032) >> 6
str1.charAt((1214867 & 4032) >> 6)
// 结果:o


// 40 = (1214867 & 258048) >> 12
str1.charAt((1214867 & 258048) >> 12)
// 结果:Y


// 4 = (1214867 & 16515072) >> 18
str1.charAt((1214867 & 16515072) >> 18)
// 结果:g
```

上述刚好对应了 xb的最后四位

> DFSz swVO PSzA Nro1t-KB sNAw **gYo3**

其余算法也一样。

#### 数字算法逻辑

现在唯一可能要注意的就是这个1214867的算法是什么？

这里篇幅原因不展开搞了。反正概念都是一样。根据索引找方法。

---

这里 1214867 是通过位运算符的 1214720 | 147 最终得到1214867

![](/images/security/douyin-x-bogus-reverse-notes/966701_HVUZZ7B4RWHVRCS.jpg)

这里又牵扯到了 两个值

-

1214720

  - 通过位运算 1179648 | 35072 移位得到1214720 那又有两个值出现了

    - 1179648 通过 18<< 16 左移得来 （这里16为定值）

![](/images/security/douyin-x-bogus-reverse-notes/966701_9E3Z5ZBCPQJBWFF.jpg)

      - 18通过 乱码charCodeAt得来

![image-20240330000330767](/images/security/douyin-x-bogus-reverse-notes/966701_UW675YK2XRCXDCX.jpg)

    - 35072 通过137 << 8 左移的来

![image-20240329235922502](/images/security/douyin-x-bogus-reverse-notes/966701_29KRTNYVH6T959B.jpg)

      - 137 通过乱码charCodeAt得来

![image-20240330000412236](/images/security/douyin-x-bogus-reverse-notes/966701_TX44HC3Z2S3BGDY.jpg)

-

147

  - 而147 则是通过 乱码 charCodeAt 获取到的

![](/images/security/douyin-x-bogus-reverse-notes/966701_D9MWGKF843RF3ZS.jpg)

有点乱 梳理一下

1. 通过 乱码 charCodeAt(20)获得147

2. 通过 乱码 charCodeAt(19)获得137

3. 通过 乱码 charCodeAt(18)获得18

4. **通过147 << 0 获得了 147**（找规律得来）

5. 通过 137 << 8 获得 35072

6. 通过 18<< 16 获得 1179648

7. 通过位运算 1179648 | 35072 获得1214720

8. 位运算符的 1214720 | 147 最终得到1214867

那这个只是最后一组的。根据这四组 找规律 获取其他组的信息可得以下代码

```text
const encodedString = "\u0002ÿ-%.*¯Ë^9õ²\u000b&7\u0012";
const decodingMap = "Dkdpgh4ZKsQB80/Mfvw36XI1R25-WUAlEi7NLboqYTOPuzmFjJnryx9HVGcaStCe=";
let xb = "";

for (let index = 0; index <= 20; index += 3) {
    const charCode1 = encodedString.charCodeAt(index);
    const charCode2 = encodedString.charCodeAt(index + 1);
    const charCode3 = encodedString.charCodeAt(index + 2);

    const combinedCode = charCode3 | (charCode2 << 8) | (charCode1 << 16);

    const codePart1 = (combinedCode & 16515072) >> 18;
    const codePart2 = (combinedCode & 258048) >> 12;
    const codePart3 = (combinedCode & 4032) >> 6;
    const codePart4 = combinedCode & 63;

    xb += decodingMap[codePart1] + decodingMap[codePart2] + decodingMap[codePart3] + decodingMap[codePart4];
}

console.log(xb);
```

#### 乱码生成分析

然后就是获取这个乱码的生成处了。可以看到 如下图所示。

![](/images/security/douyin-x-bogus-reverse-notes/966701_AVUHVFQPNNEKCN5.jpg)

![image-20240330003810920](/images/security/douyin-x-bogus-reverse-notes/966701_EV4T4SA4CSN4YKR.jpg)

继续找索引去找这个第三个传参的生产处

![image-20240330003920354](/images/security/douyin-x-bogus-reverse-notes/966701_8BC4R2XJ4TP7KXF.jpg)

如下图到达这个位置。再把这个函数扣下来。

![](/images/security/douyin-x-bogus-reverse-notes/966701_3W6ABZG4A8ND6Z8.jpg)

如上图所示。这个b的生成还是没有还原出来。我们继续来找b。

下图 是生成b的地方。所以我们把这个函数也扣下来。

![](/images/security/douyin-x-bogus-reverse-notes/966701_VS3KJGTPU947G2P.jpg)

我们测试下结果

![](/images/security/douyin-x-bogus-reverse-notes/966701_2SJ53F4MB7R9V66.jpg)

可以正常生成。那我们再来测试下

![](/images/security/douyin-x-bogus-reverse-notes/966701_8BATJVEATTQDTVG.jpg)

事实证明和上文一样。没问题。

部分代码如下

```text
function _0x86cb82(a) {
    return String.fromCharCode(a);
}

function _0x94582(a, b, c) {
    return _0x86cb82(a) + _0x86cb82(b) + c;
}

function _0x25788b(a, b) {
    for (var c, e = [], d = 0, t = "", f = 0; f < 256; f++) {
        e[f] = f;
    }
    for (var r = 0; r < 256; r++) {
        d = (d + e[r] + a.charCodeAt(r % a.length)) % 256, c = e[r], e[r] = e[d], e[d] = c;
    }
    var n = 0;
    d = 0;
    for (var o = 0; o < b.length; o++) {
        d = (d + e[n = (n + 1) % 256]) % 256, c = e[n], e[n] = e[d], e[d] = c, t += String.fromCharCode(b.charCodeAt(o) ^ e[(e[n] + e[d]) % 256]);
    }
    return t;
}

function _0x398111(a, b, c, e, d, t, f, r, n, o, i, _, x, u, s, l, v, h, p) {
    var y = new Uint8Array(19);
    return y[0] = a, y[1] = i, y[2] = b, y[3] = _, y[4] = c, y[5] = x, y[6] = e, y[7] = u,
        y[8] = d, y[9] = s, y[10] = t, y[11] = l, y[12] = f, y[13] = v, y[14] = r, y[15] = h,
        y[16] = n, y[17] = p, y[18] = o, String.fromCharCode.apply(null, y);
};
```

这个已经弄完了。还差最后一个就是这个数组。`arr`其实 不是一个完整的数组，而是一个个数字。

arr 共有19位。

这里说下大概。我也没有每个都去研究。

> 前4位是固定值
> 第5位到第10位通过md5 hex_md5 以及转码得到数组 然后切片取其中的值。
> 第11位到第18位是通过时间戳还有个canvas固定值拼接而来。
> 最后一位通过前面的签名最终得到最后一位数组
> 最后通过19位 数字 然后编码得到乱码。

## 最终结果

![](/images/security/douyin-x-bogus-reverse-notes/966701_XD3NS5DEWCS9ASG.jpg)
