import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const main=readFileSync(new URL('../public/js/main.js',import.meta.url),'utf8');
const i18n=readFileSync(new URL('../public/js/i18n.js',import.meta.url),'utf8');
test('Vietnamese and English language selector persists preference',()=>{
 assert.match(html,/id="language-choice"/); assert.match(html,/value="vi"/); assert.match(html,/value="en"/);
 assert.match(i18n,/aquarium2\.language/); assert.match(main,/startTranslations\(\)/);
});
test('translations cover aquarium settings and dynamic display',()=>{
 for(const label of ['Giọt mưa trên kính','Chuyển động san hô','Cá trong bể','Quang đãng','Cửa đóng'])assert.ok(i18n.includes(label));
 assert.match(i18n,/MutationObserver/);
});
