const canvas=document.querySelector('#globe'),ctx=canvas.getContext('2d'),motion=document.querySelector('#motion');
let highlights=[],lowHighlights=[],land=[],lowLand=[],angle=-1.45,target=-1.45,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,drag=false,lastX=0,lastY=0,width=0,height=0,r=0,baseRadius=0,tilt=.20,sectionIndex=0;
let revision=0,lastView="",lastFrame=0,globeVisible=true;
new IntersectionObserver(entries=>{globeVisible=entries[0].isIntersecting;lastFrame=0;}).observe(canvas);
let taiwanFeature=null;
let allianceFeatures=[],countryHitPaths=[],hoverCountry=null;
let occupationFeatures=[],occupationHitPaths=[],shippingFeatures=[],showRoutes=true,showOccupation=true,readingCard=false;
fetch('shipping-routes.json').then(res=>res.json()).then(data=>{shippingFeatures=data.features;revision++;window.dispatchEvent(new Event('shipping-ready'))}).catch(()=>window.dispatchEvent(new Event('shipping-error')));
fetch('occupation.json').then(res=>res.json()).then(data=>{occupationFeatures=data.features;revision++;window.dispatchEvent(new Event('occupation-ready'))}).catch(()=>window.dispatchEvent(new Event('occupation-error')));
const hatchTile=document.createElement('canvas');hatchTile.width=hatchTile.height=8;
const hatchCtx=hatchTile.getContext('2d');hatchCtx.strokeStyle='#edbecbcc';hatchCtx.lineWidth=1;
hatchCtx.beginPath();hatchCtx.moveTo(-2,2);hatchCtx.lineTo(2,-2);hatchCtx.moveTo(0,8);hatchCtx.lineTo(8,0);hatchCtx.moveTo(6,10);hatchCtx.lineTo(10,6);hatchCtx.stroke();
const occupationPattern=ctx.createPattern(hatchTile,'repeat');
fetch('relationships.json').then(res=>{if(!res.ok)throw Error('Atlas relationships unavailable');return res.json()}).then(data=>{allianceFeatures=data.features;revision++;window.dispatchEvent(new Event('relationships-ready'))}).catch(()=>window.dispatchEvent(new Event('relationships-error')));
fetch('taiwan.json').then(response=>response.json()).then(feature=>{taiwanFeature=feature;revision++}).catch(()=>{});
const emblems=[{id:'840',lon:-98.5,lat:39,src:'us-emblem.svg'},{id:'156',lon:104,lat:35,span:.25,src:'china-emblem.svg'},{id:'158',lon:132,lat:23,span:.20,src:'taiwan-emblem.svg'},{id:'NATO',lon:-28,lat:48,span:.30,src:'nato-emblem.svg'},{id:'643',lon:45,lat:57,span:.18,src:'russia-emblem.svg'}].map(mark=>{const image=new Image();const surface={...mark,image};image.onload=()=>prepareEmblem(surface);image.src=mark.src;return surface;});
// A geographic mesh keeps every part of the emblem attached to the sphere.
function prepareEmblem(mark){const ratio=mark.image.naturalHeight/mark.image.naturalWidth;const texture=document.createElement('canvas');texture.width=512;texture.height=Math.round(512*ratio);texture.getContext('2d').drawImage(mark.image,0,0,texture.width,texture.height);mark.texture=texture;const lon=mark.lon*Math.PI/180,lat=mark.lat*Math.PI/180;const center=[Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon)],east=[Math.cos(lon),0,-Math.sin(lon)],north=[-Math.sin(lat)*Math.sin(lon),Math.cos(lat),-Math.sin(lat)*Math.cos(lon)];mark.vertices=[];mark.cells=6;for(let y=0;y<=mark.cells;y++)for(let x=0;x<=mark.cells;x++){const u=x/mark.cells,v=y/mark.cells,span=mark.span||.30,e=Math.tan((u-.5)*span),n=Math.tan((.5-v)*span*ratio);const point=center.map((c,i)=>c+e*east[i]+n*north[i]);const length=Math.hypot(...point);mark.vertices.push({lon:Math.atan2(point[0],point[2])*180/Math.PI,lat:Math.asin(point[1]/length)*180/Math.PI,u:u*texture.width,v:v*texture.height});}revision++;}
function surfaceTriangle(texture,a,b,c){let polygon=[a,b,c],visible=[];for(let i=0;i<3;i++){const from=polygon[i],to=polygon[(i+1)%3];if(from.z>0)visible.push(from);if((from.z>0)!==(to.z>0)){const t=from.z/(from.z-to.z);visible.push({x:from.x+t*(to.x-from.x),y:from.y+t*(to.y-from.y)});}}if(visible.length<3)return;const du1=b.u-a.u,dv1=b.v-a.v,du2=c.u-a.u,dv2=c.v-a.v,det=du1*dv2-du2*dv1;const dx1=b.x-a.x,dy1=b.y-a.y,dx2=c.x-a.x,dy2=c.y-a.y;const A=(dx1*dv2-dx2*dv1)/det,B=(dy1*dv2-dy2*dv1)/det,C=(dx2*du1-dx1*du2)/det,D=(dy2*du1-dy1*du2)/det;ctx.save();ctx.beginPath();visible.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();ctx.transform(A,B,C,D,a.x-A*a.u-C*a.v,a.y-B*a.u-D*a.v);const sx=Math.min(a.u,b.u,c.u),sy=Math.min(a.v,b.v,c.v),sw=Math.max(a.u,b.u,c.u)-sx,sh=Math.max(a.v,b.v,c.v)-sy;ctx.drawImage(texture,sx,sy,sw,sh,sx,sy,sw,sh);ctx.restore();}
function drawSurfaceEmblems(){for(const mark of emblems){if(!mark.texture)continue;const country=mark.id==='158'?taiwanFeature:highlights.find(f=>f.id===mark.id)||allianceFeatures.find(f=>f.id===mark.id);if(!country&&mark.id!=='NATO')continue;const vertices=mark.vertices.map(v=>{const p=project(v.lon,v.lat);return {...v,x:p[0],y:p[1],z:p[2]};});if(vertices.every(v=>v.z<=0))continue;ctx.save();ctx.beginPath();ctx.arc(width/2,height/2,r,0,Math.PI*2);ctx.clip();ctx.globalAlpha=['840','156'].includes(mark.id)?.60:.32;ctx.shadowBlur=0;const stride=mark.cells+1;for(let y=0;y<mark.cells;y++)for(let x=0;x<mark.cells;x++){const a=vertices[y*stride+x],b=vertices[y*stride+x+1],c=vertices[(y+1)*stride+x],d=vertices[(y+1)*stride+x+1];surfaceTriangle(mark.texture,a,b,c);surfaceTriangle(mark.texture,b,d,c);}ctx.restore();}}

const regions=[['A GLOBAL PERSPECTIVE','A starting point. A global perspective.','INTRODUCTION',-1.45],['PUBLIC SERVICE','Learning through research and public service.','EXPERIENCE',-1.45],['A GLOBAL COMMUNITY','Education and service across borders.','VOLUNTEER',-.5],['THE INDO-PACIFIC','Industry. Resources. Technology.','POLARITY GROUP',1.95],['A WORLD BEYOND THE WORK','Language, sport, and community.','BEYOND THE WORK',.7]];
function resize(){const box=canvas.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(devicePixelRatio,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);baseRadius=Math.max(0,(Math.min(width,height)-16)/2);r=baseRadius;revision++}new ResizeObserver(resize).observe(canvas);
function project(lon,lat){const a=lon*Math.PI/180-angle,b=lat*Math.PI/180,y=Math.sin(b),z=Math.cos(b)*Math.cos(a);return [width/2+r*Math.cos(b)*Math.sin(a),height/2-r*(y*Math.cos(tilt)-z*Math.sin(tilt)),z*Math.cos(tilt)+y*Math.sin(tilt)]}
function line(points,color,lineWidth=1){ctx.beginPath();let prev=false;for(const p of points){const q=project(p[0],p[1]);if(q[2]>0){if(prev)ctx.lineTo(q[0],q[1]);else ctx.moveTo(q[0],q[1]);prev=true}else prev=false}ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke()}
function decodeCoasts(t){return t.arcs.map(arc=>{let x=0,y=0;const points=new Float32Array(arc.length*3);arc.forEach((p,i)=>{x+=p[0];y+=p[1];const lon=(x*t.transform.scale[0]+t.transform.translate[0])*Math.PI/180,lat=(y*t.transform.scale[1]+t.transform.translate[1])*Math.PI/180;points[i*3]=Math.cos(lat)*Math.sin(lon);points[i*3+1]=Math.sin(lat);points[i*3+2]=Math.cos(lat)*Math.cos(lon);});return points;});}
function coastPath(context,arcs,radius,cx,cy){const ca=Math.cos(angle),sa=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);context.beginPath();for(const arc of arcs){let previous=false;for(let i=0;i<arc.length;i+=3){const x=arc[i]*ca-arc[i+2]*sa,z=arc[i+2]*ca+arc[i]*sa,y=arc[i+1]*ct-z*st,depth=z*ct+arc[i+1]*st;if(depth>0){if(previous)context.lineTo(cx+radius*x,cy-radius*y);else context.moveTo(cx+radius*x,cy-radius*y);previous=true;}else previous=false;}}context.stroke();}
fetch('land-low.json').then(r=>{if(!r.ok)throw Error('Coastline');return r.json()}).catch(()=>fetch('land.json').then(r=>r.json())).then(t=>{lowLand=decodeCoasts(t);revision++}).catch(()=>{document.querySelector('#region-note').textContent='Globe outline unavailable. Biography remains available.'});
fetch('highlights.json').then(r=>{if(!r.ok)throw Error('Highlights');return r.json()}).catch(()=>fetch('highlights-low.json').then(r=>r.json())).then(features=>{highlights=features;revision++}).catch(()=>{});
// Cache static geometry and render only when the view changes. Idle motion uses
// 30 fps; pointer interaction remains at the display's refresh rate.
const grid=[];for(let lat=-75;lat<=75;lat+=15)grid.push(Array.from({length:181},(_,i)=>[i*2-180,lat]));for(let lon=-180;lon<180;lon+=15)grid.push(Array.from({length:91},(_,i)=>[lon,i*2-90]));
// Precompute graticule coordinates once; keep exactly the same vertices.
const gridArcs=grid.map(points=>Float64Array.from(points.flatMap(([lon,lat])=>{const a=lon*Math.PI/180,b=lat*Math.PI/180;return [Math.cos(b)*Math.sin(a),Math.sin(b),Math.cos(b)*Math.cos(a)]})));
const featureCaps=new WeakMap(),featureParts=new WeakMap();
function visibleParts(feature){let parts=featureParts.get(feature);if(!parts){parts=feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates.map(coordinates=>({type:'Feature',geometry:{type:'Polygon',coordinates},properties:feature.properties})):[feature];featureParts.set(feature,parts);}return parts.filter(featureVisible);}
function featureVisible(feature){
 let cap=featureCaps.get(feature);
 if(!cap){const [[west,south],[east,north]]=d3.geoBounds(feature);const span=(east-west+360)%360||360;const lon=(west+span/2)*Math.PI/180,lat=(south+north)/2*Math.PI/180;cap={lon,lat,radius:Math.min(Math.PI,(span+north-south)*Math.PI/360)};featureCaps.set(feature,cap);}
 if(cap.radius>=Math.PI/2)return true;
 const dot=Math.sin(cap.lat)*Math.sin(tilt)+Math.cos(cap.lat)*Math.cos(tilt)*Math.cos(cap.lon-angle);
 return dot>=-Math.sin(cap.radius)-1e-9;
}
let geometryCache=null,oceanCache=null;
function projectedGeometry(){
 const detail=highlights.length?highlights:lowHighlights;
 const key=[angle,tilt,width,height].join('|');
 if(geometryCache?.key===key&&geometryCache.allies===allianceFeatures&&geometryCache.detail===detail&&geometryCache.taiwan===taiwanFeature&&geometryCache.occupation===occupationFeatures&&geometryCache.shipping===shippingFeatures)return geometryCache;
 const projection=d3.geoOrthographic().translate([width/2,height/2]).scale(r).rotate([-angle*180/Math.PI,-tilt*180/Math.PI,0]).clipAngle(90),pathMaker=d3.geoPath(projection);
 const paths=features=>{const result=[];for(const feature of features){if(!featureVisible(feature))continue;const parts=visibleParts(feature);if(!parts.length)continue;const path=new Path2D();pathMaker.context(path);for(const part of parts)pathMaker(part);result.push({feature,path});}return result;};
 geometryCache={key,allies:allianceFeatures,detail,taiwan:taiwanFeature,occupation:occupationFeatures,shipping:shippingFeatures,countries:paths([...allianceFeatures.filter(f=>!['840','158'].includes(f.id)),...detail,...(taiwanFeature?[taiwanFeature]:[])]),occupied:paths(occupationFeatures),routes:paths(shippingFeatures)};
 return geometryCache;
}
// A separate animation clock lets the routes flow while country details are open.
let routeTime=0;
let routeNetworkCache=null;
function drawTradeRoutes(routes){
 if(!routes.length)return;
 if(routeNetworkCache?.routes!==routes){
  const network=new Path2D();
  for(const {path} of routes)network.addPath(path);
  routeNetworkCache={routes,network};
 }
 const network=routeNetworkCache.network;
 const phase=routeTime*.00032,travel=routeTime*.018;
 const color=(offset,alpha=1)=>{
  const mix=(Math.sin(phase+offset)+1)/2;
  return `rgba(${Math.round(60+190*mix)},${Math.round(175-100*mix)},${Math.round(255-140*mix)},${alpha})`;
 };
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowBlur=0;
 const glow=ctx.createLinearGradient(width/2-r,height/2-r*.35,width/2+r,height/2+r*.35);
 for(let i=0;i<=4;i++)glow.addColorStop(i/4,color(i*Math.PI/2));
 // Seven batched strokes replace per-route shadow-blur passes.
 // Translucent ribbons give a soft neon halo without GPU blur filters.
 ctx.strokeStyle=glow;ctx.globalAlpha=.07;ctx.lineWidth=5;ctx.stroke(network);
 ctx.globalAlpha=.18;ctx.lineWidth=2.5;ctx.stroke(network);
 ctx.globalAlpha=.48;ctx.lineWidth=.7;ctx.stroke(network);
 for(let direction=0;direction<2;direction++){
  ctx.strokeStyle=color(direction*Math.PI);
  ctx.setLineDash([36,184]);
  ctx.lineDashOffset=(direction?1:-1)*travel+direction*110;
  ctx.globalAlpha=.14;ctx.lineWidth=3.2;ctx.stroke(network);
  ctx.globalAlpha=.82;ctx.lineWidth=1.15;ctx.stroke(network);
 }
 ctx.restore();
}
function draw(now=0){requestAnimationFrame(draw);if(document.hidden||!globeVisible){lastFrame=0;return;}const elapsed=now-lastFrame;if(lastFrame&&elapsed<(drag?15:32))return;const dt=lastFrame?Math.min(elapsed,100)/16.667:1;lastFrame=now;r=baseRadius;if(!paused&&!drag&&!hoverCountry&&!readingCard){angle+=.0009*dt;target=angle}if(!paused&&showRoutes)routeTime+=dt*16.667;const view=[angle,tilt,width,height,revision,showRoutes?routeTime:0].join('|');if(view===lastView)return;lastView=view;ctx.clearRect(0,0,width,height);const cx=width/2,cy=height/2;
// The viewing aperture stays circular and fixed; geography rotates inside the circular silhouette.
ctx.beginPath();ctx.arc(cx,cy,baseRadius,0,Math.PI*2);if(!oceanCache||oceanCache.width!==width||oceanCache.height!==height){const gradient=ctx.createRadialGradient(cx-baseRadius*.3,cy-baseRadius*.3,0,cx,cy,baseRadius);gradient.addColorStop(0,'#273440');gradient.addColorStop(.6,'#1b252f');gradient.addColorStop(1,'#11171e');oceanCache={width,height,gradient};}ctx.fillStyle=oceanCache.gradient;ctx.fill();
ctx.save();ctx.clip();
const geometry=projectedGeometry(),countryPaths=geometry.countries;
countryHitPaths=countryPaths;
for(const {feature,path} of countryPaths){ctx.save();ctx.globalAlpha=['840','156'].includes(feature.id)?1:.5;const group=feature.properties.group,us=feature.id==='840'||feature.properties.us,taiwan=feature.id==='158';ctx.fillStyle=group?(group==='partner'?'#c4657273':group==='special'?'#9cabb52b':'#568ac773'):us?'#568ac7b3':taiwan?'#e5c34dcc':'#c46572b3';ctx.fill(path);if(hoverCountry===feature.id){ctx.save();ctx.fillStyle='#ffffff18';ctx.fill(path);ctx.restore();}ctx.restore();}
ctx.strokeStyle='#7a91a52b';ctx.lineWidth=.4;coastPath(ctx,gridArcs,r,cx,cy);
ctx.strokeStyle='#a5b3bdb3';ctx.lineWidth=.6;coastPath(ctx,lowLand.length?lowLand:land,r,cx,cy);
// Keep both national outlines above the map's cyan coastlines.
for(const {feature,path} of countryPaths){ctx.save();ctx.globalAlpha=['840','156'].includes(feature.id)?1:.5;const group=feature.properties.group,us=feature.id==='840'||feature.properties.us,taiwan=feature.id==='158',color=group?(group==='partner'?'#ec929a66':group==='special'?'#b4c0cc55':'#86b8ee66'):us?'#86b8ee':'#ec929a';ctx.strokeStyle=taiwan?'#f5dc74':color;ctx.lineWidth=hoverCountry===feature.id?1.8:.7;ctx.stroke(path);ctx.restore();}
// Surface emblems sit above all geographic linework and country borders.
occupationHitPaths=[];
if(showOccupation){for(const {feature,path} of geometry.occupied){occupationHitPaths.push({feature,path});ctx.save();const ukraine=countryPaths.find(entry=>entry.feature.id==='804');if(ukraine)ctx.clip(ukraine.path);ctx.fillStyle=occupationPattern;ctx.fill(path);ctx.strokeStyle='#eeb9c8aa';ctx.lineWidth=.6;ctx.setLineDash([2,2]);ctx.stroke(path);ctx.restore();}}
if(showRoutes)drawTradeRoutes(geometry.routes);
drawSurfaceEmblems();
for(const [lon,lat,label,dy] of [[144.79,13.44,'Guam',13],[145.75,15.20,'N. Marianas',-10],[-170.70,-14.30,'Am. Samoa',-7],[166.65,19.29,'Wake',-7],[-177.37,28.21,'Midway',-7],[-162.08,5.88,'Palmyra',-7]]){const p=project(lon,lat);if(p[2]>.08){ctx.beginPath();ctx.arc(p[0],p[1],2,0,Math.PI*2);ctx.fillStyle='#8cbaec';ctx.fill();}}
ctx.restore();
// Share the globe's exact center and radius so its outline cannot drift.
ctx.save();ctx.beginPath();ctx.arc(cx,cy,baseRadius,0,Math.PI*2);ctx.strokeStyle='#f4f7fbad';ctx.lineWidth=1.2;ctx.shadowColor='#ffffff26';ctx.shadowBlur=8;ctx.stroke();ctx.restore();}
function updateButton(){document.body.classList.toggle('motion-paused',paused);motion.textContent=paused?'Resume motion':'Pause motion';motion.setAttribute('aria-label',paused?'Resume animation':'Pause animation');motion.setAttribute('aria-pressed',String(paused))}motion.onclick=()=>{paused=!paused;updateButton()};updateButton();
// Wheel gestures scroll the page. The globe supports rotation only.
let activePointer=null;
function resetView(){tilt=.20;angle=target=regions[sectionIndex][3];}
document.querySelector('#view-reset').onclick=resetView;
canvas.addEventListener('pointerdown',e=>{if(activePointer!==null)return;activePointer=e.pointerId;drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(e.pointerId!==activePointer)return;angle-=(e.clientX-lastX)*.006;target=angle;tilt=Math.max(-1.15,Math.min(1.15,tilt+(e.clientY-lastY)*.004));lastX=e.clientX;lastY=e.clientY;});
function releasePointer(e){if(e.pointerId!==activePointer)return;activePointer=null;drag=false;}
canvas.addEventListener('pointerup',releasePointer);canvas.addEventListener('pointercancel',releasePointer);canvas.addEventListener('lostpointercapture',releasePointer);
canvas.addEventListener('keydown',e=>{if(['0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();if(e.key==='0')resetView();if(e.key==='ArrowLeft')angle=target=angle-.08;if(e.key==='ArrowRight')angle=target=angle+.08;if(e.key==='ArrowUp')tilt=Math.min(1.15,tilt+.06);if(e.key==='ArrowDown')tilt=Math.max(-1.15,tilt-.06);});
const sections=[...document.querySelectorAll('main section')],links=[...document.querySelectorAll('.atlas nav a')];const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){sectionIndex=sections.indexOf(e.target);const data=regions[sectionIndex];document.querySelector('#chapter').textContent=String(sectionIndex+1).padStart(2,'0')+' / '+data[2];document.querySelector('#region').textContent=data[0];document.querySelector('#region-note').textContent=data[1];links.forEach((l,i)=>{l.classList.toggle('active',i===sectionIndex);if(i===sectionIndex)l.setAttribute('aria-current','location');else l.removeAttribute('aria-current')})}},{rootMargin:'-25% 0px -45% 0px'});sections.forEach(s=>observer.observe(s));resize();draw();

