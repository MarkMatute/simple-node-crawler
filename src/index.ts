import Crawler from './lib/Crawler';
import dotenv from 'dotenv';
dotenv.config();

const crawler = new Crawler();

(async () => {
  await crawler.crawl();
  console.log('Crawling....');
})();