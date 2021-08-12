// Sourced from: https://www.contentful.com/blog/2021/03/17/puppeteer-node-open-graph-screenshot-for-socials/

const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const exePath =
  process.platform === 'linux'
    ? '/usr/bin/google-chrome'
    : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

let PAGE;

async function getOptions(isDev) {
  if (isDev) {
    return {
      args: [],
      executablePath: exePath,
      headless: true,
    };
  }

  return {
    args: chrome.args,
    executablePath: await chrome.executablePath,
    headless: chrome.headless,
  };
}

async function getPage(isDev = false) {
  if (PAGE) {
    return PAGE;
  }

  const options = await getOptions(isDev);
  const browser = await puppeteer.launch(options);
  PAGE = await browser.newPage();
  return PAGE;
}

module.exports = async (request, response) => {
  const isDev = request.query.isDev === 'true';
  const pageToScreenshot = request.query.page;

  if (!isDev && !pageToScreenshot.startsWith('https://ianmitchell.dev')) {
    response.statusCode = 400;
    response.json({
      error: 'Please use your own service',
    });
  }

  try {
    const page = await getPage(isDev);

    await page.setViewport({
      width: 1200,
      height: 628,
      deviceScaleFactor: 1,
    });

    await page.goto(pageToScreenshot);

    const file = await page.screenshot({
      type: 'png',
    });

    response.statusCode = 200;
    response.setHeader('Content-Type', `image/png`);
    response.setHeader(
      'Cache-Control',
      `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`
    );
    response.end(file);
  } catch (error) {
    response.statusCode = 500;
    response.json({
      error: error.message,
    });
  }
};
