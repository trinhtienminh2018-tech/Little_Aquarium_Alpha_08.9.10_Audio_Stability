/** Await decode of exactly the artwork needed for the initial visible frame.
 * No arbitrary timeout: show the room only after artwork + canvas are ready.
 */
export async function waitForDecodedImages(images){
  await Promise.all(Array.from(images,async image=>{
    if(!image)throw new Error('Missing required scene image');
    if(typeof image.decode==='function'){
      await image.decode();
    }else if(!image.complete){
      await new Promise((resolve,reject)=>{
        image.addEventListener('load',resolve,{once:true});
        image.addEventListener('error',()=>reject(new Error('Image load failed: '+image.src)),{once:true});
      });
    }
    if(!image.naturalWidth)throw new Error('Image missing/invalid: '+image.src);
  }));
}

export function getFirstFrameImages(scene,plantSprites,coralSprites){
  const visibleDOM=Array.from(scene.querySelectorAll('img[src]'));
  const moving=[...plantSprites,...coralSprites].map(entry=>entry.image);
  return [...visibleDOM,...moving];
}

export function revealReadyScene(app){
  app.setAttribute('aria-busy','false');
  app.classList.add('scene-ready');
}
