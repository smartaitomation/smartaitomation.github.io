import * as T from './three.module.js';

// Records only the local game scene and its audio bus. No microphone or screen permissions.
export function createRecorder({scene,camera,getTitle,getName,getAudioTrack,play}){
 const record=document.getElementById('record'),stop=document.getElementById('record-stop'),download=document.getElementById('record-download'),status=document.getElementById('record-status');
 const output=document.createElement('canvas');output.width=720;output.height=1280;
 const ctx=output.getContext('2d'),view=camera.clone();
 let media=null,renderer=null,stream=null,chunks=[],url=null,filename='',savedFilename='',started=0,lastFrame=0,lastSecond=-1,failed=false,active=false;
 const supported=!!(ctx&&output.captureStream&&window.MediaRecorder);
 if(!supported){record.disabled=true;status.textContent='Recording is not supported in this browser. Try Safari or Chrome.';return{frame(){}};}
 const background=ctx.createRadialGradient(360,1060,30,360,740,1050);background.addColorStop(0,'#454649');background.addColorStop(.4,'#2b2d30');background.addColorStop(1,'#1b1d1f');
 function cleanup(){stream?.getTracks().forEach(track=>track.stop());stream=null;if(renderer){renderer.dispose();renderer.forceContextLoss();renderer=null;}active=false;record.dataset.recording='false';stop.disabled=true;record.disabled=false;download.disabled=!url;}
 function draw(now){
  if(!renderer)return;
  view.copy(camera);view.aspect=720/1280;view.updateProjectionMatrix();renderer.render(scene,view);
  ctx.fillStyle=background;ctx.fillRect(0,0,720,1280);ctx.drawImage(renderer.domElement,0,0,720,1280);
  ctx.save();ctx.font='700 76px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle='#fff';ctx.shadowColor='#0009';ctx.shadowBlur=9;ctx.shadowOffsetY=4;ctx.fillText(getTitle(),360,104);ctx.restore();
  const second=Math.floor((now-started)/1000);if(active&&second!==lastSecond){lastSecond=second;status.textContent='Recording '+Math.floor(second/60)+':'+String(second%60).padStart(2,'0')+' · Tap Stop to save';}
 }
 record.onclick=()=>{
  if(active||media?.state==='recording')return;
  record.disabled=true;stop.disabled=true;status.textContent='Preparing recording…';failed=false;
  try{
   // Called directly from the tap so mobile browsers can unlock game audio.
   const audioTrack=getAudioTrack();
   renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setSize(720,1280,false);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
   stream=output.captureStream(30);if(audioTrack)stream.addTrack(audioTrack.clone());
   const types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
   const type=types.find(type=>MediaRecorder.isTypeSupported(type));
   media=new MediaRecorder(stream,{...(type?{mimeType:type}:{}),videoBitsPerSecond:4000000});chunks=[];
   const stamp=new Date().toISOString().replace(/[:.]/g,'-');filename='slice-lab-'+getName()+'-'+stamp;
   media.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
   media.onerror=()=>{failed=true;status.textContent='Recording failed. Try a shorter clip.';if(media.state!=='inactive')media.stop();else cleanup();};
   media.onstop=()=>{
    const mime=media.mimeType||type||'video/webm',blob=new Blob(chunks,{type:mime});chunks=[];cleanup();
    if(failed||!blob.size){if(!failed)status.textContent='No video captured. Tap Record to try again.';return;}
    if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);savedFilename=filename+(mime.includes('mp4')?'.mp4':'.webm');
    download.disabled=false;status.textContent='Video ready · '+(blob.size/1048576).toFixed(1)+' MB · Tap Download';
   };
   play();started=performance.now();lastFrame=0;lastSecond=-1;draw(started);media.start(250);active=true;record.dataset.recording='true';stop.disabled=false;download.disabled=true;status.textContent='Recording 0:00 · Tap Stop to save';
  }catch(error){cleanup();status.textContent='Could not start recording. Try Safari or Chrome.';console.warn('Video recording unavailable:',error.name);}
 };
 stop.onclick=()=>{if(media?.state==='recording'){stop.disabled=true;status.textContent='Saving video…';media.stop();}};
 download.onclick=()=>{if(!url)return;const link=document.createElement('a');link.href=url;link.download=savedFilename;link.style.display='none';document.body.append(link);link.click();link.remove();};
 window.addEventListener('pagehide',()=>{if(media?.state==='recording')media.stop();});
 return{frame(now){if(active&&now-lastFrame>=1000/30){lastFrame=now;draw(now);}}};
}
