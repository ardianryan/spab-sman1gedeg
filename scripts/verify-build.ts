import { readFile,readdir,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {launchBrowser} from './browser';
const results=[];
for(const file of await readdir('public/exports')){
 const source=await readFile(`public/exports/${file}`),built=await readFile(`dist/exports/${file}`);
 if(!source.equals(built))throw new Error(`Ekspor dist berbeda: ${file}`);
 const response=await fetch(`http://127.0.0.1:4173/exports/${file}`);const served=Buffer.from(await response.arrayBuffer());
 if(!response.ok||!source.equals(served))throw new Error(`Unduhan berbeda: ${file}`);
 results.push({file,bytes:source.length,sha256:createHash('sha256').update(served).digest('hex')});
}
const browser=await launchBrowser();try{const page=await browser.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173');await page.getByRole('button',{name:'Gedung B',exact:true}).click();if(!(await page.getByRole('heading',{name:'Gedung B',exact:true}).isVisible()))throw new Error('Build tidak interaktif');if(errors.length)throw new Error(errors.join('\n'));}finally{await browser.close()}
await writeFile('artifacts/build-report.json',JSON.stringify({status:'passed',downloads:results},null,2));console.log('Build produksi interaktif; semua unduhan cocok byte-per-byte dengan hasil ekspor.');
