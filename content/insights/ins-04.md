# 我用 AI 搭了一套"知识萃取系统"，从此不再重复劳动

每天和 AI 聊了大量的问题，生成了很多文档，但过一段时间全忘了。

想找某个之前整理过的东西，找不到，只能重新问一遍 AI。知识在工具里，却进不了脑子。

这个问题困扰了我很久，直到我花了一天时间，搭了一套"个人知识萃取系统"，才算真正解决。

这篇文章把整个搭建过程完整记录下来，写给和我一样被信息淹没、但不懂代码的人。

---

## 先说清楚：这套系统能解决什么问题

在搭建之前，我的状态是这样的：

- 每天和 AI 对话产生大量内容，但对话结束就消失了
- 自己写了很多 MD 文档，但不知道怎么分类，找起来很麻烦
- 很多东西梳理过、形成过文档，但过一段时间就忘了，只能从头再来
- 把资料扔进 NotebookLM 这类工具，但不知道该问它什么

搭完之后，这套系统帮我做这些事：

- 所有文档统一收口，不再散落各处
- AI 每天自动读取新文档，生成摘要和标签，**自动分类移动到对应文件夹**
- 每天自动生成复习文件，我只需要看复习，不需要翻原始文档
- 每周做一次深度分析，发现知识之间的关联

整套系统搭完，我每天只需要做一件事：**把有价值的内容扔进收件箱，其他全部交给 AI。**

---

## 系统架构：三层分工

```
每天自动  →  本地 AI 模型（处理文档、生成摘要、自动分类、更新索引）
每周手动  →  Claude 网页版（深度分析、发现知识关联）
随时可用  →  Obsidian（查看、搜索、编辑所有笔记）
```

本地模型负责高频的日常任务，完全免费、不占网络、速度快。Claude 网页版负责每周一次的深度分析，利用已有的会员，不额外花钱。Obsidian 是整个系统的"显示器"，所有内容都在这里查看和管理。

---

## 需要准备什么

开始之前，先把这几样东西装好：

**Obsidian**
免费的本地笔记工具，去 obsidian.md 下载，支持 Mac 和 Windows。

**Ollama**
本地运行 AI 模型的工具，去 ollama.com 下载安装，支持 Mac 和 Windows。装完之后在终端运行：
```
ollama pull qwen2.5:7b
```
这会下载一个约 4.7GB 的中文 AI 模型，下载完成后备用。

**Git**
版本控制工具，用来同步文件到云端。Mac 用户打开终端，运行 `git --version`，如果显示版本号说明已经安装。Windows 用户去 git-scm.com 下载安装。

**GitHub 账号**
免费注册，地址 github.com，用来存储你的笔记备份。

**Python**
Mac 自带，Windows 用户去 python.org 下载安装 3.9 以上版本。

---

## 第一步：搭建 Obsidian 文件结构

打开 Obsidian，新建一个库（Vault），取名"我的大脑"，选一个你想存放的位置。

然后在访达（Mac）或文件资源管理器（Windows）里，进入这个文件夹，新建以下子文件夹：

```
我的大脑/
├── 00-收件箱        ← 所有新东西先扔这里（AI 处理后自动清空）
├── 01-AI对话记录    ← 有价值的 AI 对话
├── 02-知识库        ← 知识总结、博客、调研报告
├── 03-项目          ← 产品文档、项目计划、白皮书
├── 04-个人          ← 简历等个人资料
└── _attachments     ← 图片、PDF 附件
```

建完之后，在库的根目录（不是任何子文件夹里）新建一个文件，命名 `index.md`，内容先空着。

> **核心原则**：任何新内容，先扔进 `00-收件箱`，不要想分类的事。分类是 AI 的工作，不是你的。

---

## 第二步：把 GitHub 配置好

这一步的目的是把你的笔记备份到云端，两台电脑也可以同步。

**在 GitHub 创建私有仓库**

登录 github.com，点右上角 `+` → `New repository`，填写：
- Repository name：`my-brain`
- 选择 `Private`（重要，保护隐私）
- 下面三个选项全部不勾选

点 `Create repository`，创建完成。

**把本地文件夹连接到 GitHub**

打开终端，依次执行以下命令（把路径换成你自己的 Vault 路径，用户名换成你的 GitHub 用户名）：

```bash
cd /你的Vault路径/我的大脑
git init
git add .
git commit -m "初始化知识库"
git branch -M main
git remote add origin https://github.com/你的用户名/my-brain.git
git push -u origin main
```

执行过程中会弹出 GitHub 登录窗口，正常登录即可。

**配置 Git 身份信息**

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

**在 Obsidian 里安装 Git 插件实现自动同步**

打开 Obsidian → 设置 → 第三方插件 → 关闭安全模式 → 浏览社区插件 → 搜索 `git` → 找到作者为 Vinzent 的 Git 插件 → 安装并启用。

进入插件设置，填写：
- `Auto commit-and-sync interval`：`10`
- `Auto pull interval`：`10`

设置完成，以后每 10 分钟自动同步一次，完全不需要手动操作。

---

## 第三步：配置 Ollama 开机自启

让 Ollama 在后台常驻运行，脚本随时都能调用它。

Mac 用户在终端运行：
```bash
brew services start ollama
```

Windows 用户：Ollama 安装完默认会开机自启，不需要额外操作。

---

## 第四步：创建自动化脚本

这是整个系统的核心。这个脚本会每天自动读取收件箱里的文件，用 AI 生成摘要、标签和思考题，**自动判断分类并把文件移动到对应文件夹**，最后生成一份复习文件供你核查。

**安装依赖**

终端运行：
```bash
pip3 install requests --break-system-packages
```

**创建脚本文件**

打开任意文本编辑器（Mac 用户可以用 VS Code，Windows 用户用记事本），新建一个文件，把下面的内容完整复制进去：

```python
import os
import shutil
import requests
from datetime import datetime

VAULT_PATH = "/你的Vault路径/我的大脑"
INBOX_PATH = os.path.join(VAULT_PATH, "00-收件箱")
INDEX_PATH = os.path.join(VAULT_PATH, "index.md")
REVIEW_PATH = os.path.join(VAULT_PATH, "02-知识库")
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen2.5:7b"

FOLDERS = {
    "01-AI对话记录": os.path.join(VAULT_PATH, "01-AI对话记录"),
    "02-知识库":     os.path.join(VAULT_PATH, "02-知识库"),
    "03-项目":       os.path.join(VAULT_PATH, "03-项目"),
    "04-个人":       os.path.join(VAULT_PATH, "04-个人"),
    "00-收件箱":     INBOX_PATH,
}

def ask_ollama(prompt):
    response = requests.post(OLLAMA_URL, json={"model": MODEL, "prompt": prompt, "stream": False}, timeout=120)
    return response.json()["response"].strip()

def process_file(filepath, filename):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    if len(content.strip()) < 50:
        return None
    print("  正在处理：" + filename)
    prompt = (
        "请阅读以下笔记，用中文回复。\n"
        "格式（严格按此格式，每项占一行）：\n"
        "摘要：用2-3句话总结核心要点\n"
        "标签：给出3-5个标签用#开头\n"
        "思考题：提出1个思考题\n"
        "归类：从以下选项中选一个最合适的，只写文件夹名称本身：\n"
        "  01-AI对话记录（与AI的对话记录、问答内容）\n"
        "  02-知识库（知识总结、学习笔记、博客文章、调研报告、方法论）\n"
        "  03-项目（产品文档、项目计划、SOP、白皮书、具体项目相关）\n"
        "  04-个人（简历、个人介绍、个人规划）\n"
        "  00-收件箱（以上都不符合，暂时保留）\n\n"
        "笔记内容：\n" + content[:3000]
    )
    result = ask_ollama(prompt)
    folder = "00-收件箱"
    for line in result.splitlines():
        if line.strip().startswith("归类："):
            raw = line.replace("归类：", "").strip()
            for key in FOLDERS:
                if key in raw:
                    folder = key
                    break
            break
    return {"filename": filename, "result": result, "folder": folder, "filepath": filepath}

def move_file(item):
    src = item["filepath"]
    dest_dir = FOLDERS[item["folder"]]
    dest = os.path.join(dest_dir, item["filename"])
    if item["folder"] == "00-收件箱":
        return
    if os.path.exists(dest):
        base, ext = os.path.splitext(item["filename"])
        dest = os.path.join(dest_dir, base + "_moved" + ext)
    shutil.move(src, dest)
    print("  已移动：" + item["filename"] + " → " + item["folder"])

def update_index(processed_files):
    today = datetime.now().strftime("%Y-%m-%d")
    entries = ""
    for item in processed_files:
        if item:
            name = item["filename"].replace(".md", "")
            folder = item["folder"]
            entries += "- [[" + folder + "/" + name + "]]（已归类到 " + folder + "）\n"
    content = (
        "# 我的知识地图\n\n"
        "## 最近新增（" + today + "）\n" + entries +
        "\n## 主要主题\n"
        "- [[02-知识库]]\n"
        "- [[01-AI对话记录]]\n"
        "- [[03-项目]]\n"
        "- [[04-个人]]\n"
    )
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("  index.md 已更新")

def generate_review(processed_files):
    today = datetime.now().strftime("%Y-%m-%d")
    review = "# 每日复习 " + today + "\n\n"
    review += "> 以下文件已自动归类，请核查位置是否正确，如有误请手动移动。\n\n"
    for item in processed_files:
        if item:
            review += "## " + item["filename"].replace(".md", "") + "\n\n"
            review += item["result"] + "\n\n"
            review += "> 已移动到：**" + item["folder"] + "**\n\n"
            review += "---\n\n"
    path = os.path.join(REVIEW_PATH, "复习-" + today + ".md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(review)
    print("  复习文件已生成：复习-" + today + ".md")

def main():
    print("知识萃取开始 " + datetime.now().strftime("%Y-%m-%d %H:%M"))
    md_files = [f for f in os.listdir(INBOX_PATH) if f.endswith(".md")]
    if not md_files:
        print("收件箱为空")
        return
    print("发现 " + str(len(md_files)) + " 个文件，开始处理...")
    processed = []
    for filename in md_files:
        filepath = os.path.join(INBOX_PATH, filename)
        result = process_file(filepath, filename)
        processed.append(result)
    valid = [p for p in processed if p]
    for item in valid:
        move_file(item)
    update_index(valid)
    generate_review(valid)
    print("完成！处理了 " + str(len(valid)) + " 个文件")

if __name__ == "__main__":
    main()
```

> **注意**：第一行 `VAULT_PATH` 里的路径要换成你自己的 Vault 实际路径。
> Mac 路径格式：`/Users/你的用户名/文件夹名/我的大脑`
> Windows 路径格式：`C:/Users/你的用户名/文件夹名/我的大脑`

保存文件，命名为 `daily_process.py`，放到 Vault 根目录里（和 `index.md` 同级）。

**测试运行**

终端运行：
```bash
python3 /你的Vault路径/我的大脑/daily_process.py
```

看到"完成！处理了 X 个文件"说明运行成功。

---

## 第五步：设置定时自动运行

让脚本每天定时自动跑，不需要手动触发。

**Mac 用户**

终端运行（把路径换成你自己的，`20` 代表晚上 8 点，根据作息自行调整）：
```bash
(crontab -l 2>/dev/null; echo "0 20 * * * /usr/bin/python3 /你的Vault路径/我的大脑/daily_process.py") | crontab -
```

验证是否设置成功：
```bash
crontab -l
```

**Windows 用户**

打开"任务计划程序"→ 创建基本任务 → 触发器选"每天" → 设置时间 → 操作选"启动程序" → 程序填 `python`，参数填脚本完整路径。

---

## 第六步：建立使用习惯

系统搭好了，剩下的就是养成习惯。

**每天需要做的事（5 分钟）**

有价值的 AI 对话结束后，加一句：
> "帮我把这次对话的核心内容整理成 Markdown 格式，包含标题、核心要点、关键概念。"

复制输出，在 Obsidian 里 `Cmd/Ctrl + N` 新建笔记，粘贴保存到 `00-收件箱`。

晚上回来，打开 `02-知识库` 里当天生成的复习文件，做两件事：
1. 看一遍摘要和思考题
2. 核查每篇笔记末尾标注的"已移动到：XX"，如果位置不对手动拖过去

**平时不需要主动翻原始文档**，复习文件就是你日常需要看的全部内容。想深入某个知识点，点双链跳回原文；想搜索某个内容，`Cmd/Ctrl + Shift + F` 全库搜索。

**每周一次深度分析（15 分钟）**

把这周新增的笔记内容复制出来，打开 Claude 网页版，用这个提示词：

```
我有以下几篇这周新增的笔记，请帮我做跨笔记深度分析：

[粘贴笔记内容]

请完成：
1. 找出这些笔记之间隐藏的关联和共同主题
2. 指出哪些知识点相互印证、哪些存在矛盾
3. 发现我最近思考的关注焦点是什么
4. 建议哪些笔记应该用双链连接
5. 生成 3 个值得深入探索的问题
```

把分析结果新建笔记存回 Obsidian，命名 `周报-2026-W17` 这样的格式，长期积累。

---

## 思考题答不上来怎么办

看复习文件时，遇到思考题答不上来是完全正常的，不要有压力。

**完全没印象的**：直接打开原文重读一遍，读完合上文件，用自己的话复述一次。这个"读完就复述"的动作是最有效的记忆方式，比反复阅读强很多。

**大概知道但说不清楚的**：把题目扔给 Claude：
> "这是我笔记里的一道思考题：[题目]。我的理解是：[你的想法，哪怕很模糊]。帮我补充和纠正。"

每天能认真对待 2-3 道思考题就足够了，不要试图全部答完。

---

## 让知识真正进入大脑

存进知识库只是第一步，真正的目标是让知识进入脑子里。

复习文件里每篇笔记都有一道思考题，不要只是读，试着关掉文件，用自己的话把这个知识点解释一遍。说不清楚的地方，就是还没真正理解的地方。

遇到重要概念，用这个方式检验自己：

> "我来解释一下 [概念]，你帮我指出哪里理解有偏差：[你的解释]"

能解释清楚，才算真的懂了。

---

## 整套系统一览

| 工具 | 作用 | 费用 |
|------|------|------|
| Obsidian | 笔记管理，查看所有内容 | 免费 |
| Qwen2.5-7B + Ollama | 每日自动处理、分类文档 | 免费 |
| GitHub | 云端备份，多设备同步 | 免费 |
| Claude 网页版 | 每周深度分析 | 已有会员则免费 |

**整套系统几乎零成本**，本地模型完全免费，GitHub 私有仓库免费，日常运行不依赖任何付费服务。

---

## 写在最后

搭这套系统花了我一个下午，但它解决的是一个长期困扰我的问题：知识在工具里，却进不了脑子。

核心思路其实很简单：**降低存入的门槛，用 AI 替代人工整理和分类，用复习机制让知识真正沉淀。**

