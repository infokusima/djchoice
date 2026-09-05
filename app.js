"use strict";

const $ = (s) => document.querySelector(s);
const audio = $("#audio");
const stationList = $("#stationList");
const filtersEl = $("#filters");
const searchEl = $("#search");
const stateEl = $("#state");
const nameEl = $("#stationName");
const descEl = $("#stationDesc");
const kindEl = $("#kind");
const nowEl = $("#now");
const logo = $("#stationLogo");
const logoFallback = $("#logoFallback");
const logoCard = document.querySelector(".logo-card");
const eq = $("#equalizer");
const stationCount = $("#stationCount");
const deleteLocalBtn = $("#deleteLocalBtn");

const GROUP_ORDER = ["Všetky","SK","OLDIES","JAZZ","ONLY","ETNO","WORLD","CZ","PL","Moje","Slovo","Hudba","NEW"];
const LOCAL_KEY = "djchoice_web_v1_local";
const ASSIGNED_KEY = "djchoice_web_v1_assigned";

const seedStations = [
  {name:"KEXP Seattle",url:"https://kexp.streamguys1.com/kexp160.aac",kind:"Hudba",description:"Seattle • indie, rock, objavy",groups:["WORLD"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.kexp.org"},
  {name:"NTS 1",url:"https://stream-relay-geo.ntslive.net/stream?client=direct",kind:"Hudba",description:"London • underground, DJ kultúra, elektronika",groups:["WORLD"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.nts.live"},
  {name:"KCRW Eclectic24",url:"https://kcrw.streamguys1.com/kcrw_128k_mp3_e24",kind:"Hudba",description:"Los Angeles • kurátorovaná eklektická hudba",groups:["WORLD"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.kcrw.com"},
  {name:"RAI Radio 3",url:"https://icestreaming.rai.it/3.mp3",kind:"Hovorené",description:"Italia • kultúra, klasika, literatúra, rozhovory",groups:["WORLD"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.raiplaysound.it/radio3"},
  {name:"Radio Kapitał",url:"https://radiokapitalpl.out.airtime.pro/radiokapitalpl_a",kind:"Hudba",description:"Poľsko • komunitné rádio, experiment, elektronika",groups:["PL"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://radiokapital.pl"},
  {name:"RadioJAZZ.FM",url:"https://stream.open.fm/166",kind:"Hudba",description:"Poľsko • jazz, bop, autorské relácie",groups:["JAZZ","PL"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://radiojazz.fm"},
  {name:"SmoothJazz.com.pl",url:"https://bcast.vigormultimedia.com:48888/sjcompl256mp3",kind:"Hudba",description:"Poľsko • prevažne inštrumentálny smooth jazz",groups:["JAZZ","PL"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://smoothjazz.com.pl"},
  {name:"KJazz HD2 Bebop",url:"https://streaming.live365.com/a45189_2",kind:"Hudba",description:"USA • bebop a hard-bop",groups:["JAZZ"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.kkjz.org"},
  {name:"WDCB Jazz",url:"https://wdcb-ice.streamguys1.com/wdcb128",kind:"Hudba",description:"Chicago • mainstream a tradičný jazz",groups:["JAZZ"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://wdcb.org"},
  {name:"WRTI All-Jazz",url:"https://wrti-live.streamguys1.com/jazz-mp3",kind:"Hudba",description:"USA • 24-hodinový jazzový stream",groups:["JAZZ"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.wrti.org"},
  {name:"KSDS Jazz 88.3",url:"https://ksds-ice.streamguys1.com/ksds.mp3",kind:"Hudba",description:"USA • bop, standards, moderný mainstream",groups:["JAZZ"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.jazz88.org"},
  {name:"Jazz24",url:"https://knkx-live-a.edge.audiocdn.com/6285_128k",kind:"Hudba",description:"USA • klasici, standards a moderný mainstream",groups:["JAZZ"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.jazz24.org"},
  {name:"WBGO Jazz 88.3",url:"https://ais-sa8.cdnstream1.com/3629_128.mp3",kind:"Hudba",description:"USA • mainstream, bop a live",groups:["JAZZ"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.wbgo.org"},
  {name:"TSF Jazz",url:"https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3",kind:"Hudba",description:"Francúzsko • standards, bop, mainstream",groups:["JAZZ"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.tsfjazz.com"},
  {name:"ETNO India – Suburbs of Goa",url:"https://ice5.somafm.com/suburbsofgoa-128-mp3",kind:"Hudba",description:"India/Ázia • desi, world beat, tabla, sitár",groups:["ETNO"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://somafm.com/suburbsofgoa"},
  {name:"ETNO Arabia – Radio Orient",url:"https://stream.rcs.revma.com/7hnrkawf4p8uv.mp3",kind:"Hudba",description:"Arabský a blízkovýchodný mix",groups:["ETNO"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.radioorient.com"},
  {name:"ETNO Africa – Radio Africa Online",url:"https://ssl.rockhost.com/proxy/radioafr?mp=/stream",kind:"Hudba",description:"Afrika • soukous, afrobeat, kizomba",groups:["ETNO"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://radioafricaonline.com"},
  {name:"ETNO Celtic – ThistleRadio",url:"https://ice5.somafm.com/thistle-128-mp3",kind:"Hudba",description:"Keltské korene • Írsko a Škótsko",groups:["ETNO"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://somafm.com/thistle"},
  {name:"ETNO World – FIP Monde",url:"https://icecast.radiofrance.fr/fipworld-midfi.mp3",kind:"Hudba",description:"World music • Afrika, Ázia, Latinská Amerika",groups:["ETNO"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.radiofrance.fr/fip"}
];

let baseStations = seedStations;
let freshNew = [];
let localStations = loadLocal(LOCAL_KEY);
let assignedStations = loadLocal(ASSIGNED_KEY);
let current = null;
let filter = "Všetky";
let installPrompt = null;
let pendingAssign = null;
let failedThisSession = new Set();

function loadLocal(key){try{const x=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(x)?x:[]}catch{return []}}
function saveLocal(key,value){localStorage.setItem(key,JSON.stringify(value))}
function initials(name){const words=String(name||"DJ").replace(/^Rádio\s+/i,"").split(/\s+/).filter(Boolean);return words.slice(0,2).map(x=>x[0]?.toUpperCase()||"").join("")||"DJ"}
function allStations(){return [...baseStations,...assignedStations,...localStations,...freshNew]}
function groupsFor(s){const set=new Set(s.groups||[]);if(s.kind==="Hovorené")set.add("Slovo");if(s.kind==="Hudba")set.add("Hudba");if(s.local)set.add("Moje");if(s.newDiscovery)set.add("NEW");return [...set]}
function stationMatches(s){if(failedThisSession.has(s.url))return false;const q=searchEl.value.trim().toLocaleLowerCase("sk");const blob=`${s.name} ${s.description||""} ${groupsFor(s).join(" ")}`.toLocaleLowerCase("sk");if(q&&!blob.includes(q))return false;if(filter==="Všetky")return true;return groupsFor(s).includes(filter)}
function availableGroups(){const set=new Set(["Všetky"]);allStations().forEach(s=>groupsFor(s).forEach(g=>set.add(g)));return GROUP_ORDER.filter(g=>set.has(g))}
function renderFilters(){filtersEl.innerHTML="";for(const g of availableGroups()){const b=document.createElement("button");b.className="filter"+(filter===g?" active":"");b.textContent=g;b.addEventListener("click",()=>{filter=g;render()});filtersEl.appendChild(b)}}
function render(){renderFilters();const arr=allStations().filter(stationMatches);stationList.innerHTML="";for(const s of arr){const row=document.createElement("div");row.className="station"+(current===s?" active":"")+(s.newDiscovery?" new":"");row.tabIndex=0;row.innerHTML=`<div class="station-icon">${escapeHtml(initials(s.name))}</div><div class="station-text"><div class="station-name">${escapeHtml(s.name)}</div><div class="station-desc">${escapeHtml(s.description||"HTTPS stream")}</div></div><div class="station-tag">${s.newDiscovery?"NEW":"HTTPS"}</div>`;row.addEventListener("click",()=>selectStation(s,true));row.addEventListener("dblclick",e=>{if(s.newDiscovery){e.preventDefault();e.stopPropagation();openAssign(s)}});row.addEventListener("keydown",e=>{if(e.key==="Enter")selectStation(s,true)});stationList.appendChild(row)}stationCount.textContent=`${arr.length} staníc`+(filter==="NEW"?" • dvojklik = pridať do…":"");deleteLocalBtn.classList.toggle("hidden",!(current&&current.local))}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

async function selectStation(s,autoplay=false){current=s;nameEl.textContent=s.name;descEl.textContent=s.description||"Priamy HTTPS stream";kindEl.textContent=(s.kind||"Hudba").toUpperCase();nowEl.textContent="";setLogo(s);render();if(autoplay)await playCurrent()}
async function playCurrent(){if(!current)return;stopAudio(false);state("NAČÍTAVAM…","idle");audio.src=current.url;audio.volume=Number($("#volume").value);try{await audio.play();state("PRÁVE PREHRÁVA","playing");nowEl.textContent=current.name;eq.classList.add("playing");setMediaSession(current)}catch(err){markFailed(current,err)}}
function stopAudio(clear=true){audio.pause();audio.removeAttribute("src");audio.load();eq.classList.remove("playing");if(clear){state("NEPREHRÁVA SA","idle");nowEl.textContent=""}}
function state(text,cls){stateEl.textContent=text;stateEl.className="state "+cls}
function markFailed(s,err){failedThisSession.add(s.url);stopAudio(false);state("STREAM SA V PREHLIADAČI NEPREHRAL","error");nowEl.textContent="Táto stanica sa do konca tejto relácie skryje.";setTimeout(render,300);console.warn("DJ Choice stream failed:",s.name,err)}
function setLogo(s){logoCard.classList.remove("fx-flash","fx-wiggle","fx-pulse");const u=String(s.logo||"").trim();if(!u){logo.classList.add("hidden");logoFallback.classList.remove("hidden");logoFallback.textContent=initials(s.name);return}logo.onload=()=>{logo.classList.remove("hidden");logoFallback.classList.add("hidden")};logo.onerror=()=>{logo.classList.add("hidden");logoFallback.classList.remove("hidden");logoFallback.textContent=initials(s.name)};logo.src=u;logo.alt=`Logo ${s.name}`}
function setMediaSession(s){try{if("mediaSession" in navigator){navigator.mediaSession.metadata=new MediaMetadata({title:s.name,artist:"DJ Choice",album:"Web rádio"});navigator.mediaSession.setActionHandler("play",()=>audio.play());navigator.mediaSession.setActionHandler("pause",()=>audio.pause());navigator.mediaSession.setActionHandler("stop",()=>stopAudio())}}catch{}}

$("#playBtn").addEventListener("click",playCurrent);$("#stopBtn").addEventListener("click",()=>stopAudio());$("#volume").addEventListener("input",e=>audio.volume=Number(e.target.value));searchEl.addEventListener("input",render);
audio.addEventListener("playing",()=>{state("PRÁVE PREHRÁVA","playing");eq.classList.add("playing")});audio.addEventListener("pause",()=>{if(!audio.src)return;eq.classList.remove("playing")});audio.addEventListener("error",()=>{if(current&&audio.src)markFailed(current,audio.error)});

$("#addBtn").addEventListener("click",()=>$("#stationDialog").showModal());
$("#saveCustomBtn").addEventListener("click",e=>{e.preventDefault();const name=$("#customName").value.trim();const url=$("#customUrl").value.trim();if(!name||!url)return;if(!url.startsWith("https://")){alert("Webová DJ Choice prijíma iba HTTPS streamy.");return}const s={name,url,kind:"Hudba",description:"Moja webová stanica",groups:["Moje"],logo:"",local:true,source:"user"};localStations.push(s);saveLocal(LOCAL_KEY,localStations);$("#stationDialog").close();$("#stationForm").reset();filter="Moje";selectStation(s,false)});
deleteLocalBtn.addEventListener("click",()=>{if(!current||!current.local)return;if(!confirm(`Odstrániť „${current.name}“ z Moje?`))return;localStations=localStations.filter(x=>x!==current);saveLocal(LOCAL_KEY,localStations);stopAudio();current=null;render();nameEl.textContent="Vyber stanicu";descEl.textContent="V tejto verzii sa prehrávajú iba priame HTTPS streamy.";setLogo({name:"DJ"})});
function openAssign(s){pendingAssign=s;$("#assignStationName").textContent=s.name;$("#assignGroup").value="Moje";$("#assignDialog").showModal()}
$("#assignSaveBtn").addEventListener("click",e=>{e.preventDefault();if(!pendingAssign)return;const g=$("#assignGroup").value;const copy={...pendingAssign,groups:[g],newDiscovery:false,local:false,assigned:true,source:"radio-browser"};assignedStations.push(copy);saveLocal(ASSIGNED_KEY,assignedStations);freshNew=freshNew.filter(x=>x!==pendingAssign);pendingAssign=null;$("#assignDialog").close();filter=g;render()});

async function loadNew(){const hosts=["https://de1.api.radio-browser.info","https://nl1.api.radio-browser.info"];let list=null;for(const host of hosts){try{const url=host+"/json/stations/search?"+new URLSearchParams({hidebroken:"true",is_https:"true",order:"changetimestamp",reverse:"true",limit:"80"});const r=await fetch(url,{headers:{"Accept":"application/json"}});if(!r.ok)throw new Error("HTTP "+r.status);list=await r.json();if(Array.isArray(list))break}catch(e){list=null}}if(!Array.isArray(list))return;const codecs=new Set(["MP3","AAC","AAC+"]);const known=new Set(allStations().map(s=>s.url));const names=new Set(allStations().map(s=>s.name.toLocaleLowerCase("sk")));const out=[];for(const x of list){const url=String(x.url_resolved||x.url||"").trim();const name=String(x.name||"").trim();const codec=String(x.codec||"").toUpperCase().trim();const bitrate=Number(x.bitrate||0);const low=(name+" "+String(x.tags||"")).toLowerCase();if(!url.startsWith("https://"))continue;if(/\.m3u8?(?:$|\?)/i.test(url)||/\.pls(?:$|\?)/i.test(url))continue;if(!codecs.has(codec))continue;if(bitrate&&bitrate<48)continue;if(!name||known.has(url)||names.has(name.toLocaleLowerCase("sk")))continue;if(/adult|porn|sex radio|xxx/.test(low))continue;out.push({name,url,kind:"Hudba",description:`NEW • ${x.country||x.countrycode||"World"} • ${codec}${bitrate?` ${bitrate} kbps`:""}`,groups:["NEW"],logo:String(x.favicon||""),newDiscovery:true,source:"radio-browser"});known.add(url);names.add(name.toLocaleLowerCase("sk"));if(out.length>=15)break}freshNew=out;render()}

function buildEq(){eq.innerHTML="";const colors=["#45D9E6","#A7E84B","#FFD33F","#FF8A35","#FF4B91","#9C6CFF"];for(let i=0;i<20;i++){const b=document.createElement("div");b.className="eq-bar";b.style.background=colors[Math.floor(i/(20/colors.length))%colors.length];b.style.animationDelay=`-${(i*.083).toFixed(2)}s`;b.style.animationDuration=`${(.78+(i%5)*.11).toFixed(2)}s`;eq.appendChild(b)}}
setInterval(()=>{if(!audio.paused&&Math.random()<0.45){const n=document.createElement("div");n.className="note";n.textContent=["♪","♫","♩"][Math.floor(Math.random()*3)];eq.appendChild(n);setTimeout(()=>n.remove(),2800)}},7000);
setInterval(()=>{if(!audio.paused){const fx=["fx-flash","fx-wiggle","fx-pulse"][Math.floor(Math.random()*3)];logoCard.classList.remove("fx-flash","fx-wiggle","fx-pulse");void logoCard.offsetWidth;logoCard.classList.add(fx);setTimeout(()=>logoCard.classList.remove(fx),800)}},30000);

const quotes=[["Hudba dáva myšlienkam priestor.","DJ Choice"],["Bez hudby by bol život omyl.","Friedrich Nietzsche"],["Kde končia slová, začína hudba.","Heinrich Heine"],["Čas, ktorý si užívaš, nie je premárnený čas.","Bertrand Russell"],["Niekedy stačí zmeniť stanicu, nie celý deň.","DJ Choice"],["Dobrá hudba nepotrebuje povolenie vstúpiť do nálady.","DJ Choice"]];let qi=0;function rotateQuote(){qi=(qi+1)%quotes.length;$("#quoteText").textContent=quotes[qi][0];$("#quoteAuthor").textContent="— "+quotes[qi][1]}setInterval(rotateQuote,40000);
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("#installBtn").classList.remove("hidden")});$("#installBtn").addEventListener("click",async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("#installBtn").classList.add("hidden")});
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
(async function init(){buildEq();setLogo({name:"DJ"});render();await loadNew()})();
