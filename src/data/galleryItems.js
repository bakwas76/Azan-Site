// Put this file at: src/data/galleryItems.js
// Images are looked up by file name from E:\azan-site\Assests\images (01.jpg ... 60.jpg)
const urls = import.meta.glob("../../Assests/images/*.{jpg,jpeg,png}", {
  eager: true,
  query: "?url",
  import: "default",
});
const url = (n) => urls[`../../Assests/images/${n}.jpg`];

// [file, category, caption, size]
// category: Match | Training | Moments      size: normal | wide | tall
// Duplicates are left out on purpose: 15 44 28 29 60 40 52 37 23 43 41 59 36 56 47 49
const RAW = [
  // ---- Match: play ----
  ["04", "Match", "Referee and defenders", "normal"],
  ["05", "Match", "SAFF U19 Championship", "normal"],
  ["06", "Match", "Dribble past the press", "normal"],
  ["08", "Match", "Tense moment after the whistle", "normal"],
  ["09", "Match", "Teams lined up", "wide"],
  ["10", "Match", "Contest for the ball", "normal"],
  ["11", "Match", "Midfield battle", "normal"],
  ["14", "Match", "Chasing the ball", "normal"],
  ["17", "Match", "Driving forward", "normal"],
  ["18", "Match", "Pressing the winger", "normal"],
  ["21", "Match", "Opposition on the attack", "normal"],
  ["24", "Match", "Squads face to face", "wide"],
  ["25", "Match", "Carrying the ball", "normal"],
  ["30", "Match", "Teammate on the run", "normal"],
  ["32", "Match", "Going for the tackle", "normal"],
  ["34", "Match", "Skipping the challenge", "normal"],
  ["35", "Match", "Under the floodlights", "normal"],
  ["38", "Match", "Reading the play", "normal"],
  ["42", "Match", "Open play", "wide"],
  ["46", "Match", "Shoulder to shoulder", "normal"],
  ["51", "Match", "Clearing the danger", "normal"],
  ["54", "Match", "Shielding the ball", "normal"],
  ["55", "Match", "Eyes on the ball", "normal"],
  ["57", "Match", "Scramble in the box", "normal"],
  // ---- Match: line-ups and anthem ----
  ["02", "Match", "National anthem", "wide"],
  ["07", "Match", "Starting eleven", "wide"],
  ["12", "Match", "Team photo", "wide"],
  ["16", "Match", "Anthem line-up", "wide"],
  ["20", "Match", "Team photo", "wide"],
  ["22", "Match", "Pre-match squad", "wide"],
  ["27", "Match", "White kit squad", "wide"],
  ["33", "Match", "Squad portrait", "wide"],
  ["13", "Match", "Officials at the centre circle", "wide"],
  ["26", "Match", "Touchline reaction", "wide"],
  // ---- Training: no clear training photos in the set, check these two ----
  ["53", "Training", "Walking the pitch", "tall"],
  ["58", "Training", "Words from the coach", "tall"],
  // ---- Moments: off the pitch ----
  ["01", "Moments", "Quiet time before the game", "tall"],
  ["31", "Moments", "Resting at the hotel", "tall"],
  ["03", "Moments", "First Pakistan shirt", "tall"],
  ["39", "Moments", "Jersey number 6", "tall"],
  ["50", "Moments", "Shirt in the dressing room", "tall"],
  ["19", "Moments", "Squad travel day", "tall"],
  ["45", "Moments", "Smiles in the dugout", "wide"],
  ["48", "Moments", "Passport and PFF jacket", "tall"],
];

export const galleryItems = RAW.map(([n, category, caption, size]) => ({
  src: url(n),
  alt: `Azan - ${caption}`,
  caption,
  category,
  size,
})).filter((i) => i.src);
export default galleryItems;