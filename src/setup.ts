export const generalSettings = {
  backgroundQueueCrawlLimit: 1000,
  backgroundConcurrencyCrawlLimit: 10, // Careful with rate limiting
  saveProcessedCasesInterval: 3000,
  saveProcessedCasesConcurrencyLimit: 5,
  preloadedEmptyPages: 1, // Careful with CPU and memory usage
  preloadedPagesPerCourt: 1, // Careful with CPU and memory usage
  emptyQueueDelay: 2000
}

/**
 * It's a good idea to keep backgroundConcurrencyCrawlLimit, preloadedEmptyPages and preloadedPagesPerCourt in sync
 * as if there are no preloaded pages, new pages will be created at crawl time which probably will be slower than preloading.
 */
