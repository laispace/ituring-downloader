# ituring-downloader 图灵阅读书籍下载器

![](https://raw.githubusercontent.com/laispace/puppeteer-explore/master/assets/download-ituring-books.png?raw=true)

## 安装

```shell
git clone https://github.com/laispace/ituring-downloader.git

cd ituring-downloader


// 
npm install

```

## 使用方法

> 需要使用 v7.6.0 或更高版本的 Node.

```
node lib/ibd username password pathToSave bookUrls
```

- `username:String` 账号名字

- `password:String` 账号密码

- `pathToSave:String` 书籍保存到本地的路径

- `book_urls:Array` 需要下载的书籍，缺省则表示下载所有数据


### 下载指定的多本书籍
```
// 下载《算法图解》和《图解设计模式》
ibd MY_USERNAME MY_PASSWORD ./books http://www.ituring.com.cn/book/1864 http://www.ituring.com.cn/book/1811
```

### 下载书架上所有书籍
```
// 下载所有书架上的书籍，默认保存到 './books' 目录
ibd MY_USERNAME MY_PASSWORD
```
> 注意，该脚本是抓取指定账号在图灵社区购买的正版电子书，只能抓取已购买书籍，下载后仅供自己阅读，请勿肆意传播，否则后果自负！

![](https://raw.githubusercontent.com/laispace/puppeteer-explore/master/assets/download-ituring-books-error.gif?raw=true)


