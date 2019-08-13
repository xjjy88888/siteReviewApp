# 项目初始化
```
cd /d xxx/[projectName]/react
cnpm install
```

# 运行项目
```
npm start
```
或者直接双击[projectName]文件夹中的run-web.bat

# 编辑器VSCode
## 1. 安装VSCode

## 2. VSCode扩展中安装插件
* EditorConfig for VS Code
* ESLint
* IntelliSense for CSS class names in HTML
* JavaScript (ES6) code snippets
* Prettier - Code formatter
* stylelint

## 3. 在工程目录下安装node包
```
cnpm install -g editorconfig
cnpm install eslint-config-prettier --save-dev
cnpm install eslint-config-airbnb --save-dev
cnpm install stylelint-config-standard --save-dev
cnpm install stylelint-config-prettier --save-dev
```

## 4. 首选项-》设置中添加用户设置
```
{
    "eslint.autoFixOnSave": true,
    "files.autoSave": "off",
    "editor.formatOnSave": true
}
```
## 5. windows下，设置git提交检出crlf均不转换为lf
git config --global core.autocrlf false

## 6. 登录用户
* 花都区办事员 hd
* 广州市办事员 gz
* 珠江流域办事员 zj
