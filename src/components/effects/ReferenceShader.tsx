import {useEffect,useRef} from "react";
import type {Material} from "./referenceMaterials";
import type {DeckQuality} from "@/services/deckTheme";
const vertex=`attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
// Signed-distance mask and bounded perimeter particles; GLSL whitespace compacted to keep the existing asset budget.
const fragment=`precision mediump float;uniform vec2 res;uniform vec2 size;uniform float time,mode,intensity,count,thickness;uniform vec3 tint;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}void main(){vec2 uv=gl_FragCoord.xy/res,p=uv*size;float d=-box(p-size*.5,size*.5-vec2(1.),17.);if(d<-.5||d>thickness+3.){gl_FragColor=vec4(0.);return;}float mask=smoothstep(-.5,1.3,d)*(1.-smoothstep(thickness-2.,thickness+3.,d));float t=time,n=noise(p*.09+vec2(t*.3,-t*.16));float sweep=pow(.5+.5*sin(p.x*.018+p.y*.028-t*.9+n*.6),9.);vec3 col=tint;float alpha=.0;if(mode<1.5){col=mix(vec3(.64,.69,.74),vec3(.99,.97,.91),sweep);alpha=.04+.24*sweep;}else if(mode<2.5){vec3 hue=.68+.14*cos(vec3(0.,2.094,4.188)+p.x*.028+p.y*.04-t*.42+n*.7);col=mix(hue,vec3(.96,.95,.93),sweep*.42);alpha=.12+.21*sweep;}else if(mode<3.5){float heat=exp(-abs(d-(3.+1.2*n))*1.6)*(.35+.65*n);col=mix(tint,vec3(.86,.56,.34),heat);alpha=heat*.56;}else if(mode<4.5){col=mix(tint,vec3(.97,.86,.61),sweep);alpha=.04+.30*sweep;}else if(mode<6.5){float seam=abs(d-(4.+2.4*sin(p.x*.067+p.y*.047)+2.*n));float heat=exp(-seam*1.6)*(.25+.75*noise(p*.045+vec2(t*.7,0.)));col=mix(tint,vec3(.96,.58,.31),heat);alpha=(mode>5.5?.7:.38)*heat;}else{float flick=.65+.35*noise(vec2(t*2.7,1.));float corner=pow(abs(uv.x-.5)*2.,5.)*pow(abs(uv.y-.5)*2.,3.);col=mix(tint,vec3(.90,.66,.40),flick*.4);alpha=(.08+.36*corner)*flick*exp(-abs(d-5.)*.17);}float sparkle=0.;if(count>0.){for(int i=0;i<16;i++){float fi=float(i);if(fi>=count)break;float seed=hash(vec2(fi+1.,18.7)),life=fract(t*(.34+seed*.26)+seed*13.);float side=floor(hash(vec2(fi,7.))*4.),along=.06+.88*hash(vec2(fi,5.));float inset=2.+life*min(thickness-2.,7.);vec2 q=vec2(along*size.x,inset);if(side==1.)q=vec2(size.x-inset,along*size.y);if(side==2.)q=vec2((1.-along)*size.x,size.y-inset);if(side==3.)q=vec2(inset,(1.-along)*size.y);float radius=.65+seed*.8;sparkle=max(sparkle,exp(-dot(p-q,p-q)/(radius*radius))*sin(life*3.14159));}}col=mix(col,vec3(.95,.72,.44),sparkle);alpha=max(alpha,sparkle*.8);gl_FragColor=vec4(col,clamp(alpha*mask*intensity,0.,.78));}`;
function rgb(hex:string){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255) as [number,number,number]}
export default function ReferenceShader({material,quality}:{material:Material;quality:DeckQuality}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  const gl=canvas.getContext("webgl",{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true,powerPreference:"low-power"});
  if(!gl){canvas.dataset.fxState="fallback";return}
  let frame=0,live=true,buffer:WebGLBuffer|null=null,program:WebGLProgram|null=null;
  const shaders:WebGLShader[]=[];
  const lost=(e:Event)=>{e.preventDefault();live=false;cancelAnimationFrame(frame);canvas.dataset.fxState="fallback"};
  canvas.addEventListener("webglcontextlost",lost);
  function cleanup(){live=false;cancelAnimationFrame(frame);canvas?.removeEventListener("webglcontextlost",lost);if(!gl)return;if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));gl.getExtension("WEBGL_lose_context")?.loseContext()}
  try{
   const compile=(kind:number,source:string)=>{const s=gl.createShader(kind);if(!s)throw Error("shader allocation");shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||"shader compile");return s};
   program=gl.createProgram();if(!program)throw Error("program allocation");gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error("shader link");
   gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,"a");gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
   const u=(n:string)=>gl.getUniformLocation(program!,n),res=u("res"),size=u("size"),clock=u("time"),start=performance.now();let last=-Infinity;
   gl.uniform1f(u("mode"),material.mode);gl.uniform1f(u("intensity"),quality==="low"?.57:.83);gl.uniform1f(u("count"),quality==="low"?Math.ceil(material.particles/2):material.particles);gl.uniform3f(u("tint"),...rgb(material.accent));
   const draw=(now:number)=>{if(!live)return;frame=requestAnimationFrame(draw);if(now-last<(quality==="low"?66:33))return;last=now;
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
    const ratio=Math.min(devicePixelRatio||1,quality==="low"?1:1.5,(quality==="low"?440:720)/Math.max(w,h));
    const cw=Math.max(1,Math.round(w*ratio)),ch=Math.max(1,Math.round(h*ratio));if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;gl.viewport(0,0,cw,ch)}
    gl.uniform2f(res,cw,ch);gl.uniform2f(size,w,h);gl.uniform1f(u("thickness"),Math.max(4,(material.edge+3)*h/360));gl.uniform1f(clock,(now-start)/1000);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);canvas.dataset.fxState="active";
   };frame=requestAnimationFrame(draw);
  }catch(error){canvas.dataset.fxState="fallback";console.warn("Reference card shader fallback",error);cleanup()}
  return cleanup;
 },[material.mode,material.accent,material.edge,material.particles,quality]);
 return <canvas ref={ref} className="reference-shader" data-testid="reference-shader" data-fx-state="initializing" aria-hidden="true"/>;
}
