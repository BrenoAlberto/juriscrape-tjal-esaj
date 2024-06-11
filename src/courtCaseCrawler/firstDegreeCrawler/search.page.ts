import { type Page } from '@juriscrape/driver'
import { logger } from '@juriscrape/common'

export class FirstDegreeSearchPage {
  private readonly url = 'https://www2.tjal.jus.br/cpopg/open.do'

  private readonly elementsCSSSelectors = {
    inputCaseNumber: '#numeroDigitoAnoUnificado',
    searchButton: '#botaoConsultarProcessos',
    inputOriginNumber: '#foroNumeroUnificado'
  }

  constructor (private readonly page: Page) { }

  public async goToCase (processNumber: string, originNumber: string): Promise<void> {
    logger.info(`Going to case ${processNumber}`)
    await this.ensureIsInSearchPage()

    logger.info(`Typing case number ${processNumber}`)
    await this.page.type(this.elementsCSSSelectors.inputCaseNumber, processNumber)
    logger.info(`Typing origin number ${originNumber}`)
    await this.page.type(this.elementsCSSSelectors.inputOriginNumber, originNumber)

    logger.info('Clicking search button')
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      this.page.click(this.elementsCSSSelectors.searchButton)
    ])
  }

  private async ensureIsInSearchPage (): Promise<void> {
    logger.info('Ensuring is in first degree search page')
    if (!this.page.url().startsWith(this.url)) {
      await this.page.goto(this.url)
    }
  }
}
