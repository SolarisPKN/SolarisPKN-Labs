// Universal back-to-top behavior. ClientRouter swaps pages without full reload.
export function initBackToTop() {
  const button=document.getElementById('back-to-top');
  if(!button || button.dataset.initialized==='true')return ()=>{};
  const controller=new AbortController();
  button.dataset.initialized='true';
  const {signal}=controller;
  const updateVisibility=()=>{
    button.hidden=window.scrollY<=320;
  };
  window.addEventListener('scroll',updateVisibility,{signal,passive:true});
  button.addEventListener('click',()=>{
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top:0,behavior:reduce?'instant':'smooth'});
  },{signal});
  updateVisibility();
  return ()=>{
    controller.abort();
    delete button.dataset.initialized;
  };
}
