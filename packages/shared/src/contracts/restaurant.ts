export interface RestaurantListItem {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    cuisineTypes: string[];
    ratingFood: number;
    ratingDelivery: number;
    reviewsCount: number;
}