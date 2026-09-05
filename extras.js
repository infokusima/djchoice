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

  async function loadThoughts() {
    try {
      if (typeof quotes === "undefined" || !Array.isArray(quotes)) return;
      const r = await fetch("./thoughts.json?v=1", {cache: "no-store"});
      if (!r.ok) throw new Error("HTTP " + r.status);
      const data = await r.json();
      if (!Array.isArray(data) || data.length < 20) throw new Error("Too few thoughts");

      const normalized = data
        .map(x => [String(x.text || "").trim(), String(x.author || "DJ Choice").trim()])
        .filter(x => x[0]);
      shuffle(normalized);
      quotes.splice(0, quotes.length, ...normalized);
      if (typeof qi !== "undefined") qi = -1;
      if (typeof rotateQuote === "function") rotateQuote();

      let leftStart = false;
      setInterval(() => {
        try {
          if (typeof qi === "undefined" || quotes.length < 2) return;
          if (qi > 1) leftStart = true;
          if (leftStart && qi === 0) {
            shuffle(quotes);
            qi = -1;
            leftStart = false;
          }
        } catch {}
      }, 2500);
    } catch (e) {
      console.warn("DJ Choice thoughts load failed", e);
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

      if (nameday) namedayEl.textContent = `Meniny: ${nameday}`;
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

      let bx = 46, by = 24, vx = 105, vy = -35;
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

      const loop = now => {
        const dt = Math.min(0.04, Math.max(0.001, (now - last) / 1000));
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

        const rect = eqEl.getBoundingClientRect();
        const W = Math.max(80, rect.width);
        const H = Math.max(70, rect.height);
        const oldY = by;

        const g = calm ? 160 : 320;
        vx *= calm ? 0.997 : 0.999;
        vy += g * dt;
        bx += vx * dt;
        by += vy * dt;

        if (bx < radius) {
          bx = radius;
          vx = Math.abs(vx) * (0.86 + Math.random() * 0.08);
        } else if (bx > W - radius) {
          bx = W - radius;
          vx = -Math.abs(vx) * (0.86 + Math.random() * 0.08);
        }

        if (by < radius) {
          by = radius;
          vy = Math.abs(vy) * 0.82;
        }

        const barIndex = Math.max(0, Math.min(states.length - 1, Math.floor((bx / W) * states.length)));
        const s = states[barIndex];
        const barTop = H - ((Math.max(5, Math.min(98, s.value + s.pulse))) / 100) * H;
        const oldBottom = oldY + radius;
        const newBottom = by + radius;

        if (vy > 0 && oldBottom <= barTop + 3 && newBottom >= barTop) {
          by = barTop - radius;
          vy = -Math.max(calm ? 72 : 110, Math.abs(vy) * (0.74 + Math.random() * 0.15));
          vx += (Math.random() - 0.5) * (calm ? 22 : 65);
          vx = Math.max(-190, Math.min(190, vx));
          s.pulse = Math.min(26, s.pulse + 9 + Math.random() * 13);
        }

        if (by > H - radius) {
          by = H - radius;
          vy = -Math.max(85, Math.abs(vy) * (0.72 + Math.random() * 0.12));
          vx += (Math.random() - 0.5) * 45;
        }

        ball.style.transform = `translate(${(bx - radius).toFixed(1)}px, ${(by - radius).toFixed(1)}px)`;
        requestAnimationFrame(loop);
      };

      requestAnimationFrame(loop);
    };

    start();
  }

  addOnlyStations();
  installTodayCard();
  installKineticEq();
  loadThoughts();

  // Pôvodný NEW loader sa spustí pri štarte aplikácie; tento výber ho po krátkej chvíli nahradí.
  setTimeout(loadSmartNew, 1800);
})();
