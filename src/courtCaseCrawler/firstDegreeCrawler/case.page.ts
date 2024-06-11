import { type Page, extractElementTextOrNull } from '@juriscrape/driver'

export class FirstDegreeCasePage {
  private readonly elementsCSSSelectors = {
    caseClass: '#classeProcesso',
    area: '#areaProcesso',
    subject: '#assuntoProcesso',
    distributionDate: '#dataHoraDistribuicaoProcesso',
    judge: '#juizProcesso',
    actionValue: '#valorAcaoProcesso',
    partiesTableRows: '#tableTodasPartes tr',
    movementsTableRows: '#tabelaTodasMovimentacoes .containerMovimentacao',

    modalTitulo: '.modalTitulo'
  }

  constructor (private readonly page: Page) { }

  public async fetchCaseData (): Promise<{
    caseClass: string | null
    area: string | null
    subject: string | null
    distributionDate: string | null
    judge: string | null
    actionValue: string | null
    parties: Array<{ type: string, description: string, lawyer?: string }>
    movements: Array<{ date?: string, description?: string, details?: string }>
  }> {
    const [
      caseClass,
      area,
      subject,
      distributionDate,
      judge,
      actionValue,
      parties,
      movements,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _
    ] = await Promise.all([
      extractElementTextOrNull(this.page, this.elementsCSSSelectors.caseClass),
      extractElementTextOrNull(this.page, this.elementsCSSSelectors.area),
      extractElementTextOrNull(this.page, this.elementsCSSSelectors.subject),
      extractElementTextOrNull(this.page, this.elementsCSSSelectors.distributionDate),
      extractElementTextOrNull(this.page, this.elementsCSSSelectors.judge),
      extractElementTextOrNull(this.page, this.elementsCSSSelectors.actionValue),
      this.extractParties(),
      this.extractMovements(),
      this.checkIfNeedsPassword()
    ])

    return {
      caseClass,
      area,
      subject,
      distributionDate,
      judge,
      actionValue,
      parties,
      movements
    }
  }

  private async checkIfNeedsPassword (): Promise<void> {
    const modalText = await extractElementTextOrNull(this.page, this.elementsCSSSelectors.modalTitulo)
    if (modalText === 'Senha do processo') { throw new Error('Needs password') }
  }

  private async extractParties (): Promise<Array<{ type: string, description: string, lawyer?: string }>> {
    return await this.page.$$eval(this.elementsCSSSelectors.partiesTableRows, rows => {
      return Array.from(rows, row => {
        const columns = row.querySelectorAll('td')
        const type = columns[0]?.innerText.trim()
        let description = ''
        let lawyer

        if (columns[1]) {
          const advText = columns[1]?.innerText
          const splitIndex = advText.search(/Advogad[ao]:/i)
          if (splitIndex !== -1) {
            description = advText.slice(0, splitIndex).trim()
            lawyer = advText.slice(splitIndex).replace(/Advogad[ao]:/i, '').trim()
          } else {
            description = advText.trim()
          }
        }
        return { type, description, lawyer }
      })
    })
  }

  private async extractMovements (): Promise<Array<{ date?: string, description?: string, details?: string }>> {
    return await this.page.$$eval(this.elementsCSSSelectors.movementsTableRows, rows => {
      return Array.from(rows, row => {
        const date = row.querySelector('.dataMovimentacao')?.textContent?.trim()
        const description = row.querySelector('.descricaoMovimentacao')?.childNodes[0]?.textContent?.trim()
        const details = row.querySelector('.descricaoMovimentacao span')?.textContent?.trim()
        return { date, description, details }
      })
    })
  }
}
