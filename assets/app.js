const formats={
 personal:{title:'Всё внимание —<br><em>вашему движению.</em>',eyebrow:'ВАША ЦЕЛЬ. ВАШ ТЕМП.',description:'Персональная работа с тренером: знакомство с вашим опытом, внимание к технике и упражнения под вашу задачу. Без необходимости подстраиваться под темп группы.',points:['Обсуждение цели и физической подготовки','Работа над техникой и контролем тела','Понятные объяснения во время занятия'],image:'assets/yuri.webp',alt:'Юрий Ряжкин в тренировочной студии',label:'ИНДИВИДУАЛЬНО · В СТУДИИ',cta:'Обсудить персональную тренировку',position:'50% 25%'},
 group:{title:'Двигаться вместе.<br><em>Внимание — каждому.</em>',eyebrow:'ФУНКЦИОНАЛЬНЫЕ ТРЕНИРОВКИ',description:'Занятия в небольшой группе: общая практика, внимание к движениям и атмосфера людей, которым тоже хочется сделать физическую активность частью жизни.',points:['Функциональные упражнения','Небольшая группа участников','Актуальный набор и расписание — у Юрия'],image:'assets/group.webp',alt:'Юрий с участницами групповой тренировки в студии',label:'ВМЕСТЕ · В МИНИ-ГРУППЕ',cta:'Узнать о мини-группе',position:'50% 40%'},
 sup:{title:'Поймать баланс.<br><em>Найти свой ритм.</em>',eyebrow:'SUP · ДВИЖЕНИЕ НА ВОДЕ',description:'Знакомство с SUP и работа над техникой гребли. Обсудите с Юрием свой опыт, желаемый формат и сезонные возможности для выхода на воду.',points:['Баланс и контроль движения','Техника гребли на SUP','Формат, площадка и сезонность — по договорённости'],image:'assets/sup-hero.webp',alt:'Юрий на SUP-доске во время заезда',label:'БАЛАНС · ТЕХНИКА · ВОДА',cta:'Обсудить SUP с Юрием',position:'50% center'}
};
const tabs=[...document.querySelectorAll('[data-format]')];
const panel=document.querySelector('#format-panel');
function selectFormat(tab,focus=false){
 const value=formats[tab.dataset.format];
 tabs.forEach(button=>{button.setAttribute('aria-selected',String(button===tab));button.tabIndex=button===tab?0:-1;});
 panel.setAttribute('aria-labelledby',tab.id);
 document.querySelector('#format-title').innerHTML=value.title;
 document.querySelector('#format-eyebrow').textContent=value.eyebrow;
 document.querySelector('#format-description').textContent=value.description;
 document.querySelector('#format-points').replaceChildren(...value.points.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
 const image=document.querySelector('#format-image');image.src=value.image;image.alt=value.alt;image.style.objectPosition=value.position;
 document.querySelector('#format-photo-label').textContent=value.label;
 const link=document.querySelector('#format-contact');link.replaceChildren(document.createTextNode(value.cta+' '));const arrow=document.createElement('span');arrow.textContent='↗';link.append(arrow);
 panel.classList.remove('panel-updated');requestAnimationFrame(()=>panel.classList.add('panel-updated'));
 if(focus)tab.focus({preventScroll:true});
}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectFormat(tab));tab.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();selectFormat(tabs[next],true);});});
const menuButton=document.querySelector('.menu-toggle'),mobileNav=document.querySelector('#mobile-nav');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');mobileNav.hidden=true;}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));menuButton.setAttribute('aria-label',open?'Открыть меню':'Закрыть меню');mobileNav.hidden=open;});
mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobileNav.hidden){closeMenu();menuButton.focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('.header'))closeMenu();});
matchMedia('(max-width:760px)').addEventListener('change',event=>{if(!event.matches)closeMenu();});
const motion=matchMedia('(prefers-reduced-motion:reduce)');
if(!motion.matches&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.08});document.body.classList.add('motion-ready');document.querySelectorAll('.reveal').forEach(element=>observer.observe(element));motion.addEventListener('change',()=>{if(motion.matches){document.body.classList.remove('motion-ready');observer.disconnect();}});}
