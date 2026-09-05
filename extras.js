"use strict";

(() => {
  const APP_TZ = "Europe/Bratislava";
  const ONLY_STATIONS = [
    {name:"ONLY ABBA",url:"https://streaming.exclusive.radio/er-app/abba/icecast.audio",kind:"Hudba",description:"ABBA nonstop • HTTPS",groups:["ONLY"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://exclusive.radio"},
    {name:"ONLY Depeche Mode",url:"https://streaming.exclusive.radio/er-app/depechemode/icecast.audio",kind:"Hudba",description:"Depeche Mode nonstop • HTTPS",groups:["ONLY"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://exclusive.radio"},
    {name:"ONLY Queen",url:"https://streaming.exclusive.radio/er-app/queen/icecast.audio",kind:"Hudba",description:"Queen nonstop • HTTPS",groups:["ONLY"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://exclusive.radio"},
    {name:"ONLY Pink Floyd",url:"https://streaming.exclusive.radio/er-app/pinkfloyd/icecast.audio",kind:"Hudba",description:"Pink Floyd nonstop • HTTPS",groups:["ONLY"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://exclusive.radio"},
    {name:"ONLY Beatles",url:"https://streaming.exclusive.radio/er-app/beatles/icecast.audio",kind:"Hudba",description:"The Beatles nonstop • HTTPS",groups:["ONLY"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://exclusive.radio"},
    {name:"ONLY Elvis Presley",url:"https://streaming.exclusive.radio/er-app/elvispresley/icecast.audio",kind:"Hudba",description:"Elvis Presley nonstop • HTTPS",groups:["ONLY"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://exclusive.radio"}
  ];

  const EUROPE_CODES = new Set([
    "AL","AD","AT","BY","BE","BA","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IS",
    "IE","IT","XK","LV","LI","LT","LU","MT","MD","MC","ME","NL","MK","NO","PL","PT","RO","RU",
    "SM","RS","SK","SI","ES","SE","CH","TR","UA","GB","VA"
  ]);
  const INTERESTING_TAGS = /jazz|blues|soul|funk|rock|indie|alternative|classical|ambient|world|folk|electronic|electronica|reggae|metal|experimental|instrumental|acoustic|chill|downtempo|fusion|bossa|latin/i;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function addOnlyStations() {
    try {
      if (typeof baseStations === "undefined" || !Array.isArray(baseStations)) return;
      const known = new Set(baseStations.map(s => String(s.url || "")));
      const add = ONLY_STATIONS.filter(s => !known.has(s.url));
      if (add.length) baseStations = [...add, ...baseStations];
      if (typeof render === "function") render();
    } catch (e) {
      console.warn("DJ Choice ONLY init failed", e);
    }
  }

  async function loadSmartNew() {
    try {
      if (typeof baseStations === "undefined" || typeof freshNew === "undefined") return;
      const hosts = [
        "https://de1.api.radio-browser.info",
        "https://nl1.api.radio-browser.info",
        "https://at1.api.radio-browser.info"
      ];
      let list = null;
      for (const host of hosts) {
        try {
          const url = host + "/json/stations/search?" + new URLSearchParams({
            hidebroken: "true",
            is_https: "true",
            order: "changetimestamp",
            reverse: "true",
            limit: "240"
          });
          const r = await fetch(url, {headers: {"Accept": "application/json"}, cache: "no-store"});
          if (!r.ok) throw new Error("HTTP " + r.status);
          const data = await r.json();
          if (Array.isArray(data)) {
            list = data;
            break;
          }
        } catch {}
      }
      if (!Array.isArray(list)) return;

      const stable = [
        ...(Array.isArray(baseStations) ? baseStations : []),
        ...(typeof assignedStations !== "undefined" && Array.isArray(assignedStations) ? assignedStations : []),
        ...(typeof localStations !== "undefined" && Array.isArray(localStations) ? localStations : [])
      ];
      const knownUrls = new Set(stable.map(s => String(s.url || "")));
      const knownNames = new Set(stable.map(s => String(s.name || "").trim().toLocaleLowerCase("sk")));
      const codecs = new Set(["MP3", "AAC", "AAC+"]);
      const candidates = [];

      for (const x of list) {
        const url = String(x.url_resolved || x.url || "").trim();
        const name = String(x.name || "").trim();
        const codec = String(x.codec || "").toUpperCase().trim();
        const bitrate = Number(x.bitrate || 0);
        const countryCode = String(x.countrycode || "").toUpperCase().trim();
        const tags = String(x.tags || "").trim();
        const low = `${name} ${tags}`.toLowerCase();

        if (!url.startsWith("https://")) continue;
        if (/\.m3u8?(?:$|\?)/i.test(url) || /\.pls(?:$|\?)/i.test(url)) continue;
        if (!codecs.has(codec)) continue;
        if (bitrate && bitrate < 48) continue;
        if (!name || knownUrls.has(url) || knownNames.has(name.toLocaleLowerCase("sk"))) continue;
        if (/adult|porn|sex radio|xxx/.test(low)) continue;

        candidates.push({
          name,
          url,
          kind: "Hudba",
          description: `NEW • ${x.country || countryCode || "World"} • ${codec}${bitrate ? ` ${bitrate} kbps` : ""}`,
          groups: ["NEW"],
          logo: String(x.favicon || ""),
          newDiscovery: true,
          source: "radio-browser",
          _countryCode: countryCode,
          _tags: tags
        });
        knownUrls.add(url);
        knownNames.add(name.toLocaleLowerCase("sk"));
      }

      shuffle(candidates);
      const chosen = [];
      const used = new Set();
      const take = (pool, n) => {
        for (const s of shuffle([...pool])) {
          if (chosen.length >= 15 || n <= 0) break;
          if (used.has(s.url)) continue;
          used.add(s.url);
          chosen.push(s);
          n--;
        }
      };

      take(candidates.filter(s => EUROPE_CODES.has(s._countryCode)), 5);
      take(candidates.filter(s => INTERESTING_TAGS.test(`${s.name} ${s._tags}`)), 5);
      take(candidates, 5);
      if (chosen.length < 15) take(candidates, 15 - chosen.length);

      const clean = chosen.slice(0, 15).map(({_countryCode, _tags, ...s}) => s);
      freshNew = clean;
      window.__djchoiceSmartNew = clean;
      if (typeof render === "function") render();

      // Druhé potvrdenie po štarte pre prípad, že pôvodný loader dobiehal pomalšie.
      setTimeout(() => {
        try {
          if (window.__djchoiceSmartNew?.length) {
            freshNew = window.__djchoiceSmartNew;
            if (typeof render === "function") render();
          }
        } catch {}
      }, 7000);
    } catch (e) {
      console.warn("DJ Choice smart NEW failed", e);
    }
  }

  let thoughtTimer = null;
  let thoughtDeck = [];
  let thoughtPos = 0;
  let thoughtTone = -1;
  let thoughtUi = null;

  function installThoughtUi() {
    if (thoughtUi) return thoughtUi;
    const text = document.querySelector("#quoteText");
    const author = document.querySelector("#quoteAuthor");
    const card = text?.closest(".quote-card");
    if (!text || !author || !card) return null;

    // Pôvodný app.js si každých 40 s ďalej "otáča" svoje skryté prvky.
    // Viditeľnú myšlienku preberá tento doplnok, takže ju môžeme nechať
    // pokojne 80–100 sekúnd bez zásahu do jadra rádia.
    text.id = "quoteTextDisplay";
    author.id = "quoteAuthorDisplay";

    const dummyText = document.createElement("span");
    dummyText.id = "quoteText";
    dummyText.hidden = true;
    const dummyAuthor = document.createElement("span");
    dummyAuthor.id = "quoteAuthor";
    dummyAuthor.hidden = true;
    card.append(dummyText, dummyAuthor);

    thoughtUi = {text, author, card};
    return thoughtUi;
  }

  function paintThought(item, immediate = false) {
    const ui = installThoughtUi();
    if (!ui || !item) return;
    const [text, author] = item;

    thoughtTone = (thoughtTone + 1) % 5;
    ui.card.classList.remove("thought-tone-0", "thought-tone-1", "thought-tone-2", "thought-tone-3", "thought-tone-4");
    ui.card.classList.add(`thought-tone-${thoughtTone}`);

    const apply = () => {
      ui.text.textContent = text;
      ui.author.textContent = "— " + (author || "DJ Choice");
      requestAnimationFrame(() => ui.card.classList.remove("thought-changing"));
    };

    if (immediate) {
      apply();
    } else {
      ui.card.classList.add("thought-changing");
      setTimeout(apply, 260);
    }
  }

  function scheduleThought() {
    clearTimeout(thoughtTimer);
    // Pôvodne 40 s. Teraz približne dvojnásobok, s malou náhodou,
    // aby panel nepôsobil ako mechanické hodiny.
    const wait = 80000 + Math.random() * 20000;
    thoughtTimer = setTimeout(showNextThought, wait);
  }

  function showNextThought() {
    if (!thoughtDeck.length) return;
    if (thoughtPos >= thoughtDeck.length) {
      shuffle(thoughtDeck);
      thoughtPos = 0;
    }
    paintThought(thoughtDeck[thoughtPos++], false);
    scheduleThought();
  }

  function startThoughtCycle(items) {
    const clean = (items || [])
      .map(x => Array.isArray(x) ? [String(x[0] || "").trim(), String(x[1] || "DJ Choice").trim()] : [String(x.text || "").trim(), String(x.author || "DJ Choice").trim()])
      .filter(x => x[0]);
    if (!clean.length) return;
    thoughtDeck = shuffle([...clean]);
    thoughtPos = 0;
    paintThought(thoughtDeck[thoughtPos++], true);
    scheduleThought();
  }

  async function loadThoughts() {
    installThoughtUi();
    try {
      const r = await fetch("./thoughts.json?v=1", {cache: "no-store"});
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      if (!Array.isArray(data) || data.length < 20) throw new Error("Too few thoughts");

      const normalized = data
        .map(x => [String(x.text || "").trim(), String(x.author || "DJ Choice").trim()])
        .filter(x => x[0]);

      // Zachováme aj globálny zásobník kvôli kompatibilite s pôvodnou aplikáciou.
      if (typeof quotes !== "undefined" && Array.isArray(quotes)) {
        quotes.splice(0, quotes.length, ...normalized);
      }
      startThoughtCycle(normalized);
    } catch (e) {
      console.warn("DJ Choice thoughts load failed", e);
      try {
        if (typeof quotes !== "undefined" && Array.isArray(quotes)) startThoughtCycle(quotes);
      } catch {}
    }
  }

  function installTodayCard() {
    if (document.querySelector("#todayCard")) return;
    const side = document.querySelector(".side");
    if (!side) return;

    const card = document.createElement("section");
    card.id = "todayCard";
    card.className = "today-card";
    card.innerHTML = `
      <div class="side-title">DNES • SLOVENSKO</div>
      <div id="todayWeekday" class="today-weekday">—</div>
      <div id="todayDate" class="today-date">—</div>
      <div id="todayClock" class="today-clock">--:--:--</div>
      <div class="today-meta">
        <div id="todayNameday" class="today-nameday">Meniny: načítavam…</div>
        <div id="todayHoliday" class="today-holiday hidden"></div>
      </div>
    `;
    side.appendChild(card);

    let loadedDate = "";
    const dateFmt = new Intl.DateTimeFormat("sk-SK", {
      timeZone: APP_TZ, year: "numeric", month: "long", day: "numeric"
    });
    const weekdayFmt = new Intl.DateTimeFormat("sk-SK", {
      timeZone: APP_TZ, weekday: "long"
    });
    const timeFmt = new Intl.DateTimeFormat("sk-SK", {
      timeZone: APP_TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    });
    const isoPartsFmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TZ, year: "numeric", month: "2-digit", day: "2-digit"
    });

    const isoDate = now => {
      const p = Object.fromEntries(isoPartsFmt.formatToParts(now).map(x => [x.type, x.value]));
      return `${p.year}-${p.month}-${p.day}`;
    };

    const titleCase = s => s ? s.charAt(0).toLocaleUpperCase("sk") + s.slice(1) : s;

    const renderClock = () => {
      const now = new Date();
      const d = isoDate(now);
      document.querySelector("#todayWeekday").textContent = titleCase(weekdayFmt.format(now));
      document.querySelector("#todayDate").textContent = dateFmt.format(now);
      document.querySelector("#todayClock").textContent = timeFmt.format(now);
      if (d !== loadedDate) {
        loadedDate = d;
        refreshDayData(d);
      }
    };

    const extractNameday = data => {
      const v = data?.data?.sk ?? data?.nameday?.sk ?? data?.data?.nameday?.sk;
      if (Array.isArray(v)) return v.filter(Boolean).join(", ");
      if (typeof v === "string") return v.trim();
      if (v && typeof v === "object") return Object.values(v).filter(Boolean).join(", ");
      return "";
    };

    const extractHolidayName = item => {
      if (!item) return "";
      const n = item.name ?? item.names ?? item.title;
      if (typeof n === "string") return n;
      if (Array.isArray(n)) {
        const sk = n.find(x => /^(sk|slk)$/i.test(String(x?.language || x?.languageIsoCode || "")));
        const first = sk || n[0];
        return String(first?.text || first?.name || first?.value || "").trim();
      }
      return String(n?.text || n?.name || "").trim();
    };

    async function refreshDayData(date) {
      const namedayEl = document.querySelector("#todayNameday");
      const holidayEl = document.querySelector("#todayHoliday");
      namedayEl.textContent = "Meniny: načítavam…";
      holidayEl.classList.add("hidden");
      holidayEl.textContent = "";

      const cachedRaw = localStorage.getItem("djchoice_daydata_v1");
      let cached = null;
      try { cached = cachedRaw ? JSON.parse(cachedRaw) : null; } catch {}

      let nameday = "";
      let holiday = "";
      let namedayOk = false;
      let holidayOk = false;

      try {
        const [, month, day] = date.split("-");
        const endpoints = [
          `https://nameday.abalin.net/api/V2/today?timezone=${encodeURIComponent(APP_TZ)}`,
          `https://nameday.abalin.net/api/V2/date?day=${Number(day)}&month=${Number(month)}`
        ];
        for (const endpoint of endpoints) {
          try {
            const r = await fetch(endpoint, {headers: {"Accept": "application/json"}, cache: "no-store"});
            if (!r.ok) throw new Error("HTTP " + r.status);
            const value = extractNameday(await r.json());
            namedayOk = true;
            if (value) {
              nameday = value;
              break;
            }
          } catch {}
        }
      } catch {}

      try {
        const u = new URL("https://openholidaysapi.org/PublicHolidays");
        u.searchParams.set("countryIsoCode", "SK");
        u.searchParams.set("languageIsoCode", "SK");
        u.searchParams.set("validFrom", date);
        u.searchParams.set("validTo", date);
        const r = await fetch(u, {headers: {"Accept": "application/json"}, cache: "no-store"});
        if (!r.ok) throw new Error("HTTP " + r.status);
        const data = await r.json();
        holiday = Array.isArray(data) && data.length ? extractHolidayName(data[0]) : "";
        holidayOk = true;
      } catch {}

      if ((!namedayOk || !holidayOk) && cached?.date === date) {
        if (!namedayOk) nameday = cached.nameday || "";
        if (!holidayOk) holiday = cached.holiday || "";
      }

      if (nameday) namedayEl.textContent = `Meniny má ${nameday}`;
      else namedayEl.textContent = namedayOk ? "Meniny: —" : "Meniny: údaj nedostupný";

      if (holiday) {
        holidayEl.textContent = holiday;
        holidayEl.classList.remove("hidden");
      }

      if (namedayOk || holidayOk) {
        localStorage.setItem("djchoice_daydata_v1", JSON.stringify({date, nameday, holiday}));
      }
    }

    renderClock();
    setInterval(renderClock, 250);
  }

  function installKineticEq() {
    const eqEl = document.querySelector("#equalizer");
    if (!eqEl) return;

    let attempts = 0;
    const start = () => {
      const bars = [...eqEl.querySelectorAll(".eq-bar")];
      if (!bars.length) {
        if (attempts++ < 30) setTimeout(start, 100);
        return;
      }
      if (eqEl.dataset.kineticReady === "1") return;
      eqEl.dataset.kineticReady = "1";

      let ball = eqEl.querySelector(".eq-ball");
      if (!ball) {
        ball = document.createElement("div");
        ball.className = "eq-ball";
        ball.setAttribute("aria-hidden", "true");
        eqEl.appendChild(ball);
      }

      const states = bars.map((bar, i) => ({
        bar,
        value: 20 + Math.random() * 45,
        target: 10 + Math.random() * 80,
        speed: 24 + Math.random() * 55,
        nextAt: performance.now() + 150 + Math.random() * 1100,
        pulse: 0,
        i
      }));

      let bx = 48;
      let by = 34;
      let vx = 125;
      let vy = -155;
      let last = performance.now();
      let calmUntil = 0;
      let nextCalmAt = last + 20000 + Math.random() * 20000;
      const audioEl = document.querySelector("#audio");
      const radius = 7;

      ball.style.transform = `translate(${(bx-radius).toFixed(1)}px, ${(by-radius).toFixed(1)}px)`;

      const chooseTarget = (s, now, calm) => {
        if (calm) {
          s.target = 8 + Math.random() * 18;
          s.speed = 12 + Math.random() * 18;
          s.nextAt = now + 500 + Math.random() * 1200;
        } else {
          const cluster = Math.random();
          if (cluster < 0.16) s.target = 70 + Math.random() * 25;
          else if (cluster < 0.34) s.target = 8 + Math.random() * 20;
          else s.target = 18 + Math.random() * 62;
          s.speed = 22 + Math.random() * 65;
          s.nextAt = now + 180 + Math.random() * 1100;
        }
      };

      const kickHorizontal = strength => {
        vx += (Math.random() - 0.5) * strength;
        if (Math.abs(vx) < 60) vx = (Math.random() < 0.5 ? -1 : 1) * (85 + Math.random() * 55);
        vx = Math.max(-215, Math.min(215, vx));
      };

      const loop = now => {
        const dt = Math.min(0.035, Math.max(0.001, (now - last) / 1000));
        last = now;

        if (!audioEl || audioEl.paused) {
          requestAnimationFrame(loop);
          return;
        }

        if (now >= nextCalmAt && now >= calmUntil) {
          calmUntil = now + 2000 + Math.random() * 1000;
          nextCalmAt = calmUntil + 20000 + Math.random() * 20000;
        }
        const calm = now < calmUntil;

        for (const s of states) {
          if (now >= s.nextAt) chooseTarget(s, now, calm);
          const dir = Math.sign(s.target - s.value);
          const step = s.speed * dt;
          if (Math.abs(s.target - s.value) <= step) s.value = s.target;
          else s.value += dir * step;
          if (s.pulse > 0) s.pulse = Math.max(0, s.pulse - 80 * dt);
          const h = Math.max(5, Math.min(98, s.value + s.pulse));
          s.bar.style.height = `${h}%`;
        }

        // Najprv nech prehliadač spočíta SKUTOČNÚ polohu stĺpcov vrátane paddingu a medzier.
        const eqRect = eqEl.getBoundingClientRect();
        const W = Math.max(80, eqRect.width);
        const H = Math.max(70, eqRect.height);
        const oldY = by;

        const g = calm ? 210 : 390;
        vx *= calm ? 0.997 : 0.999;
        vy += g * dt;
        bx += vx * dt;
        by += vy * dt;

        if (bx < radius + 2) {
          bx = radius + 2;
          vx = Math.abs(vx) * (0.88 + Math.random() * 0.08);
          kickHorizontal(24);
        } else if (bx > W - radius - 2) {
          bx = W - radius - 2;
          vx = -Math.abs(vx) * (0.88 + Math.random() * 0.08);
          kickHorizontal(24);
        }

        if (by < radius + 2) {
          by = radius + 2;
          vy = Math.abs(vy) * 0.84;
        }

        // Kolízia sa už nepočíta z percentuálnej výšky. Berieme reálny DOM obdĺžnik
        // stĺpca, takže loptička sa odráža presne od toho, čo používateľ vidí.
        let hit = null;
        if (vy > 0) {
          const oldBottom = oldY + radius;
          const newBottom = by + radius;
          for (const s of states) {
            const r = s.bar.getBoundingClientRect();
            const left = r.left - eqRect.left;
            const right = r.right - eqRect.left;
            const top = r.top - eqRect.top;
            const overlapsX = bx + radius * 0.72 >= left && bx - radius * 0.72 <= right;
            const crossedTop = oldBottom <= top + 5 && newBottom >= top - 1;
            const nearSurface = newBottom >= top - 1 && by <= top + radius + 5;
            if (overlapsX && (crossedTop || nearSurface)) {
              if (!hit || top < hit.top) hit = {s, top};
            }
          }
        }

        if (hit) {
          by = hit.top - radius - 0.5;
          const rebound = calm ? 135 + Math.random() * 45 : 185 + Math.random() * 85;
          vy = -rebound;
          kickHorizontal(calm ? 38 : 82);
          hit.s.pulse = Math.min(30, hit.s.pulse + 11 + Math.random() * 15);
        }

        // Dno je len záchranná sieť. Ak loptička trafí medzeru medzi stĺpcami,
        // necupká po čiare: dostane poriadny nový výskok späť do poľa.
        const floorY = H - radius - 4;
        if (by > floorY) {
          by = floorY;
          vy = -(calm ? 145 + Math.random() * 45 : 205 + Math.random() * 75);
          kickHorizontal(calm ? 55 : 110);
        }

        ball.style.transform = `translate(${(bx - radius).toFixed(1)}px, ${(by - radius).toFixed(1)}px)`;
        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    };

    start();
  }

  function installJukeboxIdle() {
    const body = document.body;
    const audioEl = document.querySelector("#audio");
    if (!body || !audioEl) return;

    let idleTimer = null;
    let lastMoveReset = 0;
    const IDLE_MS = 75000;

    const leaveIdle = () => body.classList.remove("dj-jukebox");
    const arm = () => {
      clearTimeout(idleTimer);
      if (audioEl.paused) {
        leaveIdle();
        return;
      }
      idleTimer = setTimeout(() => {
        if (!audioEl.paused) body.classList.add("dj-jukebox");
      }, IDLE_MS);
    };
    const activity = () => {
      leaveIdle();
      arm();
    };
    const pointerActivity = () => {
      const now = performance.now();
      if (body.classList.contains("dj-jukebox") || now - lastMoveReset > 2500) {
        lastMoveReset = now;
        activity();
      }
    };

    document.addEventListener("pointermove", pointerActivity, {passive:true});
    document.addEventListener("pointerdown", activity, {passive:true});
    document.addEventListener("wheel", activity, {passive:true});
    document.addEventListener("touchstart", activity, {passive:true});
    document.addEventListener("keydown", activity);
    audioEl.addEventListener("playing", activity);
    audioEl.addEventListener("pause", () => { clearTimeout(idleTimer); leaveIdle(); });
    audioEl.addEventListener("ended", () => { clearTimeout(idleTimer); leaveIdle(); });
  }

  function installLogoFlagWave() {
    const card = document.querySelector(".logo-card");
    const audioEl = document.querySelector("#audio");
    const sourceImg = document.querySelector("#stationLogo");
    const sourceFallback = document.querySelector("#logoFallback");
    if (!card || !audioEl || !sourceImg || !sourceFallback) return;

    let timer = null;
    let firstWave = true;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    // Staré flash/wiggle/pulse necháme v app.js bežať, ale vizuálne ich zruší CSS.
    const cleanOldFx = () => {
      if (["fx-flash", "fx-wiggle", "fx-pulse"].some(c => card.classList.contains(c))) {
        card.classList.remove("fx-flash", "fx-wiggle", "fx-pulse");
      }
    };
    const fxObserver = new MutationObserver(cleanOldFx);
    fxObserver.observe(card, {attributes:true, attributeFilter:["class"]});

    const schedule = () => {
      clearTimeout(timer);
      if (audioEl.paused || reducedMotion) return;
      const idle = document.body.classList.contains("dj-jukebox");
      const delay = firstWave ? 4500 : (idle ? 14000 + Math.random()*10000 : 23000 + Math.random()*15000);
      firstWave = false;
      timer = setTimeout(runWave, delay);
    };

    const runWave = () => {
      if (audioEl.paused || reducedMotion) return schedule();
      cleanOldFx();
      card.querySelector(".logo-flag-wave")?.remove();

      const cr = card.getBoundingClientRect();
      const W = cr.width;
      const H = cr.height;
      if (W < 40 || H < 40) return schedule();

      const imgVisible = !sourceImg.classList.contains("hidden") && !!(sourceImg.currentSrc || sourceImg.src);
      const fallbackVisible = !sourceFallback.classList.contains("hidden");
      if (!imgVisible && !fallbackVisible) return schedule();

      const layer = document.createElement("div");
      layer.className = "logo-flag-wave";
      const slices = 12;
      const sw = W / slices;

      let sourceRect = null;
      if (imgVisible) sourceRect = sourceImg.getBoundingClientRect();

      for (let i = 0; i < slices; i++) {
        const left = i * sw;
        const slice = document.createElement("div");
        slice.className = "logo-wave-slice";
        slice.style.left = `${left}px`;
        slice.style.width = `${sw + 1.2}px`;
        slice.style.setProperty("--wave-amp", `${5.2 + Math.sin((i/slices)*Math.PI)*3.2}px`);
        slice.style.animationDelay = `${i * 0.115}s`;

        const inner = document.createElement("div");
        inner.className = "logo-wave-inner";
        inner.style.width = `${W}px`;
        inner.style.height = `${H}px`;
        inner.style.left = `${-left}px`;

        if (imgVisible && sourceRect) {
          const im = document.createElement("img");
          im.src = sourceImg.currentSrc || sourceImg.src;
          im.alt = "";
          im.style.left = `${sourceRect.left - cr.left}px`;
          im.style.top = `${sourceRect.top - cr.top}px`;
          im.style.width = `${sourceRect.width}px`;
          im.style.height = `${sourceRect.height}px`;
          inner.appendChild(im);
        } else {
          const fb = document.createElement("div");
          fb.className = "logo-wave-fallback";
          fb.textContent = sourceFallback.textContent || "DJ";
          inner.appendChild(fb);
        }
        slice.appendChild(inner);
        layer.appendChild(slice);
      }

      card.appendChild(layer);
      card.classList.add("flag-wave-active");
      const total = 5600 + (slices - 1) * 115;
      setTimeout(() => {
        card.classList.remove("flag-wave-active");
        layer.remove();
        schedule();
      }, total);
    };

    audioEl.addEventListener("playing", schedule);
    audioEl.addEventListener("pause", () => {
      clearTimeout(timer);
      card.classList.remove("flag-wave-active");
      card.querySelector(".logo-flag-wave")?.remove();
    });
    audioEl.addEventListener("ended", () => clearTimeout(timer));
    if (!audioEl.paused) schedule();
  }


  // V5 – darčekový priečinok HELEN: kresťanské rádiá + lokálna fotogaléria.
  const HELEN_STATIONS = [
    {name:"Rádio Lumen",url:"https://audio.lumen.sk/live64.mp3",kind:"Kresťanské",description:"Slovensko • katolícke rádio • živé vysielanie",groups:["HELEN","SK"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.lumen.sk"},
    {name:"Rádio 7 SK",url:"https://play.radio7.sk/128",kind:"Kresťanské",description:"Slovensko • kresťanské rádio • hudba a slovo",groups:["HELEN","SK"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://radio7.sk"},
    {name:"Rádio Mária Slovensko",url:"https://dreamsiteradiocp5.com/proxy/radiomariaslomp3?mp=/stream.mp3",kind:"Kresťanské",description:"Slovensko • katolícke rádio • modlitba a duchovné slovo",groups:["HELEN","SK"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.radiomaria.sk"},
    {name:"Mirjam Rádio – Mária Rádió Felvidék",url:"https://stream.mariaradio.hu:8000/mr",kind:"Kresťanské",description:"Slovensko • maďarské kresťanské vysielanie",groups:["HELEN","SK"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://mariaradio.sk"},
    {name:"Rádio 7 CZ",url:"https://icecast8.play.cz/radio7-128.mp3",kind:"Kresťanské",description:"Česko • TWR • kresťanské slovo a hudba",groups:["HELEN","CZ"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://radio7.cz"},
    {name:"Radio Proglas",url:"https://icecast2.play.cz/proglas128",kind:"Kresťanské",description:"Česko • kresťanské rodinné rádio • 128 kbps MP3",groups:["HELEN","CZ"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.proglas.cz"},
    {name:"CBN Gospel",url:"https://cbnradio.streamguys1.com/gospel-128K",kind:"Hudba",description:"Gospel • USA • CBN • 128 kbps MP3",groups:["HELEN","WORLD"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.cbn.com"},
    {name:"CBN Praise",url:"https://cbnradio.streamguys1.com/praise-128K",kind:"Hudba",description:"Praise & Worship • USA • CBN • 128 kbps MP3",groups:["HELEN","WORLD"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.cbn.com"},
    {name:"CBN Southern Gospel",url:"https://cbnradio.streamguys1.com/southern-gospel-128K",kind:"Hudba",description:"Southern Gospel • USA • CBN • 128 kbps MP3",groups:["HELEN","WORLD"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.cbn.com"},
    {name:"K-LOVE",url:"https://maestro.emfcdn.com/stream_for/k-love/iheart/aac",kind:"Hudba",description:"Contemporary Christian • USA • K-LOVE",groups:["HELEN","WORLD"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://www.klove.com"},
    {name:"Christian Hits FM",url:"https://streaming.live365.com/a55870",kind:"Hudba",description:"Christian hits • USA • Live365",groups:["HELEN","WORLD"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://christianhitsfm.com"},
    {name:"DOC Radio – Christian Hits",url:"https://server10.reliastream.com/proxy/docradio/stream",kind:"Hudba",description:"Christian pop, rock, reggae & blues • USA",groups:["HELEN","WORLD"],logo:"https://www.google.com/s2/favicons?sz=128&domain_url=https://docradio.org"}
  ];

  const HELEN_PHOTOS = [
    "helen01.jpg","helen02.jpg","helen03.jpg","helen04.jpg","helen05.jpg",
    "helen06.jpg","helen07.jpg","helen08.jpg","helen09.jpg"
  ];

  function ensureHelenGroup() {
    try {
      if (typeof GROUP_ORDER !== "undefined" && Array.isArray(GROUP_ORDER) && !GROUP_ORDER.includes("HELEN")) {
        GROUP_ORDER.splice(1, 0, "HELEN");
      }
      if (typeof NEW_GROUPS !== "undefined" && Array.isArray(NEW_GROUPS) && !NEW_GROUPS.includes("HELEN")) {
        NEW_GROUPS.push("HELEN");
      }
    } catch {}

    const select = document.querySelector("#assignGroup");
    if (select && !Array.from(select.options).some(o => o.value === "HELEN" || o.textContent === "HELEN")) {
      const option = document.createElement("option");
      option.value = "HELEN";
      option.textContent = "HELEN";
      select.insertBefore(option, select.firstChild);
    }
  }

  function mergeHelenStations() {
    ensureHelenGroup();
    try {
      if (typeof baseStations === "undefined" || !Array.isArray(baseStations)) return false;
      let changed = false;
      for (const station of HELEN_STATIONS) {
        const found = baseStations.find(s => String(s.url || "").trim() === station.url);
        if (found) {
          const groups = new Set(Array.isArray(found.groups) ? found.groups : []);
          for (const g of station.groups) groups.add(g);
          const merged = [...groups];
          if (JSON.stringify(merged) !== JSON.stringify(found.groups || [])) {
            found.groups = merged;
            changed = true;
          }
          if (!found.logo && station.logo) found.logo = station.logo;
        } else {
          baseStations.push({...station, groups:[...station.groups], source:"helen-gift"});
          changed = true;
        }
      }
      if (changed && typeof render === "function") render();
      return true;
    } catch (e) {
      console.warn("DJ Choice HELEN stations init failed", e);
      return false;
    }
  }

  function decorateHelenFilter() {
    document.querySelectorAll("#filters .filter").forEach(btn => {
      btn.classList.toggle("helen-filter", btn.textContent.trim() === "HELEN");
    });
  }

  function installHelenGallery() {
    const logo = document.querySelector(".logo-card");
    if (!logo || document.querySelector("#helenPhotoCard")) return;

    const row = document.createElement("div");
    row.className = "logo-helen-row";
    logo.parentNode.insertBefore(row, logo);
    row.appendChild(logo);

    const photoCard = document.createElement("div");
    photoCard.id = "helenPhotoCard";
    photoCard.className = "helen-photo-card hidden";
    photoCard.setAttribute("aria-label", "HELEN – fotogaléria");
    photoCard.innerHTML = `
      <div id="helenPhotoBg" class="helen-photo-bg" aria-hidden="true"></div>
      <div id="helenGreeting" class="helen-greeting hidden" aria-live="polite">
        <div class="helen-greeting-text">Ahoj Helen</div>
      </div>
      <img id="helenPhoto" class="helen-photo" alt="Darčeková fotogaléria HELEN">
    `;
    row.appendChild(photoCard);

    const img = photoCard.querySelector("#helenPhoto");
    const bg = photoCard.querySelector("#helenPhotoBg");
    const greeting = photoCard.querySelector("#helenGreeting");
    let timer = 0;
    let introTimer = 0;
    let bag = [];
    let last = -1;
    let hasShownFirst = false;

    HELEN_PHOTOS.forEach(src => {
      const preload = new Image();
      preload.src = src;
    });

    const refillBag = () => {
      bag = HELEN_PHOTOS.map((_, i) => i).filter(i => i !== last);
      shuffle(bag);
    };

    const showGreeting = () => {
      photoCard.classList.add("helen-intro-active");
      greeting.classList.remove("hidden");
    };

    const hideGreeting = () => {
      photoCard.classList.remove("helen-intro-active");
      greeting.classList.add("hidden");
    };

    const showIndex = index => {
      if (index < 0 || index >= HELEN_PHOTOS.length) return;
      last = index;
      const src = HELEN_PHOTOS[index];
      img.classList.add("helen-photo-changing");
      window.setTimeout(() => {
        img.src = src;
        bg.style.backgroundImage = `url("${src}")`;
        img.classList.remove("helen-photo-changing");
      }, 220);
    };

    const showNextRandom = () => {
      if (!bag.length) refillBag();
      const index = bag.shift();
      showIndex(index);
    };

    const isHelenActive = () => Array.from(document.querySelectorAll("#filters .filter.active"))
      .some(btn => btn.textContent.trim() === "HELEN");

    const sync = () => {
      decorateHelenFilter();
      const active = isHelenActive();
      photoCard.classList.toggle("hidden", !active);
      if (active) {
        if (!hasShownFirst) {
          if (!introTimer) {
            showGreeting();
            introTimer = window.setTimeout(() => {
              introTimer = 0;
              hasShownFirst = true;
              hideGreeting();
              showIndex(0); // narodeninová koláž sa ukáže ako prvá po pozdrave
              if (!timer) timer = window.setInterval(showNextRandom, 60000);
            }, 5000);
          }
        } else {
          hideGreeting();
          if (!timer) timer = window.setInterval(showNextRandom, 60000);
        }
      } else {
        hideGreeting();
        if (introTimer) {
          clearTimeout(introTimer);
          introTimer = 0;
        }
        if (timer) {
          clearInterval(timer);
          timer = 0;
        }
      }
    };

    const filters = document.querySelector("#filters");
    if (filters) {
      filters.addEventListener("click", () => window.setTimeout(sync, 0));
      const observer = new MutationObserver(() => window.setTimeout(sync, 0));
      observer.observe(filters, {childList:true, subtree:true, attributes:true, attributeFilter:["class"]});
    }
    sync();
  }

  function installHelenFeature() {
    ensureHelenGroup();
    installHelenGallery();
    mergeHelenStations();
    decorateHelenFilter();

    // loadSeed() môže katalóg krátko po štarte prepísať; niekoľko krátkych kontrol
    // zabezpečí HELEN v oboch verziách app.js bez trvalého polling-u.
    let tries = 0;
    const retry = window.setInterval(() => {
      mergeHelenStations();
      decorateHelenFilter();
      if (++tries >= 9) clearInterval(retry);
    }, 700);
  }



  // V8 – stabilizácia priečinka MOJE a dialógu PRIDAJ.
  // MOJE má byť viditeľné aj keď je zatiaľ prázdne.
  function installMojeAndAddFix() {
    const filters = document.querySelector("#filters");
    const dialog = document.querySelector("#stationDialog");
    const form = document.querySelector("#stationForm");
    const cancelBtn = document.querySelector("#cancelStationBtn");

    const closeAddDialog = () => {
      try { dialog?.close(); } catch {}
      try { form?.reset(); } catch {}
    };

    if (cancelBtn) cancelBtn.addEventListener("click", closeAddDialog);

    // Klik do tmavého pozadia mimo formulára tiež zavrie okno.
    if (dialog) {
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog) closeAddDialog();
      });
    }

    const ensureMoje = () => {
      if (!filters) return;
      const buttons = Array.from(filters.querySelectorAll(".filter"));
      let moje = buttons.find(b => b.textContent.trim() === "Moje");
      if (moje) return;

      moje = document.createElement("button");
      moje.type = "button";
      moje.className = "filter";
      try {
        if (typeof filter !== "undefined" && filter === "Moje") moje.classList.add("active");
      } catch {}
      moje.textContent = "Moje";
      moje.addEventListener("click", () => {
        try {
          filter = "Moje";
          if (typeof render === "function") render();
        } catch {}
      });

      let order = ["Všetky","HELEN","SK","OLDIES","JAZZ","ONLY","ETNO","WORLD","CZ","PL","Moje","Slovo","Hudba","NEW"];
      try {
        if (typeof GROUP_ORDER !== "undefined" && Array.isArray(GROUP_ORDER)) order = GROUP_ORDER;
      } catch {}
      const myIndex = order.indexOf("Moje");
      let before = null;
      for (const b of buttons) {
        const idx = order.indexOf(b.textContent.trim());
        if (myIndex >= 0 && idx > myIndex) { before = b; break; }
      }
      filters.insertBefore(moje, before);
    };

    ensureMoje();
    if (filters) {
      const obs = new MutationObserver(() => queueMicrotask(ensureMoje));
      obs.observe(filters, {childList:true});
    }
  }



  // V9 – jednotná správa staníc: dvojklik = uložiť/presunúť/vymazať.
  // Manuálne pridaná stanica zostáva natrvalo v localStorage a používateľ si volí priečinok.
  function installStationManagerV9() {
    const DELETED_KEY = "djchoice_web_v1_deleted";
    const OVERRIDE_KEY = "djchoice_web_v1_group_overrides";
    const stationListEl = document.querySelector("#stationList");
    const filtersElV9 = document.querySelector("#filters");
    const dialog = document.querySelector("#assignDialog");
    const groupSelect = document.querySelector("#assignGroup");
    const saveBtn = document.querySelector("#assignSaveBtn");
    const deleteBtn = document.querySelector("#manageDeleteBtn");
    const cancelBtn = document.querySelector("#manageCancelBtn");
    const title = document.querySelector("#manageStationTitle");
    const assignName = document.querySelector("#assignStationName");
    const addBtn = document.querySelector("#addBtn");
    const customGroup = document.querySelector("#customGroup");
    const saveCustomBtn = document.querySelector("#saveCustomBtn");
    const stationDialog = document.querySelector("#stationDialog");
    const stationForm = document.querySelector("#stationForm");
    if (!stationListEl || !dialog || !groupSelect || !saveBtn) return;

    const loadJson = (key, fallback) => {
      try {
        const v = JSON.parse(localStorage.getItem(key) || "null");
        return v ?? fallback;
      } catch { return fallback; }
    };
    const deletedUrls = new Set((loadJson(DELETED_KEY, []) || []).filter(Boolean));
    const groupOverrides = loadJson(OVERRIDE_KEY, {}) || {};
    let pendingManage = null;

    const persistDeleted = () => localStorage.setItem(DELETED_KEY, JSON.stringify([...deletedUrls]));
    const persistOverrides = () => localStorage.setItem(OVERRIDE_KEY, JSON.stringify(groupOverrides));
    const stationUrl = s => String(s?.url || "").trim();

    // Staršie uloženia z pôvodného dialógu zachováme: ak už existuje assigned kópia
    // pevnej stanice, jej cieľový priečinok berieme ako používateľovu voľbu.
    try {
      if (typeof assignedStations !== "undefined" && Array.isArray(assignedStations)) {
        for (const a of assignedStations) {
          const u = stationUrl(a);
          if (!u) continue;
          const baseHit = typeof baseStations !== "undefined" && Array.isArray(baseStations) && baseStations.some(b => stationUrl(b) === u);
          if (baseHit && Array.isArray(a.groups) && a.groups.length && !groupOverrides[u]) {
            groupOverrides[u] = [a.groups[0]];
          }
        }
        persistOverrides();
      }
    } catch {}

    // Tombstones: VYMAZAŤ skryje stanicu natrvalo v tomto prehliadači.
    try {
      const originalAllStations = allStations;
      allStations = function() {
        const raw = originalAllStations();
        const out = [];
        const seen = new Set();
        for (const s of raw) {
          const u = stationUrl(s);
          if (!u || deletedUrls.has(u) || seen.has(u)) continue;
          seen.add(u);
          out.push(s);
        }
        return out;
      };
    } catch {}

    // Používateľský presun pevnej stanice prepisuje jej pôvodný priečinok,
    // ale typové priečinky Hudba/Slovo zostanú zachované.
    try {
      const originalGroupsFor = groupsFor;
      groupsFor = function(s) {
        const u = stationUrl(s);
        const override = u && groupOverrides[u];
        if (!override || !override.length) return originalGroupsFor(s);
        const set = new Set(override);
        if (s?.local) set.add("Moje");
        if (s?.kind === "Hovorené") set.add("Slovo");
        if (s?.kind === "Hudba") set.add("Hudba");
        return [...set];
      };
    } catch {}

    let hint = document.querySelector("#stationManageHint");
    if (!hint) {
      hint = document.createElement("div");
      hint.id = "stationManageHint";
      hint.className = "station-manage-hint";
      stationListEl.parentNode.insertBefore(hint, stationListEl);
    }

    const updateHint = () => {
      let currentFilter = "";
      try { currentFilter = typeof filter !== "undefined" ? filter : ""; } catch {}
      const isNew = currentFilter === "NEW";
      hint.classList.toggle("new-mode", isNew);
      hint.textContent = isNew
        ? "DVOJKLIK NA STANICU → ULOŽIŤ DO PRIEČINKA"
        : "Dvojklik na stanicu → pridať / presunúť / vymazať";
    };

    // Po každom renderi si naviažeme aktuálne DOM riadky na aktuálne stanice.
    try {
      const originalRender = render;
      render = function() {
        originalRender();
        let visible = [];
        try { visible = allStations().filter(stationMatches); } catch {}
        [...stationListEl.querySelectorAll(".station")].forEach((row, i) => {
          row.dataset.djStationIndex = String(i);
        });
        stationListEl.__djVisibleStations = visible;
        updateHint();
      };
    } catch {}

    const realGroups = ["Moje","HELEN","SK","OLDIES","JAZZ","ONLY","ETNO","WORLD","CZ","PL","Slovo","Hudba"];
    const bestCurrentGroup = s => {
      const u = stationUrl(s);
      if (groupOverrides[u]?.[0]) return groupOverrides[u][0];
      try {
        if (typeof filter !== "undefined" && realGroups.includes(filter) && filter !== "NEW") return filter;
      } catch {}
      const gs = Array.isArray(s?.groups) ? s.groups : [];
      return gs.find(g => realGroups.includes(g)) || "Moje";
    };

    const openManager = s => {
      if (!s) return;
      pendingManage = s;
      try { pendingAssign = null; } catch {}
      if (title) title.textContent = s.newDiscovery ? "Uložiť stanicu" : "Správa stanice";
      if (assignName) assignName.textContent = s.name || "Stanica";
      const g = bestCurrentGroup(s);
      if ([...groupSelect.options].some(o => o.value === g || o.textContent === g)) groupSelect.value = g;
      if (deleteBtn) deleteBtn.textContent = s.newDiscovery ? "VYMAZAŤ Z NEW" : "VYMAZAŤ";
      try { if (!dialog.open) dialog.showModal(); } catch {}
    };

    stationListEl.addEventListener("dblclick", e => {
      const row = e.target.closest(".station");
      if (!row) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const arr = stationListEl.__djVisibleStations || [];
      const s = arr[Number(row.dataset.djStationIndex || -1)];
      if (s) openManager(s);
    }, true);

    const closeManager = () => {
      pendingManage = null;
      try { dialog.close(); } catch {}
    };
    cancelBtn?.addEventListener("click", closeManager);
    dialog.addEventListener("click", e => { if (e.target === dialog) closeManager(); });

    const saveManaged = e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const s = pendingManage;
      if (!s) return;
      const g = groupSelect.value || "Moje";
      const u = stationUrl(s);
      if (!u) return;

      deletedUrls.delete(u);
      persistDeleted();

      try {
        if (s.newDiscovery) {
          const existing = Array.isArray(assignedStations) ? assignedStations.find(x => stationUrl(x) === u) : null;
          if (existing) {
            existing.groups = [g];
            existing.newDiscovery = false;
            existing.assigned = true;
          } else if (Array.isArray(assignedStations)) {
            assignedStations.push({...s, groups:[g], newDiscovery:false, local:false, assigned:true, source:"radio-browser"});
          }
          if (typeof saveLocal === "function") saveLocal(ASSIGNED_KEY, assignedStations);
          if (Array.isArray(freshNew)) freshNew = freshNew.filter(x => stationUrl(x) !== u);
        } else if (s.local) {
          const hit = Array.isArray(localStations) ? localStations.find(x => stationUrl(x) === u) : null;
          if (hit) hit.groups = [g];
          if (typeof saveLocal === "function") saveLocal(LOCAL_KEY, localStations);
        } else if (s.assigned) {
          const hit = Array.isArray(assignedStations) ? assignedStations.find(x => stationUrl(x) === u) : null;
          if (hit) hit.groups = [g];
          if (typeof saveLocal === "function") saveLocal(ASSIGNED_KEY, assignedStations);
        } else {
          groupOverrides[u] = [g];
          persistOverrides();
        }
      } catch (err) {
        console.warn("DJ Choice station move failed", err);
      }

      closeManager();
      try { filter = g; } catch {}
      try { if (typeof render === "function") render(); } catch {}
    };
    saveBtn.addEventListener("click", saveManaged, true);

    const deleteManaged = e => {
      e?.preventDefault?.();
      e?.stopImmediatePropagation?.();
      const s = pendingManage;
      if (!s) return;
      const u = stationUrl(s);
      if (!u) return;
      if (!confirm(`Vymazať „${s.name || "stanicu"}“ z DJ Choice v tomto prehliadači?`)) return;

      deletedUrls.add(u);
      delete groupOverrides[u];
      persistDeleted();
      persistOverrides();
      try {
        if (Array.isArray(localStations)) {
          localStations = localStations.filter(x => stationUrl(x) !== u);
          if (typeof saveLocal === "function") saveLocal(LOCAL_KEY, localStations);
        }
        if (Array.isArray(assignedStations)) {
          assignedStations = assignedStations.filter(x => stationUrl(x) !== u);
          if (typeof saveLocal === "function") saveLocal(ASSIGNED_KEY, assignedStations);
        }
        if (Array.isArray(freshNew)) freshNew = freshNew.filter(x => stationUrl(x) !== u);
        if (typeof current !== "undefined" && current && stationUrl(current) === u) {
          try { if (typeof stopAudio === "function") stopAudio(); } catch {}
          current = null;
          const n = document.querySelector("#stationName");
          const d = document.querySelector("#stationDesc");
          if (n) n.textContent = "Vyber stanicu";
          if (d) d.textContent = "V tejto verzii sa prehrávajú iba priame HTTPS streamy.";
        }
      } catch {}
      closeManager();
      try { if (typeof render === "function") render(); } catch {}
    };
    deleteBtn?.addEventListener("click", deleteManaged, true);

    // Manuálny PRIDAJ: zvolí sa priečinok a stanica v ňom zostane po reštarte.
    addBtn?.addEventListener("click", () => {
      let g = "Moje";
      try { if (realGroups.includes(filter) && filter !== "NEW") g = filter; } catch {}
      if (customGroup && [...customGroup.options].some(o => o.value === g || o.textContent === g)) customGroup.value = g;
    });

    saveCustomBtn?.addEventListener("click", e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const name = document.querySelector("#customName")?.value.trim() || "";
      const url = document.querySelector("#customUrl")?.value.trim() || "";
      const g = customGroup?.value || "Moje";
      if (!name || !url) {
        alert("Vyplň názov aj HTTPS stream.");
        return;
      }
      if (!url.startsWith("https://")) {
        alert("Webová DJ Choice prijíma iba HTTPS streamy.");
        return;
      }

      deletedUrls.delete(url);
      delete groupOverrides[url];
      persistDeleted();
      persistOverrides();

      let s = null;
      try {
        s = Array.isArray(localStations) ? localStations.find(x => stationUrl(x) === url) : null;
        if (s) {
          s.name = name;
          s.groups = [g];
          s.kind = g === "Slovo" ? "Hovorené" : "Hudba";
        } else {
          s = {
            name, url,
            kind: g === "Slovo" ? "Hovorené" : "Hudba",
            description: `Moja webová stanica • ${g}`,
            groups:[g], logo:"", local:true, source:"user"
          };
          if (Array.isArray(localStations)) localStations.push(s);
        }
        if (typeof saveLocal === "function") saveLocal(LOCAL_KEY, localStations);
      } catch (err) {
        console.warn("DJ Choice custom station save failed", err);
        return;
      }

      try { stationDialog?.close(); } catch {}
      try { stationForm?.reset(); } catch {}
      try { filter = g; } catch {}
      try {
        if (typeof selectStation === "function") selectStation(s, false);
        else if (typeof render === "function") render();
      } catch {}
    }, true);

    // Už pri štarte zobraz nápovedu, ďalšie rendery ju udržia aktuálnu.
    try { if (typeof render === "function") render(); else updateHint(); } catch { updateHint(); }
  }

  installHelenFeature();
  installMojeAndAddFix();
  installStationManagerV9();
  addOnlyStations();
  installTodayCard();
  installKineticEq();
  installJukeboxIdle();
  installLogoFlagWave();
  loadThoughts();

  // Pôvodný NEW loader sa spustí pri štarte aplikácie; tento výber ho po krátkej chvíli nahradí.
  setTimeout(loadSmartNew, 1800);
})();
