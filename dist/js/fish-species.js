/** Alpha 08 — art-directed marine-fantasy roster.
 * Behavior presets are deterministic rules, not biological claims.
 * Size values refer to the base canvas (1536×1024).
 */
export const SPECIES = Object.freeze({
  chromis: { id:'chromis', label:'Cá thia xanh', behavior:'school', weight:0.38, size:[9,13], speed:32, turn:44, depth:['back','mid'], colors:['#55bfd2','#66d4c4','#5ea6dc'] },
  clown:  { id:'clown', label:'Cá hề', behavior:'cruise', weight:0.22, size:[14,19], speed:24, turn:33, depth:['mid','front'], colors:['#f28d3f','#ff9f4c'] },
  yellow: { id:'yellow', label:'Cá đuôi gai vàng', behavior:'cruise', weight:0.14, size:[16,21], speed:26, turn:28, depth:['mid','front'], colors:['#f3d447','#f9bb45'] },
  blue:   { id:'blue', label:'Cá đuôi gai xanh', behavior:'cruise', weight:0.12, size:[18,23], speed:28, turn:29, depth:['mid','front'], colors:['#2772d9','#337ede'] },
  goby:   { id:'goby', label:'Cá bống cát', behavior:'bottom', weight:0.14, size:[12,17], speed:15, turn:32, depth:['mid','front'], colors:['#d6b68d','#d8c59c'] },
});
export const SPECIES_KEYS=Object.freeze(Object.keys(SPECIES));
export const DEPTH_ORDER=Object.freeze(['back','mid','front']);
export const FUTURE_ROSTER=Object.freeze({ crabs:2, shrimps:4, snails:3, turtles:1 });
