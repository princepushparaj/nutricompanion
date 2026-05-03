/**
 * Types for the NutriCompanion App
 */

export enum MealType {
  BREAKFAST = 'Breakfast',
  MORNING_SNACK = 'Morning Snack',
  LUNCH = 'Lunch',
  AFTERNOON_SNACK = 'Afternoon Snack',
  DINNER = 'Dinner',
  BEFORE_BED = 'Before Bed'
}

export interface DietPlanItem {
  id: string;
  time: string; // e.g., "08:30"
  prepTimeMinutes: number; // For reminders
  type: MealType;
  description: string;
  isOptional?: boolean;
}

export interface DailyLog {
  id: string;
  date: string; // ISO format
  meals: {
    mealId: string;
    logged: boolean;
    timestamp?: string;
    notes?: string;
  }[];
  waterIntakeMl: number;
  waterGoalMl: number;
  weightKg?: number;
}

export interface BiometricLog {
  id: string;
  date: string;
  weight: number;
  waist?: number;
  bmi?: number;
  notes?: string;
}
