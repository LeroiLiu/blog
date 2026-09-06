---
title: Android 微信逆向：实现发朋友圈动态
description: 从 Android 微信 7.0.11 的 SnsUploadUI、动态类型、文字动态和图片动态分析实现朋友圈发布流程。
---

## 0x0 前言

最近一直在研究Windows逆向的东西，想着快要把Android给遗忘了。所以就想利用工作之余来研究Android相关的技术，来保持对Android热情。调用微信代码来发送朋友圈动态一直是自己想实现的东西，研究了一下，果然实现了，遂写下本文当作记录。本文主要分析发送纯文字朋友圈动态和发送图片朋友圈动态。

## 0x1 朋友圈动态类型分析

本文用到的工具如下：

- PC

- 一台可以调试微信进程的Android手机

- 微信7.0.11

- ddms(用于跟踪调用过程)

- uiautomatorviewer(用于定位控件id)

- jadx(用于对微信apk静态分析)

- frida(用于hook微信，获得相关信息，发布朋友圈)

在分析代码之前，首先要定位到与之相近的地方，我们首先想到的肯定是发朋友圈那个界面，如何查看发朋友圈的界面是哪个Activity呢？很简单，在手机上打开发送朋友圈的界面

![](/images/security/wechat-android-moments-reverse-notes/815293_2HN4TK7SRS2ENFR.jpg)

把手机连接电脑，打开USB调试，在PC的cmd窗口中执行以下命令：

```text
adb shell dumpsys activity top
```

![](/images/security/wechat-android-moments-reverse-notes/815293_HBXHDZJMRUBF3N9.jpg)

可以看到发朋友圈的那个Activity就是`com.tencent.mm.plugin.sns.ui.SnsUploadUI`

虽然找到了Activity，但还是不能高兴太早，想要通过Activity知道哪部分是发朋友的代码还是比较费力的。于是我们就想到从“发表”按钮入手，找出发表朋友圈的相关代码。点击“发表”按钮会发生什么？发表是一个动态的行为，我们可以通过跟踪点击“发表”按钮时的调用过程，来找到有用的信息。跟踪调用过程，可以使用ddms工具来完成。打开ddms,选中微信进程，在手机中打开发表朋友圈界面，然后在ddms中点击下图圈出的图标开始跟踪：

![](/images/security/wechat-android-moments-reverse-notes/815293_PNPAC3BHM43QCY6.jpg)

将朋友圈动态发出，再点一次上图圈出的图标停止跟踪。ddms会生成跟踪结果，对于跟踪结果，怎么找到按钮事件相关的信息呢，学过Android的朋友就会想到**onClick**方法，那我们就在ddms的搜索结果中搜索这个名称：

![](/images/security/wechat-android-moments-reverse-notes/815293_Q9ZSADEV5CWNJ2E.jpg)

成功的定位到了onClick的位置，但是比起这条onClick结果，更加令人引人注目的是它的上一条结果，因为它包含了我们刚才找到的Activity的类名:

![](/images/security/wechat-android-moments-reverse-notes/815293_5ESNJJKA7ZYMPFH.jpg)

知道这个方法被调用，我们去看看`com.tencent.mm.plugin.sns.ui.SnsUploadUI`类里的OnMemuItemClick究竟是什么。

用jadx打开微信apk,定位到`com.tencent.mm.plugin.sns.ui.SnsUploadUI`类，在类中搜索`onMemuItemClick`，结果不多，看起来比较像的就是这个`onMemuItemClick`了:

![](/images/security/wechat-android-moments-reverse-notes/815293_XXMSZD2QXG8QVKD.jpg)

在onMemuItemClick方法中看到了:

```text
String unused2 = SnsUploadUI.this.desc = SnsUploadUI.this.tQN.getText().toString();
```

这行代码有什么特别的呢，在我看来，有两个特别的地方：

- desc是描述（description）的英文单词的缩写

- this.desc被赋予this.tQN.getText().toString()

我们发朋友圈动态时候，是要写动态的描述的，所以这个desc可能就是发朋友圈动态的描述，如果是描述，我们就可以根据这个描述，顺藤摸瓜找到发朋友圈动态的地方。而且this.desc的值又来自于`this.tQN.getText().toString()`，即this.tQN很有可能就是我们填写动态描述的文本框。我们来看看this.tQN赋值的地方，它在onCreate方法被赋值：

![](/images/security/wechat-android-moments-reverse-notes/815293_ARA9K8XDKRUNJ3A.jpg)

可以知道它的id是`d41`，那么d41是哪个控件？打开uiautomatorviewer,对发朋友圈界面截图分析，点击截图中的文本框，uiautomatorviewer右侧跳转到了相应的位置，果然，d41就是发动态时填写描述文本框的id

![](/images/security/wechat-android-moments-reverse-notes/815293_X4H6FTZNGYVU27Y.jpg)

好了，现在知道this.desc就是发表朋友圈动态时的描述，跟上他应该就可以找到发朋友圈动态的地方。继续往onMemuItemClick方法下部分析，可以看到this.desc被传入了`SnsUploadUI.this.tQO.a`方法：

![](/images/security/wechat-android-moments-reverse-notes/815293_F2BRJB5M46BT2NJ.jpg)

SnsUploadUI.this.tQO.a方法定义在接口`com.tencent.mm.plugin.sns.ui.z`中：

![](/images/security/wechat-android-moments-reverse-notes/815293_WUG4JGVRPQACPY9.jpg)

![](/images/security/wechat-android-moments-reverse-notes/815293_DYAX26624QMD98Z.jpg)

知道它定义在哪个接口并不能解决问题，毕竟接口没有实质性代码，要找还得找接口的的实现类，在com.tencent.mm.plugin.sns.ui.SnsUploadUI类中寻找this.tQO在哪里会被赋值。最终，我们在com.tencent.mm.plugin.sns.ui.SnsUploadUI类的ag方法中看到了许多给this.tQO赋值的地方：

![](/images/security/wechat-android-moments-reverse-notes/815293_58VZK58KEUE5KCW.jpg)

由此，可见this.tQO被赋予什么值是根据`this.tMY`来决定的，this.tMY是一个int类型的数据，那我们hook com.tencent.mm.plugin.sns.ui.SnsUploadUI类的ag方法就可以知道this.tMY是什么值。在这里，我用frida来hook,frida的javascript部分代码如下：

```text
var SnsUploadUI= Java.use('com.tencent.mm.plugin.sns.ui.SnsUploadUI');
var ag = SnsUploadUI.ag.overload("android.os.Bundle");
//get sns type
ag.implementation=function(bundle){
    var ret = ag.call(this,bundle);
    send("sns type = " + this.tMY.value);
    return ret;
}
```

hook之后，每当我们在手机上打开发布朋友圈动态的界面，ag方法被调用，控制台就会输出相应的数字。经过我的测试，这个数字是发表朋友圈动态的类型。朋友圈类型和其对应类如下：

- 0 带图片的动态，对应：`com.tencent.mm.plugin.sns.ui.ai`

- 9 纯文字动态，对应：`com.tencent.mm.plugin.sns.ui.ae`

这些类都直接或间接的实现了上面讲到的`com.tencent.mm.plugin.sns.ui.z`接口。这样一来，就知道this.tQO会根据朋友圈的动态类型进行初始化，那么，上面的SnsUploadUI.this.tQO.a方法很有可能就是发朋友圈动态的方法。接下来，我们根据不同的朋友圈动态所对应的类来分别分析

## 0x2 文字动态分析

文字动态分析起来应该比图片动态来说简单一些，我们就先来分析它。上面讲到，这类动态对应类是com.tencent.mm.plugin.sns.ui.ae，这个类里我们主要看a方法，在看a方法之前，先看它传入什么参数，为了看清楚，这就要回看上文onMenuItemClick方法调用a方法的地方：

```text
public final boolean onMenuItemClick(MenuItem menuItem) {
    String unused2 = SnsUploadUI.this.desc = SnsUploadUI.this.tQN.getText().toString();
    int pasterLen = SnsUploadUI.this.tQN.getPasterLen();
    int privated = SnsUploadUI.this.tKm.getPrivated();
    int syncFlag2 = SnsUploadUI.this.tKm.getSyncFlag();
    ......
    PInt pInt = new PInt();
    if (SnsUploadUI.this.tQO instanceof a) {
        Bundle bundle = new Bundle();
        bundle.putInt("param_is_privated", privated);
        bundle.putString("param_description", SnsUploadUI.this.desc);
        bundle.putStringArrayList("param_with_list", new ArrayList(SnsUploadUI.this.uij.getAtList()));
        bundle.putInt("param_paste_len", pasterLen);
        try {
            bundle.putByteArray("param_localtion", SnsUploadUI.this.uik.getLocation().toByteArray());
        } catch (IOException e2) {
            ab.printErrStackTrace("MicroMsg.SnsUploadUI", e2, "parse location error", new Object[0]);
        }
        bundle.putBoolean("param_is_black_group", SnsUploadUI.this.tQS);
        bundle.putStringArrayList("param_group_user", SnsUploadUI.this.tQR);
        bundle.putInt("param_contact_tag_count", SnsUploadUI.this.tOk);
        bundle.putInt("param_temp_user_count", SnsUploadUI.this.tOl);
        pInt.value = ((a) SnsUploadUI.this.tQO).getContentType();
        z unused4 = SnsUploadUI.this.tQO;
    } else {
        SnsUploadUI.this.tQO.a(privated, syncFlag2, SnsUploadUI.this.tKm.getTwitterAccessToken(), SnsUploadUI.this.desc, SnsUploadUI.this.uij.getAtList(), SnsUploadUI.this.uik.getLocation(), (LinkedList<Long>) null, pasterLen, SnsUploadUI.this.tQS, SnsUploadUI.this.tQR, pInt, SnsUploadUI.this.tOj, SnsUploadUI.this.tOk, SnsUploadUI.this.tOl);
    }
}
```

这就是a方法调用的地方，根据这段代码和编写hook a方法的代码来推出它的参数。hook代码如下：

```text
var ae = Java.use('com.tencent.mm.plugin.sns.ui.ae');
var ae_a = ae.a.overload("int","int","org.b.d.i","java.lang.String","java.util.List","com.tencent.mm.protocal.protobuf.bdi","java.util.LinkedList","int","boolean","java.util.List","com.tencent.mm.pointers.PInt","java.lang.String","int","int");
ae_a.implementation = function(isPrivate,syncFlag2,twitterAccessToken,desc,atList,location,list1,pasterLen,bool1,list2,pint1,str1,num1,num2){
    var ret = ae_a.call(this,isPrivate,syncFlag2,twitterAccessToken,desc,atList,location,list1,pasterLen,bool1,list2,pint1,str1,num1,num2);
    console.log("************Basic Info************");
    console.log("isPrivate = " + isPrivate);
    console.log("syncFlag2 = " + syncFlag2);
    console.log("twitterAccessToken = " + twitterAccessToken);
    console.log("desc = " + "'" + desc + "'");
    if(atList.size()>0){
        for(var i=0;i<atList.size();i++){
            console.log("atList[" + i + "] = " + atList.get(0));
        }
    }
    if(location != null){

        if(location.yRD.value != null){
            console.log("location.yRD = " + location.yRD.value);
        }

        if(location.yRE.value != null){
            console.log("location.yRE = " + location.yRE.value);
        }

    }
    console.log("list1 = " + list1);
    console.log("pasterLen = " + pasterLen);
    console.log("bool1 = " + bool1);
    if(list2 != null){
        console.log("list2 = " + list2.size());
    }
    else{
        console.log("list2 = " + list2);
    }
    console.log("pint1 = " + pint1.value.value);
    console.log("str1 = " + str1);
    console.log("num1 = " + num1);
    console.log("num1 = " + num1);

    return ret;
}//ae.a
```

hook成功后，发一条纯文字的朋友圈动态，打印出：

![](/images/security/wechat-android-moments-reverse-notes/815293_MR2T6BCMTXUN8KX.jpg)

所以，可得：

```text
- privated(int)：动态是否私密：0公开，1私密
- desc(String)：朋友圈的文本
- AtList(List<String>)：艾特人的wxid
- Location(com.tencent.mm.protocal.protobuf.bdi)：定位信息
```

好多参数我们不知道是什么，不过问题不大，那些我们需要的参数已经能搞懂了。懂得a方法的参数，那能否尝试直接调用它？先来看一下`com.tencent.mm.plugin.sns.ui.ae`类的构造函数能否调用：

![](/images/security/wechat-android-moments-reverse-notes/815293_9UMUDQDPGC35CUA.jpg)

构造函数有Activity类型的参数，Activity类型的参数是很难构造的，所以放弃构造com.tencent.mm.plugin.sns.ui.ae类来调用a方法。那我们直接去看a方法，看能不能找到有用的东西。由于是文字动态，所以我们着重关注传入的文本，即com.tencent.mm.plugin.sns.ui.SnsUploadUI类的desc成员，在a方法中它是第4个参数：

![](/images/security/wechat-android-moments-reverse-notes/815293_WZUR7U7MUH9GQS6.jpg)

可见this.desc在a方法中它是str,而且在a方法中，str只有一处引用：

![](/images/security/wechat-android-moments-reverse-notes/815293_HRD69H39NJJR24Z.jpg)

str传给了ayVar.adk()方法，找一下ayVar来自哪里，它在a方法里初始化，而且初始化方式很简单：

![](/images/security/wechat-android-moments-reverse-notes/815293_KQN57EDS7HC6Z5D.jpg)

只传入一个数字就能初始化，我们初始化ay类的时候不用深究这个数字是什么，和它传入一样的值即可。在a方法的尾部，还看到一个引人注目的commit方法：

![](/images/security/wechat-android-moments-reverse-notes/815293_CDBZ5Q9M46M5ZBH.jpg)

猜测这就是发布朋友圈的方法，写个简单的frida脚本来验证一下：

```text
if(Java.available)
{
    Java.perform(function(){
        var ay_class = Java.use("com.tencent.mm.plugin.sns.model.ay");
        var desc = "To be, or not to be, that is a question.";
        var ayInstance = ay_class.$new(2);
        ayInstance.adk(desc);
        ayInstance.commit();
    });
}
```

文字动态的内容是：`To be, or not to be, that is a question.`。果不其然，脚本运行后，文字动态发表成功了

![](/images/security/wechat-android-moments-reverse-notes/815293_Z57PK642S4T8Q6K.jpg)

经过对com.tencent.mm.plugin.sns.ui.ae的a方法的分析，我们可以知道，a方法主要传入一些发朋友圈动态所需要的通用的数据，比如动态是否私密，动态的文字描述，艾特的人，定位信息等，这些信息在其他类型的朋友圈动态中也会用得到。我们还知道发文字动态只需要文字描述就能发表成功。

## 0x3 带图片的朋友圈动态分析

带图片的的动态和文字动态差不多，只是多加了图片的参数，我们在分析此类动态时多关注图片在哪传入即可。带图片的动态对应的类是`com.tencent.mm.plugin.sns.ui.ai`，有了上面的经验，我们直接去看它的a方法（ai类有许多a方法，注意这里说的a方法参数和com.tencent.mm.plugin.sns.ui.z接口里的a方法参数一致）。在a方法的开头，看到利用迭代器去遍历一个列表，遍历过程中组装`com.tencent.mm.plugin.sns.data.j`类的数据，然后把j类放入链表linkedList2中：

![](/images/security/wechat-android-moments-reverse-notes/815293_EFUYEPYFMK2FB3C.jpg)

在组装数据的时候，我们看到j类构造时传入一个字符串和数字，而这个字符串对应j类的path字段，这可能就是图片的路径：

![](/images/security/wechat-android-moments-reverse-notes/815293_F5MYAERN8DBETQN.jpg)

那么我们猜测j类就是存储朋友圈的动态图片信息的类，上面提到j类被放入链表linkedList2中，那么来看linkedList2被哪里引用了

![](/images/security/wechat-android-moments-reverse-notes/815293_JHN6JR3M3U4VB8E.jpg)

看到醒目的字符串：`commit pic size`，这应该是日志要打印的字符串，现在基本上可以确定j类就是存储要发表的图片的信息的类了，那么linkedList2就是存储所有将要发表的图片信息，继续往下寻找linkedList2还被哪里引用了

![](/images/security/wechat-android-moments-reverse-notes/815293_9MJ5CWS96FDDXRD.jpg)

可以看到linkedList2传入两个地方，一处传入a方法：

![](/images/security/wechat-android-moments-reverse-notes/815293_DBGTR9ABJYH8JQ9.jpg)

另一处传入`com.tencent.mm.plugin.sns.ui.ai$a`类构造函数：

![](/images/security/wechat-android-moments-reverse-notes/815293_MUJ9CT7R44FU3AS.jpg)

linkedList2传入a类后,又赋值给成员变量tPF,这个tPF成员变量只在a类的dU方法中被引用

![](/images/security/wechat-android-moments-reverse-notes/815293_WAYNECVWHATUN59.jpg)

而dU方法在哪里调用呢？在a类的父类：`com.tencent.mm.plugin.sns.model.h`中，我们看到dU方法在u方法被调用：

![](/images/security/wechat-android-moments-reverse-notes/815293_RXXZ8P7Z69NAPFR.jpg)

而u方法在ai类的a方法中调用（可以回看前面的图）。分析到这，上面的linkedList2传出去之后都终有所属了，即最终都传入了com.tencent.mm.plugin.sns.model.ay类ey方法。知道图片往哪传了，就写段frida代码调用试试吧

```text
if(Java.available)
{
    Java.perform(function(){
        var ay_class = Java.use("com.tencent.mm.plugin.sns.model.ay");
        var j_class = Java.use("com.tencent.mm.plugin.sns.data.j")
        var desc = "To be, or not to be, that is a question.";
        var likedList_class = Java.use("java.util.LinkedList");
        var linkedListInstance = likedList_class.$new();
        var ayInstance = ay_class.$new(1);
        var jInstance1 = j_class.$new("/storage/emulated/0/test1.jpg",2);
        var jInstance2 = j_class.$new("/storage/emulated/0/test2.jpg",2);
        var jInstance3 = j_class.$new("/storage/emulated/0/test3.jpg",2);

        linkedListInstance.add(jInstance1);
        linkedListInstance.add(jInstance2);
        linkedListInstance.add(jInstance3);
        ayInstance.ey(linkedListInstance);
        ayInstance.adk(desc);
        ayInstance.commit();
    });
}
```

上面的代码在发送文本动态代码的基础上初始化三个j类，分别传入三个本地图片路径，再将三个类实例添加到链表，再将链表传入ay类的ey方法，最后调用ay类的commit方法将动态发送出去，代码运行，发现带图片的朋友圈动态发表成功：

![](/images/security/wechat-android-moments-reverse-notes/815293_QTS5PNQBQJT66QC.jpg)
