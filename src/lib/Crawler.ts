import request from 'request';
import { load } from 'cheerio';
import URL from 'url-parse';
import _ from 'lodash';

/**
 * Simple Crawler Written in JavaScript
 */
class Crawler {

  /**
   * Maximum Visit per run
   */
  private maxVisit: number;

  /**
   * Current Visit count
   */
  private visitCount: number = 0;

  /**
   * Pages Pending to visit
   */
  private pagesToVisit: Array<string> = [];

  /**
   * Pages already visited
   */
  private pagesVisited: Array<string> = [];

  /**
   * Base URL of Site
   */
  private baseUrl: string;

  /**
   * Don't crawl this sites
   */
  private blackListedDomains = ['google', 'youtube', 'facebook', 'twitter'];

  /**
   * Search only for whitelisted domain
   */
  private whiteListedDomains = [];

  /**
   * Delay every request to prevent spamming
   */
  private requestDelay = 500;
  
  /**
   * Constructor
   * @param url Site URL to be crawled
   */
  constructor() {
    // Set base url as first page
    this.baseUrl = process.env.TARGET;
    this.maxVisit = parseInt(process.env.MAX_ALLOWED_VISIT);
    this.requestDelay = parseInt(process.env.REQUEST_DELAY);
    this.pagesToVisit.push(this.baseUrl);

    console.log(`Target: ${this.baseUrl}`);
    console.log(`Max Allowed Visit: ${this.maxVisit}`);
  }

  /**
   * Crawl pages
   */
  public async crawl(): Promise<void> {

    // Check if reached maxVisit
    if (this.visitCount >= this.maxVisit) {
      console.log(this.pagesVisited);
      console.log('Crawling finished...');
      process.exit();
      return;
    }

    // Start Crawling
    const nextPage = this.pagesToVisit.pop();

    // Check for next page
    if (!nextPage) return;

    // Check if trying to crawl same page
    if (_.includes(this.pagesVisited, nextPage)) {
      this.crawl();
    } else {
      this.visit(nextPage);
    }
  }

  /**
   * 
   * @param url Path you want to visit
   */
  public async visit(url: string): Promise<void> {

    // Increment visit count
    this.visitCount++;

    // Push URL to visited pages
    this.pagesVisited.push(url);

    // Do Page request
    await this.requestPage(url);

    // recurs crawl again
    await this.crawl();
  }

  /**
   * Request Page
   * @param url To be requested URL
   */
  public async requestPage(url: string): Promise<any> {
    console.log(`Requesting ${url}`);

    // Do request with delay
    return new Promise((resolve, reject) => {
      setTimeout(()=> {
        request(url, async (err, response, body) => {
          if (err) resolve();
          if (!body) return resolve()
          const parsedBody = load(body);

          /**
           * Any Logic you want to do in the body
           */

          await this.collectLinks(parsedBody);
          resolve();
        });
      }, this.requestDelay);
    });
  }

  /**
   * Register Links in the Body
   * @param parsedBody 
   */
  public async collectLinks(parsedBody: any): Promise<void> {
    try {
      let gatheredLinks = parsedBody(`a`);
      _.each(gatheredLinks, (link) => {
        const linkHref = link.attribs.href;
        let allowed = true;
        if (!linkHref) return;

        // Check if already on visited domains
        if (_.includes(this.pagesVisited, linkHref)) return;

        // Check if aleardy on pages to be visited
        if (_.includes(this.pagesToVisit, linkHref)) return;
        
        // Blacklisted Domains
        _.each(this.blackListedDomains, (domain) => {
          if (linkHref.indexOf(domain) > -1) allowed = false;
        });

        // Whitelisted Domains
        _.each(this.whiteListedDomains, (domain) => {
          if (linkHref.indexOf(domain) > -1) {
            if (allowed) this.pagesToVisit.push(linkHref);
          }
        });
        
      });
    } catch(err) {
      console.log(err);
    }
  }
}

export default Crawler;
