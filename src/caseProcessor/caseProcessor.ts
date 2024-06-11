import { GetCourtCase } from '../courtCaseCrawler/getCourtCase'
import { logger, concurrentTaskQueue, type Court, type CourtCaseModel } from '@juriscrape/common'
import { type PageManager, type PreloadedPageManager } from '@juriscrape/driver'
import { generalSettings } from '../setup'

export interface CrawlCourtCase {
  caseNumber: string
  processNumber: string
  originNumber: string
  court: Court
}

export class CourtCaseProcessor {
  private readonly courtCaseQueue: CrawlCourtCase[] = []
  private readonly processedCourtCases: CourtCaseModel[] = []
  private readonly workerLimit = generalSettings.backgroundQueueCrawlLimit
  private readonly concurrencyLimit = generalSettings.backgroundConcurrencyCrawlLimit
  private readonly delay = generalSettings.emptyQueueDelay
  private isProcessing = false
  private intervalId?: NodeJS.Timeout

  constructor (
    private readonly pageManager: PageManager,
    private readonly preloadedPageManager: PreloadedPageManager
  ) { }

  public async startProcessing (): Promise<void> {
    this.isProcessing = true
    this.intervalId = setInterval(async () => { await this.sendProcessedCourtCases() }, generalSettings.saveProcessedCasesInterval) // Sends the processed court cases every 10 seconds to the API
    logger.info('Processing court cases with the following settings:')
    logger.info(JSON.stringify({
      workerLimit: this.workerLimit,
      concurrencyLimit: this.concurrencyLimit,
      delay: this.delay,
      queueSize: this.courtCaseQueue.length
    }))
    while (this.isProcessing && this.courtCaseQueue.length < this.workerLimit) {
      try {
        await this.processCourtCases()
      } catch (error) {
        logger.error('Error during court case processing', error)
      }
    }
  }

  public stopProcessing (): void {
    logger.info('Stopping court case processing')
    this.isProcessing = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  public addCourtCases (courtCases: CrawlCourtCase[]): void {
    logger.info(`Adding ${courtCases.length} court cases to the queue`)
    this.courtCaseQueue.push(...courtCases)
  }

  private async sendProcessedCourtCases (): Promise<void> {
    if (this.processedCourtCases.length > 0) {
      const casesToSend = this.processedCourtCases.splice(0, this.processedCourtCases.length)

      logger.info(`Sending ${casesToSend.length} processed court cases`)

      try {
        const promises: Array<() => Promise<void>> = []
        for (const caseToSend of casesToSend) {
          promises.push(async () => {
            await fetch(`${process.env.TJ_API_URL!}/insert-court-cases`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify([caseToSend])
            })
          })
        }
        await concurrentTaskQueue(promises, generalSettings.saveProcessedCasesConcurrencyLimit)
      } catch (error) {
        logger.error('Failed to send processed court cases: ', error)
        this.processedCourtCases.unshift(...casesToSend)
      }
    }
  }

  private async processCourtCases (): Promise<void> {
    if (this.courtCaseQueue.length > 0) {
      logger.info(`In queue: ${this.courtCaseQueue.length} court cases`)
      logger.info(`Processing up to ${this.workerLimit} court cases`)
      const tasks = this.courtCaseQueue.splice(0, this.workerLimit).map(courtCase =>
        async () => {
          try {
            const getCourtCase = await GetCourtCase.create(
              this.pageManager,
              this.preloadedPageManager
            )
            this.processedCourtCases.push(await getCourtCase.execute(courtCase.caseNumber, courtCase.processNumber, courtCase.originNumber))
          } catch (error) {
            logger.error('Failed to get court case: ', error)
            this.processedCourtCases.push({
              caseNumber: courtCase.caseNumber,
              crawlStatus: 'failed'
            })
          }
        }
      )
      await concurrentTaskQueue(tasks, this.concurrencyLimit)
    } else {
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }
  }
}
