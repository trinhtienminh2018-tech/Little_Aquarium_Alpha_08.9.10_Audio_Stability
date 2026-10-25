import {createServer} from 'node:http';
import {createReadStream, statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
const root=resolve('public'), types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.json':'application/json'};
const port=Number(process.env.PORT||3000);
createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);}catch{res.writeHead(400);return res.end();}
 const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);return res.end();}
 try{const s=statSync(file);if(!s.isFile())throw Error();res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-cache'});createReadStream(file).pipe(res);}catch{res.writeHead(404);res.end('Not found');}
}).listen(port,()=>console.log(`Little Aquarium 2.0: http://localhost:${port}`));
