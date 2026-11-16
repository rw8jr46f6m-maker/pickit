import {build} from 'esbuild';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

async function styles(dir){
  const files=[];
  for(const item of await readdir(dir,{withFileTypes:true})){
    const name=path.join(dir,item.name);
    if(item.isDirectory())files.push(...await styles(name));
    else if(name.endsWith('.css'))files.push(name);
  }
  return files;
}
const result=await build({
  stdin:{contents:"import {createRoot} from 'react-dom/client';import Picker from './components/Picker';createRoot(document.getElementById('root')).render(<Picker offline/>);",resolveDir:process.cwd(),loader:'tsx'},
  jsx:'automatic',bundle:true,minify:true,write:false,legalComments:'inline',define:{'process.env.NODE_ENV':'"production"'}
});
const cssFiles=await styles('.next/static');
if(!cssFiles.length)throw Error('Missing production styles');
const css=(await Promise.all(cssFiles.sort().map(file=>readFile(file,'utf8')))).join('\n');
const js=result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const html='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PICKIT 베타</title><style>'+css+'</style><div id="root"></div><script>'+js+'</script></html>';
await mkdir('beta-output',{recursive:true});
await writeFile('beta-output/PICKIT-Beta.html',html);
