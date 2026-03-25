(()=>{function N(a){let c=a.replace(/\u00a0/g," ").replace(/\r\n?/g,`
`).replace(/\s+/g," ").trim(),i=/\b([A-Z]{2,5})\s+(\d{3}[A-Z]?)\s*-\s*(.+?)\s+([A-Z]{1,2}[+-]?)\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)\s+\d+(?:\.\d+)?\b/g,p=[],l=i.exec(c);for(;l!==null;){let[,u,b,o,x,m]=l;p.push({code:u+" "+b,title:o.replace(/\s+/g," ").trim(),grade:x,hours:parseFloat(m)}),l=i.exec(c)}let n=new Map,k=[];for(let u of p){let b=u.code.match(/^([A-Z]{2,5}\s+\d{3})L$/);b?k.push({parentCode:b[1],...u}):n.set(u.code,{...u})}for(let u of k)n.has(u.parentCode)?n.get(u.parentCode).hours+=u.hours:n.set(u.code,u);return Array.from(n.values())}function L(a){return"ca-"+a.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")}function P(a){a||(a=document);let c=a.querySelectorAll("div.acalog-core"),i=[],p="";for(let l=0;l<c.length;l++){let n=c[l],k=n.querySelector("h2"),u=n.querySelector("h3"),b=n.querySelector("h4"),o=n.querySelector("p"),x=o?o.textContent.replace(/\u00a0/g," ").trim():"",m=k||u||b;if(k&&!u&&!b){p=k.textContent.trim(),m&&(m.id=L(p)),i.push({type:"section-header",section:p,instructions:x,element:n,coreIndex:l,slug:L(p)});continue}let C="";m&&(C=Array.from(m.childNodes).filter(v=>v.nodeType===3||v.nodeType===1&&v.tagName==="A").map(v=>v.textContent.trim()).join("").trim(),m.id=L(C));let w=b!==null,y=x.match(/(\d+)[–-](\d+)\s+semester hours/),E=x.match(/up to (\d+)\s+semester hours in any one discipline/),$=y?parseInt(y[1]):null,H=y?parseInt(y[2]):null,f=E?parseInt(E[1]):null,e=$!==null?"hour-range":"pick-one",s=n.querySelector("ul"),g=[],t=[],r=null;if(s){for(let v of s.children)if(v.classList.contains("acalog-adhoc")){let A=v.textContent.trim();["Or","One from","And"].includes(A)||(r=A,t.push({name:A,element:v}))}else if(v.classList.contains("acalog-course")){let A=v.querySelector("a"),z=(A?A.textContent.trim():"").match(/^([A-Z]{2,5})\s+(\d{3}[A-Z]?)\s*-\s*(.+)$/);z&&g.push({code:z[1]+" "+z[2],title:z[3].trim(),subDiscipline:r,element:v})}}i.push({type:w?"tag":"category",section:p,name:C,instructions:x,reqType:e,minHours:$,maxHours:H,maxPerDiscipline:f,courses:g,subDisciplineElements:t,element:n,coreIndex:l,slug:L(C)})}return i}var T=["World Languages II","Arts, Oral Rhetoric, Visual Rhetoric","Humanities","Mathematical Sciences","Natural Sciences","Social and Behavioral Sciences"];function O(a,c){let i=new Set(c.map(o=>o.code)),p={};c.forEach(o=>{p[o.code]=o});let l={};for(let o of a)if(!(!o.courses||!o.name))for(let x of o.courses)l[x.code]||(l[x.code]=[]),l[x.code].push(o.name);let n={},k=0,u=0,b=[];for(let o of a){if(o.type==="section-header"){b.push({...o,status:"header"});continue}if(!o.courses||o.courses.length===0){b.push({...o,status:"info-only"});continue}let x=o.courses.filter(f=>i.has(f.code)),m=0,C={};for(let f of x){let e=p[f.code],s=e?e.hours:0;m+=s;let g=f.subDiscipline||"General";C[g]=(C[g]||0)+s}let w=o.maxHours!==null?Math.min(m,o.maxHours):m,y=new Set;if(o.maxPerDiscipline)for(let[f,e]of Object.entries(C))e>=o.maxPerDiscipline&&y.add(f);let E=o.courses.some(f=>!i.has(f.code)&&!y.has(f.subDiscipline||"General")),$;if(o.reqType==="pick-one")$=x.length>0?"complete":"incomplete";else{let f=o.minHours||0;f>0?m<f?$="incomplete":o.maxPerDiscipline&&o.maxHours!==null&&w<o.maxHours&&E?$="satisfied":$="complete":$=m>0?"complete":"optional-available"}T.includes(o.name)&&(n[o.name]={raw:m,effective:w,max:o.maxHours},k+=w,m>0&&u++);let H=o.courses.map(f=>{let e=i.has(f.code),s=l[f.code]||[],g=s.filter(t=>t!==o.name);return{...f,isTaken:e,isMultiSection:s.length>1,otherCategories:g,isMaxedDiscipline:y.has(f.subDiscipline||"General")&&!e,grade:e&&p[f.code]?.grade||"",hours:e&&p[f.code]?.hours||0}});b.push({...o,status:$,hoursEarned:m,hoursEffective:w,hoursByDiscipline:C,maxedDisciplines:y,takenCount:x.length,courseAnnotations:H})}return{results:b,transcript:c,kuSummary:{totalHours:k,requiredHours:26,categoriesUsed:u,requiredCategories:5,hoursByCategory:n}}}var d={taken:"#2d8a4e",takenBg:"#e6f7ed",opportunity:"#b8860b",opportunityBg:"#fff8dc",doubleCount:"#1a73e8",doubleCountBg:"#e8f0fe"};function D(){["ca-styles","ca-toc-styles"].forEach(a=>{document.getElementById(a)?.remove()}),document.querySelectorAll(".ca-legend,.ca-summary-panel,.ca-badge,.ca-hours-note,#ca-toc,.ca-disclaimer,.ca-transcript-section").forEach(a=>{a.remove()}),document.querySelectorAll('[class*="ca-course-"],[class*="ca-category-"]').forEach(a=>{a.className=a.className.replace(/ca-[\w-]+/g,"").trim(),a.removeAttribute("data-ca-note")})}function R({results:a,kuSummary:c,transcript:i}){D();let p=document.createElement("style");p.id="ca-styles",p.textContent=`
    .ca-badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px;
      font-weight:bold; margin-left:8px; vertical-align:middle; letter-spacing:0.3px; white-space:nowrap; }
    .ca-badge-complete { background:${d.takenBg}; color:${d.taken}; border:1px solid ${d.taken}; }
    .ca-badge-incomplete { background:${d.opportunityBg}; color:${d.opportunity}; border:1px solid ${d.opportunity}; }
    .ca-badge-satisfied { background:#eef4ff; color:#1f5fbf; border:1px solid #8fb2ef; }
    .ca-badge-optional { background:#f0f0f0; color:#666; border:1px solid #ccc; }
    .ca-course-taken { background:${d.takenBg}!important; border-left:3px solid ${d.taken}!important; padding-left:6px; }
    .ca-course-taken > a:first-of-type { color:${d.taken}!important; font-weight:bold; }
    .ca-course-taken::after { content:attr(data-ca-note); font-size:11px; color:${d.taken}; margin-left:8px; font-style:italic; }
    .ca-course-opportunity { border-left:3px solid ${d.opportunity}!important; padding-left:6px; }
    .ca-course-double-count { background:${d.doubleCountBg}!important; border-left:3px solid ${d.doubleCount}!important; padding-left:6px; }
    .ca-course-double-count::after { content:attr(data-ca-note); font-size:11px; color:${d.doubleCount}; margin-left:8px; font-weight:bold; }
    .ca-course-taken-multi { background:linear-gradient(90deg, ${d.takenBg} 70%, ${d.doubleCountBg})!important;
      border-left:3px solid ${d.taken}!important; padding-left:6px; }
    .ca-course-taken-multi > a:first-of-type { color:${d.taken}!important; font-weight:bold; }
    .ca-course-taken-multi::after { content:attr(data-ca-note); font-size:11px; color:${d.taken}; margin-left:8px; font-style:italic; }
    .ca-course-maxed { opacity:0.35; }
    .ca-category-complete { opacity:0.45; transition:opacity 0.2s; }
    .ca-category-complete:hover { opacity:1; }
    .ca-hours-note { font-size:11px; color:#555; margin:2px 0 6px 0; padding:3px 10px;
      background:#f8f8f0; border-radius:4px; display:block; border:1px solid #e0e0d0; line-height:1.5; }
    .ca-summary-panel { background:linear-gradient(135deg,#1a1a2e,#16213e); color:#e0e0e0;
      padding:18px 22px; border-radius:10px; margin:16px 0;
      font-family:system-ui,-apple-system,sans-serif; box-shadow:0 2px 12px rgba(0,0,0,0.15); }
    .ca-summary-panel h3 { color:#fff!important; margin:0 0 12px 0; font-size:16px; }
    .ca-summary-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:12px; }
    .ca-summary-item { background:rgba(255,255,255,0.08); padding:8px 12px; border-radius:6px; font-size:12px;
      cursor:pointer; transition:background 0.15s; text-decoration:none; display:block; }
    .ca-summary-item:hover { background:rgba(255,255,255,0.15); }
    .ca-summary-item .label { color:#aaa; font-size:11px; }
    .ca-summary-item .value { color:#fff; font-weight:bold; font-size:14px; }
    .ca-summary-item.complete .value { color:#4ade80; }
    .ca-summary-item.incomplete .value { color:#fbbf24; }
    .ca-summary-item .cap-note { color:#f87171; font-size:10px; }
    .ca-progress-bar { background:#2a2a3e; border-radius:8px; height:16px; overflow:hidden; position:relative; margin-top:4px; }
    .ca-progress-fill { height:100%; border-radius:8px; }
    .ca-progress-label { position:absolute; top:0; left:50%; transform:translateX(-50%);
      font-size:10px; font-weight:bold; line-height:16px; color:#fff; text-shadow:0 1px 2px rgba(0,0,0,0.5); }
    .ca-legend { display:flex; gap:16px; flex-wrap:wrap; margin:10px 0 16px 0; font-size:12px;
      font-family:system-ui,-apple-system,sans-serif; padding:8px 12px;
      background:#fafafa; border:1px solid #e0e0e0; border-radius:6px; }
    .ca-legend-item { display:flex; align-items:center; gap:5px; }
    .ca-legend-swatch { width:14px; height:14px; border-radius:3px; border:1px solid rgba(0,0,0,0.15); }
    .ca-disclaimer { font-size:12px; color:#7a5c00; background:#fffbea; border:1px solid #e8d87a;
      border-radius:6px; padding:7px 12px; margin:10px 0 6px 0;
      font-family:system-ui,-apple-system,sans-serif; line-height:1.5; }
    .ca-transcript-section { font-family:system-ui,-apple-system,sans-serif; margin:24px 0 16px 0; }
    .ca-transcript-section h3 { font-size:14px; color:#333!important; margin:0 0 8px 0; }
    .ca-transcript-table { width:100%; border-collapse:collapse; font-size:12px; }
    .ca-transcript-table th { background:#f0f0f0; text-align:left; padding:4px 8px;
      border-bottom:2px solid #ccc; font-weight:bold; color:#333; }
    .ca-transcript-table td { padding:3px 8px; border-bottom:1px solid #eee; vertical-align:top; }
    .ca-transcript-table tr:hover td { background:#f9f9f9; }
    .ca-transcript-cats { color:#555; font-style:italic; }
    .ca-transcript-none { color:#bbb; font-style:italic; }
  `,document.head.appendChild(p);let l=document.createElement("style");l.id="ca-toc-styles",l.textContent=`
    #ca-toc { position:fixed; top:80px; right:0; z-index:10000; font-family:system-ui,-apple-system,sans-serif; }
    #ca-toc-toggle { position:absolute; top:0; right:0; width:36px; height:36px; border:1px solid #333; border-right:none;
      border-radius:6px 0 0 6px; background:#1a1a2e; color:#fff; font-size:18px; cursor:pointer;
      display:flex; align-items:center; justify-content:center; box-shadow:-2px 2px 8px rgba(0,0,0,0.15); z-index:2; }
    #ca-toc-toggle:hover { background:#16213e; }
    #ca-toc-panel { display:none; position:absolute; top:0; right:36px; width:240px; max-height:calc(100vh - 120px);
      overflow-y:auto; background:#1a1a2e; border-radius:8px 0 0 8px; box-shadow:-4px 4px 16px rgba(0,0,0,0.25); padding:8px 0; }
    .ca-toc-header { padding:8px 14px; font-size:13px; font-weight:bold; color:#fff;
      border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:4px; }
    .ca-toc-item { display:block; padding:4px 14px; font-size:12px; color:#ccc; text-decoration:none;
      border-left:3px solid transparent; transition:all 0.15s; line-height:1.3; cursor:pointer; }
    .ca-toc-item:hover { background:rgba(255,255,255,0.08); color:#fff; }
    .ca-toc-item.ca-toc-active { border-left-color:#fbbf24; color:#fff; background:rgba(255,255,255,0.05); font-weight:bold; }
    .ca-toc-cat { padding-left:24px; font-size:11px; }
    .ca-toc-tag { padding-left:32px; font-size:11px; font-style:italic; }
    .ca-toc-item:not(.ca-toc-cat):not(.ca-toc-tag) { font-weight:bold; font-size:11px; color:#fbbf24;
      text-transform:uppercase; letter-spacing:0.5px; margin-top:6px; padding-top:6px;
      border-top:1px solid rgba(255,255,255,0.06); }
    .ca-toc-status { font-size:9px; margin-left:4px; vertical-align:middle; }
    .ca-toc-status-done { color:#4ade80; }
    .ca-toc-status-needed { color:#fbbf24; }
    .ca-toc-status-satisfied { color:#8fb2ef; }
    .ca-toc-status-optional { color:#888; }
    #ca-toc-panel::-webkit-scrollbar { width:4px; }
    #ca-toc-panel::-webkit-scrollbar-track { background:transparent; }
    #ca-toc-panel::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:2px; }
  `,document.head.appendChild(l);let n=document.querySelector("div.acalog-core");if(!n)return;let k=document.createElement("div");k.className="ca-legend",k.innerHTML=`
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${d.takenBg};border-color:${d.taken}"></div>Taken</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:linear-gradient(90deg,${d.takenBg} 70%,${d.doubleCountBg});border-color:${d.taken}"></div>Taken (multi-section)</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${d.doubleCountBg};border-color:${d.doubleCount}"></div>Double-count opportunity</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="border-left:3px solid ${d.opportunity}"></div>Available</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:#eee;opacity:0.35"></div>Maxed / satisfied</div>
  `;let u=document.createElement("div");u.className="ca-summary-panel";let b=Math.min(100,Math.round(c.totalHours/c.requiredHours*100)),o=c.totalHours>=c.requiredHours?"#4ade80":"#fbbf24",x=c.categoriesUsed>=c.requiredCategories?"#4ade80":"#fbbf24",m="";for(let e of T){let s=c.hoursByCategory[e]||{raw:0,effective:0,max:null},g=s.raw>0?"complete":"incomplete",t=s.max!==null&&s.raw>s.max?`<div class="cap-note">${s.raw}h earned, capped at ${s.max}h</div>`:"",r=L(e);m+=`<a href="#${r}" class="ca-summary-item ${g}" data-slug="${r}">
      <span class="label">${e}</span><br><span class="value">${s.effective} hrs</span>${t}</a>`}u.innerHTML=`
    <h3>\u{1F4CA} Core Program Audit</h3>
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
      <span>K&U Hours: <strong style="color:${o}">${c.totalHours} / ${c.requiredHours}</strong></span>
      <span>K&U Categories: <strong style="color:${x}">${c.categoriesUsed} / ${c.requiredCategories}</strong></span>
    </div>
    <div class="ca-progress-bar"><div class="ca-progress-fill" style="width:${b}%;background:${o}"></div>
      <div class="ca-progress-label">${b}%</div></div>
    <div class="ca-summary-grid">${m}</div>`,u.addEventListener("click",e=>{let s=e.target.closest(".ca-summary-item");s&&(e.preventDefault(),document.getElementById(s.dataset.slug)?.scrollIntoView({behavior:"smooth",block:"start"}))});let C=document.createElement("div");C.className="ca-disclaimer",C.textContent="\u26A0\uFE0F These results are unofficial and for planning purposes only. They may not reflect all institutional policies, transfer credit decisions, or advisor overrides. Always verify your core program status with your academic advisor or the Registrar.",n.parentElement.insertBefore(k,n),n.parentElement.insertBefore(u,n),n.parentElement.insertBefore(C,n);let w=document.createElement("div");w.id="ca-toc";let y=document.createElement("button");y.id="ca-toc-toggle",y.textContent="\u2630",y.title="Table of Contents";let E=document.createElement("div");E.id="ca-toc-panel";let $='<div class="ca-toc-header">\u{1F4D1} Core Program</div>';for(let e of a){if(!e.slug)continue;let s=e.type==="section-header"?"":e.type==="tag"?"ca-toc-tag":"ca-toc-cat",g=e.name||e.section,t="";e.status==="complete"?t='<span class="ca-toc-status ca-toc-status-done">\u2713</span>':e.status==="satisfied"?t='<span class="ca-toc-status ca-toc-status-satisfied">\u25D4</span>':e.status==="incomplete"?t='<span class="ca-toc-status ca-toc-status-needed">\u25CB</span>':e.status==="optional-available"&&(t='<span class="ca-toc-status ca-toc-status-optional">\u25CB</span>'),$+=`<a href="#${e.slug}" class="ca-toc-item ${s}" data-slug="${e.slug}">${g}${t}</a>`}E.innerHTML=$,w.appendChild(y),w.appendChild(E),document.body.appendChild(w);let H=!1;y.addEventListener("click",()=>{H=!H,E.style.display=H?"block":"none",y.textContent=H?"\u2715":"\u2630"}),E.addEventListener("click",e=>{let s=e.target.closest("a");s&&(e.preventDefault(),document.getElementById(s.dataset.slug)?.scrollIntoView({behavior:"smooth",block:"start"}))});let f=new IntersectionObserver(e=>{for(let s of e)if(s.isIntersecting){let g=s.target.id;document.querySelectorAll(".ca-toc-item").forEach(r=>{r.classList.remove("ca-toc-active")});let t=document.querySelector(`.ca-toc-item[data-slug="${g}"]`);t&&(t.classList.add("ca-toc-active"),t.scrollIntoView({block:"nearest",behavior:"smooth"}))}},{rootMargin:"-10% 0px -80% 0px"});a.filter(e=>e.slug).forEach(e=>{let s=document.getElementById(e.slug);s&&f.observe(s)});for(let e of a){if(e.status==="header"||!e.courseAnnotations)continue;let s=e.element,g=s.querySelector("h3")||s.querySelector("h4");if(g){let t=document.createElement("span");t.className="ca-badge",e.status==="complete"?(t.className+=" ca-badge-complete",t.textContent="\u2713 COMPLETE"):e.status==="satisfied"?(t.className+=" ca-badge-satisfied",t.textContent="MIN MET"):e.status==="optional-available"?(t.className+=" ca-badge-optional",t.textContent="OPTIONAL"):(t.className+=" ca-badge-incomplete",t.textContent=e.reqType==="hour-range"?e.hoursEarned+"/"+(e.minHours||0)+"+ hrs":"NEEDED"),g.appendChild(t)}if(Array.isArray(e.subDisciplineElements))for(let t of e.subDisciplineElements){if(!e.maxedDisciplines.has(t.name))continue;let r=document.createElement("span");r.className="ca-badge ca-badge-complete",r.textContent="\u2713 COMPLETE",t.element.appendChild(r)}if(e.reqType==="hour-range"&&(e.hoursEarned>0||e.maxPerDiscipline)){let t=document.createElement("span");t.className="ca-hours-note";let r="\u{1F4D0} "+e.hoursEarned+"h earned";if(e.minHours!==null&&(r+=" (need "+e.minHours+"\u2013"+e.maxHours+"h)"),e.maxHours!==null&&e.hoursEarned>e.maxHours&&(r+=" \u26A0\uFE0F over max by "+(e.hoursEarned-e.maxHours)+"h \u2014 only "+e.maxHours+"h count toward K&U total"),Object.keys(e.hoursByDiscipline).length>0){let v=Object.entries(e.hoursByDiscipline).map(([A,I])=>A+": "+I+"h"+(e.maxedDisciplines.has(A)?" \u26A0\uFE0F maxed":"")).join(" \xB7 ");r+=" \u2014 "+v,e.maxPerDiscipline&&(r+=" (max "+e.maxPerDiscipline+"h/discipline)")}t.textContent=r,s.querySelector("p")?.after(t)}e.status==="complete"&&e.type!=="tag"&&s.classList.add("ca-category-complete");for(let t of e.courseAnnotations){if(!t.element)continue;let r=t.element;t.isTaken?t.isMultiSection?(r.classList.add("ca-course-taken-multi"),r.setAttribute("data-ca-note","\u2713 "+t.grade+" ("+t.hours+"h) \u21C9 Also: "+t.otherCategories.join(", "))):(r.classList.add("ca-course-taken"),r.setAttribute("data-ca-note","\u2713 "+t.grade+" ("+t.hours+"h)")):e.status==="complete"&&e.type!=="tag"?t.isMultiSection?(r.classList.add("ca-course-double-count"),r.setAttribute("data-ca-note","\u21C9 Also: "+t.otherCategories.join(", "))):r.classList.add("ca-course-maxed"):t.isMaxedDiscipline?r.classList.add("ca-course-maxed"):t.isMultiSection&&!t.isTaken?(r.classList.add("ca-course-double-count"),r.setAttribute("data-ca-note","\u21C9 Also: "+t.otherCategories.join(", "))):e.status!=="complete"?r.classList.add("ca-course-opportunity"):r.classList.add("ca-course-maxed")}}if(i&&i.length>0){let e={};for(let t of a)if(t.courseAnnotations)for(let r of t.courseAnnotations)e[r.code]||(e[r.code]=[]),e[r.code].push(t.name);let s=document.createElement("div");s.className="ca-transcript-section";let g="";for(let t of i){let r=e[t.code]||[],v=r.length>0?`<span class="ca-transcript-cats">${r.join(", ")}</span>`:'<span class="ca-transcript-none">not in core lists</span>';g+=`<tr><td><strong>${t.code}</strong></td><td>${t.title}</td><td>${t.grade}</td><td>${t.hours}h</td><td>${v}</td></tr>`}s.innerHTML=`<h3>\u{1F4CB} Transcript Reference (${i.length} courses)</h3>
      <table class="ca-transcript-table">
        <thead><tr><th>Code</th><th>Title</th><th>Grade</th><th>Hrs</th><th>Core Categories</th></tr></thead>
        <tbody>${g}</tbody>
      </table>`,n.parentElement.appendChild(s)}}var B={pathname:"/content.php",catoid:"24",navoid:"780"},h={panel:"ca-launcher-panel",details:"ca-launcher-details",textarea:"ca-transcript-input",status:"ca-launcher-status",styles:"ca-launcher-styles"};function j(){if(document.getElementById(h.styles))return;let a=document.createElement("style");a.id=h.styles,a.textContent=`
    #${h.panel} {
      margin: 16px 0;
      padding: 14px 16px;
      border: 1px solid #cfd8dc;
      border-radius: 10px;
      background: linear-gradient(180deg, #f8fbfc, #eef5f6);
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
      font-family: system-ui, -apple-system, sans-serif;
    }
    #${h.panel} details {
      margin: 0;
    }
    #${h.panel} summary {
      cursor: pointer;
      font-weight: 700;
      color: #163642;
      list-style: none;
    }
    #${h.panel} summary::-webkit-details-marker {
      display: none;
    }
    #${h.panel} summary::before {
      content: '\u25B8';
      display: inline-block;
      margin-right: 8px;
      transition: transform 0.15s ease;
    }
    #${h.panel} details[open] summary::before {
      transform: rotate(90deg);
    }
    #${h.panel} p {
      margin: 10px 0 0;
      color: #35515a;
      line-height: 1.45;
      font-size: 13px;
    }
    #${h.textarea} {
      width: 100%;
      min-height: 140px;
      margin-top: 12px;
      padding: 10px 12px;
      border: 1px solid #aabcc3;
      border-radius: 8px;
      resize: vertical;
      box-sizing: border-box;
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
      background: #fff;
    }
    .ca-launcher-actions {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
      margin-top: 10px;
    }
    .ca-launcher-button {
      border: 1px solid #244b57;
      background: #244b57;
      color: #fff;
      border-radius: 999px;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .ca-launcher-button:hover {
      background: #1d3e48;
    }
    .ca-launcher-button-secondary {
      background: #fff;
      color: #244b57;
    }
    .ca-launcher-button-secondary:hover {
      background: #f3f7f8;
    }
    #${h.status} {
      font-size: 12px;
      color: #35515a;
    }
    #${h.status}.ca-status-success {
      color: #2d8a4e;
    }
    #${h.status}.ca-status-error {
      color: #9f2d2d;
    }
  `,document.head.appendChild(a)}function S(a,c){let i=document.getElementById(h.status);i&&(i.textContent=a,i.className="",c==="success"&&i.classList.add("ca-status-success"),c==="error"&&i.classList.add("ca-status-error"))}function F(){let a=new URL(window.location.href);return a.pathname===B.pathname&&a.searchParams.get("catoid")===B.catoid&&a.searchParams.get("navoid")===B.navoid}function q(a){let c=(a||"").trim();if(c.length===0){S("Paste your Workday Academic History transcript to run the audit.",null);return}let i=N(c);if(i.length===0){D(),S("Could not parse any courses. Copy from Workday Academic Record > Academic History and paste the full content here.","error");return}let p=P(),l=O(p,i);R(l),S("Audit updated: "+i.length+" courses, "+l.kuSummary.totalHours+"/"+l.kuSummary.requiredHours+" K&U hours, "+l.kuSummary.categoriesUsed+"/"+l.kuSummary.requiredCategories+" K&U categories.","success"),console.log("[Core Annotator]",i.length,"courses:",i.map(n=>n.code+"("+n.hours+"h)")),console.log("[Core Annotator] K&U:",l.kuSummary)}function U(){if(document.getElementById(h.panel))return;let a=document.querySelector("div.acalog-core");if(!a||!a.parentElement)return;j();let c=document.createElement("section");c.id=h.panel,c.innerHTML=`
    <details id="${h.details}">
      <summary>Calvin Core Annotator</summary>
      <p>Open Workday, go to Academic Record, open Academic History, select all, copy, then paste here. Pasting runs the audit immediately.</p>
      <textarea id="${h.textarea}" spellcheck="false" placeholder="Paste Workday Academic History here"></textarea>
      <div class="ca-launcher-actions">
        <button type="button" class="ca-launcher-button" data-action="analyze">Analyze pasted transcript</button>
        <button type="button" class="ca-launcher-button ca-launcher-button-secondary" data-action="reset">Reset annotations</button>
        <span id="${h.status}">Paste your Workday Academic History transcript to run the audit.</span>
      </div>
    </details>`,a.parentElement.insertBefore(c,a);let i=c.querySelector("details"),p=c.querySelector("textarea");c.addEventListener("click",l=>{let n=l.target.closest("button[data-action]");n&&(n.dataset.action==="analyze"&&q(p.value),n.dataset.action==="reset"&&(p.value="",D(),S("Annotations cleared.",null),i.open=!1))}),p.addEventListener("paste",l=>{let n=l.clipboardData?.getData("text/plain");if(typeof n=="string"&&n.length>0){l.preventDefault(),p.value=n,q(n),i.open=!1;return}window.setTimeout(()=>{q(p.value),i.open=!1},0)})}function M(){if(console.log("v0.0.3"),!!F()){if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",U,{once:!0});return}U()}}window.CalvinCoreAnnotator={main:M};M();})();
