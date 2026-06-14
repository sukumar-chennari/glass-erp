/**
 * Shared domain union types used across multiple entity models.
 * Define here once — import into model files and re-export for backwards
 * compatibility. Select option arrays live in constants/options.ts.
 */

export type GlassPosition =
  | 'Front Windshield'
  | 'Rear Windshield'
  | 'Driver Side Window'
  | 'Passenger Side Window'
  | 'Rear Left Window'
  | 'Rear Right Window'
  | 'Sunroof Glass'
  | 'Quarter Glass';

export type PaymentType = 'Cash' | 'Insurance' | 'Card' | 'UPI';

export type DamageType =
  | 'Crack'
  | 'Chip / Stone Impact'
  | 'Complete Shatter'
  | 'Scratch'
  | 'Stress Fracture';

export type Insurer =
  | 'New India Assurance'
  | 'ICICI Lombard'
  | 'HDFC ERGO'
  | 'Bajaj Allianz'
  | 'United India Insurance'
  | 'National Insurance'
  | 'Oriental Insurance'
  | 'Other';
