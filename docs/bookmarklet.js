(()=>{function W(n){let a=n.replace(/\u00a0/g," ").replace(/\r\n?/g,`
`).replace(/\s+/g," ").trim(),d=/\b([A-Z]{2,5})\s+(\d{3}[A-Z]?)\s*-\s*(.+?)\s+([A-Z]{1,2}[+-]?)\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)\s+\d+(?:\.\d+)?\b/g,p=[],m=d.exec(a);for(;m!==null;){let[,b,f,v,l,r]=m;p.push({code:b+" "+f,title:v.replace(/\s+/g," ").trim(),grade:l,hours:parseFloat(r),status:"completed"}),m=d.exec(a)}let u=new Map,y=[];for(let b of p){let f=b.code.match(/^([A-Z]{2,5}\s+\d{3})L$/);f?y.push({parentCode:f[1],...b}):u.set(b.code,{...b})}for(let b of y)u.has(b.parentCode)?u.get(b.parentCode).hours+=b.hours:u.set(b.code,b);return Array.from(u.values())}function Z(n){let a=n.replace(/\u00a0/g," ").replace(/\r\n?/g,`
`).split(`
`).map(r=>r.trim()).filter(r=>r.length>0),d=/^([A-Z]{2,5})\s+(\d{3}[A-Z]?L?)\s*-\s*(.+)$/,p=/^(.+?\bExemption)\s*-\s*(\d{2}\/\d{2}\/\d{4})$/,m=/\(Override Assigned\)/,u=[],y=[],b=new Set;for(let r=0;r<a.length;r++){if(m.test(a[r])){let S=a[r].replace(/\s*\(Click for more details\)/g,"").replace(/\s*\(Override Assigned\)/g,"").trim();b.add(S)}let k=a[r].match(p);if(k){let S=k[1].trim(),g=null;/language/i.test(S)&&(g="World Languages I"),y.push({name:S,date:k[2],target:g});let B=0;for(let t=r+1;t<Math.min(r+4,a.length);t++){if(/^\d+$/.test(a[t])){B=parseInt(a[t]);break}if(d.test(a[t]))break}g&&u.push({code:null,title:S,grade:null,hours:B,status:"exemption",exemptionTarget:g});continue}let D=a[r].match(d);if(!D)continue;let A=D[3].trim(),T="completed";/\(In Progress\)/.test(A)?(T="in-progress",A=A.replace(/\s*\(In Progress\)/,"").trim()):/\(Transfer Credit\)/.test(A)&&(T="transfer",A=A.replace(/\s*\(Transfer Credit\)/,"").trim());let E=0,o=null,w=null;for(let S=r+1;S<Math.min(r+8,a.length);S++){let g=a[S];if(d.test(g)||p.test(g))break;/^\d{4}\s+(Fall|Spring|Summer|Winter|Interim)$/i.test(g)?w=g:/^\d+$/.test(g)&&E===0?E=parseInt(g):(/^[A-Z]{1,2}[+-]?$/.test(g)||g==="CR")&&(o=g)}u.push({code:D[1]+" "+D[2],title:A,grade:o,hours:E,status:T,period:w})}let f=new Map,v=new Map;for(let r of u){if(r.code===null){f.has(r.title)||f.set(r.title,r);continue}let k=r.code.match(/^([A-Z]{2,5}\s+\d{3})L$/);k?v.has(r.code)||v.set(r.code,{parentCode:k[1],...r}):f.has(r.code)||f.set(r.code,{...r})}for(let r of v.values())f.has(r.parentCode)?f.get(r.parentCode).hours+=r.hours:f.set(r.code,r);return{courses:Array.from(f.values()),exemptions:y,overrides:b}}function _(n){if(/RequirementSort and filter column|StatusSort and filter column|Satisfied With/.test(n))return"progress";if(/Opens in new window/.test(n))return"transcript";let a=W(n).length;return Z(n).courses.filter(p=>p.code!==null).length>a?"progress":"transcript"}function I(n){return"ca-"+n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")}function X(n){n||(n=document);let a=n.querySelectorAll("div.acalog-core"),d=[],p="";for(let m=0;m<a.length;m++){let u=a[m],y=u.querySelector("h2"),b=u.querySelector("h3"),f=u.querySelector("h4"),v=u.querySelector("p"),l=v?v.textContent.replace(/\u00a0/g," ").trim():"",r=y||b||f;if(y&&!b&&!f){p=y.textContent.trim(),r&&(r.id=I(p)),d.push({type:"section-header",section:p,instructions:l,element:u,coreIndex:m,slug:I(p)});continue}let k="";r&&(k=Array.from(r.childNodes).filter(x=>x.nodeType===3||x.nodeType===1&&x.tagName==="A").map(x=>x.textContent.trim()).join("").trim(),r.id=I(k));let D=f!==null,A=l.match(/(\d+)[–-](\d+)\s+semester hours/),T=l.match(/up to (\d+)\s+semester hours in any one discipline/),E=A?parseInt(A[1]):null,o=A?parseInt(A[2]):null,w=T?parseInt(T[1]):null,S=E!==null?"hour-range":"pick-one",g=u.querySelector("ul"),B=[],t=[],i=null;if(g){for(let x of g.children)if(x.classList.contains("acalog-adhoc")){let e=x.textContent.trim();["Or","One from","And"].includes(e)||(i=e,t.push({name:e,element:x}))}else if(x.classList.contains("acalog-course")){let e=x.querySelector("a"),C=(e?e.textContent.trim():"").match(/^([A-Z]{2,5})\s+(\d{3}[A-Z]?)\s*-\s*(.+)$/);C&&B.push({code:C[1]+" "+C[2],title:C[3].trim(),subDiscipline:i,element:x})}}d.push({type:D?"tag":"category",section:p,name:k,instructions:l,reqType:S,minHours:E,maxHours:o,maxPerDiscipline:w,courses:B,subDisciplineElements:t,element:u,coreIndex:m,slug:I(k)})}return d}var K=["World Languages II","Arts, Oral Rhetoric, Visual Rhetoric","Humanities","Mathematical Sciences","Natural Sciences","Social and Behavioral Sciences"];function oe(n){return(n||"").toUpperCase().replace(/\s+/g," ").trim()}function J(n,a,d={}){let p=a.filter(o=>o.status!=="in-progress"&&o.status!=="exemption"),m=a.filter(o=>o.status==="in-progress"),u=a.filter(o=>o.status==="exemption"),y=new Set(u.map(o=>o.exemptionTarget).filter(Boolean)),b=new Set(p.map(o=>o.code).filter(Boolean)),f=new Set(m.map(o=>o.code).filter(Boolean)),v=new Set([...b,...f]),l={};for(let o of a)o.code&&(l[o.code]=o);let r=new Set((d.plannedCourses||[]).map(o=>oe(o)).filter(o=>o.length>0&&!v.has(o))),k={};for(let o of n)if(!(!o.courses||!o.name))for(let w of o.courses)k[w.code]||(k[w.code]=[]),k[w.code].push(o.name);let D={},A=0,T=0,E=[];for(let o of n){if(o.type==="section-header"){E.push({...o,status:"header"});continue}if(!o.courses||o.courses.length===0){if(y.has(o.name)){E.push({...o,status:"complete",hoursEarned:0,hoursEffective:0,hoursByDiscipline:{},maxedDisciplines:new Set,subDisciplines:null,takenCount:0,inProgressCount:0,plannedCount:0,courseAnnotations:[],isExempt:!0});continue}E.push({...o,status:"info-only"});continue}if(y.has(o.name)){let h=o.courses.map(P=>({...P,isTaken:v.has(P.code),isInProgress:f.has(P.code),isPlanned:!1,isMultiSection:!1,otherCategories:[],isMaxedDiscipline:!1,grade:"",hours:0}));E.push({...o,status:"complete",hoursEarned:0,hoursEffective:0,hoursByDiscipline:{},maxedDisciplines:new Set,subDisciplines:null,takenCount:0,inProgressCount:0,plannedCount:0,courseAnnotations:h,isExempt:!0});continue}let w=o.courses.filter(h=>v.has(h.code)),S=o.courses.filter(h=>f.has(h.code)),g=0,B={};for(let h of w){let P=l[h.code],H=P?P.hours:0;g+=H;let z=h.subDiscipline||"General";B[z]=(B[z]||0)+H}let t=o.maxHours!==null?Math.min(g,o.maxHours):g,i=new Set;if(o.maxPerDiscipline)for(let[h,P]of Object.entries(B))P>=o.maxPerDiscipline&&i.add(h);let x=o.courses.some(h=>!v.has(h.code)&&!i.has(h.subDiscipline||"General")),e;if(o.reqType==="pick-one")e=w.length>0?"complete":"incomplete";else{let h=o.minHours||0;g<h?e="incomplete":g===0&&h===0?e="optional-available":o.maxPerDiscipline&&o.maxHours!==null&&t<o.maxHours&&x?e="satisfied":e="complete"}K.includes(o.name)&&(D[o.name]={raw:g,effective:t,max:o.maxHours},A+=t,g>0&&T++);let s=null;if(o.maxPerDiscipline&&w.length>0){s={};let h=new Set(o.courses.map(P=>P.subDiscipline).filter(Boolean));for(let P of h){let H=B[P]||0,z=i.has(P),j=o.courses.filter(q=>q.subDiscipline===P&&!v.has(q.code)).length;s[P]={hoursEarned:H,cap:o.maxPerDiscipline,isMaxed:z,untakenCount:j}}}let C=o.courses.map(h=>{let P=b.has(h.code),H=f.has(h.code),z=P||H,j=!z&&r.has(h.code),q=k[h.code]||[],ee=q.filter(te=>te!==o.name),U=l[h.code];return{...h,isTaken:P,isInProgress:H,isMultiSection:q.length>1,otherCategories:ee,isPlanned:j,isMaxedDiscipline:i.has(h.subDiscipline||"General")&&!z,grade:z&&U?.grade||"",hours:z&&U?.hours||0,isTransfer:U?.status==="transfer"}}),M=C.filter(h=>h.isPlanned).length,F=C.filter(h=>h.isInProgress).length;E.push({...o,status:e,hoursEarned:g,hoursEffective:t,hoursByDiscipline:B,maxedDisciplines:i,subDisciplines:s,takenCount:w.length,inProgressCount:F,plannedCount:M,courseAnnotations:C})}return{results:E,transcript:a,plannedCourses:Array.from(r),overrides:d.overrides||new Set,exemptions:u,kuSummary:{totalHours:A,requiredHours:26,categoriesUsed:T,requiredCategories:5,hoursByCategory:D}}}var c={taken:"#2d8a4e",takenBg:"#e6f7ed",opportunity:"#b8860b",opportunityBg:"#fff8dc",doubleCount:"#1a73e8",doubleCountBg:"#e8f0fe",inProgress:"#5b21b6",inProgressBg:"#ede9fe",transfer:"#0e7490",transferBg:"#ecfeff"};function N(){["ca-styles","ca-toc-styles"].forEach(n=>{document.getElementById(n)?.remove()}),document.querySelectorAll(".ca-legend,.ca-summary-panel,.ca-badge,.ca-hours-note,#ca-toc,.ca-disclaimer,.ca-transcript-section").forEach(n=>{n.remove()}),document.querySelectorAll('[class*="ca-course-"],[class*="ca-category-"]').forEach(n=>{n.className=n.className.replace(/ca-[\w-]+/g,"").trim(),n.removeAttribute("data-ca-note")})}function ae(n,a,d,p){if(typeof p!="function")return;let m=document.createElement("button");m.type="button",m.className="ca-plan-toggle"+(d?" ca-plan-toggle-on":""),m.textContent=d?"Planned":"+ Plan",m.title=d?"Remove planned course":"Mark as planned course",m.addEventListener("click",u=>{u.preventDefault(),u.stopPropagation(),p(a)}),n.appendChild(m)}function Q({results:n,kuSummary:a,transcript:d,plannedCourses:p},m={}){let u=m.onTogglePlanned;N();let y=document.createElement("style");y.id="ca-styles",y.textContent=`
    .ca-badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px;
      font-weight:bold; margin-left:8px; vertical-align:middle; letter-spacing:0.3px; white-space:nowrap; }
    .ca-badge-complete { background:${c.takenBg}; color:${c.taken}; border:1px solid ${c.taken}; }
    .ca-badge-incomplete { background:${c.opportunityBg}; color:${c.opportunity}; border:1px solid ${c.opportunity}; }
    .ca-badge-satisfied { background:#eef4ff; color:#1f5fbf; border:1px solid #8fb2ef; }
    .ca-badge-optional { background:#f0f0f0; color:#666; border:1px solid #ccc; }
    .ca-course-taken { background:${c.takenBg}!important; border-left:3px solid ${c.taken}!important; padding-left:6px; }
    .ca-course-taken > a:first-of-type { color:${c.taken}!important; font-weight:bold; }
    .ca-course-taken::after { content:attr(data-ca-note); font-size:11px; color:${c.taken}; margin-left:8px; font-style:italic; }
    .ca-course-opportunity { border-left:3px solid ${c.opportunity}!important; padding-left:6px; }
    .ca-course-double-count { background:${c.doubleCountBg}!important; border-left:3px solid ${c.doubleCount}!important; padding-left:6px; }
    .ca-course-double-count::after { content:attr(data-ca-note); font-size:11px; color:${c.doubleCount}; margin-left:8px; font-weight:bold; }
    .ca-course-taken-multi { background:linear-gradient(90deg, ${c.takenBg} 70%, ${c.doubleCountBg})!important;
      border-left:3px solid ${c.taken}!important; padding-left:6px; }
    .ca-course-taken-multi > a:first-of-type { color:${c.taken}!important; font-weight:bold; }
    .ca-course-taken-multi::after { content:attr(data-ca-note); font-size:11px; color:${c.taken}; margin-left:8px; font-style:italic; }
    .ca-course-planned { background:#fff7e9!important; border-left:3px solid #d97706!important; padding-left:6px; }
    .ca-course-planned > a:first-of-type { color:#9a5a00!important; font-weight:600; }
    .ca-course-planned::after { content:attr(data-ca-note); font-size:11px; color:#9a5a00; margin-left:8px; font-style:italic; }
    .ca-course-planned-multi { background:linear-gradient(90deg, #fff7e9 70%, ${c.doubleCountBg})!important;
      border-left:3px solid #d97706!important; padding-left:6px; }
    .ca-course-planned-multi > a:first-of-type { color:#9a5a00!important; font-weight:600; }
    .ca-course-planned-multi::after { content:attr(data-ca-note); font-size:11px; color:#9a5a00; margin-left:8px; font-style:italic; }
    .ca-course-in-progress { background:${c.inProgressBg}!important; border-left:3px solid ${c.inProgress}!important; padding-left:6px; }
    .ca-course-in-progress > a:first-of-type { color:${c.inProgress}!important; font-weight:bold; }
    .ca-course-in-progress::after { content:attr(data-ca-note); font-size:11px; color:${c.inProgress}; margin-left:8px; font-style:italic; }
    .ca-course-transfer { background:${c.transferBg}!important; border-left:3px solid ${c.transfer}!important; padding-left:6px; }
    .ca-course-transfer > a:first-of-type { color:${c.transfer}!important; font-weight:bold; }
    .ca-course-transfer::after { content:attr(data-ca-note); font-size:11px; color:${c.transfer}; margin-left:8px; font-style:italic; }
    .ca-badge-in-progress { background:${c.inProgressBg}; color:${c.inProgress}; border:1px solid ${c.inProgress}; }
    .ca-badge-exempt { background:#f0fdf4; color:#166534; border:1px solid #86efac; font-style:italic; }
    .ca-course-maxed { opacity:0.35; }
    .ca-plan-toggle { margin-left:8px; padding:1px 7px; border-radius:999px; border:1px solid #c67b00;
      background:#fff; color:#9a5a00; font-size:10px; font-weight:700; cursor:pointer; vertical-align:middle; }
    .ca-plan-toggle:hover { background:#fff6dd; }
    .ca-plan-toggle.ca-plan-toggle-on { background:#fff1cc; border-color:#b86d00; color:#7d4700; }
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
  `,document.head.appendChild(y);let b=document.createElement("style");b.id="ca-toc-styles",b.textContent=`
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
  `,document.head.appendChild(b);let f=document.querySelector("div.acalog-core");if(!f)return;let v=document.createElement("div");v.className="ca-legend",v.innerHTML=`
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${c.takenBg};border-color:${c.taken}"></div>Taken</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:linear-gradient(90deg,${c.takenBg} 70%,${c.doubleCountBg});border-color:${c.taken}"></div>Taken (multi-section)</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:#fff7e9;border-color:#d97706"></div>Planned</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${c.doubleCountBg};border-color:${c.doubleCount}"></div>Double-count opportunity</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="border-left:3px solid ${c.opportunity}"></div>Open opportunities</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${c.inProgressBg};border-color:${c.inProgress}"></div>In Progress</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${c.transferBg};border-color:${c.transfer}"></div>Transfer Credit</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:#eee;opacity:0.35"></div>Maxed / satisfied</div>
  `;let l=document.createElement("div");l.className="ca-summary-panel";let r=Math.min(100,Math.round(a.totalHours/a.requiredHours*100)),k=a.totalHours>=a.requiredHours?"#4ade80":"#fbbf24",D=a.categoriesUsed>=a.requiredCategories?"#4ade80":"#fbbf24",A="";for(let t of K){let i=a.hoursByCategory[t]||{raw:0,effective:0,max:null},x=i.raw>0?"complete":"incomplete",e=i.max!==null&&i.raw>i.max?`<div class="cap-note">${i.raw}h earned, capped at ${i.max}h</div>`:"",s=I(t);A+=`<a href="#${s}" class="ca-summary-item ${x}" data-slug="${s}">
      <span class="label">${t}</span><br><span class="value">${i.effective} hrs</span>${e}</a>`}l.innerHTML=`
    <h3>\u{1F4CA} Core Opportunities</h3>
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
      <span>Progress (K&U Hours): <strong style="color:${k}">${a.totalHours} / ${a.requiredHours}</strong></span>
      <span>Progress (K&U Categories): <strong style="color:${D}">${a.categoriesUsed} / ${a.requiredCategories}</strong></span>
    </div>
    <div style="font-size:12px;color:#d5dbe5;margin-bottom:6px">Planned courses: <strong>${(p||[]).length}</strong> (do not count toward completed hours until taken)</div>
    <div class="ca-progress-bar"><div class="ca-progress-fill" style="width:${r}%;background:${k}"></div>
      <div class="ca-progress-label">${r}%</div></div>
    <div class="ca-summary-grid">${A}</div>`,l.addEventListener("click",t=>{let i=t.target.closest(".ca-summary-item");i&&(t.preventDefault(),document.getElementById(i.dataset.slug)?.scrollIntoView({behavior:"smooth",block:"start"}))});let T=document.createElement("div");T.className="ca-disclaimer",T.textContent="\u26A0\uFE0F These results are unofficial and for planning purposes only. They may not reflect all institutional policies, transfer credit decisions, or advisor overrides. Always verify your core program status with your academic advisor or the Registrar.",f.parentElement.insertBefore(v,f),f.parentElement.insertBefore(l,f),f.parentElement.insertBefore(T,f);let E=document.createElement("div");E.id="ca-toc";let o=document.createElement("button");o.id="ca-toc-toggle",o.textContent="\u2630",o.title="Table of Contents";let w=document.createElement("div");w.id="ca-toc-panel";let S='<div class="ca-toc-header">\u{1F4D1} Core Program</div>';for(let t of n){if(!t.slug)continue;let i=t.type==="section-header"?"":t.type==="tag"?"ca-toc-tag":"ca-toc-cat",x=t.name||t.section,e="";t.status==="complete"?e='<span class="ca-toc-status ca-toc-status-done">\u2713</span>':t.status==="satisfied"?e='<span class="ca-toc-status ca-toc-status-satisfied">\u25D4</span>':t.status==="incomplete"?e='<span class="ca-toc-status ca-toc-status-needed">\u25CB</span>':t.status==="optional-available"&&(e='<span class="ca-toc-status ca-toc-status-optional">\u25CB</span>'),S+=`<a href="#${t.slug}" class="ca-toc-item ${i}" data-slug="${t.slug}">${x}${e}</a>`}w.innerHTML=S,E.appendChild(o),E.appendChild(w),document.body.appendChild(E);let g=!1;o.addEventListener("click",()=>{g=!g,w.style.display=g?"block":"none",o.textContent=g?"\u2715":"\u2630"}),w.addEventListener("click",t=>{let i=t.target.closest("a");i&&(t.preventDefault(),document.getElementById(i.dataset.slug)?.scrollIntoView({behavior:"smooth",block:"start"}))});let B=new IntersectionObserver(t=>{for(let i of t)if(i.isIntersecting){let x=i.target.id;document.querySelectorAll(".ca-toc-item").forEach(s=>{s.classList.remove("ca-toc-active")});let e=document.querySelector(`.ca-toc-item[data-slug="${x}"]`);e&&(e.classList.add("ca-toc-active"),e.scrollIntoView({block:"nearest",behavior:"smooth"}))}},{rootMargin:"-10% 0px -80% 0px"});n.filter(t=>t.slug).forEach(t=>{let i=document.getElementById(t.slug);i&&B.observe(i)});for(let t of n){if(t.status==="header"||!t.courseAnnotations)continue;let i=t.element,x=i.querySelector("h3")||i.querySelector("h4");if(x){let e=document.createElement("span");e.className="ca-badge",t.isExempt?(e.className+=" ca-badge-exempt",e.textContent="\u2713 EXEMPT"):t.status==="complete"?(e.className+=" ca-badge-complete",e.textContent="\u2713 COMPLETE"):t.status==="satisfied"?(e.className+=" ca-badge-satisfied",e.textContent="MIN MET"):t.status==="optional-available"?(e.className+=" ca-badge-optional",e.textContent="OPTIONAL"):(e.className+=" ca-badge-incomplete",e.textContent=t.reqType==="hour-range"?t.hoursEarned+"/"+(t.minHours||0)+"+ hrs":"AREAS TO EXPLORE"),x.appendChild(e)}if(Array.isArray(t.subDisciplineElements)&&t.subDisciplines)for(let e of t.subDisciplineElements){let s=t.subDisciplines[e.name];if(!s)continue;let C=document.createElement("span");C.className="ca-badge",s.isMaxed?(C.className+=" ca-badge-complete",C.textContent="\u2713 "+s.hoursEarned+"h/"+s.cap+"h"):s.hoursEarned>0?(C.className+=" ca-badge-incomplete",C.textContent=s.hoursEarned+"h/"+s.cap+"h max"):(C.className+=" ca-badge-optional",C.textContent="0h \u2014 up to "+s.cap+"h"),e.element.appendChild(C)}if(t.type==="category"&&t.name==="World Languages I"){let e=document.createElement("span");e.className="ca-hours-note",e.textContent="\u2139\uFE0F World Languages I may already be satisfied through qualifying high school language coursework/exemption. Confirm with your advisor or the Registrar if this applies to you.",i.querySelector("p")?.after(e)}if(t.reqType==="hour-range"&&(t.hoursEarned>0||t.maxPerDiscipline)){let e=document.createElement("span");e.className="ca-hours-note";let s="\u{1F4D0} "+t.hoursEarned+"h earned";if(t.minHours!==null&&(s+=" (need "+t.minHours+"\u2013"+t.maxHours+"h)"),t.maxHours!==null&&t.hoursEarned>t.maxHours&&(s+=" \u26A0\uFE0F over max by "+(t.hoursEarned-t.maxHours)+"h \u2014 only "+t.maxHours+"h count toward K&U total"),Object.keys(t.hoursByDiscipline).length>0){let C=Object.entries(t.hoursByDiscipline).map(([M,F])=>M+": "+F+"h"+(t.maxedDisciplines.has(M)?" \u26A0\uFE0F maxed":"")).join(" \xB7 ");s+=" \u2014 "+C,t.maxPerDiscipline&&(s+=" (max "+t.maxPerDiscipline+"h/discipline)")}e.textContent=s,i.querySelector("p")?.after(e)}t.status==="complete"&&t.type!=="tag"&&i.classList.add("ca-category-complete");for(let e of t.courseAnnotations){if(!e.element)continue;let s=e.element;e.isInProgress?(s.classList.add("ca-course-in-progress"),s.setAttribute("data-ca-note","\u23F3 In Progress ("+e.hours+"h)")):e.isTransfer?(s.classList.add("ca-course-transfer"),s.setAttribute("data-ca-note","\u2713 Transfer ("+e.hours+"h)")):e.isTaken?e.isMultiSection?(s.classList.add("ca-course-taken-multi"),s.setAttribute("data-ca-note","\u2713 "+e.grade+" ("+e.hours+"h) \u21C9 Also: "+e.otherCategories.join(", "))):(s.classList.add("ca-course-taken"),s.setAttribute("data-ca-note","\u2713 "+e.grade+" ("+e.hours+"h)")):e.isPlanned?e.isMultiSection?(s.classList.add("ca-course-planned-multi"),s.setAttribute("data-ca-note","Planned \u21C9 Also: "+e.otherCategories.join(", "))):(s.classList.add("ca-course-planned"),s.setAttribute("data-ca-note","Planned")):t.status==="complete"&&t.type!=="tag"?e.isMultiSection?(s.classList.add("ca-course-double-count"),s.setAttribute("data-ca-note","\u21C9 Also: "+e.otherCategories.join(", "))):s.classList.add("ca-course-maxed"):e.isMaxedDiscipline?s.classList.add("ca-course-maxed"):e.isMultiSection&&!e.isTaken?(s.classList.add("ca-course-double-count"),s.setAttribute("data-ca-note","\u21C9 Also: "+e.otherCategories.join(", "))):t.status!=="complete"?s.classList.add("ca-course-opportunity"):s.classList.add("ca-course-maxed"),!e.isTaken&&!e.isInProgress&&!e.isTransfer&&ae(s,e.code,e.isPlanned,u)}}if(d&&d.length>0){let t={};for(let e of n)if(e.courseAnnotations)for(let s of e.courseAnnotations)t[s.code]||(t[s.code]=[]),t[s.code].push(e.name);let i=document.createElement("div");i.className="ca-transcript-section";let x="";for(let e of d){let s=t[e.code]||[],C=s.length>0?`<span class="ca-transcript-cats">${s.join(", ")}</span>`:'<span class="ca-transcript-none">not in core lists</span>',M=e.status==="in-progress"?' <span style="color:'+c.inProgress+'">\u23F3</span>':e.status==="transfer"?' <span style="color:'+c.transfer+'">\u2197</span>':"";x+=`<tr><td><strong>${e.code}</strong>${M}</td><td>${e.title}</td><td>${e.grade||"\u2014"}</td><td>${e.hours}h</td><td>${C}</td></tr>`}i.innerHTML=`<h3>\u{1F4CB} Transcript Reference (${d.length} courses)</h3>
      <table class="ca-transcript-table">
        <thead><tr><th>Code</th><th>Title</th><th>Grade</th><th>Hrs</th><th>Core Categories</th></tr></thead>
        <tbody>${x}</tbody>
      </table>`,f.parentElement.appendChild(i)}}var G={pathname:"/content.php",catoid:"24",navoid:"780"},$={panel:"ca-launcher-panel",details:"ca-launcher-details",textarea:"ca-transcript-input",status:"ca-launcher-status",styles:"ca-launcher-styles"},L=new Set;function se(){if(document.getElementById($.styles))return;let n=document.createElement("style");n.id=$.styles,n.textContent=`
    #${$.panel} {
      margin: 16px 0;
      padding: 14px 16px;
      border: 1px solid #cfd8dc;
      border-radius: 10px;
      background: linear-gradient(180deg, #f8fbfc, #eef5f6);
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
      font-family: system-ui, -apple-system, sans-serif;
    }
    #${$.panel} details {
      margin: 0;
    }
    #${$.panel} summary {
      cursor: pointer;
      font-weight: 700;
      color: #163642;
      list-style: none;
    }
    #${$.panel} summary::-webkit-details-marker {
      display: none;
    }
    #${$.panel} summary::before {
      content: '\u25B8';
      display: inline-block;
      margin-right: 8px;
      transition: transform 0.15s ease;
    }
    #${$.panel} details[open] summary::before {
      transform: rotate(90deg);
    }
    #${$.panel} p {
      margin: 10px 0 0;
      color: #35515a;
      line-height: 1.45;
      font-size: 13px;
    }
    #${$.textarea} {
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
    #${$.status} {
      font-size: 12px;
      color: #35515a;
    }
    #${$.status}.ca-status-success {
      color: #2d8a4e;
    }
    #${$.status}.ca-status-error {
      color: #9f2d2d;
    }
  `,document.head.appendChild(n)}function R(n,a){let d=document.getElementById($.status);d&&(d.textContent=n,d.className="",a==="success"&&d.classList.add("ca-status-success"),a==="error"&&d.classList.add("ca-status-error"))}function ne(){let n=new URL(window.location.href);return n.pathname===G.pathname&&n.searchParams.get("catoid")===G.catoid&&n.searchParams.get("navoid")===G.navoid}function O(n){let a=(n||"").trim();if(a.length===0){R("Paste your Workday Academic History or Academic Progress to see your core opportunities.",null);return}let d=_(a),p,m;if(d==="progress"){let l=Z(a);p=l.courses,m=l.overrides}else p=W(a);if(p.length===0){N(),R("Could not parse any courses. Copy from Workday Academic Record (Academic History or Academic Progress) and paste the full content here.","error");return}let u=X(),y=J(u,p,{plannedCourses:Array.from(L),overrides:m}),b=new Set(y.plannedCourses||[]);L.clear();for(let l of b)L.add(l);Q(y,{onTogglePlanned:l=>{L.has(l)?L.delete(l):L.add(l),O(n)}});let f=p.filter(l=>l.status==="in-progress").length,v=["Progress updated: "+p.filter(l=>l.code).length+" courses",y.kuSummary.totalHours+"/"+y.kuSummary.requiredHours+" K&U hours",y.kuSummary.categoriesUsed+"/"+y.kuSummary.requiredCategories+" K&U categories"];f>0&&v.push(f+" in-progress"),L.size>0&&v.push(L.size+" planned"),R(v.join(", ")+".","success"),console.log("[Core Annotator]",p.length,"courses ("+d+"):",p.filter(l=>l.code).map(l=>l.code+"("+l.hours+"h)")),console.log("[Core Annotator] K&U:",y.kuSummary),f>0&&console.log("[Core Annotator] In-progress:",p.filter(l=>l.status==="in-progress").map(l=>l.code)),L.size>0&&console.log("[Core Annotator] Planned:",Array.from(L))}function Y(){if(document.getElementById($.panel))return;let n=document.querySelector("div.acalog-core");if(!n||!n.parentElement)return;se();let a=document.createElement("section");a.id=$.panel,a.innerHTML=`
    <details id="${$.details}">
      <summary>Calvin Core Annotator</summary>
      <p>Open Workday, go to Academic Record, open Academic History (or Academic Progress), select all, copy, then paste here. Pasting shows opportunities immediately.</p>
      <textarea id="${$.textarea}" spellcheck="false" placeholder="Paste Workday Academic History or Academic Progress here"></textarea>
      <div class="ca-launcher-actions">
        <button type="button" class="ca-launcher-button" data-action="analyze">Show core opportunities</button>
        <button type="button" class="ca-launcher-button ca-launcher-button-secondary" data-action="reset">Reset annotations</button>
        <span id="${$.status}">Paste your Workday Academic History or Academic Progress to see your core opportunities.</span>
      </div>
    </details>`,n.parentElement.insertBefore(a,n);let d=a.querySelector("details"),p=a.querySelector("textarea");a.addEventListener("click",m=>{let u=m.target.closest("button[data-action]");u&&(u.dataset.action==="analyze"&&O(p.value),u.dataset.action==="reset"&&(p.value="",L.clear(),N(),R("Annotations cleared.",null),d.open=!1))}),p.addEventListener("paste",m=>{let u=m.clipboardData?.getData("text/plain");if(typeof u=="string"&&u.length>0){m.preventDefault(),p.value=u,O(u),d.open=!1;return}window.setTimeout(()=>{O(p.value),d.open=!1},0)})}function V(){if(console.log("v0.0.3"),!!ne()){if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",Y,{once:!0});return}Y()}}window.CalvinCoreAnnotator={main:V};V();})();
