
document.querySelector('.menu')?.addEventListener('click',()=>document.querySelector('.nav').classList.toggle('open'));
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>document.querySelector('.nav')?.classList.remove('open')));
