import {useEffect,useRef,type RefObject} from "react";
import type {Material} from "./referenceMaterials";
import type {DeckQuality} from "@/services/deckTheme";
const vertex=`attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
// Arc-length localized light. No persistent rim color or broad glow.
const fragment=`precision mediump float;uniform vec2 res,size;uniform float time,mode,intensity;uniform vec3 tint;uniform sampler2D relief;uniform float mapped;const float PI=3.14159265;void main(){vec2 uv=gl_FragCoord.xy/res,p=(uv-.5)*size,h=size*.5-1.8;float r=min(18.2,min(h.x,h.y)),lx=h.x-r,ly=h.y-r;vec2 a=abs(p),q=a-vec2(lx,ly);float d=length(max(q,0.))+min(max(q.x,q.y),0.)-r;float line=1.-smoothstep(.38,1.45,abs(d));if(line<=0.){gl_FragColor=vec4(0.);return;}float quarter=lx+ly+r*PI*.5,s;if(q.x>0.&&q.y>0.)s=lx+r*atan(q.x,q.y);else if(q.y>=q.x)s=min(a.x,lx);else s=lx+r*PI*.5+ly-min(a.y,ly);if(p.y<0.)s=2.*quarter-s;if(p.x<0.)s=4.*quarter-s;float t=time,phase=fract(s/(4.*quarter)-t/(mode>4.5?3.7:4.8)+1.);float tail=1.-smoothstep(.025,.205,phase);float head=smoothstep(.0,.025,phase);float arc=tail*head;if(arc<=0.){gl_FragColor=vec4(0.);return;}vec3 col=mix(tint,vec3(.96,.94,.88),.68);if(mode<1.5)col=vec3(.93,.95,.98);else if(mode<2.5)col=.82+.13*cos(vec3(0.,2.094,4.188)+phase*15.+t*.65);else if(mode>4.5||mode>2.5&&mode<3.5)col=mix(tint,vec3(1.,.75,.48),.7);if(mapped>.5){vec3 mat=texture2D(relief,vec2(uv.x,1.-uv.y)).rgb;col=mix(col,vec3(.99,.97,.91),.10*length(mat.rg-.5));}float fade=smoothstep(0.,.24,t);gl_FragColor=vec4(col,line*arc*intensity*fade);}`;
function rgb(hex:string){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255) as [number,number,number]}
export default function ReferenceShader({material,quality,normalMap,revision}:{material:Material;quality:DeckQuality;normalMap:RefObject<HTMLCanvasElement|null>;revision:number}){
 const ref=useRef<HTMLCanvasElement>(null),mapRevision=useRef(revision);mapRevision.current=revision;
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  const gl=canvas.getContext("webgl",{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true,powerPreference:"low-power"});
  if(!gl){canvas.dataset.fxState="fallback";return}
  let frame=0,live=true,buffer:WebGLBuffer|null=null,program:WebGLProgram|null=null,texture:WebGLTexture|null=null;
  const shaders:WebGLShader[]=[];
  const lost=(e:Event)=>{e.preventDefault();live=false;cancelAnimationFrame(frame);canvas.dataset.fxState="fallback"};
  canvas.addEventListener("webglcontextlost",lost);
  function cleanup(){live=false;cancelAnimationFrame(frame);canvas?.removeEventListener("webglcontextlost",lost);if(!gl)return;if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);if(texture)gl.deleteTexture(texture);shaders.forEach(s=>gl.deleteShader(s));gl.getExtension("WEBGL_lose_context")?.loseContext()}
  try{
   const compile=(kind:number,source:string)=>{const s=gl.createShader(kind);if(!s)throw Error("shader allocation");shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||"shader compile");return s};
   program=gl.createProgram();if(!program)throw Error("program allocation");gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error("shader link");
   gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,"a");gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
   const u=(n:string)=>gl.getUniformLocation(program!,n),res=u("res"),size=u("size"),clock=u("time"),start=performance.now();let last=-Infinity,uploaded=-1;texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([128,128,0,255]));gl.uniform1i(u("relief"),0);
   gl.uniform1f(u("mode"),material.mode);gl.uniform1f(u("intensity"),quality==="low"?.58:.82);gl.uniform3f(u("tint"),...rgb(material.accent));
   const draw=(now:number)=>{if(!live)return;frame=requestAnimationFrame(draw);if(now-last<(quality==="low"?66:33))return;last=now;
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
    const ratio=Math.min(devicePixelRatio||1,quality==="low"?1:1.5,(quality==="low"?440:720)/Math.max(w,h));
    const cw=Math.max(1,Math.round(w*ratio)),ch=Math.max(1,Math.round(h*ratio));if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;gl.viewport(0,0,cw,ch)}
    if(uploaded!==mapRevision.current){uploaded=mapRevision.current;const source=normalMap.current;if(uploaded>0&&source){gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);gl.uniform1f(u("mapped"),1);canvas.dataset.relief="active"}else{gl.uniform1f(u("mapped"),0)}}gl.uniform2f(res,cw,ch);gl.uniform2f(size,w,h);gl.uniform1f(clock,(now-start)/1000);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);canvas.dataset.fxState="active";
   };frame=requestAnimationFrame(draw);
  }catch(error){canvas.dataset.fxState="fallback";console.warn("Reference card shader fallback",error);cleanup()}
  return cleanup;
 },[material.mode,material.accent,quality]);
 return <canvas ref={ref} className="reference-shader" data-testid="reference-shader" data-fx-state="initializing" aria-hidden="true"/>;
}
