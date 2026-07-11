/* ==========================================================
   Chaitanya Dussa — Portfolio Scripts
   Extracted from index.html — split into html/css/js on request.
   Loaded at the end of <body>, after all HTML has parsed —
   same guarantee the inline scripts relied on, so every
   document.getElementById(...) call still finds its element.
   ========================================================== */

  // ── Remote sync: content now lives in Vercel Postgres (via /api/content),
  // not just this browser's localStorage. We fetch it synchronously, once,
  // before any of the code below runs — so every render() further down
  // still sees fully-loaded data on first paint, exactly like before.
  // If the API isn't deployed yet (or the request fails), CD_REMOTE_OK stays
  // false and everything transparently falls back to localStorage/defaults,
  // so the site keeps working exactly as it did pre-backend.
  var CD_REMOTE = {};
  var CD_REMOTE_OK = false;
  (function(){
    try{
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/content', false); // deliberately synchronous — see comment above
      xhr.send(null);
      if(xhr.status >= 200 && xhr.status < 300){
        CD_REMOTE = JSON.parse(xhr.responseText) || {};
        CD_REMOTE_OK = true;
      }
    }catch(e){ /* offline, or /api not deployed yet — fine, falls back below */ }
  })();

  var CD_ADMIN_TOKEN = null;
  try{ CD_ADMIN_TOKEN = sessionStorage.getItem('cd_admin_token') || null; }catch(e){}
  function cdSetAdminToken(token){
    CD_ADMIN_TOKEN = token;
    try{ if(token){ sessionStorage.setItem('cd_admin_token', token); } else { sessionStorage.removeItem('cd_admin_token'); } }catch(e){}
  }

  function cdRemoteGet(key, fallback){
    if(CD_REMOTE_OK && Object.prototype.hasOwnProperty.call(CD_REMOTE, key)){ return CD_REMOTE[key]; }
    try{ var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(e){ return fallback; }
  }
  function cdRemoteSet(key, val){
    CD_REMOTE[key] = val;
    try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
    if(!CD_ADMIN_TOKEN) return;
    try{
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CD_ADMIN_TOKEN },
        body: JSON.stringify({ key: key, value: val })
      }).then(function(r){
        if(!r.ok && typeof console !== 'undefined'){ console.warn('Saved locally but failed to sync to server (status ' + r.status + ')'); }
      }).catch(function(){});
    }catch(e){}
  }
  function cdRemoteRemove(key){
    delete CD_REMOTE[key];
    try{ localStorage.removeItem(key); }catch(e){}
    if(!CD_ADMIN_TOKEN) return;
    try{
      fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CD_ADMIN_TOKEN },
        body: JSON.stringify({ key: key, value: null })
      }).catch(function(){});
    }catch(e){}
  }

  // mobile nav
  document.addEventListener('click', function(e){
    var nav = document.querySelector('nav.links');
    if(!e.target.closest('.menu-toggle') && !e.target.closest('nav.links')){
      nav.classList.remove('mobile-open');
    }
  });

  // footer year
  document.getElementById('year').textContent = new Date().getFullYear();

  // ── INTRO: simple auto-cycling subtitle above the avatar (no audio, no buttons) ──
  (function(){
    var subtitle = document.getElementById('introSubtitle');
    if(!subtitle) return;

    var messages = [
      "Hi, I'm Chaitanya Dussa — a full-stack developer from Andhra Pradesh, India.",
      "I build with React, Node.js, and Express.",
      "Currently exploring generative AI, prompt engineering, and workflow automation.",
      "Take a look through my projects below.",
      "Feel free to reach out if you'd like to work together."
    ];

    var idx = 0;
    var CYCLE_MS = 60000; // 1 minute per message

    function showMessage(text){
      subtitle.classList.remove('visible');
      setTimeout(function(){
        subtitle.textContent = text;
        subtitle.classList.add('visible');
      }, 250);
    }

    // show the first message right away
    showMessage(messages[idx]);

    setInterval(function(){
      idx = (idx + 1) % messages.length;
      showMessage(messages[idx]);
    }, CYCLE_MS);
  })();

  // ── terminal: loads from localStorage if saved, falls back to defaults ──
  var TERMINAL_KEY = 'cd_terminal_v1';
  var TERMINAL_DEFAULTS = [
    {p:'~$ ', t:'whoami', out:false},
    {p:'', t:'chaitanya-dussa \u2014 full-stack developer', out:true},
    {p:'~$ ', t:'cat stack.json', out:false},
    {p:'', t:'{ core: [React, Node.js, Express, MongoDB],', out:true},
    {p:'', t:'  exploring: [LLMs, Prompt Engineering, AI Automation] }', out:true},
    {p:'~$ ', t:'status', out:false},
    {p:'', t:'open to opportunities \u2713', out:true}
  ];
  function loadTerminalLines(){
    return cdRemoteGet(TERMINAL_KEY, TERMINAL_DEFAULTS);
  }

  var body = document.getElementById('terminalBody');
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function renderStatic(lines){
    var html = '';
    for(var i=0;i<lines.length;i++){
      var l = lines[i];
      html += '<div class="line' + (l.out ? ' out' : '') + '">' +
        (l.out ? '' : '<span class="prompt">' + l.p + '</span>') + l.t + '</div>';
    }
    body.innerHTML = html;
  }

  function replayTerminal(){
    var lines = loadTerminalLines();
    body.innerHTML = '';
    if(prefersReduced){ renderStatic(lines); return; }
    var li = 0;
    function typeLine(){
      if(li >= lines.length){ return; }
      var l = lines[li];
      var div = document.createElement('div');
      div.className = 'line' + (l.out ? ' out' : '');
      if(!l.out){
        var span = document.createElement('span');
        span.className = 'prompt';
        span.textContent = l.p;
        div.appendChild(span);
      }
      var textNode = document.createTextNode('');
      div.appendChild(textNode);
      var caret = document.createElement('span');
      caret.className = 'caret';
      div.appendChild(caret);
      body.appendChild(div);
      var ci = 0;
      var speed = l.out ? 8 : 32;
      function typeChar(){
        if(ci < l.t.length){
          textNode.textContent += l.t[ci];
          ci++;
          setTimeout(typeChar, speed);
        } else {
          caret.remove();
          li++;
          setTimeout(typeLine, 220);
        }
      }
      typeChar();
    }
    typeLine();
  }

  replayTerminal();

  // ---------- content manager: projects, certifications, videos (render + tabbed admin add/remove) ----------
  (function(){
    var defaultCategories = [
      { id:'cat-web',  name:'Web Apps' },
      { id:'cat-auto', name:'Automation' },
      { id:'cat-ai',   name:'AI Projects' },
      { id:'cat-n8n',  name:'n8n Workflows' }
    ];
    var defaultExtraLinks = []; // pure custom "additional info" links for Get in Touch, no defaults
    var defaultProjects = [
      { id:'studynest', title:'StudyNest — Smart Study Collaboration Platform', category:'Web Apps',
        tags:['HTML','CSS','JavaScript'],
        bullets:['Built a collaborative study platform with virtual study features.','Enabled real-time session tracking and interactive features for productivity.','Designed a responsive UI using HTML, CSS, and JavaScript.'],
        demo:'https://studynest.ccbp.tech/', source:'https://github.com/ChaitanyaDussa/STUDYNEST' },
      { id:'chatapp', title:'Chat Application', category:'Web Apps',
        tags:['React.js','Node.js','Express','Socket.io','MongoDB'],
        bullets:['Developed a real-time chat app using Socket.io for instant messaging.','Implemented authentication and REST APIs for user and message management.','Built a responsive UI with React.js for seamless communication.'],
        demo:'', source:'https://github.com/ChaitanyaDussa/chat-app_new' },
      { id:'greeninsight', title:'Green Insight — Tree Track', category:'Web Apps',
        tags:['React.js','Node.js','Express','MongoDB'],
        bullets:['Built a tree plantation tracking system to monitor and manage planted trees.','Added features for adding, updating, and tracking tree data, including location and growth status.','Designed a responsive React frontend with RESTful APIs in Node.js and Express, backed by MongoDB.'],
        demo:'https://green-insight-tree-track.lovable.app', source:'https://github.com/ChaitanyaDussa/green-insight-tree-track' }
    ];
    var defaultCerts = [
      { id:'cert-frontend', title:'Frontend Developer', subtitle:'Building static websites with HTML, CSS & JS', icon:'📄', url:'https://s3-ap-south-1.amazonaws.com/nkb-backend-ccbp-media-static/certificates/share/ACXCZKRWXH.png' },
      { id:'cert-python', title:'Python Developer Course', subtitle:'Conditionals, lists, functions & OOP', icon:'🐍', url:'https://s3-ap-south-1.amazonaws.com/nkb-backend-ccbp-media-static/certificates/share/FRCTXKOWFS.png' },
      { id:'cert-git', title:'Command-Line & Git Course', subtitle:'Version control fundamentals', icon:'⌥', url:'https://s3-ap-south-1.amazonaws.com/nkb-backend-ccbp-media-static/certificates/share/PGZBXVIHWJ.png' },
      { id:'cert-sql', title:'The Complete SQL Developer Course', subtitle:'Clauses, operators, joins & transactions', icon:'🗄️', url:'https://s3-ap-south-1.amazonaws.com/nkb-backend-ccbp-media-static/certificates/share/ACXCZKRWXH.png' },
      { id:'cert-wadhwani', title:'Entrepreneurship Development Program', subtitle:'Wadhwani Foundation', icon:'🚀', url:'https://web.certificate.wfglobal.org/en/certificate?certificateId=69148b0175befa3ac2e89763' }
    ];
    var defaultVideos = [];
    var defaultEducation = [
      { id:'edu-btech', title:'B.Tech in Computer Science', desc:'Andhra Loyola Institute of Engineering and Technology, Vijayawada (Affiliated with JNTUK) — 8.0 CGPA', startYear:'2023', endYear:'2027' },
      { id:'edu-inter', title:'Board of Intermediate Education', desc:'Sri Chaitanya Junior College, Hyderabad — 96.5%', startYear:'2021', endYear:'2023' }
    ];
    var defaultSkills = [
      { id:'sk-js', group:'Languages', name:'JavaScript' }, { id:'sk-py', group:'Languages', name:'Python' },
      { id:'sk-java', group:'Languages', name:'Java' }, { id:'sk-html', group:'Languages', name:'HTML' }, { id:'sk-css', group:'Languages', name:'CSS' },
      { id:'sk-react', group:'Frameworks', name:'React.js' }, { id:'sk-node', group:'Frameworks', name:'Node.js' },
      { id:'sk-express', group:'Frameworks', name:'Express.js' }, { id:'sk-bootstrap', group:'Frameworks', name:'Bootstrap' }, { id:'sk-mongoose', group:'Frameworks', name:'Mongoose' },
      { id:'sk-mongodb', group:'Databases', name:'MongoDB' }, { id:'sk-mysql', group:'Databases', name:'MySQL' },
      { id:'sk-ec2', group:'Cloud', name:'AWS EC2' }, { id:'sk-s3', group:'Cloud', name:'AWS S3' }, { id:'sk-deploy', group:'Cloud', name:'Deployment' },
      { id:'sk-vscode', group:'Developer Tools', name:'VS Code' }, { id:'sk-git', group:'Developer Tools', name:'Git' }, { id:'sk-github', group:'Developer Tools', name:'GitHub' },
      { id:'sk-genai', group:'AI Technologies', name:'Generative AI' }, { id:'sk-llm', group:'AI Technologies', name:'LLMs' },
      { id:'sk-aiauto', group:'AI Technologies', name:'AI Automation' }, { id:'sk-prompt', group:'AI Technologies', name:'Prompt Engineering' },
      { id:'sk-nocode', group:'Workflow & No-Code', name:'No-Code / Low-Code' }, { id:'sk-api', group:'Workflow & No-Code', name:'API Integration' },
      { id:'sk-wfauto', group:'Workflow & No-Code', name:'Workflow Automation' }, { id:'sk-vibe', group:'Workflow & No-Code', name:'Vibe Coding' },
      { id:'sk-win', group:'OS', name:'Windows' }, { id:'sk-mac', group:'OS', name:'macOS' }
    ];

    var CUSTOM_KEYS = { projects:'cd_custom_projects_v1', certs:'cd_custom_certs_v1', videos:'cd_custom_videos_v1', skills:'cd_custom_skills_v1', education:'cd_custom_education_v1', categories:'cd_custom_categories_v1', extralinks:'cd_custom_extralinks_v1' };
    var REMOVED_KEY = 'cd_removed_defaults_v1';
    var activeFilter = 'All';

    function loadJSON(key, fallback){ return cdRemoteGet(key, fallback); }
    function saveJSON(key, val){ cdRemoteSet(key, val); }

    function loadCustom(type){ return loadJSON(CUSTOM_KEYS[type], []); }
    function saveCustom(type, list){ saveJSON(CUSTOM_KEYS[type], list); }
    function loadRemoved(){ return loadJSON(REMOVED_KEY, {projects:[],certs:[],videos:[],skills:[],education:[],categories:[],extralinks:[]}); }
    function saveRemoved(removed){ saveJSON(REMOVED_KEY, removed); }

    function defaultsFor(type){
      if(type==='projects') return defaultProjects;
      if(type==='certs') return defaultCerts;
      if(type==='skills') return defaultSkills;
      if(type==='education') return defaultEducation;
      if(type==='categories') return defaultCategories;
      if(type==='extralinks') return defaultExtraLinks;
      return defaultVideos;
    }
    function getCategoryNames(){
      return allItems('categories').map(function(c){ return c.name; });
    }
    function allItems(type){
      var removed = loadRemoved()[type] || [];
      var base = defaultsFor(type).filter(function(it){ return removed.indexOf(it.id) === -1; });
      return base.concat(loadCustom(type));
    }
    function removeItem(type, id){
      var custom = loadCustom(type);
      var inCustom = custom.some(function(p){ return p.id === id; });
      if(inCustom){
        saveCustom(type, custom.filter(function(p){ return p.id !== id; }));
      } else {
        var removed = loadRemoved();
        if(removed[type].indexOf(id) === -1){ removed[type].push(id); }
        saveRemoved(removed);
      }
    }

    function escapeHtml(s){
      return String(s).replace(/[&<>"]/g, function(c){
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];
      });
    }
    function youTubeId(url){
      var m = String(url).match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
      return m ? m[1] : null;
    }

    // ── reusable repeatable link-row editor (Title + URL + remove), used by
    // Skills, Videos, and Contact Info's extra-links admin forms ──
    function addLinkRow(container, link){
      link = link || { title:'', url:'' };
      var row = document.createElement('div');
      row.className = 'link-row';
      row.innerHTML =
        '<input type="text" class="lr-title" placeholder="Link title (e.g. Docs)" value="'+escapeHtml(link.title||'')+'">' +
        '<input type="text" class="lr-url" placeholder="https://..." value="'+escapeHtml(link.url||'')+'">' +
        '<button type="button" title="Remove">✕</button>';
      row.querySelector('button').addEventListener('click', function(){ row.remove(); });
      container.appendChild(row);
      return row;
    }
    function collectLinkRows(container){
      var rows = container.querySelectorAll('.link-row');
      var out = [];
      for(var i=0;i<rows.length;i++){
        var title = rows[i].querySelector('.lr-title').value.trim();
        var url = rows[i].querySelector('.lr-url').value.trim();
        if(url){ out.push({ title: title || 'Link', url: url }); }
      }
      return out;
    }
    function clearLinkRows(container){ container.innerHTML = ''; }

    // ---------- PROJECTS ----------
    function projectCardHtml(p){
      var i, tagsHtml = '', bulletsHtml = '', actions = '';
      for(i=0;i<p.tags.length;i++){ tagsHtml += '<span class="tag">'+escapeHtml(p.tags[i])+'</span>'; }
      for(i=0;i<p.bullets.length;i++){ bulletsHtml += '<li>'+escapeHtml(p.bullets[i])+'</li>'; }
      if(p.demo){ actions += '<a class="btn ghost" href="'+escapeHtml(p.demo)+'" target="_blank" rel="noopener">Live Demo ↗</a>'; }
      if(p.source){ actions += '<a class="btn ghost" href="'+escapeHtml(p.source)+'" target="_blank" rel="noopener">Source Code ↗</a>'; }
      return '<div class="project-card reveal is-visible">' +
          '<div class="project-top"><div><h3>'+escapeHtml(p.title)+'</h3>' +
          '<div class="project-tags">'+tagsHtml+'</div></div>' +
          '<div class="project-actions">'+actions+'</div></div>' +
          '<ul>'+bulletsHtml+'</ul></div>';
    }
    function renderTabs(){
      var tabsEl = document.getElementById('catTabs');
      if(!tabsEl) return;
      var cats = ['All'].concat(getCategoryNames());
      var html = '';
      for(var i=0;i<cats.length;i++){
        html += '<button class="cat-tab'+(cats[i]===activeFilter?' active':'')+'" data-cat="'+escapeHtml(cats[i])+'" type="button">'+escapeHtml(cats[i])+'</button>';
      }
      tabsEl.innerHTML = html;
      var btns = tabsEl.querySelectorAll('.cat-tab');
      for(var j=0;j<btns.length;j++){
        btns[j].addEventListener('click', function(e){
          activeFilter = e.currentTarget.getAttribute('data-cat');
          renderTabs();
          renderProjects();
        });
      }
    }
    // ── scroll-box fade helper: shows bottom fade only when there's more to scroll ──
    function initScrollBox(id){
      var box = document.getElementById(id);
      if(!box) return;
      function update(){
        var hasMore = box.scrollHeight - box.scrollTop - box.clientHeight > 4;
        box.classList.toggle('is-scrollable', hasMore);
      }
      update();
      box.removeEventListener('scroll', box._scrollBoxHandler || function(){});
      box._scrollBoxHandler = update;
      box.addEventListener('scroll', update);
      window.addEventListener('resize', update);
    }

    function renderProjects(){
      var listEl = document.getElementById('projectsList');
      if(!listEl) return;
      var items = allItems('projects');
      if(activeFilter !== 'All'){
        items = items.filter(function(p){ return p.category === activeFilter; });
      }
      listEl.innerHTML = items.length === 0
        ? '<div class="empty-state">No '+escapeHtml(activeFilter)+' projects yet — check back soon.</div>'
        : items.map(projectCardHtml).join('');
      initScrollBox('projectsScrollBox');
    }

    // ---------- CERTIFICATIONS ----------
    function certCardHtml(c){
      return '<a class="cert-card reveal is-visible" href="'+escapeHtml(c.url||'#')+'" target="_blank" rel="noopener">' +
        '<div class="cert-ico">'+c.icon+'</div>' +
        '<div><h4>'+escapeHtml(c.title)+'</h4>' +
        '<p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:6px;">'+escapeHtml(c.subtitle||'')+'</p>' +
        '<a>View certificate ↗</a></div></a>';
    }
    function renderCerts(){
      var el = document.getElementById('certGrid');
      if(!el) return;
      var items = allItems('certs');
      el.innerHTML = items.length === 0
        ? '<div class="empty-state">No certifications listed yet — check back soon.</div>'
        : items.map(certCardHtml).join('');
      initScrollBox('certsScrollBox');
    }

    // ---------- VIDEOS ----------
    function videoCardHtml(v){
      var vid = youTubeId(v.url);
      var embed = vid
        ? '<iframe src="https://www.youtube.com/embed/'+vid+'" title="'+escapeHtml(v.title)+'" allowfullscreen loading="lazy"></iframe>'
        : '';
      var extra = '';
      if(v.description && v.description.trim()){
        extra += '<p class="video-desc">'+escapeHtml(v.description)+'</p>';
      }
      if(v.links && v.links.length){
        extra += '<div class="link-badges">' + v.links.map(function(l){
          return '<a class="link-badge" href="'+escapeHtml(l.url)+'" target="_blank" rel="noopener">'+escapeHtml(l.title||'Link')+' ↗</a>';
        }).join('') + '</div>';
      }
      return '<div class="video-card reveal is-visible">' +
        '<div class="video-embed">'+embed+'</div>' +
        '<div class="video-card-body-col"><h4>'+escapeHtml(v.title)+'</h4>'+extra+'</div></div>';
    }
    function renderVideos(){
      var el = document.getElementById('videoGrid');
      if(!el) return;
      var items = allItems('videos');
      if(items.length === 0){
        el.innerHTML = '<div class="video-empty reveal is-visible"><div class="play-ico">▶</div><p>Nothing uploaded yet — check back soon.</p></div>';
      } else {
        el.innerHTML = '<div class="video-grid">'+items.map(videoCardHtml).join('')+'</div>';
      }
      initScrollBox('videosScrollBox');
    }

    // ---------- SKILLS ----------
    function renderSkills(){
      var el = document.getElementById('skillGroups');
      if(!el) return;
      var items = allItems('skills');
      if(items.length === 0){
        el.innerHTML = '<div class="empty-state">No skills listed yet — check back soon.</div>';
        initScrollBox('skillsScrollBox');
        return;
      }
      var order = [], byGroup = {};
      for(var i=0;i<items.length;i++){
        var g = items[i].group;
        if(!byGroup[g]){ byGroup[g] = []; order.push(g); }
        byGroup[g].push(items[i]);
      }
      var html = '';
      for(var k=0;k<order.length;k++){
        var groupSkills = byGroup[order[k]];
        var simplePills = [], richItems = [];
        for(var s=0;s<groupSkills.length;s++){
          var sk = groupSkills[s];
          if((sk.description && sk.description.trim()) || (sk.links && sk.links.length)){ richItems.push(sk); }
          else{ simplePills.push(sk); }
        }
        var body = '';
        if(simplePills.length){
          body += '<div class="pill-row">' + simplePills.map(function(n){ return '<span class="pill">'+escapeHtml(n.name)+'</span>'; }).join('') + '</div>';
        }
        if(richItems.length){
          body += '<div class="skill-item-list"' + (simplePills.length ? ' style="margin-top:14px;"' : '') + '>';
          for(var r=0;r<richItems.length;r++){
            var ri = richItems[r];
            body += '<div class="skill-item"><div class="skill-item-name">'+escapeHtml(ri.name)+'</div>';
            if(ri.description && ri.description.trim()){
              body += '<div class="skill-item-desc">'+escapeHtml(ri.description)+'</div>';
            }
            if(ri.links && ri.links.length){
              body += '<div class="skill-links">' + ri.links.map(function(l){
                return '<a class="skill-link-chip" href="'+escapeHtml(l.url)+'" target="_blank" rel="noopener">'+escapeHtml(l.title||'Link')+' ↗</a>';
              }).join('') + '</div>';
            }
            body += '</div>';
          }
          body += '</div>';
        }
        html += '<div class="skill-card reveal is-visible"><h4>'+escapeHtml(order[k])+'</h4>'+body+'</div>';
      }
      el.innerHTML = html;
      initScrollBox('skillsScrollBox');
    }

    renderTabs();
    renderProjects();
    renderCerts();
    renderVideos();
    renderSkills();
    renderEducation();

    // ---------- admin: server-verified password gate + tabbed panel ----------
    // The password check now happens on the server (/api/login), which is
    // the only place that knows the real hash. The browser never sees it,
    // so it can't be read from page source or brute-forced offline.
    function adminLogin(password){
      return fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
      }).then(function(r){ return r.json().then(function(body){ return { ok: r.ok, body: body }; }); })
        .catch(function(){ return { ok:false, body:{ error:'Could not reach the server. Is the site deployed with the API + database set up?' } }; });
    }

    var overlay = document.getElementById('adminOverlay');
    var gateEl = document.getElementById('adminGate');
    var panelEl = document.getElementById('adminPanel');
    var closeBtn = document.getElementById('adminClose');
    var unlockBtn = document.getElementById('adminUnlock');
    var lockBtn = document.getElementById('adminLockBtn');
    var passInput = document.getElementById('adminPass');
    var errorEl = document.getElementById('adminError');
    var catSelect = document.getElementById('pCategory');
    var pendingTab = 'projects';

    function refreshCategorySelect(){
      if(!catSelect) return;
      var names = getCategoryNames();
      var current = catSelect.value;
      var optHtml = '';
      for(var c=0;c<names.length;c++){ optHtml += '<option value="'+escapeHtml(names[c])+'">'+escapeHtml(names[c])+'</option>'; }
      catSelect.innerHTML = optHtml;
      if(names.indexOf(current) !== -1){ catSelect.value = current; }
    }
    refreshCategorySelect();

    var addCategoryBtn = document.getElementById('addCategoryBtn');
    var newCategoryInput = document.getElementById('newCategoryInput');
    if(addCategoryBtn && newCategoryInput){
      addCategoryBtn.addEventListener('click', function(){
        var name = newCategoryInput.value.trim();
        if(!name){ return; }
        var existing = getCategoryNames();
        if(existing.indexOf(name) !== -1){
          alert('That category already exists.');
          return;
        }
        var custom = loadCustom('categories');
        custom.push({ id: 'custom-cat-' + Date.now(), name: name });
        saveCustom('categories', custom);
        renderTabs();
        refreshCategorySelect();
        renderAdminList('categories', 'adminCategoriesList');
        newCategoryInput.value = '';
      });
      newCategoryInput.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ addCategoryBtn.click(); } });
    }

    function setActiveTab(tab){
      pendingTab = tab;
      var tabs = document.querySelectorAll('.admin-tab');
      for(var i=0;i<tabs.length;i++){
        tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab') === tab);
      }
      document.getElementById('tabProjects').style.display  = tab === 'projects'  ? '' : 'none';
      document.getElementById('tabSkills').style.display    = tab === 'skills'    ? '' : 'none';
      document.getElementById('tabCerts').style.display     = tab === 'certs'     ? '' : 'none';
      document.getElementById('tabVideos').style.display    = tab === 'videos'    ? '' : 'none';
      document.getElementById('tabAbout').style.display     = tab === 'about'     ? '' : 'none';
      document.getElementById('tabEducation').style.display = tab === 'education' ? '' : 'none';
      document.getElementById('tabTerminal').style.display  = tab === 'terminal'  ? '' : 'none';
      document.getElementById('tabContactInfo').style.display = tab === 'contactinfo' ? '' : 'none';
      document.getElementById('tabAvatar').style.display     = tab === 'avatar'    ? '' : 'none';
      document.getElementById('tabSecurity').style.display  = tab === 'security'  ? '' : 'none';
      if(tab === 'projects')  { renderAdminList('projects', 'adminProjectsList'); renderAdminList('categories', 'adminCategoriesList'); }
      if(tab === 'skills')    renderAdminList('skills', 'adminSkillsList');
      if(tab === 'certs')     renderAdminList('certs', 'adminCertsList');
      if(tab === 'videos')    renderAdminList('videos', 'adminVideosList');
      if(tab === 'about')     populateAboutForm();
      if(tab === 'education') renderAdminList('education', 'adminEduList');
      if(tab === 'terminal')  populateTerminalForm();
      if(tab === 'contactinfo') populateContactInfoForm();
      if(tab === 'avatar')    populateAvatarForm();
      if(tab === 'security')  populateSecurityForm();
    }

    var tabBtns = document.querySelectorAll('.admin-tab');
    for(var ti=0;ti<tabBtns.length;ti++){
      tabBtns[ti].addEventListener('click', function(e){ setActiveTab(e.currentTarget.getAttribute('data-tab')); });
    }

    function openAdmin(tab){
      if(overlay){ overlay.classList.add('open'); }
      if(gateEl){ gateEl.style.display = ''; }
      if(panelEl){ panelEl.style.display = 'none'; }
      if(passInput){ passInput.value = ''; }
      if(errorEl){ errorEl.textContent = ''; }
      setActiveTab(tab || 'projects');
    }
    function closeAdmin(){ if(overlay){ overlay.classList.remove('open'); } }
    function unlockAdmin(){
      if(!passInput) return;
      var entered = passInput.value;
      unlockBtn.disabled = true;
      if(errorEl){ errorEl.textContent = ''; }
      adminLogin(entered).then(function(res){
        unlockBtn.disabled = false;
        if(res.ok && res.body && res.body.token){
          cdSetAdminToken(res.body.token);
          gateEl.style.display = 'none';
          panelEl.style.display = '';
          setActiveTab(pendingTab);
        } else if(errorEl){
          errorEl.textContent = (res.body && res.body.error) || 'Wrong password.';
          errorEl.className = 'form-status err';
        }
      });
    }

    var openTriggers = document.querySelectorAll('[data-open-admin]');
    for(var oi=0;oi<openTriggers.length;oi++){
      openTriggers[oi].addEventListener('click', function(e){
        openAdmin(e.currentTarget.getAttribute('data-open-admin'));
      });
    }
    if(closeBtn){ closeBtn.addEventListener('click', closeAdmin); }
    if(overlay){ overlay.addEventListener('click', function(e){ if(e.target === overlay){ closeAdmin(); } }); }
    if(unlockBtn){ unlockBtn.addEventListener('click', unlockAdmin); }
    if(passInput){ passInput.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ unlockAdmin(); } }); }
    if(lockBtn){ lockBtn.addEventListener('click', function(){ openAdmin(pendingTab); }); }

    function renderAdminList(type, elId){
      var el = document.getElementById(elId);
      if(!el) return;
      var items = allItems(type);
      if(items.length === 0){
        el.innerHTML = '<p class="note">Nothing listed yet.</p>';
        return;
      }
      var html = '';
      for(var i=0;i<items.length;i++){
        var name = items[i].title || items[i].name;
        var sub = items[i].category || items[i].group;
        var label = name + (sub ? ' ('+sub+')' : '');
        html += '<div class="row"><span>'+escapeHtml(label)+'</span>' +
          '<button class="project-remove" data-remove-type="'+type+'" data-remove-id="'+escapeHtml(items[i].id)+'" type="button">Remove</button></div>';
      }
      el.innerHTML = html;
      var btns = el.querySelectorAll('[data-remove-id]');
      for(var j=0;j<btns.length;j++){
        btns[j].addEventListener('click', function(e){
          var t = e.currentTarget.getAttribute('data-remove-type');
          var id = e.currentTarget.getAttribute('data-remove-id');
          removeItem(t, id);
          if(t==='projects'){ renderProjects(); renderAdminList('projects','adminProjectsList'); }
          if(t==='skills'){ renderSkills(); renderAdminList('skills','adminSkillsList'); }
          if(t==='certs'){ renderCerts(); renderAdminList('certs','adminCertsList'); }
          if(t==='videos'){ renderVideos(); renderAdminList('videos','adminVideosList'); }
          if(t==='education'){ renderEducation(); renderAdminList('education','adminEduList'); }
          if(t==='categories'){ renderTabs(); refreshCategorySelect(); renderAdminList('categories','adminCategoriesList'); }
          if(t==='extralinks'){ renderExtraLinks(); renderAdminList('extralinks','adminExtraLinksList'); }
        });
      }
    }

    // ---------- EDUCATION ----------
    function eduSortKey(e){
      var n = parseInt(e.startYear, 10);
      return isNaN(n) ? -Infinity : n;
    }
    function renderEducation(){
      var el = document.getElementById('eduTimeline');
      if(!el) return;
      var items = allItems('education').slice();
      items.sort(function(a,b){ return eduSortKey(b) - eduSortKey(a); }); // most recent start year first
      if(items.length === 0){
        el.innerHTML = '<div class="empty-state">No education entries yet.</div>';
        return;
      }
      var html = '';
      for(var i=0;i<items.length;i++){
        var e = items[i];
        var endLabel = (e.endYear && String(e.endYear).trim()) ? e.endYear : 'Present';
        html += '<div class="tl-item reveal is-visible">' +
          '<span class="when">'+escapeHtml(e.startYear||'')+' — '+escapeHtml(endLabel)+'</span>' +
          '<h3>'+escapeHtml(e.title)+'</h3>' +
          '<p>'+escapeHtml(e.desc||'')+'</p></div>';
      }
      el.innerHTML = html;
    }

    // add project
    var addProjectBtn = document.getElementById('addProjectBtn');
    if(addProjectBtn){
      addProjectBtn.addEventListener('click', function(){
        var title = document.getElementById('pTitle').value.trim();
        var category = document.getElementById('pCategory').value;
        var tagsRaw = document.getElementById('pTags').value.trim();
        var bulletsRaw = document.getElementById('pBullets').value.trim();
        var demo = document.getElementById('pDemo').value.trim();
        var source = document.getElementById('pSource').value.trim();
        if(!title || !bulletsRaw){ alert('Please add at least a title and one highlight line.'); return; }
        var tags = tagsRaw ? tagsRaw.split(',').map(function(t){ return t.trim(); }).filter(Boolean) : [];
        var bullets = bulletsRaw.split('\n').map(function(b){ return b.trim(); }).filter(Boolean);
        var id = 'custom-' + Date.now();
        var custom = loadCustom('projects');
        custom.push({ id:id, title:title, category:category, tags:tags, bullets:bullets, demo:demo, source:source });
        saveCustom('projects', custom);
        renderProjects();
        renderAdminList('projects','adminProjectsList');
        document.getElementById('pTitle').value = '';
        document.getElementById('pTags').value = '';
        document.getElementById('pBullets').value = '';
        document.getElementById('pDemo').value = '';
        document.getElementById('pSource').value = '';
      });
    }

    // add skill
    var sLinksEditor = document.getElementById('sLinksEditor');
    var addSkillLinkRowBtn = document.getElementById('addSkillLinkRowBtn');
    if(addSkillLinkRowBtn && sLinksEditor){
      addSkillLinkRowBtn.addEventListener('click', function(){ addLinkRow(sLinksEditor); });
    }

    var addSkillBtn = document.getElementById('addSkillBtn');
    if(addSkillBtn){
      addSkillBtn.addEventListener('click', function(){
        var group = document.getElementById('sGroup').value.trim();
        var name = document.getElementById('sName').value.trim();
        var description = document.getElementById('sDesc').value.trim();
        if(!group || !name){ alert('Please add both a group name and a skill name.'); return; }
        var links = sLinksEditor ? collectLinkRows(sLinksEditor) : [];
        var id = 'custom-skill-' + Date.now();
        var custom = loadCustom('skills');
        custom.push({ id:id, group:group, name:name, description:description, links:links });
        saveCustom('skills', custom);
        renderSkills();
        renderAdminList('skills','adminSkillsList');
        document.getElementById('sGroup').value = '';
        document.getElementById('sName').value = '';
        document.getElementById('sDesc').value = '';
        if(sLinksEditor){ clearLinkRows(sLinksEditor); }
      });
    }

    // add certificate
    var addCertBtn = document.getElementById('addCertBtn');
    if(addCertBtn){
      addCertBtn.addEventListener('click', function(){
        var title = document.getElementById('cTitle').value.trim();
        var subtitle = document.getElementById('cSubtitle').value.trim();
        var icon = document.getElementById('cIcon').value.trim() || '📄';
        var url = document.getElementById('cUrl').value.trim();
        if(!title || !url){ alert('Please add at least a title and the certificate URL.'); return; }
        var id = 'custom-cert-' + Date.now();
        var custom = loadCustom('certs');
        custom.push({ id:id, title:title, subtitle:subtitle, icon:icon, url:url });
        saveCustom('certs', custom);
        renderCerts();
        renderAdminList('certs','adminCertsList');
        document.getElementById('cTitle').value = '';
        document.getElementById('cSubtitle').value = '';
        document.getElementById('cIcon').value = '';
        document.getElementById('cUrl').value = '';
      });
    }

    var vLinksEditor = document.getElementById('vLinksEditor');
    var addVideoLinkRowBtn = document.getElementById('addVideoLinkRowBtn');
    if(addVideoLinkRowBtn && vLinksEditor){
      addVideoLinkRowBtn.addEventListener('click', function(){ addLinkRow(vLinksEditor); });
    }

    // add video
    var addVideoBtn = document.getElementById('addVideoBtn');
    if(addVideoBtn){
      addVideoBtn.addEventListener('click', function(){
        var title = document.getElementById('vTitle').value.trim();
        var url = document.getElementById('vUrl').value.trim();
        var description = document.getElementById('vDesc').value.trim();
        var errEl = document.getElementById('videoError');
        if(!title || !url){ if(errEl){ errEl.textContent = 'Please add a title and a YouTube URL.'; errEl.className='form-status err'; } return; }
        if(!youTubeId(url)){ if(errEl){ errEl.textContent = "Couldn't read a video ID from that URL — check it's a full YouTube link."; errEl.className='form-status err'; } return; }
        if(errEl){ errEl.textContent = ''; }
        var links = vLinksEditor ? collectLinkRows(vLinksEditor) : [];
        var id = 'custom-video-' + Date.now();
        var custom = loadCustom('videos');
        custom.push({ id:id, title:title, url:url, description:description, links:links });
        saveCustom('videos', custom);
        renderVideos();
        renderAdminList('videos','adminVideosList');
        document.getElementById('vTitle').value = '';
        document.getElementById('vUrl').value = '';
        document.getElementById('vDesc').value = '';
        if(vLinksEditor){ clearLinkRows(vLinksEditor); }
      });
    }

    // export buttons
    function wireExport(btnId, boxId, type){
      var btn = document.getElementById(btnId);
      var box = document.getElementById(boxId);
      if(btn && box){
        btn.addEventListener('click', function(){
          box.style.display = '';
          box.value = JSON.stringify(allItems(type), null, 2);
          box.focus();
          box.select();
        });
      }
    }
    wireExport('exportProjectsBtn', 'exportBoxProjects', 'projects');
    wireExport('exportSkillsBtn', 'exportBoxSkills', 'skills');
    wireExport('exportCertsBtn', 'exportBoxCerts', 'certs');
    wireExport('exportVideosBtn', 'exportBoxVideos', 'videos');

    // ── About section admin ──
    var ABOUT_KEY = 'cd_about_v1';
    var ABOUT_DEFAULTS = {
      name:    'Chaitanya Dussa',
      tagline: 'builds full-stack products.',
      eyebrow: 'Available for opportunities',
      lead:    "I'm a full-stack developer working across React, Node.js, and Express, with hands-on REST API and database experience. Lately I've been folding generative AI, prompt engineering, and workflow automation into how I ship — alongside no-code tooling where it gets the job done faster."
    };
    function loadAbout(){ return cdRemoteGet(ABOUT_KEY, ABOUT_DEFAULTS); }
    function saveAboutData(d){ cdRemoteSet(ABOUT_KEY, d); }
    function applyAbout(d){
      var n=document.getElementById('heroName'); if(n) n.textContent=d.name;
      var t=document.getElementById('heroTagline'); if(t) t.textContent=d.tagline;
      var e=document.getElementById('heroEyebrow'); if(e) e.textContent=d.eyebrow;
      var l=document.getElementById('heroLead'); if(l) l.textContent=d.lead;
    }
    function populateAboutForm(){
      var d=loadAbout();
      var f=function(id,v){ var el=document.getElementById(id); if(el) el.value=v; };
      f('aboutName',d.name); f('aboutTagline',d.tagline); f('aboutEyebrow',d.eyebrow); f('aboutLead',d.lead);
    }
    function statusMsg(elId, msg, isErr){
      var el=document.getElementById(elId); if(!el) return;
      el.textContent=msg; el.className='form-status'+(isErr?' err':'');
      setTimeout(function(){ el.textContent=''; }, 3000);
    }
    // apply on load
    applyAbout(loadAbout());
    var saveAboutBtn = document.getElementById('saveAboutBtn');
    if(saveAboutBtn){
      saveAboutBtn.addEventListener('click', function(){
        var d={
          name:   (document.getElementById('aboutName')||{}).value||ABOUT_DEFAULTS.name,
          tagline:(document.getElementById('aboutTagline')||{}).value||ABOUT_DEFAULTS.tagline,
          eyebrow:(document.getElementById('aboutEyebrow')||{}).value||ABOUT_DEFAULTS.eyebrow,
          lead:   (document.getElementById('aboutLead')||{}).value||ABOUT_DEFAULTS.lead
        };
        saveAboutData(d); applyAbout(d);
        statusMsg('aboutStatus','✓ Saved — changes applied instantly.', false);
      });
    }
    var resetAboutBtn = document.getElementById('resetAboutBtn');
    if(resetAboutBtn){
      resetAboutBtn.addEventListener('click', function(){
        cdRemoteRemove(ABOUT_KEY);
        applyAbout(ABOUT_DEFAULTS);
        populateAboutForm();
        statusMsg('aboutStatus','Reset to defaults.', false);
      });
    }

    // ── Education section admin: add / remove / auto-sort by start year ──
    var addEduBtn = document.getElementById('addEduBtn');
    if(addEduBtn){
      addEduBtn.addEventListener('click', function(){
        var title = (document.getElementById('eduTitleInput')||{}).value || '';
        var desc = (document.getElementById('eduDescInput')||{}).value || '';
        var startYear = (document.getElementById('eduStartInput')||{}).value || '';
        var endYear = (document.getElementById('eduEndInput')||{}).value || '';
        title = title.trim(); desc = desc.trim(); startYear = startYear.trim(); endYear = endYear.trim();
        if(!title || !startYear){
          alert('Please add at least a degree/course title and a start year.');
          return;
        }
        var id = 'custom-edu-' + Date.now();
        var custom = loadCustom('education');
        custom.push({ id:id, title:title, desc:desc, startYear:startYear, endYear:endYear });
        saveCustom('education', custom);
        renderEducation();
        renderAdminList('education', 'adminEduList');
        document.getElementById('eduTitleInput').value = '';
        document.getElementById('eduDescInput').value = '';
        document.getElementById('eduStartInput').value = '';
        document.getElementById('eduEndInput').value = '';
      });
    }
    var exportEduBtn = document.getElementById('exportEduBtn');
    var exportBoxEdu = document.getElementById('exportBoxEdu');
    if(exportEduBtn && exportBoxEdu){
      exportEduBtn.addEventListener('click', function(){
        exportBoxEdu.style.display = '';
        exportBoxEdu.value = JSON.stringify(allItems('education'), null, 2);
        exportBoxEdu.focus();
        exportBoxEdu.select();
      });
    }

    // ── Terminal admin ──
    function populateTerminalForm(){
      var lines = loadTerminalLines();
      var editor = document.getElementById('terminalLinesEditor');
      if(!editor) return;
      editor.innerHTML = '';
      lines.forEach(function(l, idx){ addTerminalRow(editor, l, idx); });
    }

    function addTerminalRow(editor, l, idx){
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;align-items:flex-start;';
      row.innerHTML =
        '<select style="font-family:JetBrains Mono,monospace;font-size:0.75rem;background:var(--bg-panel-2);border:1px solid var(--line);border-radius:7px;color:var(--text);padding:7px 8px;width:115px;flex-shrink:0;">' +
          '<option value="cmd"' + (!l.out?'selected':'') + '>$ command</option>' +
          '<option value="out"' + (l.out?'selected':'') + '>  output</option>' +
        '</select>' +
        '<input type="text" value="' + (l.t||'').replace(/"/g,'&quot;') + '" placeholder="line text..." style="flex:1;font-family:JetBrains Mono,monospace;font-size:0.8rem;">' +
        '<button type="button" style="background:none;border:1px solid var(--line);border-radius:7px;color:#ff8a8a;padding:6px 10px;cursor:pointer;font-size:0.8rem;flex-shrink:0;" title="Remove">✕</button>';
      row.querySelector('button').addEventListener('click', function(){ row.remove(); });
      editor.appendChild(row);
    }

    var addLineBtn = document.getElementById('addTerminalLineBtn');
    if(addLineBtn){
      addLineBtn.addEventListener('click', function(){
        var editor = document.getElementById('terminalLinesEditor');
        addTerminalRow(editor, {p:'~$ ', t:'', out:false}, editor.children.length);
      });
    }

    var saveTermBtn = document.getElementById('saveTerminalBtn');
    if(saveTermBtn){
      saveTermBtn.addEventListener('click', function(){
        var editor = document.getElementById('terminalLinesEditor');
        var rows = editor.querySelectorAll('div');
        var newLines = [];
        rows.forEach(function(row){
          var sel = row.querySelector('select');
          var inp = row.querySelector('input');
          if(!sel || !inp) return;
          var isOut = sel.value === 'out';
          newLines.push({ p: isOut ? '' : '~$ ', t: inp.value, out: isOut });
        });
        cdRemoteSet(TERMINAL_KEY, newLines);
        replayTerminal();
        statusMsg('terminalStatus','✓ Saved — terminal replaying now.', false);
      });
    }

    var resetTermBtn = document.getElementById('resetTerminalBtn');
    if(resetTermBtn){
      resetTermBtn.addEventListener('click', function(){
        cdRemoteRemove(TERMINAL_KEY);
        populateTerminalForm();
        replayTerminal();
        statusMsg('terminalStatus','Reset to defaults.', false);
      });
    }

    // ── Contact Info: single source feeding footer + Get in Touch + resume links ──
    var CONTACT_INFO_KEY = 'cd_contact_info_v1';
    var CONTACT_INFO_DEFAULTS = {
      email: 'dussachaitanya@gmail.com',
      phone: '+917032883832',
      linkedin: 'https://www.linkedin.com/in/chaitanya-dussa-fullstackdevelopment/',
      github: 'https://github.com/ChaitanyaDussa',
      leetcode: 'https://leetcode.com/u/ChaitanyaDussa/',
      resume: 'https://drive.google.com/file/d/1Mr5mkM8v876UZic6V3QVlx6pjNPks_er/view?usp=sharing'
    };
    function loadContactInfo(){ return cdRemoteGet(CONTACT_INFO_KEY, CONTACT_INFO_DEFAULTS); }
    function saveContactInfoData(d){ cdRemoteSet(CONTACT_INFO_KEY, d); }
    function applyContactInfo(d){
      var set = function(id, attr, val){ var el = document.getElementById(id); if(el){ el[attr] = val; } };
      set('footerEmail',   'href', 'mailto:' + d.email);
      set('footerPhone',   'href', 'tel:' + d.phone.replace(/[^\d+]/g, ''));
      set('footerLinkedin','href', d.linkedin);
      set('footerGithub',  'href', d.github);
      set('footerLeetcode','href', d.leetcode);
      set('giLeetcode',    'href', d.leetcode);
      set('giLinkedin',    'href', d.linkedin);
      set('giGithub',      'href', d.github);
      set('giEmail',       'href', 'mailto:' + d.email);
      var giEmailText = document.getElementById('giEmailText'); if(giEmailText){ giEmailText.textContent = d.email; }
      set('navResumeLink', 'href', d.resume);
      set('heroResumeLink','href', d.resume);
    }
    function populateContactInfoForm(){
      var d = loadContactInfo();
      var f = function(id, v){ var el = document.getElementById(id); if(el){ el.value = v; } };
      f('ciEmail', d.email); f('ciPhone', d.phone); f('ciLinkedin', d.linkedin);
      f('ciGithub', d.github); f('ciLeetcode', d.leetcode); f('ciResume', d.resume);
      renderAdminList('extralinks', 'adminExtraLinksList');
    }

    // ── extensible "additional links" for future info types (Get in Touch) ──
    function renderExtraLinks(){
      var el = document.getElementById('giExtraLinks');
      if(!el) return;
      var items = allItems('extralinks');
      el.innerHTML = items.map(function(link){
        return '<a class="contact-card reveal is-visible" href="'+escapeHtml(link.url)+'" target="_blank" rel="noopener">' +
          '<div class="contact-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg></div>' +
          '<div><h4>'+escapeHtml(link.label)+'</h4><p style="max-width:200px;">'+escapeHtml(link.url)+'</p></div>' +
          '<span class="contact-arrow">↗</span></a>';
      }).join('');
    }
    renderExtraLinks();

    var addExtraLinkBtn = document.getElementById('addExtraLinkBtn');
    if(addExtraLinkBtn){
      addExtraLinkBtn.addEventListener('click', function(){
        var labelEl = document.getElementById('ciExtraLabel');
        var urlEl = document.getElementById('ciExtraUrl');
        var label = labelEl ? labelEl.value.trim() : '';
        var url = urlEl ? urlEl.value.trim() : '';
        if(!label || !url){ alert('Please add both a label and a URL.'); return; }
        var custom = loadCustom('extralinks');
        custom.push({ id: 'custom-link-' + Date.now(), label: label, url: url });
        saveCustom('extralinks', custom);
        renderExtraLinks();
        renderAdminList('extralinks', 'adminExtraLinksList');
        labelEl.value = ''; urlEl.value = '';
      });
    }
    // apply on load
    applyContactInfo(loadContactInfo());

    var saveContactInfoBtn = document.getElementById('saveContactInfoBtn');
    if(saveContactInfoBtn){
      saveContactInfoBtn.addEventListener('click', function(){
        var g = function(id, fallback){ var el = document.getElementById(id); return (el && el.value.trim()) || fallback; };
        var d = {
          email:    g('ciEmail', CONTACT_INFO_DEFAULTS.email),
          phone:    g('ciPhone', CONTACT_INFO_DEFAULTS.phone),
          linkedin: g('ciLinkedin', CONTACT_INFO_DEFAULTS.linkedin),
          github:   g('ciGithub', CONTACT_INFO_DEFAULTS.github),
          leetcode: g('ciLeetcode', CONTACT_INFO_DEFAULTS.leetcode),
          resume:   g('ciResume', CONTACT_INFO_DEFAULTS.resume)
        };
        saveContactInfoData(d);
        applyContactInfo(d);
        statusMsg('contactInfoStatus', '✓ Saved — footer, Get in Touch, and resume links updated.', false);
      });
    }
    var resetContactInfoBtn = document.getElementById('resetContactInfoBtn');
    if(resetContactInfoBtn){
      resetContactInfoBtn.addEventListener('click', function(){
        cdRemoteRemove(CONTACT_INFO_KEY);
        applyContactInfo(CONTACT_INFO_DEFAULTS);
        populateContactInfoForm();
        statusMsg('contactInfoStatus', 'Reset to defaults.', false);
      });
    }
    var exportContactInfoBtn = document.getElementById('exportContactInfoBtn');
    var exportBoxContactInfo = document.getElementById('exportBoxContactInfo');
    if(exportContactInfoBtn && exportBoxContactInfo){
      exportContactInfoBtn.addEventListener('click', function(){
        exportBoxContactInfo.style.display = '';
        exportBoxContactInfo.value = JSON.stringify(loadContactInfo(), null, 2);
        exportBoxContactInfo.focus();
        exportBoxContactInfo.select();
      });
    }

    // ── Avatar: swap the photo used in navbar + hero (this-browser preview only) ──
    var AVATAR_KEY = 'cd_avatar_override_v1';
    function loadAvatarOverride(){ return cdRemoteGet(AVATAR_KEY, null); }
    function applyAvatar(dataUrl){
      var src = dataUrl || 'avatar.png';
      var nav = document.getElementById('navAvatarImg'); if(nav){ nav.src = src; }
      var hero = document.getElementById('heroAvatarImg'); if(hero){ hero.src = src; }
      var favicon = document.querySelector('link[rel="icon"]'); if(favicon && dataUrl){ favicon.href = dataUrl; }
    }
    function populateAvatarForm(){
      var preview = document.getElementById('avatarPreview');
      var override = loadAvatarOverride();
      if(preview){ preview.src = override || 'avatar.png'; }
      var fileInput = document.getElementById('avatarFileInput');
      if(fileInput){ fileInput.value = ''; }
    }
    // apply on load
    applyAvatar(loadAvatarOverride());

    var pendingAvatarDataUrl = null;
    var avatarFileInput = document.getElementById('avatarFileInput');
    if(avatarFileInput){
      avatarFileInput.addEventListener('change', function(e){
        var file = e.target.files && e.target.files[0];
        if(!file) return;
        if(file.size > 1.5 * 1024 * 1024){
          statusMsg('avatarStatus', 'That file is quite large — it may fail to save. Consider compressing it first.', true);
        }
        var reader = new FileReader();
        reader.onload = function(ev){
          pendingAvatarDataUrl = ev.target.result;
          var preview = document.getElementById('avatarPreview');
          if(preview){ preview.src = pendingAvatarDataUrl; }
        };
        reader.readAsDataURL(file);
      });
    }
    var applyAvatarBtn = document.getElementById('applyAvatarBtn');
    if(applyAvatarBtn){
      applyAvatarBtn.addEventListener('click', function(){
        if(!pendingAvatarDataUrl){
          statusMsg('avatarStatus', 'Choose an image file first.', true);
          return;
        }
        try{
          cdRemoteSet(AVATAR_KEY, pendingAvatarDataUrl);
          applyAvatar(pendingAvatarDataUrl);
          statusMsg('avatarStatus', '✓ Avatar updated — synced to the server.', false);
        }catch(e){
          statusMsg('avatarStatus', 'Could not save — the image is likely too large. Try a smaller file.', true);
        }
      });
    }
    var resetAvatarBtn = document.getElementById('resetAvatarBtn');
    if(resetAvatarBtn){
      resetAvatarBtn.addEventListener('click', function(){
        cdRemoteRemove(AVATAR_KEY);
        pendingAvatarDataUrl = null;
        applyAvatar(null);
        populateAvatarForm();
        statusMsg('avatarStatus', 'Reset to the original avatar.', false);
      });
    }

    // ── Security tab: change the admin password yourself, no source edits needed ──
    function populateSecurityForm(){
      var statusLine = document.getElementById('securityStatusLine');
      var newPassEl = document.getElementById('newAdminPass');
      var confirmEl = document.getElementById('confirmAdminPass');
      if(newPassEl){ newPassEl.value = ''; }
      if(confirmEl){ confirmEl.value = ''; }
      if(statusLine){
        statusLine.textContent = 'Password is verified and stored server-side — it applies for every browser and every visitor.';
      }
    }

    var savePassBtn = document.getElementById('savePasswordBtn');
    if(savePassBtn){
      savePassBtn.addEventListener('click', function(){
        var newPassEl = document.getElementById('newAdminPass');
        var confirmEl = document.getElementById('confirmAdminPass');
        var newPass = newPassEl ? newPassEl.value : '';
        var confirmPass = confirmEl ? confirmEl.value : '';
        if(!newPass || newPass.length < 4){
          statusMsg('securityStatus', 'Password must be at least 4 characters.', true);
          return;
        }
        if(newPass !== confirmPass){
          statusMsg('securityStatus', "Passwords don't match.", true);
          return;
        }
        savePassBtn.disabled = true;
        fetch('/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CD_ADMIN_TOKEN },
          body: JSON.stringify({ newPassword: newPass })
        }).then(function(r){ return r.json().then(function(body){ return {ok:r.ok, body:body}; }); })
          .then(function(res){
            savePassBtn.disabled = false;
            if(res.ok){
              populateSecurityForm();
              statusMsg('securityStatus', '✓ Password updated for every browser and visitor.', false);
            } else {
              statusMsg('securityStatus', (res.body && res.body.error) || 'Could not update password.', true);
            }
          })
          .catch(function(){
            savePassBtn.disabled = false;
            statusMsg('securityStatus', 'Could not reach the server.', true);
          });
      });
    }

    var resetPassBtn = document.getElementById('resetPasswordBtn');
    if(resetPassBtn){
      resetPassBtn.addEventListener('click', function(){
        fetch('/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CD_ADMIN_TOKEN },
          body: JSON.stringify({ reset: true })
        }).then(function(r){ return r.ok; })
          .then(function(ok){
            populateSecurityForm();
            statusMsg('securityStatus', ok ? 'Reset to the original password.' : 'Could not reset password.', !ok);
          })
          .catch(function(){ statusMsg('securityStatus', 'Could not reach the server.', true); });
      });
    }
  })();

  // ---------- chatbot widget (scripted FAQ, not a real AI model) ----------
  (function(){
    var fab = document.getElementById('chatFab');
    var panel = document.getElementById('chatPanel');
    var body = document.getElementById('chatBody');
    var input = document.getElementById('chatInput');
    var sendBtn = document.getElementById('chatSend');
    var muteBtn = document.getElementById('chatMute');
    if(!fab || !panel) return;

    var muted = false;
    var greeted = false;

    // ── draggable window (desktop only; launcher button itself never moves) ──
    var restoreChatPosition = function(){}; // no-op unless drag is enabled below
    (function initDrag(){
      var head = document.getElementById('chatHead');
      if(!head || !panel) return;

      var DRAG_KEY = 'cd_chat_pos_v1';
      // "desktop" = a mouse-driven device (fine pointer + hover), regardless of window width.
      // A narrow browser window on a laptop still has a mouse, so width alone isn't a
      // reliable signal — only touch-primary devices (phones/tablets) should be excluded.
      var isTouchPrimary = window.matchMedia('(hover:none) and (pointer:coarse)').matches;
      var isDesktop = !isTouchPrimary;
      if(!isDesktop){
        // touch device: dragging disabled, panel stays in its default fixed CSS position
        return;
      }

      head.classList.add('draggable');

      function clamp(x, y){
        var w = panel.offsetWidth, h = panel.offsetHeight;
        var maxX = window.innerWidth - w - 8;
        var maxY = window.innerHeight - h - 8;
        return { x: Math.min(Math.max(x, 8), Math.max(maxX, 8)), y: Math.min(Math.max(y, 8), Math.max(maxY, 8)) };
      }

      function applyPosition(x, y){
        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
      }

      // called once the panel is actually visible (has real dimensions to clamp against)
      restoreChatPosition = function(){
        try{
          var raw = localStorage.getItem(DRAG_KEY);
          if(!raw) return;
          var pos = JSON.parse(raw);
          var c = clamp(pos.x, pos.y);
          applyPosition(c.x, c.y);
        }catch(e){}
      };

      var dragging = false, offsetX = 0, offsetY = 0;

      head.addEventListener('mousedown', function(e){
        // don't start a drag from the mute button
        if(e.target.closest('#chatMute')) return;
        dragging = true;
        var rect = panel.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        panel.classList.add('dragging');
        e.preventDefault();
      });

      document.addEventListener('mousemove', function(e){
        if(!dragging) return;
        var c = clamp(e.clientX - offsetX, e.clientY - offsetY);
        applyPosition(c.x, c.y);
      });

      document.addEventListener('mouseup', function(){
        if(!dragging) return;
        dragging = false;
        panel.classList.remove('dragging');
        var rect = panel.getBoundingClientRect();
        try{ localStorage.setItem(DRAG_KEY, JSON.stringify({ x: rect.left, y: rect.top })); }catch(e){}
      });

      // keep the panel inside the viewport if the window is resized while open
      window.addEventListener('resize', function(){
        if(!panel.classList.contains('open') || panel.style.left === '') return;
        var rect = panel.getBoundingClientRect();
        var c = clamp(rect.left, rect.top);
        applyPosition(c.x, c.y);
      });
    })();

    var FAQ = [
      { kw:['skill','stack','tech','know','language','use'], a:"Chaitanya works mainly with JavaScript, Python, Java, React.js, Node.js, and Express, plus MongoDB and MySQL. He's also been picking up generative AI, prompt engineering, and workflow automation with tools like n8n." },
      { kw:['project','built','build','work','portfolio','made'], a:"He's built StudyNest, a study collaboration platform; a real-time chat app with Socket.io; and Green Insight, a tree-tracking system. Scroll to the Projects section for live demos and source code — they're organized by category, including Web Apps, Automation, AI Projects, and n8n Workflows." },
      { kw:['automation','n8n','workflow'], a:"He's been building out automation and n8n workflow projects — check the Automation and n8n Workflows tabs in the Projects section. New ones get added regularly." },
      { kw:['ai project','ai work','generative','llm','prompt'], a:"On the AI side, he works with generative AI, LLMs, and prompt engineering — see the AI Projects tab in the Projects section for specific builds." },
      { kw:['education','study','college','university','degree','cgpa','school'], a:"He's a B.Tech Computer Science student at Andhra Loyola Institute of Engineering and Technology, graduating in 2027, with an 8.0 CGPA." },
      { kw:['certificat','certified','course'], a:"He holds certificates in frontend development, Python, command-line and Git, SQL, and an entrepreneurship program with the Wadhwani Foundation — see the Certifications section for verified links." },
      { kw:['video','youtube','content','watch'], a:"His YouTube section is on this page too — content shows up there as soon as he publishes it." },
      { kw:['resume','cv'], a:"You can download his resume right from the navbar or the hero section on this page." },
      { kw:['contact','email','reach','hire','available','freelance','message'], a:"You can email him directly at dussachaitanya@gmail.com, or find his phone, LinkedIn, and GitHub in the footer at the bottom of this page. He usually replies within a day." },
      { kw:['phone','call','number','whatsapp'], a:"His phone number is listed in the footer at the bottom of this page." },
      { kw:['location','where','based','live','from','country'], a:"He's based in Andhra Pradesh, India." },
      { kw:['github'], a:"His GitHub is github.com/ChaitanyaDussa — all his project source code is public there." },
      { kw:['linkedin'], a:"You can connect with him on LinkedIn — there's a link in the navbar and footer." },
      { kw:['leetcode','dsa','coding practice'], a:"He practices on LeetCode — there's a link to his profile in the footer." },
      { kw:['who','about you','about him','introduce'], a:"Chaitanya is a full-stack developer from Andhra Pradesh, India, currently studying B.Tech Computer Science. He builds with React, Node.js, and Express, and is branching into AI and automation tooling." },
      { kw:['thank','thanks'], a:"You're welcome! Anything else you'd like to know about Chaitanya?" },
      { kw:['hi','hello','hey','yo'], a:"Hi! Ask me about Chaitanya's skills, projects, education, certifications, or how to get in touch." }
    ];
    var FALLBACK = "I don't have a scripted answer for that yet — try asking about his skills, projects, education, or certifications, or check the footer for ways to reach Chaitanya directly.";

    function findAnswer(q){
      q = q.toLowerCase();
      var best = null, bestScore = 0;
      for(var i=0;i<FAQ.length;i++){
        var score = 0;
        for(var j=0;j<FAQ[i].kw.length;j++){
          if(q.indexOf(FAQ[i].kw[j]) !== -1){ score++; }
        }
        if(score > bestScore){ bestScore = score; best = FAQ[i].a; }
      }
      return best || FALLBACK;
    }
    function addMsg(text, who){
      var div = document.createElement('div');
      div.className = 'chat-msg ' + who;
      div.textContent = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }
    function pickFemaleVoice(){
      var voices = window.speechSynthesis.getVoices();
      for(var i=0;i<voices.length;i++){
        if(/female|zira|samantha|susan|victoria|google us english$/i.test(voices[i].name)){ return voices[i]; }
      }
      return null;
    }
    function speak(text){
      if(muted || !('speechSynthesis' in window)){ return; }
      window.speechSynthesis.cancel();
      var utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;
      var female = pickFemaleVoice();
      if(female){ utter.voice = female; }
      window.speechSynthesis.speak(utter);
    }
    function botReply(text){
      addMsg(text, 'bot');
      speak(text);
    }
    function handleSend(){
      var q = input.value.trim();
      if(!q) return;
      addMsg(q, 'me');
      input.value = '';
      setTimeout(function(){ botReply(findAnswer(q)); }, 300);
    }
    fab.addEventListener('click', function(){
      panel.classList.toggle('open');
      if(panel.classList.contains('open')){
        restoreChatPosition();
      }
      if(panel.classList.contains('open') && !greeted){
        greeted = true;
        setTimeout(function(){
          botReply("Hi, I'm an automated assistant for Chaitanya's portfolio. Ask me about his skills, projects, education, or how to get in touch.");
        }, 200);
      }
    });
    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ handleSend(); } });
    muteBtn.addEventListener('click', function(){
      muted = !muted;
      muteBtn.textContent = muted ? '🔇' : '🔊';
      muteBtn.classList.toggle('muted', muted);
      if(muted && 'speechSynthesis' in window){ window.speechSynthesis.cancel(); }
    });
    if('speechSynthesis' in window){
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = function(){ window.speechSynthesis.getVoices(); };
    }
  })();

  // scroll reveal
  var revealEls = document.querySelectorAll('.reveal:not(.is-visible)');
  if('IntersectionObserver' in window){
    var obs = new IntersectionObserver(function(entries){
      for(var i=0;i<entries.length;i++){
        var en = entries[i];
        if(en.isIntersecting){
          en.target.classList.add('is-visible');
          obs.unobserve(en.target);
        }
      }
    }, {threshold:0.12});
    for(var j=0;j<revealEls.length;j++){ obs.observe(revealEls[j]); }
  } else {
    for(var k=0;k<revealEls.length;k++){ revealEls[k].classList.add('is-visible'); }
  }

/* ── Theme engine ── */
(function(){
  var THEMES = [
    { id:'ocean-blue',    name:'Ocean Blue',    bg:'#070b13', panel:'#0d1322', panel2:'#101a2e', line:'#1d2842',
      primary:'#4fd8ff', pdim:'#1d4f63', secondary:'#9b7bff', accent:'#5eead4',
      text:'#eaf1fb', muted:'#8a96b3', faint:'#7280a0', dot:'#4fd8ff' },
    { id:'cyber-green',   name:'Cyber Green',   bg:'#071209', panel:'#0d1f10', panel2:'#112815', line:'#1c3820',
      primary:'#39ff8a', pdim:'#0d4022', secondary:'#00e5c0', accent:'#b8ff6e',
      text:'#e6faea', muted:'#7aa87e', faint:'#537558', dot:'#39ff8a' },
    { id:'royal-purple',  name:'Royal Purple',  bg:'#0c0814', panel:'#160f26', panel2:'#1c1430', line:'#2e1f4a',
      primary:'#b57bff', pdim:'#3d2070', secondary:'#ff7bdb', accent:'#7b9fff',
      text:'#f0eaff', muted:'#9b8ab8', faint:'#6a5a8a', dot:'#b57bff' },
    { id:'sunset-orange', name:'Sunset Orange', bg:'#120a04', panel:'#1f1208', panel2:'#29180b', line:'#3d2510',
      primary:'#ff8c42', pdim:'#5c2e10', secondary:'#ff5e7e', accent:'#ffd166',
      text:'#fff0e6', muted:'#b8896a', faint:'#7a5540', dot:'#ff8c42' },
    { id:'crimson-red',   name:'Crimson Red',   bg:'#130507', panel:'#200a0d', panel2:'#2a0d10', line:'#3f1118',
      primary:'#ff4466', pdim:'#5c1020', secondary:'#ff8866', accent:'#ff6699',
      text:'#ffe6ea', muted:'#b87a84', faint:'#7a4a52', dot:'#ff4466' },
    { id:'midnight-black',name:'Midnight',       bg:'#000000', panel:'#0c0c0c', panel2:'#131313', line:'#222222',
      primary:'#ffffff', pdim:'#444444', secondary:'#aaaaaa', accent:'#666666',
      text:'#f5f5f5', muted:'#888888', faint:'#555555', dot:'#ffffff' },
    { id:'coffee-brown',  name:'Coffee Brown',  bg:'#0e0905', panel:'#1a1208', panel2:'#22180b', line:'#3a2c18',
      primary:'#c8922a', pdim:'#4a3010', secondary:'#e8b86d', accent:'#a07850',
      text:'#f5ece0', muted:'#a8906a', faint:'#706040', dot:'#c8922a' },
    { id:'neon-cyan',     name:'Neon Cyan',     bg:'#030e10', panel:'#071620', panel2:'#0a1d28', line:'#0f3040',
      primary:'#00f5ff', pdim:'#004d5a', secondary:'#00b8ff', accent:'#80ffe8',
      text:'#e0faff', muted:'#60a0b0', faint:'#3a6878', dot:'#00f5ff' },
    { id:'sakura-pink',   name:'Sakura Pink',   bg:'#130a0e', panel:'#1e1016', panel2:'#28161e', line:'#3d2030',
      primary:'#ff80b0', pdim:'#5c2040', secondary:'#ffb3cc', accent:'#ff4d80',
      text:'#ffe6ef', muted:'#b87a90', faint:'#7a4a5a', dot:'#ff80b0' },
    { id:'lavender',      name:'Lavender',      bg:'#0c0b14', panel:'#141326', panel2:'#1a1830', line:'#2c2850',
      primary:'#b8a8ff', pdim:'#3d3480', secondary:'#e8c0ff', accent:'#8890ff',
      text:'#f0eeff', muted:'#9088b8', faint:'#605880', dot:'#b8a8ff' },
    { id:'gold',          name:'Gold',          bg:'#0e0c04', panel:'#1a1808', panel2:'#22200c', line:'#3a3614',
      primary:'#ffd700', pdim:'#4a4000', secondary:'#ffb300', accent:'#ffe566',
      text:'#fffae6', muted:'#a89a60', faint:'#706840', dot:'#ffd700' },
    { id:'arctic-white',  name:'Arctic White',  bg:'#0a0e14', panel:'#111822', panel2:'#16202c', line:'#223040',
      primary:'#e8f4ff', pdim:'#2a4060', secondary:'#a0d0ff', accent:'#c0e8ff',
      text:'#f5faff', muted:'#8090a8', faint:'#506078', dot:'#e8f4ff' },
    { id:'emerald',       name:'Emerald',       bg:'#050e09', panel:'#0b1a10', panel2:'#102016', line:'#1a3524',
      primary:'#2ecc71', pdim:'#0a4020', secondary:'#27ae60', accent:'#a8ffcc',
      text:'#e6fff0', muted:'#6ab882', faint:'#3a6850', dot:'#2ecc71' },
    { id:'indigo',        name:'Indigo',        bg:'#070a18', panel:'#0e1230', panel2:'#12183c', line:'#1e2858',
      primary:'#6677ff', pdim:'#1e2860', secondary:'#8899ff', accent:'#4455dd',
      text:'#eaeeff', muted:'#7880b8', faint:'#485080', dot:'#6677ff' },
    { id:'random',        name:'Random',        dot:'#aaaaaa' } // special
  ];

  var HARMONIOUS = [
    ['#4fd8ff','#9b7bff','#5eead4'],
    ['#39ff8a','#00e5c0','#b8ff6e'],
    ['#b57bff','#ff7bdb','#7b9fff'],
    ['#ff8c42','#ff5e7e','#ffd166'],
    ['#ff4466','#ff8866','#ff6699'],
    ['#c8922a','#e8b86d','#a07850'],
    ['#00f5ff','#00b8ff','#80ffe8'],
    ['#ff80b0','#ffb3cc','#ff4d80'],
    ['#b8a8ff','#e8c0ff','#8890ff'],
    ['#ffd700','#ffb300','#ffe566'],
    ['#2ecc71','#27ae60','#a8ffcc'],
    ['#6677ff','#8899ff','#4455dd']
  ];

  function hexToRgb(hex){ var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return r+','+g+','+b; }
  function lighten(hex,pct){ var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); r=Math.min(255,Math.round(r*(1+pct))); g=Math.min(255,Math.round(g*(1+pct))); b=Math.min(255,Math.round(b*(1+pct))); return '#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+b.toString(16).padStart(2,'0'); }
  function darken(hex,pct){ return lighten(hex,-pct); }

  function buildRandom(){
    var pal = HARMONIOUS[Math.floor(Math.random()*HARMONIOUS.length)];
    var bgHue = ['#070b13','#0c0814','#071209','#130507','#050e09','#070a18'];
    var bg = bgHue[Math.floor(Math.random()*bgHue.length)];
    return { id:'random', name:'Random', bg:bg, panel:lighten(bg,0.6), panel2:lighten(bg,1.0),
      line:lighten(bg,2.5), primary:pal[0], pdim:darken(pal[0],0.6),
      secondary:pal[1], accent:pal[2],
      text:'#f0f4ff', muted:'#8a96b3', faint:'#7280a0', dot:pal[0] };
  }

  function applyTheme(t){
    var r = document.documentElement.style;
    r.setProperty('--bg',         t.bg);
    r.setProperty('--bg-panel',   t.panel);
    r.setProperty('--bg-panel-2', t.panel2);
    r.setProperty('--line',       t.line);
    r.setProperty('--primary',    t.primary);
    r.setProperty('--primary-dim',t.pdim);
    r.setProperty('--secondary',  t.secondary);
    r.setProperty('--accent',     t.accent);
    r.setProperty('--text',       t.text);
    r.setProperty('--text-muted', t.muted);
    r.setProperty('--text-faint', t.faint);
    r.setProperty('--primary-rgb',hexToRgb(t.primary));
    r.setProperty('--secondary-rgb',hexToRgb(t.secondary));
    r.setProperty('--accent-rgb', hexToRgb(t.accent));
    // also update bg-rgb for any rgba(var(--bg-rgb),...) references
    r.setProperty('--bg-rgb',     hexToRgb(t.bg));
    // update scrollbar accent via meta color-scheme hack
    document.querySelector('meta[name="theme-color"]') && (document.querySelector('meta[name="theme-color"]').content = t.primary);
    // mark active swatch
    var swatches = document.querySelectorAll('.theme-swatch');
    for(var i=0;i<swatches.length;i++){
      swatches[i].classList.toggle('active', swatches[i].getAttribute('data-id') === t.id);
    }
  }

  function saveTheme(id){ try{ localStorage.setItem('cd_theme',''+id); }catch(e){} }
  function loadThemeId(){ try{ return localStorage.getItem('cd_theme'); }catch(e){ return null; } }

  // build swatches
  var grid = document.getElementById('themeGrid');
  if(grid){
    THEMES.forEach(function(t){
      var div = document.createElement('div');
      div.className = 'theme-swatch';
      div.setAttribute('data-id', t.id);
      div.setAttribute('role','button');
      div.setAttribute('tabindex','0');
      div.innerHTML = '<span class="swatch-dot" style="background:'+t.dot+';color:'+t.dot+'"></span><span class="swatch-label">'+t.name+'</span>';
      div.addEventListener('click', function(){
        var chosen = t.id === 'random' ? buildRandom() : t;
        applyTheme(chosen);
        saveTheme(t.id);
      });
      div.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ div.click(); } });
      grid.appendChild(div);
    });
  }

  // toggle panel
  var fab   = document.getElementById('themeFab');
  var panel = document.getElementById('themePanel');
  var close = document.getElementById('themeClose');
  if(fab && panel){
    fab.addEventListener('click', function(e){ e.stopPropagation(); panel.hidden = !panel.hidden; });
    close && close.addEventListener('click', function(){ panel.hidden = true; });
    document.addEventListener('click', function(e){ if(!panel.contains(e.target) && e.target !== fab){ panel.hidden = true; } });
  }

  // restore saved theme on load
  var savedId = loadThemeId();
  if(savedId){
    if(savedId === 'random'){
      applyTheme(buildRandom());
    } else {
      var found = THEMES.filter(function(t){ return t.id === savedId; })[0];
      if(found){ applyTheme(found); }
    }
  }
  // default: Ocean Blue (already set in CSS, just mark active)
  if(!savedId){
    var defaultSwatch = document.querySelector('[data-id="ocean-blue"]');
    if(defaultSwatch){ defaultSwatch.classList.add('active'); }
  }
})();
