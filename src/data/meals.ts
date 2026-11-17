import type { MealOption } from '@/types';

/** Sentinel option id for "no meal"; stored on a passenger as `mealId: null`. */
export const NO_MEAL_ID = 'no-meal';

export const MEAL_OPTIONS: readonly MealOption[] = [
  {
    id: NO_MEAL_ID,
    name: 'No meal',
    description: 'Skip the meal for this flight.',
    price: 0,
    isVeg: true,
  },
  {
    id: 'veg-sandwich',
    name: 'Standard Veg Sandwich',
    description: 'Grilled vegetables and cheese on multigrain bread.',
    price: 0,
    isVeg: true,
  },
  {
    id: 'paneer-wrap',
    name: 'Paneer Tikka Wrap',
    description: 'Tandoori paneer, mint chutney and crunchy onions.',
    price: 300,
    isVeg: true,
  },
  {
    id: 'chicken-biryani',
    name: 'Chicken Biryani',
    description: 'Slow-cooked basmati rice with spiced chicken and raita.',
    price: 400,
    isVeg: false,
  },
  {
    id: 'fruit-yogurt',
    name: 'Fruit & Yogurt Bowl',
    description: 'Seasonal fruit with creamy yogurt and granola.',
    price: 200,
    isVeg: true,
  },
  {
    id: 'jain-meal',
    name: 'Jain Meal',
    description: 'Prepared without onion, garlic or root vegetables.',
    price: 250,
    isVeg: true,
  },
];
