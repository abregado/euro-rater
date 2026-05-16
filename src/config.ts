export interface CountryPrototype {
  id: string;
  name: string;
  song: string;
  artist: string;
}

export interface RatingField {
  id: string;
  label: string;
}

export const RATING_MIN = 0;
export const RATING_MAX = 20;

export const COUNTRIES: CountryPrototype[] = [
  { id: 'ch', name: 'Switzerland', song: 'TBD', artist: 'TBD' },
];

export const RATING_FIELDS: RatingField[] = [
  { id: 'vocals', label: 'Vocals' },
];
