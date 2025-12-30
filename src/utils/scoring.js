import prendas from '../data/prendas.json';

export function getPrenda(score) {
    let candidates = [];
    if (score < 30) {
        // Punishments: Drink Shot
        candidates = prendas.filter(p => [1, 8, 9, 10, 6].includes(p.id));
    } else if (score < 60) {
        // Challenges: Dance, Accent, Language
        candidates = prendas.filter(p => [14, 15, 16].includes(p.id));
    } else if (score < 85) {
        // Good / Neutral: Nothing happens or Drink for someone
        candidates = prendas.filter(p => [11, 7].includes(p.id));
    } else {
        // Excellent: Legend, Choose someone to drink
        candidates = prendas.filter(p => [2, 3, 4, 5, 12, 13, 19].includes(p.id));
    }

    if (candidates.length === 0) return prendas[0];

    return candidates[Math.floor(Math.random() * candidates.length)];
}
