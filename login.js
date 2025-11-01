const DEMO_USERS = [
  { email: 'student@school.edu', password: 'Passw0rd!', name: 'Estudiante' },
  { email: 'admin', password: 'admin', name: 'Admin' }
];
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 10;
const STORAGE_KEYS = { attempts: 'login_attempts', rememberedEmail: 'remembered_email', theme: 'pref_theme' };

function readAttempts(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.attempts)) || [] } catch { return [] } }
function writeAttempts(a){ localStorage.setItem(STORAGE_KEYS.attempts, JSON.stringify(a)) }
function purgeOldAttempts(){ const now=Date.now(); const ms=WINDOW_MINUTES*60*1000; const f=readAttempts().filter(ts=>now-ts<ms); writeAttempts(f); return f }
function setAlert(type,msg){ const el=document.getElementById('alert'); el.className=`alert ${type}`; el.textContent=msg; el.hidden=false }
function clearAlert(){ const el=document.getElementById('alert'); el.hidden=true; el.textContent=''; el.className='alert' }
function simulateNetwork(ms=400){ return new Promise(r=>setTimeout(r,ms)) }
function applyTheme(theme){ if(theme==='light'){ document.documentElement.style.setProperty('--bg','#f1f5f9'); document.documentElement.style.setProperty('--bg-2','#e2e8f0'); document.documentElement.style.setProperty('--text','#0f172a'); document.body.style.background='linear-gradient(180deg,#e2e8f0,#f8fafc)' } else { document.documentElement.style.setProperty('--bg','#0f172a'); document.documentElement.style.setProperty('--bg-2','#1e293b'); document.documentElement.style.setProperty('--text','#e2e8f0'); document.body.style.background='radial-gradient(1200px 600px at 20% 0%, #1f2937 0%, var(--bg) 40%), radial-gradient(900px 500px at 100% 100%, #0b1022 0%, #020617 70%)' } }
function setLoading(loading){ const b=document.getElementById('submitBtn'); if(loading){ b.disabled=true; b.innerHTML='<span class="spinner"></span>Ingresando…' } else { b.disabled=false; b.textContent='Entrar' } }
function lockoutIfNeeded(){ const a=purgeOldAttempts(); const b=document.getElementById('submitBtn'); if(a.length>=MAX_ATTEMPTS){ b.disabled=true; setAlert('warning',`Demasiados intentos fallidos. Intenta en ${WINDOW_MINUTES} minutos.`); return true } b.disabled=false; return false }
function persistRemembered(id,remember){ if(remember) localStorage.setItem(STORAGE_KEYS.rememberedEmail,id); else localStorage.removeItem(STORAGE_KEYS.rememberedEmail) }
function restoreRemembered(){ const x=localStorage.getItem(STORAGE_KEYS.rememberedEmail); if(x){ document.getElementById('email').value=x; document.getElementById('remember').checked=true } }

function findUser(identifier, password){
  const ident = String(identifier || '').toLowerCase();
  return DEMO_USERS.find(u => {
    const full = String(u.email || '').toLowerCase();
    const userPart = full.includes('@') ? full.split('@')[0] : full;
    const name = String(u.name || '').toLowerCase();
    return (full === ident || userPart === ident || name === ident) && u.password === password;
  });
}

window.addEventListener('DOMContentLoaded',()=>{
  restoreRemembered();
  applyTheme(localStorage.getItem(STORAGE_KEYS.theme)||'dark');

  const form=document.getElementById('loginForm');
  const email=document.getElementById('email');
  const pwd=document.getElementById('password');
  const remember=document.getElementById('remember');

  document.getElementById('togglePwd').addEventListener('click',()=>{ const isPw=pwd.type==='password'; pwd.type=isPw?'text':'password' });
  document.getElementById('toggleTheme').addEventListener('click',(e)=>{ e.preventDefault(); const next=(localStorage.getItem(STORAGE_KEYS.theme)||'dark')==='dark'?'light':'dark'; localStorage.setItem(STORAGE_KEYS.theme,next); applyTheme(next) });

  for(const el of [email,pwd]) el.addEventListener('input',()=>{ el.setAttribute('aria-invalid', String(!el.checkValidity())) });

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    clearAlert();
    if(lockoutIfNeeded()) return;
    if(!form.reportValidity()){ setAlert('error','Completa los campos requeridos.'); return }

    setLoading(true);
    await simulateNetwork();
    const user=findUser(email.value.trim(), pwd.value);
    if(!user){
      const a=purgeOldAttempts(); a.push(Date.now()); writeAttempts(a);
      setLoading(false); setAlert('error','Usuario o contraseña no válidos.'); lockoutIfNeeded(); return;
    }

    persistRemembered(email.value.trim(), remember.checked);
    sessionStorage.setItem('auth_user', JSON.stringify(user));
    setLoading(false);
    const target = new URL('tareas.html', window.location.href);
    window.location.assign(target.href);
  });
});
