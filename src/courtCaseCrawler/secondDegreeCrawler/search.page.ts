import { type Page } from '@juriscrape/driver'
import { logger } from '@juriscrape/common'

export class SecondDegreeSearchPage {
  private readonly url = 'https://www2.tjal.jus.br/cposg5'

  private readonly elementsCSSSelectors = {
    selectedProcessRadioButton: '#processoSelecionado:nth-child(1)',
    mensagemRetorno: '#mensagemRetorno'
  }

  constructor (private readonly page: Page) { }

  public async fetchCaseURL (caseNumber: string, processNumber: string): Promise<string> {
    logger.info(`Fetching case URL for ${caseNumber}`)
    const url = `${this.url}/search.do?conversationId=&paginaConsulta=0&cbPesquisa=NUMPROC&numeroDigitoAnoUnificado=${processNumber}&foroNumeroUnificado=0001&dePesquisaNuUnificado=${caseNumber}&dePesquisaNuUnificado=UNIFICADO&dePesquisa=&tipoNuProcesso=UNIFICADO`
    await this.page.goto(url, { waitUntil: 'domcontentloaded' })

    await this.ensureNoWarningMessage()

    const selectedProcessRadioButton = await this.page.$(this.elementsCSSSelectors.selectedProcessRadioButton)
    if (selectedProcessRadioButton) {
      const processCode = await selectedProcessRadioButton.evaluate((el) => el.getAttribute('value'))
      return `${this.url}/show.do?processo.codigo=${processCode}`
    } else {
      return this.page.url()
    }
  }

  private async ensureNoWarningMessage (): Promise<void> {
    const warningMessage = await this.page.$(this.elementsCSSSelectors.mensagemRetorno)
    if (warningMessage) {
      const warningMessageText = await warningMessage.evaluate((el) => el.textContent)
      if (warningMessageText?.includes('Não existem informações')) {
        throw new Error('CASE NOT FOUND')
      }
    }
    logger.info('No warning message found')
  }
}
