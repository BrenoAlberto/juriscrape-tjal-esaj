import { FirstDegreeCaseCrawler } from './firstDegreeCrawler/crawler'
import { SecondDegreeCaseCrawler } from './secondDegreeCrawler/crawler'
import { type PageManager, type PreloadedPageManager } from '@juriscrape/driver'
import { type CourtCaseModel } from '@juriscrape/common'

export class GetCourtCase {
  private constructor (
    private readonly firstDegreeCaseCrawler: FirstDegreeCaseCrawler,
    private readonly secondDegreeCaseCrawler: SecondDegreeCaseCrawler
  ) { }

  public async execute (caseNumber: string, processNumber: string, originNumber: string): Promise<CourtCaseModel> {
    const [firstDegreeData, secondDegreeData] = await Promise.all([
      this.firstDegreeCaseCrawler.scrapeCase(caseNumber, processNumber, originNumber),
      this.secondDegreeCaseCrawler.scrapeCase(caseNumber, processNumber)
    ])

    return {
      caseNumber,
      firstDegreeCaseData: firstDegreeData,
      secondDegreeCaseData: secondDegreeData,
      crawlStatus: 'available'
    }
  }

  public static async create (pageManager: PageManager, preloadedPageManager: PreloadedPageManager): Promise<GetCourtCase> {
    const firstDegreeCaseCrawler = await FirstDegreeCaseCrawler.create(preloadedPageManager)
    const secondDegreeCaseCrawler = await SecondDegreeCaseCrawler.create(pageManager)
    return new GetCourtCase(firstDegreeCaseCrawler, secondDegreeCaseCrawler)
  }
}
