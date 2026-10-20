import * as T from './three.module.js';
const noise=`
float shash(vec3 p){p=fract(p*.3183099+vec3(.11,.23,.37));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float snoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(shash(i),shash(i+vec3(1,0,0)),f.x),mix(shash(i+vec3(0,1,0)),shash(i+vec3(1,1,0)),f.x),f.y),mix(mix(shash(i+vec3(0,0,1)),shash(i+vec3(1,0,1)),f.x),mix(shash(i+vec3(0,1,1)),shash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return .55*snoise(p)+.28*snoise(p*2.1)+.12*snoise(p*4.3)+.05*snoise(p*9.1);}
`;
function shaderFor(material,kind,body){material.onBeforeCompile=shader=>{shader.vertexShader='attribute vec3 slicePosition; varying vec3 fruitPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfruitPosition=slicePosition;');shader.fragmentShader='varying vec3 fruitPosition;\n'+noise+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+body);};material.customProgramCacheKey=()=>kind;}
export function configureMaterials(materials,o,kind){
 if(kind===0){
 shaderFor(materials[0],'natural-melon-v1',`
 vec3 p=normalize(fruitPosition);float longitude=atan(p.z,p.x);float wave=sin(longitude*11.+(fbm(p*18.)-.5)*5.+sin(p.y*25.)*.15);float stripes=smoothstep(-.20,.27,wave);float grain=fbm(p*55.);vec3 lightGreen=mix(vec3(.15,.33,.035),vec3(.38,.58,.12),grain);vec3 darkGreen=mix(vec3(.012,.065,.018),vec3(.055,.18,.035),grain);diffuseColor.rgb=mix(darkGreen,lightGreen,stripes)*( .85+.24*fbm(p*120.));`);
 }
 const scale=kind===2?'vec3(.83,1.15,.83)':kind===3?'vec3(1.,.94,1.)':'vec3(1.)';
 const rimColor=new T.Color(o.rim),skinColor=new T.Color(o.skin);
 const color=c=>`vec3(${c.r},${c.g},${c.b})`;
 let body=`float edge=length(fruitPosition/${scale});float juice=fbm(fruitPosition*85.);diffuseColor.rgb*=.87+.23*juice;`;
 if(kind===0){body+=`diffuseColor.rgb=mix(vec3(.48,.013,.025),vec3(.78,.055,.082),.4+juice*.5);float seedMask=1.;`;
 // Seeds retain the texture's elliptical silhouettes, with wet, finely varied flesh around them.
 body+=`vec4 seedTex=texture2D(map,vMapUv);if(max(seedTex.r,max(seedTex.g,seedTex.b))<.13)diffuseColor.rgb=vec3(.045,.018,.009);`;}
 if(kind===4){body+=`float layer=mod(fruitPosition.y+.78,.44);diffuseColor.rgb=mix(vec3(.16,.055,.020),vec3(.83,.68,.45),smoothstep(.30,.32,layer)*(1.-smoothstep(.39,.41,layer)));diffuseColor.rgb*=.8+.35*juice;`;}
 else body+=`diffuseColor.rgb=mix(diffuseColor.rgb,${color(rimColor)},smoothstep(.91,.962,edge));diffuseColor.rgb=mix(diffuseColor.rgb,${color(skinColor)},smoothstep(.987,1.,edge));`;
 shaderFor(materials[1],'flesh-v3-'+kind,body);
 materials[1].roughness=kind===4?.9:.32;
}
