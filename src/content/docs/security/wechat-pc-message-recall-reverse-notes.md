---
title: PC 微信逆向：实现消息防撤回
description: 从 PC 微信 2.8.0.121 的内存搜索、写入断点、调用点定位和 DLL Hook 代码整理消息防撤回实现过程。
---

自从聊天软件消息撤回功能问世后，对于撤回的消息，我们对它一直有种强烈的好奇感。“Ta刚撤回了什么？是骂我的话？还是说喜欢我？还是把发给其他人的消息误发给了我？好气呀，都看不到了...”这是我们看到消息被撤回后的内心独白。但是今天，看完了本篇文章你就可以说：

![](/images/security/wechat-pc-message-recall-reverse-notes/815293_FU27GHRDFWTFEAK.jpg)

我们看一下效果图，撤回的消息被我们看到了，相当于防（防止）撤回

![](/images/security/wechat-pc-message-recall-reverse-notes/815293_X53TUY8WE43NBMA.jpg)

好了，看完效果，接下来我们看一下怎么找到它的位置，并用代码hook它。

本文用到的软件工具：

- 微信 2.8.0.121

- Cheat Engine 7.0(用于内存搜索，下文简称CE)

- Ollydbg吾爱破解版(用于动态调试，下文简称OD)

- Visual Studio 2017(用于编写Hook代码，下文简称VS)

用CE打开微信进程

![](/images/security/wechat-pc-message-recall-reverse-notes/815293_BUR55NXBW3VKUMJ.jpg)

用另一个微信号给在电脑登录的微信号随机发一条消息，勾选**UTF-16**选项，然后在CE中搜索**消息内容**

![](/images/security/wechat-pc-message-recall-reverse-notes/815293_SFSQNEXV7Q7Y3FP.jpg)

撤回消息，看到一条xml消息，双击它添加到地址列表

![](/images/security/wechat-pc-message-recall-reverse-notes/815293_7QJUJMS7G7EU42Y.jpg)

打开OD，附加微信进程，用dd命令定位到上面的那个地址

![](/images/security/wechat-pc-message-recall-reverse-notes/815293_5J895PVS54ZW28E.jpg)

再给电脑登录那个微信号发一条消息，然后在上面那个地址下**内存写入断点**。为什么是内存写入断点？因为我们上文亲眼目睹了消息撤回后这个地址的字符串被改写了。

下好断点后再把消息撤回，此时断点被触发，微信被断下，断下后，**删除内存断点**。在堆栈里寻找我们想要的内容，看到一个包含**撤回提示**，**wxid**和**撤回内容**的call

![](/images/security/wechat-pc-message-recall-reverse-notes/815293_7N28KHWFTHMMPQD.jpg)

在反汇编窗口中跟随这个call，点击这个call，按F2在该call下断点，按F9继续运行。再给在电脑登录那个微信号发一条消息并撤回，该call断下

![](/images/security/wechat-pc-message-recall-reverse-notes/815293_RQBJ7NZ9YNE23Y7.jpg)

说明，这个call就是我们要找的消息撤回的位置，而且它有我们想要的数据

![](/images/security/wechat-pc-message-recall-reverse-notes/815293_9YNHPYQ5YEPV3US.jpg)

找到了call，来整理一下该call的数据，数据都是存在堆栈里，所以有：

- esp + 0x4 ：撤回消息的提示

- esp + 0x50 : 撤回消息人的wxid

- esp + 0x78 : 撤回消息的内容

接下来编写一个dll，来hook这个call，读取esp偏移地址的数据。

在VS创建一个dll项目，核心代码如下：

```text
#include "resource.h"
#include "hook.h"
#include "module.h"
#include <wchar.h>
INT_PTR CALLBACK Dlgproc(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam);
void DlgThread(HMODULE hInstance);

#define REVOCK_CALL_RVA 0x28c33f
#define REVOCK_CALL_TARGET_RVA 0x28ccd0

DWORD revockCallVA = 0;
DWORD revockCallTargetVA = 0;
DWORD revockCallJmpBackVA = 0;

DWORD wechatWinAddr = 0;
BYTE backCode[5];

HWND m_dialog_hwnd;
BOOL APIENTRY DllMain( HMODULE hModule,
                       DWORD  ul_reason_for_call,
                       LPVOID lpReserved
                     )
{
    switch (ul_reason_for_call)
    {
    case DLL_PROCESS_ATTACH:
    CreateThread(NULL, 0, LPTHREAD_START_ROUTINE(DlgThread), hModule, 0, NULL);
    case DLL_THREAD_ATTACH:
    case DLL_THREAD_DETACH:
    case DLL_PROCESS_DETACH:
        break;
    }
    return TRUE;
}

void OnRevock(DWORD esp) {
  wchar_t *tips = *(wchar_t **)(esp + 0x4);
  wchar_t *msg = *(wchar_t **)(esp + 0x78);
  if (NULL != tips) {
    WCHAR buffer[0x8192];
    wchar_t* pos = wcsstr(tips, L"撤回了一条消息");
    if (pos!= NULL && NULL != msg) {
      swprintf_s(buffer, L"%s，内容：%s",tips, msg);
      SetDlgItemText(m_dialog_hwnd, IDC_EDIT1, buffer);
    }
  }

}
DWORD tEsp = 0;
_declspec(naked) void _OnRevock() {
    __asm {
        mov tEsp, esp
        pushad
    }
    OnRevock(tEsp);
    __asm {
        popad
        call revockCallTargetVA
        jmp revockCallJmpBackVA
    }
}

void DlgThread(HMODULE hInstance) {
  DialogBox(hInstance, MAKEINTRESOURCE(IDD_DIALOG1), NULL, Dlgproc);
}

INT_PTR CALLBACK Dlgproc(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
  switch (uMsg) {
    case WM_INITDIALOG: {
      m_dialog_hwnd = hWnd;
      wechatWinAddr = GetWxModuleAddress();
      revockCallVA = wechatWinAddr + REVOCK_CALL_RVA;
      revockCallTargetVA = wechatWinAddr + REVOCK_CALL_TARGET_RVA;

      revockCallJmpBackVA = revockCallVA + 5;
      StartHook5(wechatWinAddr+REVOCK_CALL_RVA,backCode,_OnRevock);
    }
    break;
    case WM_CLOSE:
      Unhook5(wechatWinAddr + REVOCK_CALL_RVA, backCode);
      EndDialog(hWnd, TRUE);
      break;
  }
  return 0;
  }
```

Hook相关代码：

```text
int StartHook5(DWORD hookAddr, BYTE backCode[5], void(*FuncBeCall)()) {
    DWORD jmpAddr = (DWORD)FuncBeCall - (hookAddr + 5);

    BYTE jmpCode[5];
    *(jmpCode + 0) = 0xE9;
    *(DWORD *)(jmpCode + 1) = jmpAddr;
    HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, NULL, GetCurrentProcessId());
    //备份被替换的
    if (ReadProcessMemory(hProcess, (LPVOID)hookAddr, backCode, 5, NULL) == 0) {
        return -1;
    }
    //写入jmp指令
    if (WriteProcessMemory(hProcess, (LPVOID)hookAddr, jmpCode, 5, NULL) == 0) {
        return -1;
    }

    return 0;
}

int Unhook5(DWORD hookAddr, BYTE backCode[5]) {
    HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, NULL, GetCurrentProcessId());
    if (WriteProcessMemory(hProcess, (LPVOID)hookAddr, backCode, 5, NULL) == 0) {
        return -1;
    }
    return 0;
}
```

代码写完后，生成dll，把它注入到微信进程，防撤回消息就能实现了。

**总结**：微信版本一直会变化，相应的hook地址也会改变，但是有了这个思路，它更新版本，我们也能快速的找到call。这个消息撤回的call也比较好找，像我这样初学逆向的朋友可以尝试自己找一下。
