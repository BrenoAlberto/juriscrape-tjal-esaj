import { SecondDegreeCasePage } from './case.page'
import { SecondDegreeSearchPage } from './search.page'
import { type PageManager, type Page } from '@juriscrape/driver'
import { logger, type CourtCrawler } from '@juriscrape/common'

export class SecondDegreeCaseCrawler implements CourtCrawler {
  private secondDegreeSearchPage: SecondDegreeSearchPage | undefined
  private secondDegreeCasePage: SecondDegreeCasePage | undefined
  private page: Page | undefined

  private constructor (
    private readonly pageManager: PageManager
  ) { }

  private async init (): Promise<void> {
    this.page = await this.pageManager.acquirePage()
    this.secondDegreeSearchPage = new SecondDegreeSearchPage(this.page)
    this.secondDegreeCasePage = new SecondDegreeCasePage(this.page)
  }

  private releasePage (): void {
    if (!this.page) return
    void this.pageManager.releasePage(this.page)
    this.page = undefined
  }

  private ensurePageIsInitialized (): void {
    if (!this.page) {
      throw new Error('SecondDegreeCaseCrawler instance is not initialized. Call init before using it.')
    }
  }

  public async scrapeCase (caseNumber: string, processNumber: string): Promise<any> {
    this.ensurePageIsInitialized()
    const startPerf = performance.now()
    try {
      const caseURL = await this.secondDegreeSearchPage!.fetchCaseURL(caseNumber, processNumber)
      const caseData = await this.secondDegreeCasePage!.fetchCaseData(caseURL, caseNumber)
      const endPerf = performance.now()
      logger.info(`Case ${caseNumber} took ${(endPerf - startPerf) / 1000} seconds to scrape.`)
      this.releasePage()
      return caseData
    } catch (error) {
      const endPerf = performance.now()
      logger.info(`Case ${processNumber} took ${(endPerf - startPerf) / 1000} seconds to scrape - NO DATA.`)
      this.releasePage()
    }
  }

  public static async create (pageManager: PageManager): Promise<SecondDegreeCaseCrawler> {
    const crawler = new SecondDegreeCaseCrawler(pageManager)
    await crawler.init()
    return crawler
  }
}
