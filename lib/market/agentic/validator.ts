export class ExtractionValidator {
  async validate(
    extractedData: any,
    schema: any
  ): Promise<{ isValid: boolean; cleanedData?: any; errors?: string[] }> {
    const errors: string[] = [];

    if (!extractedData || Object.keys(extractedData).length === 0) {
      return { isValid: false, errors: ['Extracted data is empty or null'] };
    }

    for (const [key, type] of Object.entries(schema)) {
      if (extractedData[key] === undefined) {
        if (type !== 'optional') {
          errors.push(`Missing required field: ${key}`);
        }
      } else {
        if (typeof extractedData[key] !== type && type !== 'optional') {
          errors.push(`Type mismatch on ${key}. Expected ${type}, got ${typeof extractedData[key]}`);
        }
      }
    }

    if (extractedData.hourly_price && extractedData.hourly_price > 10000) {
      errors.push(`Sanity check failed: hourly_price suspiciously high ($${extractedData.hourly_price})`);
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return { isValid: true, cleanedData: this.cleanseData(extractedData) };
  }

  private cleanseData(data: any): any {
    const cleaned = { ...data };
    if (typeof cleaned.price === 'string') {
      cleaned.price = parseFloat(cleaned.price.replace(/[^0-9.-]+/g, ''));
    }
    return cleaned;
  }
}
