/** Developer-only visual scene inspector; enable with ?debugLayers=1.
 * Never overrides layer assets, positions or their z-index values.
 * All hide/opacity mutations are local DOM styles and cleared on reset.
 */
export const LAYERS=Object.freeze([
 {id:'outside-current',name:'Cảnh ngoài cửa',owner:'outside / aperture'},
 {id:'lightning-window',name:'Sét ngoài cửa',owner:'storm effect'},
 {id:'room',name:'Căn phòng (đã chứa bể, mèo, cốc)',owner:'static room + aquarium + cat + mug'},
 {id:'window-bars',name:'Thanh cửa di động',owner:'window mullions'},
 {id:'wet-glass',name:'Giọt mưa trên kính',owner:'rain-on-glass'},
 {id:'plant-repair',name:'Nền đã xóa cây 01',owner:'plant 01 clean patch'},{id:'plant-02-repair',name:'Nền đã xóa cây 02',owner:'plant 02 clean patch'},
 {id:'coral-01-repair',name:'Nền đã xóa san hô 01',owner:'coral 01 clean patch'},
 {id:'coral-02-repair',name:'Nền đã xóa san hô 02',owner:'coral 02 clean patch'},
 {id:'coral-03-repair',name:'Nền đã xóa san hô 03',owner:'coral 03 clean patch'},
 {id:'coral-hide-01-repair',name:'Nền đã xóa san hô trú ẩn',owner:'coral hide clean patch'},
 {id:'coral-motion',name:'San hô chuyển động',owner:'hand-separated coral'},
 {id:'aquatic-plants',name:'Cây thủy sinh chuyển động',owner:'hand-separated plant'},
 {id:'aquarium-led-off',name:'LED tắt (PNG)',owner:'LED off sprite'},
 {id:'aquarium-led-dim',name:'LED sáng nhẹ (PNG)',owner:'LED dim sprite'},
 {id:'aquarium-light-bar',name:'LED bật (PNG)',owner:'aquarium LED'},
 {id:'aquarium-night-illumination',name:'Sáng bể buổi tối',owner:'aquarium lighting'},
 {id:'vine-left',name:'Dây leo trái',owner:'vine'},
 {id:'vine-mid',name:'Dây leo giữa',owner:'vine'},
 {id:'vine-right',name:'Dây leo phải',owner:'vine'},
 {id:'vine-far-right',name:'Dây leo xa',owner:'vine'},
 {id:'lamp-original',name:'Ánh sáng đèn bàn',owner:'static lamp light'},
 {id:'effects',name:'Cá, sinh vật, nước, mưa',owner:'rendered effects'},
]);
export function layerAudit(documentRef){
 return LAYERS.map(layer=>({...layer,exists:!!documentRef.getElementById(layer.id)}));
}
export function installLayerInspector({doc=document,search=location.search}={}){
 if(new URLSearchParams(search).get('debugLayers')!=='1')return null;
 const root=doc.createElement('aside');root.id='layer-inspector';
 root.setAttribute('aria-label','Kiểm tra layer (chỉ dành cho phát triển)');
 const heading=doc.createElement('div');heading.className='debug-heading';
 const title=doc.createElement('strong');title.textContent='🔍 Kiểm tra layer · Alpha 08.4';
 const close=doc.createElement('button');close.type='button';close.textContent='×';close.title='Đóng panel';
 close.addEventListener('click',()=>{reset();root.remove();});heading.append(title,close);root.append(heading);
 const help=doc.createElement('p');help.textContent='Ẩn/hiện hoặc chỉnh độ mờ để tìm lớp đè sai. Chỉ xuất hiện khi URL có ?debugLayers=1.';root.append(help);
 const entries=[];
 for(const item of LAYERS){
   const el=doc.getElementById(item.id);if(!el)continue;
   const line=doc.createElement('label');line.className='debug-layer';
   const checkbox=doc.createElement('input');checkbox.type='checkbox';checkbox.checked=true;
   const name=doc.createElement('span');name.textContent=item.name;name.title=item.owner;
   const opacity=doc.createElement('input');opacity.type='range';opacity.min='0';opacity.max='100';opacity.step='5';opacity.value='100';opacity.title='Độ mờ layer';
   const status=doc.createElement('small');status.textContent='100%';
   const update=()=>{el.style.visibility=checkbox.checked?'':'hidden';el.style.opacity=opacity.value==='100'?'':String(Number(opacity.value)/100);status.textContent=opacity.value+'%';};
   checkbox.addEventListener('change',update);opacity.addEventListener('input',update);
   line.append(checkbox,name,opacity,status);root.append(line);entries.push({el,checkbox,opacity,status});
 }
 function reset(){for(const x of entries){x.el.style.removeProperty('visibility');x.el.style.removeProperty('opacity');x.checkbox.checked=true;x.opacity.value='100';x.status.textContent='100%';}}
 const resetButton=doc.createElement('button');resetButton.type='button';resetButton.className='debug-reset';resetButton.textContent='Khôi phục tất cả layer';resetButton.addEventListener('click',reset);root.append(resetButton);
 const warn=doc.createElement('p');warn.textContent='Lưu ý: room hiện chứa sẵn bể, mèo và cốc. Chúng KHÔNG phải ba lớp độc lập.';root.append(warn);
 doc.body.append(root);
 return {root,reset,layers:entries};
}
