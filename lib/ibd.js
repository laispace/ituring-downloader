/**
 * 下载图灵电子书
 */
const puppeteer = require('puppeteer');
const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const BASE_URL = 'http://www.ituring.com.cn';
const SHELF_URL = `${BASE_URL}/user/shelf`;
const LOGIN_URL = `http://account.ituring.com.cn/log-in?returnUrl=${encodeURIComponent(SHELF_URL)}`;

const downloadIturingBooks = async (userName, password, saveDir = './books/', targetBookUrls) => {
    if (!userName) {
        throw new Error('请输入用户名');
    }
    if (!password) {
        throw new Error('请输入密码');
    }
    try {
        // 设置统一的视窗大小
        const viewport = {
            width: 1376,
            height: 768,
        };

        console.log('启动浏览器');
        const browser = await puppeteer.launch({
            timeout: 0,
            // 关闭无头模式，方便我们看到这个无头浏览器执行的过程
            // 注意若调用了 Page.pdf 即保存为 pdf，则需要保持为无头模式
            // headless: false,
        });

        console.log('打开新页面');
        const page = await browser.newPage();
        page.setViewport(viewport);

        console.log('输入登录地址');
        await page.goto(LOGIN_URL, {
            timeout: 0
        });

        await page.waitForSelector('#loginForm');

        console.log('输入用户名和密码');
        await page.focus('#Email');
        await page.type('#Email', userName);
        await page.focus('#Password');
        await page.type('#Password', password);
        await page.click('#loginForm  input[type="submit"]');

        await page.waitForSelector('.block-items');

        let books;
        if (Array.isArray(targetBookUrls) && targetBookUrls.length) {
            books = targetBookUrls;
            console.log(`准备下载指定的${books.length}本书`);
        } else {
            books = await page.$eval('.block-items', element => {
                const booksHTMLCollection = element.querySelectorAll('.block-item');
                const booksElementArray = Array.prototype.slice.call(booksHTMLCollection);
                const books = booksElementArray.map(item => {
                    const a = item.querySelector('.book-img a');
                    return a.getAttribute('href');
                });
                return books;
            });
            console.log(`准备下载书架上找到的所有${books.length}本书`);
        }

        for (let book of books) {
            const bookPage = await browser.newPage();
            bookPage.setViewport(viewport);
            const bookUrl = book.startsWith(BASE_URL) ? book : `${BASE_URL}${book}`;
            await bookPage.goto(bookUrl, {
                timeout: 0
            });
            await bookPage.waitForSelector('.bookmenu');
            const bookTitle = await bookPage.$eval('.book-title h2', element => element.innerText);
            const articles = await bookPage.$eval('.bookmenu table tbody', element => {
                const articlesHTMLCollection = element.querySelectorAll('tr');
                const articlesElementArray = Array.prototype.slice.call(articlesHTMLCollection);
                const articles = articlesElementArray.map(item => {
                    const a = item.querySelector('td a');
                    return {
                        href: a.getAttribute('href'),
                        title: a.innerText.trim(),
                    };
                });
                return articles;
            });
            bookPage.close();

            for (let article of articles) {
                const articlePage = await browser.newPage();
                articlePage.setViewport(viewport);
                // articlePage.on('console', msg => {
                //     for (let i = 0; i < msg.args.length; ++i)
                //         console.log(`${i}: ${msg.args[i]}`);
                // });
                await articlePage.goto(`${BASE_URL}/${article.href}`, {
                    timeout: 0
                });
                await articlePage.waitForSelector('.article-detail');
                await articlePage.$eval('body', body => {
                    body.querySelector('.layout-head').style.display = 'none';
                    body.querySelector('.book-page .side').style.display = 'none';
                    body.querySelector('#footer').style.display = 'none';
                    body.querySelector('#toTop').style.display = 'none';
                    Promise.resolve();
                });
                const dirPath = `${saveDir}/${bookTitle}`;
                const fileName = `${article.title.replace(/\//g, '、')}.pdf`;
                const filePath = `${dirPath}/${fileName}`;
                mkdirp.sync(dirPath);

                if (fs.existsSync(filePath)) {
                    console.log(`章节已存在，跳过: ${filePath}`);
                } else {
                    await page.emulateMedia('screen');
                    await articlePage.pdf({
                        path: filePath,
                        format: 'A4'
                    });
                    console.log(`保存章节成功: ${filePath}`);
                }

                await articlePage.waitForSelector('.book-nav');
                const sections = await articlePage.$eval('.book-nav', element => {
                   const liHTMLCollection = element.querySelectorAll('li');
                   const liElementArray = Array.prototype.slice.call(liHTMLCollection);
                   const sectionsElementArray = liElementArray.filter(li => {
                       return li.getAttribute('style') === 'text-indent: 1em';
                   });
                   const sections = sectionsElementArray.map(item => {
                       const a = item.querySelector('a');
                       return {
                           href: a.getAttribute('href'),
                           title: a.innerText.trim(),
                       };
                   });
                   return sections;
                });
                if (sections.length) {
                    for (let section of sections) {
                        const sectionPage = await browser.newPage();
                        sectionPage.setViewport(viewport);
                        await sectionPage.goto(`${BASE_URL}/${section.href}`, {
                            timeout: 0
                        });
                        await sectionPage.waitForSelector('.article-detail');
                        await sectionPage.$eval('body', body => {
                            body.querySelector('.layout-head').style.display = 'none';
                            body.querySelector('.book-page .side').style.display = 'none';
                            body.querySelector('#footer').style.display = 'none';
                            body.querySelector('#toTop').style.display = 'none';
                            Promise.resolve();
                        });
                        const dirPath = `${saveDir}/${bookTitle}`;
                        const fileName = `${article.title.replace(/\//g, '、')}-${section.title.replace(/\//g, '、')}.pdf`;
                        const filePath = `${dirPath}/${fileName}`;
                        mkdirp.sync(dirPath);

                        if (fs.existsSync(filePath)) {
                            console.log(`子章节已存在，跳过: ${filePath}`);
                        } else {
                            await page.emulateMedia('screen');
                            await sectionPage.pdf({
                                path: filePath,
                                format: 'A4'
                            });
                            console.log(`保存子章节成功: ${filePath}`);
                        }
                    }
                }

                articlePage.close();
            }
        }

        browser.close();
    } catch (e) {
        console.error(e);
    }
};

if (require.main) {
    const USER = process.argv[2];
    const PASSWORD = process.argv[3];
    const SAVE_DIR = process.argv[4];
    const BOOK_URLS = process.argv.slice(5);
    if (!USER || !PASSWORD) {
        console.log('无效账号明或密码');
        process.exit();
    }
    downloadIturingBooks(USER, PASSWORD, SAVE_DIR, BOOK_URLS);
}

module.exports = downloadIturingBooks;




