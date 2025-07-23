export interface ParsedBusiness {
  name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  category: string;
  rating: number;
  priceRange: string;
  latitude?: number;
  longitude?: number;
  confidence: number;
  dateAdded: string;
}

export interface ValidationRule {
  field: keyof ParsedBusiness;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  errorMessage: string;
}

export class DataValidator {
  private rules: ValidationRule[] = [
    {
      field: 'name',
      required: true,
      minLength: 2,
      maxLength: 100,
      errorMessage: 'Business name must be between 2 and 100 characters'
    },
    {
      field: 'phone',
      pattern: /^(\+27|0)[1-9]\d{8}$/,
      errorMessage: 'Phone number must be a valid South African number'
    },
    {
      field: 'email',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      errorMessage: 'Email must be a valid email address'
    },
    {
      field: 'website',
      customValidator: (value: string) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      errorMessage: 'Website must be a valid URL'
    },
    {
      field: 'rating',
      customValidator: (value: number) => value >= 0 && value <= 5,
      errorMessage: 'Rating must be between 0 and 5'
    }
  ];

  public validateBusiness(business: ParsedBusiness): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of this.rules) {
      const value = business[rule.field];
      
      // Check if required field is missing
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors.push(rule.errorMessage);
        continue;
      }

      // Skip validation if field is empty and not required
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        continue;
      }

      // Check string length
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(rule.errorMessage);
          continue;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(rule.errorMessage);
          continue;
        }
      }

      // Check pattern
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(rule.errorMessage);
        continue;
      }

      // Check custom validator
      if (rule.customValidator && !rule.customValidator(value)) {
        errors.push(rule.errorMessage);
        continue;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public validateBatch(businesses: ParsedBusiness[]): { valid: ParsedBusiness[]; invalid: Array<{ business: ParsedBusiness; errors: string[] }> } {
    const valid: ParsedBusiness[] = [];
    const invalid: Array<{ business: ParsedBusiness; errors: string[] }> = [];

    for (const business of businesses) {
      const validation = this.validateBusiness(business);
      if (validation.isValid) {
        valid.push(business);
      } else {
        invalid.push({ business, errors: validation.errors });
      }
    }

    return { valid, invalid };
  }
}