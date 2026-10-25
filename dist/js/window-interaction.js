/** One interaction path for the on-scene window and the existing toolbar control.
 * Keeping both wired to the same callback guarantees identical state and audio.
 */
export function setupWindowInteraction({root=document,onToggle}) {
  const hotspot=root.getElementById('window-hotspot');
  const toolbar=root.getElementById('window-toggle');
  if (!hotspot || !toolbar || typeof onToggle!=='function') {
    throw new Error('Thiếu vùng cửa sổ, nút mở cửa hoặc hàm chuyển trạng thái');
  }
  const handleClick=event=>{
    event?.stopPropagation?.();
    onToggle();
  };
  hotspot.addEventListener('click',handleClick);
  toolbar.addEventListener('click',handleClick);
  return function syncWindowInteraction(isOpen) {
    const action=isOpen?'Đóng':'Mở';
    hotspot.setAttribute('aria-label',`${action} cửa sổ`);
    hotspot.setAttribute('aria-pressed',String(Boolean(isOpen)));
    hotspot.setAttribute('title',`Nhấp để ${action.toLowerCase()} cửa sổ`);
    hotspot.setAttribute('data-hint',`Nhấp để ${action.toLowerCase()} cửa`);
    toolbar.setAttribute('aria-pressed',String(Boolean(isOpen)));
  };
}
