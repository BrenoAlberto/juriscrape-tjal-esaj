import { type Request, type Response } from 'express'

import { type CourtCaseProcessor, type CrawlCourtCase } from '../caseProcessor/caseProcessor'
import { logger } from '@juriscrape/common'

export class CourtCaseCrawlerController {
  constructor (
    private readonly courtCaseProcessor: CourtCaseProcessor
  ) { }

  public async crawlCourtCases (req: Request, res: Response): Promise<Response> {
    try {
      const courtCases: CrawlCourtCase[] = req.body
      this.courtCaseProcessor.addCourtCases(courtCases)
      return res.status(200).send({ message: 'Court cases added to the queue' })
    } catch (error) {
      logger.error(error)
      return res.status(500).send({ message: 'Internal server error' })
    }
  }
}
