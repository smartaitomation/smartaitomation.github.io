import * as T from './three.module.js';
import * as C from './cannon-es.js';
import { ConvexHull } from './ConvexHull.js';
import { configureMaterials } from './materials.js';
const $=id=>document.getElementById(id),canvas=$('scene');
const objects=[{name:'Watermelon',icon:'🍉',skin:'#4b8628',flesh:'#da283a',rim:'#edf2ca',rough:.38},{name:'Orange',icon:'🍊',skin:'#f28b14',flesh:'#ffa526',rim:'#fff1c1',rough:.65},{name:'Kiwi',icon:'🥝',skin:'#795534',flesh:'#a9cf47',rim:'#d4b68b',rough:.95},{name:'Apple',icon:'🍎',skin:'#b52124',flesh:'#fff1cc',rim:'#e55040',rough:.28},{name:'Cake',icon:'🍰',skin:'#f4b6c5',flesh:'#6c3a22',rim:'#fff3db',rough:.85}];
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true})}catch(e){$('status').textContent='This 3D simulator needs WebGL. Please open it in a browser with hardware acceleration.';$('slice').disabled=true;throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,60),world=new T.Group();scene.add(world);scene.add(new T.HemisphereLight(0xe4e9f1,0x3e3532,.85));
const key=new T.DirectionalLight(0xfff4e6,3.0);key.position.set(-3,6,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:20});key.shadow.normalBias=.025;key.shadow.bias=-.0002;key.shadow.radius=4;scene.add(key);const rim=new T.DirectionalLight(0xd8e4f5,1.4);rim.position.set(3,4,-3);scene.add(rim);const fill=new T.DirectionalLight(0xffffff,.45);fill.position.set(0,2,5);scene.add(fill);
function tex(draw){const c=document.createElement('canvas');c.width=c.height=1024;draw(c.getContext('2d'));const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t}
let seed=22;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
const wood=tex(c=>{c.fillStyle='#ad7745';c.fillRect(0,0,1024,1024);for(let i=0;i<2100;i++){let y=rand()*1024;c.strokeStyle=`rgba(${rand()>.5?'65,30,8':'245,195,131'},${rand()*.18})`;c.lineWidth=rand()*2+.3;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(330,y+rand()*12,680,y-rand()*12,1024,y+rand()*8);c.stroke()}for(let y=0;y<1024;y+=205){c.fillStyle='#3b210b35';c.fillRect(0,y,1024,3)}});
// A small, shallow board with beveled edges and a real handle slot.
const outline=new T.Shape(),bw=1.55,bh=.76,br=.065;
outline.moveTo(-bw+br,-bh);outline.lineTo(bw-br,-bh);outline.quadraticCurveTo(bw,-bh,bw,-bh+br);outline.lineTo(bw,bh-br);outline.quadraticCurveTo(bw,bh,bw-br,bh);outline.lineTo(-bw+br,bh);outline.quadraticCurveTo(-bw,bh,-bw,bh-br);outline.lineTo(-bw,-bh+br);outline.quadraticCurveTo(-bw,-bh,-bw+br,-bh);
const slot=new T.Path();slot.absellipse(-1.29,.34,.045,.13,0,Math.PI*2,true);outline.holes.push(slot);
wood.wrapS=wood.wrapT=T.RepeatWrapping;wood.repeat.set(.3,.65);
const board=new T.Mesh(new T.ExtrudeGeometry(outline,{depth:.11,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:3,steps:1,curveSegments:16}),new T.MeshStandardMaterial({map:wood,color:0xe1ba8c,roughness:.62}));board.rotation.x=-Math.PI/2;board.position.y=-.135;board.receiveShadow=true;board.castShadow=true;scene.add(board);
const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.15}));ground.rotation.x=-Math.PI/2;ground.position.y=-.19;ground.receiveShadow=true;scene.add(ground);
const physics=new C.World({gravity:new C.Vec3(0,-9.82,0),allowSleep:true});physics.solver.iterations=18;physics.broadphase=new C.SAPBroadphase(physics);
const fruitPhysics=new C.Material('fruit'),boardPhysics=new C.Material('board');physics.addContactMaterial(new C.ContactMaterial(fruitPhysics,boardPhysics,{friction:.95,restitution:.03}));physics.addContactMaterial(new C.ContactMaterial(fruitPhysics,fruitPhysics,{friction:.42,restitution:.05}));
const boardBody=new C.Body({mass:0,material:boardPhysics});boardBody.addShape(new C.Box(new C.Vec3(1.57,.075,.79)));boardBody.position.set(0,-.075,0);physics.addBody(boardBody);
const floorBody=new C.Body({mass:0,material:boardPhysics});floorBody.addShape(new C.Plane());floorBody.quaternion.setFromEuler(-Math.PI/2,0,0);floorBody.position.y=-.19;physics.addBody(floorBody);
const FLOAT_Y=2.65;
const dropGeometry=new T.SphereGeometry(1,5,4),dropMaterial=new T.MeshPhysicalMaterial({color:0xffc4b8,roughness:.15,transmission:.1,transparent:true,opacity:.65});
const droplets=new T.InstancedMesh(dropGeometry,dropMaterial,240);droplets.instanceMatrix.setUsage(T.DynamicDrawUsage);droplets.frustumCulled=false;scene.add(droplets);const drops=[],dummy=new T.Object3D();droplets.count=0;

let selected=0,n=3,parts=[],materials=[],stem=null,cutIndex=0,running=false,released=false,elapsed=0,wait=0,azimuth=0,elevation=.10,distance=9.3,drag=null,ac,bladeAge=99;
const blade=new T.Mesh(new T.BoxGeometry(3.2,.018,2.6),new T.MeshStandardMaterial({color:0xe9f1ee,metalness:.9,roughness:.22,transparent:true,opacity:.8}));blade.visible=false;world.add(blade);
function textures(o){const skin=tex(c=>{c.fillStyle=o.skin;c.fillRect(0,0,1024,1024);if(selected===0){for(let x=-120;x<1200;x+=100){c.fillStyle='#173f19';c.beginPath();for(let y=0;y<=1024;y+=8){let xx=x+Math.sin(y*.023+x)*12+Math.sin(y*.007)*25;c.lineTo(xx,y)}for(let y=1024;y>=0;y-=8){let xx=x+39+Math.sin(y*.023+x)*12+Math.sin(y*.007)*25;c.lineTo(xx,y)}c.closePath();c.fill()}}for(let i=0;i<23000;i++){let x=rand()*1024,y=rand()*1024;c.fillStyle=selected===2?'#241b0c44':rand()>.5?'#fff8cc20':'#20150018';c.fillRect(x,y,rand()*2+1,selected===2?rand()*8+1:2)}});
const flesh=tex(c=>{c.fillStyle=o.flesh;c.fillRect(0,0,1024,1024);for(let i=0;i<29000;i++){c.fillStyle=rand()>.5?'#ffffff16':'#3b160b10';c.fillRect(rand()*1024,rand()*1024,rand()*3+1,2)}c.strokeStyle=o.rim;c.lineWidth=selected===0?45:22;c.beginPath();c.arc(512,512,490,0,Math.PI*2);c.stroke();if(selected===0){for(let i=0;i<55;i++){let a=rand()*Math.PI*2,r=150+rand()*265;c.save();c.translate(512+Math.cos(a)*r,512+Math.sin(a)*r);c.rotate(a);c.fillStyle='#39201b';c.beginPath();c.ellipse(0,0,5,10,0,0,7);c.fill();c.restore()}}if(selected===1){c.strokeStyle='#fff0b18a';c.lineWidth=8;for(let i=0;i<10;i++){let a=i*Math.PI/5;c.beginPath();c.moveTo(512,512);c.lineTo(512+Math.cos(a)*480,512+Math.sin(a)*480);c.stroke()}for(let i=0;i<2200;i++){let x=rand()*1024,y=rand()*1024;c.fillStyle='#ffeabc44';c.fillRect(x,y,2,8)}}if(selected===2){c.fillStyle='#e6ecc1';c.beginPath();c.ellipse(512,512,100,155,0,0,7);c.fill();for(let i=0;i<75;i++){let a=i*2.399,r=150+rand()*90;c.fillStyle='#262b18';c.beginPath();c.ellipse(512+Math.cos(a)*r,512+Math.sin(a)*r,3,7,a,0,7);c.fill()}}if(selected===3){c.fillStyle='#cab783';for(let i=0;i<5;i++){let a=i*Math.PI*2/5;c.beginPath();c.ellipse(512+Math.cos(a)*55,512+Math.sin(a)*55,8,18,a,0,7);c.fill()}}if(selected===4){c.fillStyle='#ffefdb';for(let y=200;y<1024;y+=270)c.fillRect(0,y,1024,58)}});return[skin,flesh]}
function center(faces){let sum=new T.Vector3(),count=0;for(const f of faces)for(const v of f.v){sum.add(v);count++}return sum.divideScalar(count)}
function volume(faces){let v=0;for(const f of faces)for(let i=1;i<f.v.length-1;i++)v+=f.v[0].dot(new T.Vector3().crossVectors(f.v[i],f.v[i+1]))/6;return Math.abs(v)}
function initialFaces(){let g=selected===4?new T.CylinderGeometry(1,1,1.55,48,5):new T.SphereGeometry(1,48,32);let pos=g.attributes.position,idx=g.index.array,out=[];for(let i=0;i<idx.length;i+=3){let v=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(pos,idx[i+j]));if(selected===2)v.forEach(p=>{p.x*=.83;p.y*=1.15;p.z*=.83});if(selected===3)v.forEach(p=>{let a=Math.atan2(p.z,p.x),factor=1+.055*Math.cos(a*5)*(1-p.y*p.y);p.x*=factor;p.z*=factor;p.y*=.94});if(new T.Vector3().crossVectors(v[1].clone().sub(v[0]),v[2].clone().sub(v[0])).lengthSq()>1e-12)out.push({v,m:0})}g.dispose();return out}
function makePart(faces){const c=center(faces),positions=[],original=[],normals=[],uvs=[],g=new T.BufferGeometry();let start=0;for(const f of faces){let normal=new T.Vector3();for(let j=0;j<f.v.length;j++)normal.add(new T.Vector3().crossVectors(f.v[j],f.v[(j+1)%f.v.length]));normal.normalize();let basis=f.basis;for(let i=1;i<f.v.length-1;i++)for(const p of [f.v[0],f.v[i],f.v[i+1]]){positions.push(p.x-c.x,p.y-c.y,p.z-c.z);original.push(p.x,p.y,p.z);let norm=f.m===0&&selected!==4?p.clone().normalize():normal;normals.push(norm.x,norm.y,norm.z);if(f.m===0){uvs.push(.5+Math.atan2(p.z,p.x)/(2*Math.PI),.5+Math.asin(T.MathUtils.clamp(p.y/(selected===2?1.15:1),-1,1))/Math.PI)}else uvs.push(.5+p.dot(basis.u)/2.2,.5+p.dot(basis.v)/2.2)}let count=(f.v.length-2)*3;g.addGroup(start,count,f.m);start+=count}g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('slicePosition',new T.Float32BufferAttribute(original,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.computeBoundingSphere();let mesh=new T.Mesh(g,materials);mesh.castShadow=mesh.receiveShadow=true;mesh.position.copy(c).add(new T.Vector3(0,FLOAT_Y,0));world.add(mesh);return{faces,mesh,c,volume:volume(faces),vel:new T.Vector3(),spin:new T.Vector3(),rest:false}}
// Clip every surface polygon against a plane, then close the solid with an actual cut face.
function split(faces,normal,d){let sides=[[],[]],hits=[];for(let side=0;side<2;side++){let sign=side===0?1:-1;for(const f of faces){let out=[];for(let i=0;i<f.v.length;i++){let a=f.v[i],b=f.v[(i+1)%f.v.length],da=(a.dot(normal)-d)*sign,db=(b.dot(normal)-d)*sign;if(da>=-1e-8)out.push(a.clone());if((da>1e-8&&db< -1e-8)||(da< -1e-8&&db>1e-8)){let p=a.clone().lerp(b,da/(da-db));out.push(p);if(side===0&&!hits.some(h=>h.distanceToSquared(p)<1e-12))hits.push(p.clone())}}if(out.length>=3)sides[side].push({...f,v:out})}}
if(hits.length<3)return null;let c=hits.reduce((s,p)=>s.add(p),new T.Vector3()).divideScalar(hits.length),u=new T.Vector3().crossVectors(normal,Math.abs(normal.y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0)).normalize(),v=new T.Vector3().crossVectors(normal,u).normalize();hits.sort((a,b)=>Math.atan2(a.clone().sub(c).dot(v),a.clone().sub(c).dot(u))-Math.atan2(b.clone().sub(c).dot(v),b.clone().sub(c).dot(u)));sides[0].push({v:hits.slice().reverse(),m:1,basis:{u,v}});sides[1].push({v:hits,m:1,basis:{u,v}});return sides}
function disposeParts(){for(const p of parts){if(p.body)physics.removeBody(p.body);world.remove(p.mesh);p.mesh.geometry.dispose()}parts=[];drops.length=0;droplets.count=0;}
function reset(){disposeParts();azimuth=0;elevation=.10;distance=9.3;if(stem){stem.removeFromParent();stem.geometry.dispose();stem.material.dispose();stem=null}for(const m of materials){m.map?.dispose();m.dispose()}const o=objects[selected],[skin,flesh]=textures(o);materials=[new T.MeshStandardMaterial({map:skin,roughness:o.rough,bumpMap:skin,bumpScale:selected===1?.028:.009}),new T.MeshStandardMaterial({map:flesh,roughness:selected===4?.9:.46})];configureMaterials(materials,o,selected);parts=[makePart(initialFaces())];if(selected!==4){stem=new T.Mesh(new T.CylinderGeometry(.035,.055,.24,10),new T.MeshStandardMaterial({color:selected===0?0x627c31:0x5c3b1e,roughness:.9}));stem.position.set(.025,FLOAT_Y+(selected===2?1.24:1.1),0);stem.rotation.z=-.3;stem.castShadow=true;world.add(stem)}cutIndex=0;running=false;released=false;elapsed=0;wait=0;blade.visible=false;$('status').textContent='Ready to cut.';$('pieceCount').textContent='Ready to slice';$('slice').textContent='Slice it ↗'}
function setN(value){n=Math.max(1,Math.min(40,Number(value)));$('cuts').value=n;$('amount').value=n;$('headline').textContent=n+(n===1?' Cut':' Cuts');document.querySelectorAll('[data-n]').forEach(b=>b.classList.toggle('active',+b.dataset.n===n));reset()}
let noiseBuffer,master,lastLanding=-Infinity;
function unlockAudio(){
 if(!$('sound').checked)return;
 try{if(!ac){ac=new(window.AudioContext||window.webkitAudioContext)();master=ac.createDynamicsCompressor();master.threshold.value=-18;master.ratio.value=5;master.connect(ac.destination);noiseBuffer=ac.createBuffer(1,Math.ceil(ac.sampleRate*.4),ac.sampleRate);const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch{}
}
function sound(kind='slice',strength=1){
 if(!$('sound').checked||!ac||ac.state!=='running')return;
 const now=ac.currentTime;
 if(kind==='landing'){if(now-lastLanding<.085||strength<.12)return;lastLanding=now;}
 try{
 const landing=kind==='landing',duration=landing?.16:.11;
 const src=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain();src.buffer=noiseBuffer;
 filter.type=landing?'lowpass':'bandpass';filter.frequency.setValueAtTime(landing?460:(selected===4?1600:2800),now);filter.frequency.exponentialRampToValueAtTime(landing?120:650,now+duration);filter.Q.value=landing?.7:.55;
 const volume=landing?Math.min(.24,strength*.12):.25;gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(volume,now+.004);gain.gain.exponentialRampToValueAtTime(.001,now+duration);src.connect(filter).connect(gain).connect(master);src.start(now);src.stop(now+duration);src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect();};
 const osc=ac.createOscillator(),bodyGain=ac.createGain();osc.type='sine';osc.frequency.setValueAtTime(landing?130:230,now);osc.frequency.exponentialRampToValueAtTime(landing?48:90,now+.075);bodyGain.gain.setValueAtTime(landing?Math.min(.18,strength*.07):.08,now);bodyGain.gain.exponentialRampToValueAtTime(.001,now+.09);osc.connect(bodyGain).connect(master);osc.start(now);osc.stop(now+.1);osc.onended=()=>{osc.disconnect();bodyGain.disconnect();};
 }catch{}
}

function cut(){
 const idx=parts.reduce((a,p,i)=>p.volume>parts[a].volume?i:a,0),old=parts[idx];
 const a=cutIndex*2.39996+.35;
 const normal=(cutIndex===0?new T.Vector3(.32,.80,.50):new T.Vector3(Math.cos(a),Math.sin(a*1.3)*.7,Math.sin(a))).normalize();
 const result=split(old.faces,normal,old.c.dot(normal));
 if(!result){running=false;$('status').textContent='Reset to try this cut again.';return;}
 world.remove(old.mesh);old.mesh.geometry.dispose();
 const children=result.map(makePart);parts.splice(idx,1,...children);
 for(const p of parts){p.mesh.position.copy(p.c).addScaledVector(p.c,.035).add(new T.Vector3(0,FLOAT_Y,0));}
 spray(normal,old.c);
 cutIndex++;$('pieceCount').textContent=parts.length+' pieces';$('status').textContent=cutIndex+' of '+n+' cuts';sound();
 if(cutIndex===n){running=false;wait=.18;$('slice').textContent='Replay ↻';$('status').textContent='Cut complete. Falling onto the board.';}
}
function collider(part){
 // Support-point sampling preserves each cut plane while keeping collision hulls light enough for mobile.
 const points=part.faces.flatMap(f=>f.v),support=[];
 for(let i=0;i<26;i++){const y=1-2*(i+.5)/26,a=i*2.39996323,d=new T.Vector3(Math.cos(a)*Math.sqrt(1-y*y),y,Math.sin(a)*Math.sqrt(1-y*y));let best=points[0],max=-Infinity;for(const p of points){const dot=p.dot(d);if(dot>max){max=dot;best=p}}if(!support.some(p=>p.distanceToSquared(best)<1e-10))support.push(best.clone());}
 const hullCenter=support.reduce((s,p)=>s.add(p),new T.Vector3()).divideScalar(support.length);
 const hull=new ConvexHull().setFromPoints(support),vertices=[],faces=[],indices=new Map();
 for(const face of hull.faces){const f=[];let edge=face.edge;do{const p=edge.head().point;let index=indices.get(p);if(index===undefined){index=vertices.length;indices.set(p,index);vertices.push(new C.Vec3(p.x-hullCenter.x,p.y-hullCenter.y,p.z-hullCenter.z))}f.push(index);edge=edge.next;}while(edge!==face.edge);faces.push(f);}
 const shape=new C.ConvexPolyhedron({vertices,faces});shape.sliceOffset=new C.Vec3(hullCenter.x-part.c.x,hullCenter.y-part.c.y,hullCenter.z-part.c.z);return shape;
}
function release(){
 released=true;
 if(stem){const parent=parts.reduce((a,p)=>p.c.y>a.c.y?p:a,parts[0]);stem.position.sub(parent.mesh.position);parent.mesh.add(stem);}
 for(const p of parts){const body=new C.Body({mass:Math.max(.025,p.volume),material:fruitPhysics,linearDamping:.3,angularDamping:.65,allowSleep:true,sleepSpeedLimit:.22,sleepTimeLimit:.45});const shape=collider(p);body.addShape(shape,shape.sliceOffset);body.position.copy(p.mesh.position);body.velocity.set(parts.length===2?Math.sign(p.c.y||p.c.x)*.52:p.c.x*.22,-.15,p.c.z*.12);body.angularVelocity.set(-.2+p.c.z*.12,.02,-Math.sign(p.c.y)*.28);body.addEventListener('collide',event=>{if(event.body.mass===0){sound('landing',Math.abs(event.contact.getImpactVelocityAlongNormal()));body.linearDamping=.93;body.angularDamping=.97;}});physics.addBody(body);p.body=body;}
}
function spray(normal,origin){
 const u=new T.Vector3().crossVectors(normal,new T.Vector3(0,0,1)).normalize(),v=new T.Vector3().crossVectors(normal,u).normalize();
 for(let i=0;i<24;i++){const a=rand()*Math.PI*2,radial=u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v,Math.sin(a));drops.push({pos:origin.clone().multiplyScalar(.5).addScaledVector(radial,.92).add(new T.Vector3(0,FLOAT_Y,0)),vel:radial.multiplyScalar(.6+rand()*1.5).add(new T.Vector3(0,.8+rand(),0)),life:1.1+rand()*.8,size:.006+rand()*.012});}
 while(drops.length>240)drops.shift();
}
function updateDrops(dt){for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.life-=dt;d.vel.y-=5*dt;d.pos.addScaledVector(d.vel,dt);if(d.life<=0||d.pos.y<0)drops.splice(i,1);}droplets.count=drops.length;drops.forEach((d,i)=>{dummy.position.copy(d.pos);dummy.scale.set(d.size,d.size*(1+Math.abs(d.vel.y)*.35),d.size);dummy.updateMatrix();droplets.setMatrixAt(i,dummy.matrix);});droplets.instanceMatrix.needsUpdate=true;}

objects.forEach((o,i)=>{const b=document.createElement('button');b.className='object';b.innerHTML='<b>'+o.icon+'</b>'+o.name;b.setAttribute('aria-pressed',i===0);b.onclick=()=>{selected=i;document.querySelectorAll('.object').forEach((b,j)=>b.setAttribute('aria-pressed',i===j));$('material').textContent=o.name;reset()};$('objects').append(b)});
$('cuts').oninput=e=>setN(e.target.value);$('minus').onclick=()=>setN(n-1);$('plus').onclick=()=>setN(n+1);$('presets').onclick=e=>{if(e.target.dataset.n)setN(e.target.dataset.n)};$('reset').onclick=reset;$('slice').onclick=()=>{unlockAudio();reset();running=true;elapsed=.2;$('status').textContent='Slicing through the real geometry…';$('slice').textContent='Restart ↗'};
$('sound').onchange=()=>{if($('sound').checked){unlockAudio();if(ac)ac.resume().then(()=>sound()).catch(()=>{});}};
canvas.style.touchAction='none';canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)};canvas.onpointermove=e=>{if(!drag)return;azimuth-=(e.clientX-drag.x)*.008;elevation=T.MathUtils.clamp(elevation+(e.clientY-drag.y)*.006,.08,1.15);drag={x:e.clientX,y:e.clientY}};canvas.onpointerup=canvas.onpointercancel=()=>drag=null;canvas.addEventListener('wheel',e=>{e.preventDefault();distance=T.MathUtils.clamp(distance+e.deltaY*.005,7.5,13)},{passive:false});
function resize(){const box=canvas.getBoundingClientRect();renderer.setSize(box.width,box.height,false);camera.aspect=box.width/box.height;camera.fov=40;camera.updateProjectionMatrix()}window.addEventListener('resize',resize);
let last=performance.now();
function animate(now){
 requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.04);last=now;
 const step=dt*($('slow').checked?.32:1);
 camera.position.set(Math.sin(azimuth)*Math.cos(elevation)*distance,2.1+Math.sin(elevation)*distance,Math.cos(azimuth)*Math.cos(elevation)*distance);camera.lookAt(0,2.1,0);
 if(running){elapsed+=step;if(elapsed>Math.max(.035,.16-n*.003)){elapsed=0;cut();}}
 if(wait>0){wait-=step;if(wait<=0)release();}
 if(released){physics.step(1/120,step,6);for(const p of parts){p.mesh.position.copy(p.body.position);p.mesh.quaternion.copy(p.body.quaternion);}if(parts.every(p=>p.body.sleepState===C.Body.SLEEPING))$('status').textContent=n+(n===1?' cut. ':' cuts. ')+parts.length+' pieces.';}
 updateDrops(step);renderer.render(scene,camera);
}
// Read-only diagnostics for geometry and browser checks.
window.sliceLab={get state(){return{selected,n,cutIndex,pieces:parts.length,running,released,webgl:renderer.getContext().getParameter(renderer.getContext().VERSION),triangles:renderer.info.render.triangles}},setN,select(i){selected=i;reset()},cut,split,volume,initialFaces};resize();reset();requestAnimationFrame(animate);
