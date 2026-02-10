export interface RatingChange {
    old: number;
    new: number;
}

export interface RatingChanges {
    white: RatingChange;
    black: RatingChange;
}
