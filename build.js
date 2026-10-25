import {rmSync,cpSync} from 'node:fs';
rmSync('dist',{force:true,recursive:true});cpSync('public','dist',{recursive:true});console.log('Build completed: dist/');
