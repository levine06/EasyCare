// Shared with FoodTagSelector (meal logging), TodaysFeedback (Home feedback card),
// customTags API (de-dupe), and ManageFoodTagsScreen (default tags list).
export const FOOD_TAGS = ['Whole grains', 'Protein', 'Vegetables', 'Dairy', 'Fruits'];

// Short standalone "why it matters" phrases shown as the secondary line under each
// tag's feedback row in TodaysFeedback.
export const FOOD_TAG_RATIONALE = {
  'Whole grains': 'They give you lasting energy and fiber.',
  Protein: 'They give you muscle repair and lasting fullness.',
  Vegetables: 'They give you fiber, vitamins, and minerals.',
  Dairy: 'They have calcium and vitamin D for strong bones.',
  Fruits: 'They give you vitamins, antioxidants, and natural energy.',
};
