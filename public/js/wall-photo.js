/** Wall paintings: open the supplied memory in a native accessible lightbox.
 * The three buttons are positioned against the fixed 1536x1024 source image.
 */
export function setupWallPhoto({root=document}={}) {
  const modal=root.getElementById('photo-modal');
  const closeButton=root.getElementById('photo-close');
  const paintings=[...root.querySelectorAll('.picture-hotspot')];
  if(!modal || !closeButton || paintings.length!==3) return;
  let lastFocused=null;
  const photo=modal.querySelector('img.photo-full');
  function openPhoto(event){
    lastFocused=event.currentTarget;
    // Load the full photo only when the user actually opens a wall frame.
    if(photo?.dataset.src && !photo.hasAttribute('src')){photo.src=photo.dataset.src;photo.removeAttribute('data-src');}
    if(!modal.open){modal.showModal();closeButton.focus();}
  }
  paintings.forEach(painting=>painting.addEventListener('click',openPhoto));
  closeButton.addEventListener('click',()=>modal.close());
  // A click outside the card closes the modal; clicks on the image don't.
  modal.addEventListener('click',event=>{if(event.target===modal)modal.close();});
  modal.addEventListener('close',()=>{lastFocused?.focus({preventScroll:true});});
}
