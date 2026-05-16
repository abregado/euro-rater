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

// Running order for the Eurovision 2026 Grand Final (Vienna)
export const COUNTRIES: CountryPrototype[] = [
  { id: 'dk', name: 'Denmark',        song: 'Før vi går hjem',  artist: 'Søren Torpegaard Lund' },
  { id: 'de', name: 'Germany',        song: 'Fire',             artist: 'Sarah Engels' },
  { id: 'il', name: 'Israel',         song: 'Michelle',         artist: 'Noam Bettan' },
  { id: 'be', name: 'Belgium',        song: 'Dancing on the Ice', artist: 'Essyla' },
  { id: 'al', name: 'Albania',        song: 'Nân',              artist: 'Alis' },
  { id: 'gr', name: 'Greece',         song: 'Ferto',            artist: 'Akylas' },
  { id: 'ua', name: 'Ukraine',        song: 'Ridnym',           artist: 'Leléka' },
  { id: 'au', name: 'Australia',      song: 'Eclipse',          artist: 'Delta Goodrem' },
  { id: 'rs', name: 'Serbia',         song: 'Kraj mene',        artist: 'Lavina' },
  { id: 'mt', name: 'Malta',          song: 'Bella',            artist: 'Aidan' },
  { id: 'cz', name: 'Czechia',        song: 'Crossroads',       artist: 'Daniel Zîžka' },
  { id: 'bg', name: 'Bulgaria',       song: 'Bangaranga',       artist: 'Dara' },
  { id: 'hr', name: 'Croatia',        song: 'Andromeda',        artist: 'Lelek' },
  { id: 'gb', name: 'United Kingdom', song: 'Eins, Zwei, Drei', artist: 'Look Mum No Computer' },
  { id: 'fr', name: 'France',         song: 'Regarde !',        artist: 'Monroe' },
  { id: 'md', name: 'Moldova',        song: 'Viva, Moldova',    artist: 'Satoshi' },
  { id: 'fi', name: 'Finland',        song: 'Liekinheitin',     artist: 'Lampenius & Parkkonen' },
  { id: 'pl', name: 'Poland',         song: 'Pray',             artist: 'Alicja' },
  { id: 'lt', name: 'Lithuania',      song: 'Sólo quiero más',  artist: 'Lion Ceccah' },
  { id: 'se', name: 'Sweden',         song: 'My System',        artist: 'Felicia' },
  { id: 'cy', name: 'Cyprus',         song: 'Jalla',            artist: 'Antigoni' },
  { id: 'it', name: 'Italy',          song: 'Per sempre sì',    artist: 'Sal Da Vinci' },
  { id: 'no', name: 'Norway',         song: 'Ya ya ya',         artist: 'Jonas Lovv' },
  { id: 'ro', name: 'Romania',        song: 'Choke Me',         artist: 'Alexandra Căpitănescu' },
  { id: 'at', name: 'Austria',        song: 'Tanzschein',       artist: 'Cosmo' },
];

export const RATING_FIELDS: RatingField[] = [
  { id: 'vocals', label: 'Vocals' },
];
