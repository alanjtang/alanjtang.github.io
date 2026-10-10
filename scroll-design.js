(() => {
  const loading=document.querySelector('#loading-screen');
  const scenes=[...document.querySelectorAll('.section-scene')];
  const sceneImages=scenes.map(scene=>scene.querySelector('img'));
  const sections=[...document.querySelectorAll('main section')];
  const progress=document.querySelector('.reading-progress span');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  let positions=[],target=0,current=0,raf=0,lastTime=0;
  const stopped=()=>reduced.matches||document.hidden||document.body.classList.contains('motion-paused');
  function chapter(y){
    const offset=innerWidth<=1100?innerHeight*.2:innerHeight*.32;
    const spot=y+offset*clamp(y/innerHeight);
    for(let i=positions.length-2;i>=0;i--)if(spot>=positions[i])return i+clamp((spot-positions[i])/(positions[i+1]-positions[i]));
    return 0;
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(paint)}
  function measure(){positions=sections.map(s=>s.getBoundingClientRect().top+scrollY);target=chapter(scrollY);schedule()}
  function paint(now=0){
    raf=0;const dt=lastTime?Math.min(64,now-lastTime)/16.667:1;lastTime=now;
    current=stopped()?target:current+(target-current)*(1-Math.pow(.88,dt));
    if(Math.abs(target-current)<.001)current=target;
    scenes.forEach((scene,i)=>{
      const distance=current-i,weight=clamp(1-Math.abs(distance));
      scene.style.opacity=(weight*.78).toFixed(3);
      scene.style.visibility=weight>.005?'visible':'hidden';
      scene.style.transform='none';
      // Only visible scenes need ambient animation work.
      sceneImages[i].style.animationPlayState=weight>.005&&!stopped()?'running':'paused';
    });
    progress.style.transform=`scaleX(${clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))})`;
    sections.forEach((section,i)=>{
      const reveal=reduced.matches?1:clamp((innerHeight-(positions[i]-scrollY))/(innerHeight*.38));
      section.style.setProperty('--reveal-opacity',(.25+.75*reveal).toFixed(3));
      section.style.setProperty('--reveal-y','0px');
    });
    if(current!==target&&!stopped())schedule();else lastTime=0;
  }
  addEventListener('scroll',()=>{target=chapter(scrollY);schedule()},{passive:true});
  addEventListener('resize',measure,{passive:true});
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',schedule);
  document.querySelector('#motion').addEventListener('click',schedule);
  document.querySelectorAll('details').forEach(detail=>detail.addEventListener('toggle',measure));
  document.body.classList.add('scroll-ready');measure();
  const dismiss=()=>loading?.classList.add('is-ready');
  if(reduced.matches) dismiss(); else addEventListener('load',()=>setTimeout(dismiss,1750),{once:true});
  addEventListener('load',measure,{once:true});
})();

// Keep the personal site branding consistent with the author's current name.
document.addEventListener('DOMContentLoaded',()=>{
  document.title='Alan Tang · Personal Atlas';
  const description=document.querySelector('meta[name="description"]');
  if(description) description.content='Alan Tang — University of Virginia student exploring military history, U.S. grand strategy, and foreign affairs.';
  document.querySelector('.image-credits')?.setAttribute('open','');
  const legend=document.querySelector('.country-legend');
  if(legend&&!legend.querySelector('.taiwan-legend')){const item=document.createElement('span');item.className='taiwan-legend';item.innerHTML='<img src="taiwan-flag.svg" alt="Republic of China flag" width="32" height="20">Taiwan / Republic of China';legend.appendChild(item);}
  const globeCanvas=document.querySelector('#globe'); if(globeCanvas) globeCanvas.setAttribute('aria-label','Rotating globe with the United States highlighted in blue, China in red, and Taiwan / Republic of China in yellow. Drag to rotate.');
});
