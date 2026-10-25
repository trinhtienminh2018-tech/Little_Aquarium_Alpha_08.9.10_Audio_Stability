/** Reef habitat markers in original 1536×1024 artwork coordinates.
 * The habitat anchor is intentionally distinct from the opaque silhouette.
 * Clownfish share coral-like illustrated shelter, not a biological anemone claim.
 */
export const CORAL_SHELTERS=Object.freeze([
  Object.freeze({id:'coral_hide_01',x:1287,y:575,rx:78,ry:62}),
  Object.freeze({id:'coral_02',x:659,y:498,rx:46,ry:28}),
]);
export const CRAB_CORAL=Object.freeze({id:'coral_hide_01',x:1248,y:646,radius:82});
export function nearShelter(entity,shelter,radius=22){
  if(!shelter)return false;
  return Math.hypot(entity.x-shelter.x,entity.y-shelter.y)<=radius;
}
export function selectFishShelter(fish){
  if(fish.species!=='clown')return null;
  const sorted=[...CORAL_SHELTERS].sort((a,b)=>
    Math.hypot(fish.x-a.x,fish.y-a.y)-Math.hypot(fish.x-b.x,fish.y-b.y));
  const nearest=sorted[0];
  return Math.hypot(fish.x-nearest.x,fish.y-nearest.y)<350?nearest:null;
}
export function crabCoralLift(x){
  const u=Math.max(0,1-Math.abs(x-CRAB_CORAL.x)/CRAB_CORAL.radius);
  return 37*u*u*(3-2*u);
}
