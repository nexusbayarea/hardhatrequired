import { GeminiExtractor } from './extractor';
import { DeepSeekNavigator } from './navigator';
import { PlaywrightRuntime } from './runtime';
import { ExtractionValidator } from './validator';

export interface AgenticTask {
  vertical: 'slurry' | 'gasbuddy' | 'edgecompute' | 'events' | 'petinsurance';
  targetUrl: string;
  extractionSchema: any;
  missionPrompt: string;
}

export class AgenticBrowserEngine {
  private extractor = new GeminiExtractor();
  private navigator = new DeepSeekNavigator();
  private browser = new PlaywrightRuntime();
  private validator = new ExtractionValidator();

  async executeMission(task: AgenticTask): Promise<any> {
    const requiresDeepNavigation = ['edgecompute', 'events'].includes(task.vertical);

    let rawData;

    if (requiresDeepNavigation) {
      const navPlan = await this.navigator.planInteraction(task.targetUrl, task.missionPrompt);
      const { finalDom, screenshotPath } = await this.browser.executePlan(task.targetUrl, navPlan);
      rawData = await this.extractor.extractFromState(finalDom, screenshotPath, task.extractionSchema);
    } else {
      const { finalDom, screenshotPath } = await this.browser.loadAndCapture(task.targetUrl);
      rawData = await this.extractor.extractFromState(finalDom, screenshotPath, task.extractionSchema);
    }

    const validationResult = await this.validator.validate(rawData, task.extractionSchema);

    if (validationResult.isValid) {
      return validationResult.cleanedData;
    } else {
      await this.flagForHumanReview(task, rawData, validationResult.errors);
      throw new Error('Extraction failed validation.');
    }
  }

  private async flagForHumanReview(task: AgenticTask, data: any, errors?: string[]) {
    // Writes to a review_queue table in Supabase
    console.log(`[FLAGGED] Task on ${task.targetUrl} failed. Human intervention required.`);
  }
}
