(()=>{function W(a){let s=a.replace(/\u00a0/g," ").replace(/\r\n?/g,`
`).replace(/\s+/g," ").trim(),d=/\b([A-Z]{2,5})\s+(\d{3}[A-Z]?)\s*-\s*(.+?)\s+([A-Z]{1,2}[+-]?)\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)\s+\d+(?:\.\d+)?\b/g,p=[],g=d.exec(s);for(;g!==null;){let[,x,f,C,l,i]=g;p.push({code:x+" "+f,title:C.replace(/\s+/g," ").trim(),grade:l,hours:parseFloat(i),status:"completed"}),g=d.exec(s)}let u=new Map,y=[];for(let x of p){let f=x.code.match(/^([A-Z]{2,5}\s+\d{3})L$/);f?y.push({parentCode:f[1],...x}):u.set(x.code,{...x})}for(let x of y)u.has(x.parentCode)?u.get(x.parentCode).hours+=x.hours:u.set(x.code,x);return Array.from(u.values())}function Z(a){let s=a.replace(/\u00a0/g," ").replace(/\r\n?/g,`
`).split(`
`).map(i=>i.trim()).filter(i=>i.length>0),d=/^([A-Z]{2,5})\s+(\d{3}[A-Z]?L?)\s*-\s*(.+)$/,p=/^(.+?\bExemption)\s*-\s*(\d{2}\/\d{2}\/\d{4})$/,g=/\(Override Assigned\)/,u=[],y=[],x=new Set;for(let i=0;i<s.length;i++){if(g.test(s[i])){let P=s[i].replace(/\s*\(Click for more details\)/g,"").replace(/\s*\(Override Assigned\)/g,"").trim();x.add(P)}let w=s[i].match(p);if(w){let P=w[1].trim(),m=null;/language/i.test(P)&&(m="World Languages I"),y.push({name:P,date:w[2],target:m});let S=0;for(let D=i+1;D<Math.min(i+4,s.length);D++){if(/^\d+$/.test(s[D])){S=parseInt(s[D]);break}if(d.test(s[D]))break}m&&u.push({code:null,title:P,grade:null,hours:S,status:"exemption",exemptionTarget:m});continue}let H=s[i].match(d);if(!H)continue;let k=H[3].trim(),M="completed";/\(In Progress\)/.test(k)?(M="in-progress",k=k.replace(/\s*\(In Progress\)/,"").trim()):/\(Transfer Credit\)/.test(k)&&(M="transfer",k=k.replace(/\s*\(Transfer Credit\)/,"").trim());let B=0,o=null,A=null;for(let P=i+1;P<Math.min(i+8,s.length);P++){let m=s[P];if(d.test(m)||p.test(m))break;/^\d{4}\s+(Fall|Spring|Summer|Winter|Interim)$/i.test(m)?A=m:/^\d+$/.test(m)&&B===0?B=parseInt(m):(/^[A-Z]{1,2}[+-]?$/.test(m)||m==="CR")&&(o=m)}u.push({code:H[1]+" "+H[2],title:k,grade:o,hours:B,status:M,period:A})}let f=new Map,C=new Map;for(let i of u){if(i.code===null){f.has(i.title)||f.set(i.title,i);continue}let w=i.code.match(/^([A-Z]{2,5}\s+\d{3})L$/);w?C.has(i.code)||C.set(i.code,{parentCode:w[1],...i}):f.has(i.code)||f.set(i.code,{...i})}for(let i of C.values())f.has(i.parentCode)?f.get(i.parentCode).hours+=i.hours:f.set(i.code,i);return{courses:Array.from(f.values()),exemptions:y,overrides:x}}function _(a){if(/RequirementSort and filter column|StatusSort and filter column|Satisfied With/.test(a))return"progress";if(/Opens in new window/.test(a))return"transcript";let s=W(a).length;return Z(a).courses.filter(p=>p.code!==null).length>s?"progress":"transcript"}function q(a){return"ca-"+a.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")}function X(a){a||(a=document);let s=a.querySelectorAll("div.acalog-core"),d=[],p="";for(let g=0;g<s.length;g++){let u=s[g],y=u.querySelector("h2"),x=u.querySelector("h3"),f=u.querySelector("h4"),C=u.querySelector("p"),l=C?C.textContent.replace(/\u00a0/g," ").trim():"",i=y||x||f;if(y&&!x&&!f){p=y.textContent.trim(),i&&(i.id=q(p)),d.push({type:"section-header",section:p,instructions:l,element:u,coreIndex:g,slug:q(p)});continue}let w="";i&&(w=Array.from(i.childNodes).filter(T=>T.nodeType===3||T.nodeType===1&&T.tagName==="A").map(T=>T.textContent.trim()).join("").trim(),i.id=q(w));let H=f!==null,k=l.match(/(\d+)[–-](\d+)\s+semester hours/),M=l.match(/up to (\d+)\s+semester hours in any one discipline/),B=k?parseInt(k[1]):null,o=k?parseInt(k[2]):null,A=M?parseInt(M[1]):null,P=B!==null?"hour-range":"pick-one",m=u.querySelector("ul"),S=[],D=[],L=null;if(m){for(let T of m.children)if(T.classList.contains("acalog-adhoc")){let e=T.textContent.trim();["Or","One from","And"].includes(e)||(L=e,D.push({name:e,element:T}))}else if(T.classList.contains("acalog-course")){let e=T.querySelector("a"),v=(e?e.textContent.trim():"").match(/^([A-Z]{2,5})\s+(\d{3}[A-Z]?)\s*-\s*(.+)$/);v&&S.push({code:v[1]+" "+v[2],title:v[3].trim(),subDiscipline:L,element:T})}}d.push({type:H?"tag":"category",section:p,name:w,instructions:l,reqType:P,minHours:B,maxHours:o,maxPerDiscipline:A,courses:S,subDisciplineElements:D,element:u,coreIndex:g,slug:q(w)})}return d}var G=["World Languages II","Arts, Oral Rhetoric, Visual Rhetoric","Humanities","Mathematical Sciences","Natural Sciences","Social and Behavioral Sciences"];function oe(a){return(a||"").toUpperCase().replace(/\s+/g," ").trim()}function J(a,s,d={}){let p=s.filter(o=>o.status!=="in-progress"&&o.status!=="exemption"),g=s.filter(o=>o.status==="in-progress"),u=s.filter(o=>o.status==="exemption"),y=new Set(u.map(o=>o.exemptionTarget).filter(Boolean)),x=new Set(p.map(o=>o.code).filter(Boolean)),f=new Set(g.map(o=>o.code).filter(Boolean)),C=new Set([...x,...f]),l={};for(let o of s)o.code&&(l[o.code]=o);let i=new Set((d.plannedCourses||[]).map(o=>oe(o)).filter(o=>o.length>0&&!C.has(o))),w={};for(let o of a)if(!(!o.courses||!o.name))for(let A of o.courses)w[A.code]||(w[A.code]=[]),w[A.code].push(o.name);let H={},k=0,M=0,B=[];for(let o of a){if(o.type==="section-header"){B.push({...o,status:"header"});continue}if(!o.courses||o.courses.length===0){if(y.has(o.name)){B.push({...o,status:"complete",hoursEarned:0,hoursEffective:0,hoursByDiscipline:{},maxedDisciplines:new Set,subDisciplines:null,takenCount:0,inProgressCount:0,plannedCount:0,courseAnnotations:[],isExempt:!0});continue}B.push({...o,status:"info-only"});continue}if(y.has(o.name)){let r=o.courses.map(b=>({...b,isTaken:C.has(b.code),isInProgress:f.has(b.code),isPlanned:!1,isMultiSection:!1,otherCategories:[],isMaxedDiscipline:!1,grade:"",hours:0}));B.push({...o,status:"complete",hoursEarned:0,hoursEffective:0,hoursByDiscipline:{},maxedDisciplines:new Set,subDisciplines:null,takenCount:0,inProgressCount:0,plannedCount:0,courseAnnotations:r,isExempt:!0});continue}let A=o.courses.filter(r=>C.has(r.code)),P=o.courses.filter(r=>f.has(r.code)),m=0,S={};for(let r of A){let b=l[r.code],$=b?b.hours:0;m+=$;let z=r.subDiscipline||"General";S[z]=(S[z]||0)+$}let D=o.maxHours!==null?Math.min(m,o.maxHours):m,L=new Set;if(o.maxPerDiscipline)for(let[r,b]of Object.entries(S))b>=o.maxPerDiscipline&&L.add(r);let T=o.courses.some(r=>!C.has(r.code)&&!L.has(r.subDiscipline||"General")),e;if(o.reqType==="pick-one")e=A.length>0?"complete":"incomplete";else{let r=o.minHours||0;m<r?e="incomplete":m===0&&r===0?e="optional-available":o.maxPerDiscipline&&o.maxHours!==null&&D<o.maxHours&&T?e="satisfied":e="complete"}G.includes(o.name)&&(H[o.name]={raw:m,effective:D,max:o.maxHours},k+=D,m>0&&M++);let h=null;if(o.maxPerDiscipline&&A.length>0){h={};let r=new Set(o.courses.map(b=>b.subDiscipline).filter(Boolean));for(let b of r){let $=S[b]||0,z=L.has(b),O=o.courses.filter(N=>N.subDiscipline===b&&!C.has(N.code)).length;h[b]={hoursEarned:$,cap:o.maxPerDiscipline,isMaxed:z,untakenCount:O}}}let v=o.courses.map(r=>{let b=x.has(r.code),$=f.has(r.code),z=b||$,O=!z&&i.has(r.code),N=w[r.code]||[],ee=N.filter(te=>te!==o.name),U=l[r.code];return{...r,isTaken:b,isInProgress:$,isMultiSection:N.length>1,otherCategories:ee,isPlanned:O,isMaxedDiscipline:L.has(r.subDiscipline||"General")&&!z,grade:z&&U?.grade||"",hours:z&&U?.hours||0,isTransfer:U?.status==="transfer"}}),t=v.filter(r=>r.isPlanned).length,n=v.filter(r=>r.isInProgress).length;B.push({...o,status:e,hoursEarned:m,hoursEffective:D,hoursByDiscipline:S,maxedDisciplines:L,subDisciplines:h,takenCount:A.length,inProgressCount:n,plannedCount:t,courseAnnotations:v})}return{results:B,transcript:s,plannedCourses:Array.from(i),overrides:d.overrides||new Set,exemptions:u,kuSummary:{totalHours:k,requiredHours:26,categoriesUsed:M,requiredCategories:5,hoursByCategory:H}}}var c={taken:"#2d8a4e",takenBg:"#e6f7ed",opportunity:"#b8860b",opportunityBg:"#fff8dc",doubleCount:"#1a73e8",doubleCountBg:"#e8f0fe",inProgress:"#5b21b6",inProgressBg:"#ede9fe",transfer:"#0e7490",transferBg:"#ecfeff"};function R(){["ca-styles","ca-toc-styles"].forEach(a=>{document.getElementById(a)?.remove()}),document.querySelectorAll(".ca-legend,.ca-summary-panel,.ca-badge,.ca-hours-note,#ca-toc,.ca-disclaimer,.ca-transcript-section").forEach(a=>{a.remove()}),document.querySelectorAll('[class*="ca-course-"],[class*="ca-category-"]').forEach(a=>{a.className=a.className.replace(/ca-[\w-]+/g,"").trim(),a.removeAttribute("data-ca-note")})}function ae(a,s,d,p){if(typeof p!="function")return;let g=document.createElement("button");g.type="button",g.className="ca-plan-toggle"+(d?" ca-plan-toggle-on":""),g.textContent=d?"Planned":"+ Plan",g.title=d?"Remove planned course":"Mark as planned course",g.addEventListener("click",u=>{u.preventDefault(),u.stopPropagation(),p(s)}),a.appendChild(g)}function Q({results:a,kuSummary:s,transcript:d,plannedCourses:p},g={}){let u=g.onTogglePlanned;R();let y=document.createElement("style");y.id="ca-styles",y.textContent=`
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
    .ca-summary-section-label { color:#fbbf24; font-size:11px; font-weight:bold; text-transform:uppercase;
      letter-spacing:0.5px; margin:14px 0 6px 0; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08); }
    .ca-summary-section-label:first-of-type { margin-top:8px; padding-top:0; border-top:none; }
    .ca-summary-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
    .ca-summary-grid-4 { grid-template-columns:1fr 1fr 1fr 1fr; }
    .ca-summary-item { background:rgba(255,255,255,0.08); padding:8px 12px; border-radius:6px; font-size:12px;
      cursor:pointer; transition:background 0.15s; text-decoration:none; display:block; }
    .ca-summary-item:hover { background:rgba(255,255,255,0.15); }
    .ca-summary-item .label { color:#aaa; font-size:11px; }
    .ca-summary-item .value { color:#fff; font-weight:bold; font-size:14px; }
    .ca-summary-item.complete .value { color:#4ade80; }
    .ca-summary-item.incomplete .value { color:#fbbf24; }
    .ca-summary-item.exempt .value { color:#86efac; font-style:italic; }
    .ca-summary-item.optional .value { color:#888; }
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
  `,document.head.appendChild(y);let x=document.createElement("style");x.id="ca-toc-styles",x.textContent=`
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
  `,document.head.appendChild(x);let f=document.querySelector("div.acalog-core");if(!f)return;let C=document.createElement("div");C.className="ca-legend",C.innerHTML=`
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${c.takenBg};border-color:${c.taken}"></div>Taken</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:linear-gradient(90deg,${c.takenBg} 70%,${c.doubleCountBg});border-color:${c.taken}"></div>Taken (multi-section)</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:#fff7e9;border-color:#d97706"></div>Planned</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${c.doubleCountBg};border-color:${c.doubleCount}"></div>Double-count opportunity</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="border-left:3px solid ${c.opportunity}"></div>Open opportunities</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${c.inProgressBg};border-color:${c.inProgress}"></div>In Progress</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${c.transferBg};border-color:${c.transfer}"></div>Transfer Credit</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:#eee;opacity:0.35"></div>Maxed / satisfied</div>
  `;let l=document.createElement("div");l.className="ca-summary-panel";let i=a.filter(e=>e.status!=="header"&&e.status!=="info-only"),w=i.filter(e=>e.status==="complete"||e.isExempt).length,H=[],k=null;for(let e of a){if(e.status==="header"){k={name:e.section,items:[]},H.push(k);continue}k&&e.status!=="info-only"&&k.items.push(e)}function M(e){return e.isExempt?"exempt":e.status==="complete"||e.status==="satisfied"?"complete":e.status==="optional-available"?"optional":"incomplete"}function B(e){return e.isExempt?"Exempt":e.status==="complete"?"\u2713":e.status==="satisfied"?"Min met":e.status==="optional-available"?"Optional":"\u25CB"}let o="";for(let e of H){if(e.items.length===0)continue;let h=e.name==="KNOWLEDGE AND UNDERSTANDING";if(o+=`<div class="ca-summary-section-label">${e.name}</div>`,h){let v=Math.min(100,Math.round(s.totalHours/s.requiredHours*100)),t=s.totalHours>=s.requiredHours?"#4ade80":"#fbbf24",n=s.categoriesUsed>=s.requiredCategories?"#4ade80":"#fbbf24";o+=`<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span>Hours: <strong style="color:${t}">${s.totalHours} / ${s.requiredHours}</strong></span>
        <span>Categories: <strong style="color:${n}">${s.categoriesUsed} / ${s.requiredCategories}</strong></span>
      </div>
      <div class="ca-progress-bar"><div class="ca-progress-fill" style="width:${v}%;background:${t}"></div>
        <div class="ca-progress-label">${v}%</div></div>`;let r="";for(let b of G){let $=s.hoursByCategory[b]||{raw:0,effective:0,max:null},z=$.raw>0?"complete":"incomplete",O=$.max!==null&&$.raw>$.max?`<div class="cap-note">${$.raw}h earned, capped at ${$.max}h</div>`:"",N=q(b);r+=`<a href="#${N}" class="ca-summary-item ${z}" data-slug="${N}">
          <span class="label">${b}</span><br><span class="value">${$.effective} hrs</span>${O}</a>`}o+=`<div class="ca-summary-grid">${r}</div>`}else{let v=e.items.length===4?" ca-summary-grid-4":"",t="";for(let n of e.items){let r=M(n),b=B(n),$=n.slug,z=n.name;t+=`<a href="#${$}" class="ca-summary-item ${r}" data-slug="${$}">
          <span class="label">${z}</span><br><span class="value">${b}</span></a>`}o+=`<div class="ca-summary-grid${v}">${t}</div>`}}l.innerHTML=`
    <h3>\u{1F4CA} Core Opportunities</h3>
    <div style="font-size:13px;margin-bottom:4px">
      <span>Overall: <strong style="color:${w>=i.length?"#4ade80":"#fbbf24"}">${w} / ${i.length}</strong> requirements complete</span>
    </div>
    <div style="font-size:12px;color:#d5dbe5;margin-bottom:2px">Planned courses: <strong>${(p||[]).length}</strong> (do not count toward completed hours until taken)</div>
    ${o}`,l.addEventListener("click",e=>{let h=e.target.closest(".ca-summary-item");h&&(e.preventDefault(),document.getElementById(h.dataset.slug)?.scrollIntoView({behavior:"smooth",block:"start"}))});let A=document.createElement("div");A.className="ca-disclaimer",A.textContent="\u26A0\uFE0F These results are unofficial and for planning purposes only. They may not reflect all institutional policies, transfer credit decisions, or advisor overrides. Always verify your core program status with your academic advisor or the Registrar.",f.parentElement.insertBefore(C,f),f.parentElement.insertBefore(l,f),f.parentElement.insertBefore(A,f);let P=document.createElement("div");P.id="ca-toc";let m=document.createElement("button");m.id="ca-toc-toggle",m.textContent="\u2630",m.title="Table of Contents";let S=document.createElement("div");S.id="ca-toc-panel";let D='<div class="ca-toc-header">\u{1F4D1} Core Program</div>';for(let e of a){if(!e.slug)continue;let h=e.type==="section-header"?"":e.type==="tag"?"ca-toc-tag":"ca-toc-cat",v=e.name||e.section,t="";e.status==="complete"?t='<span class="ca-toc-status ca-toc-status-done">\u2713</span>':e.status==="satisfied"?t='<span class="ca-toc-status ca-toc-status-satisfied">\u25D4</span>':e.status==="incomplete"?t='<span class="ca-toc-status ca-toc-status-needed">\u25CB</span>':e.status==="optional-available"&&(t='<span class="ca-toc-status ca-toc-status-optional">\u25CB</span>'),D+=`<a href="#${e.slug}" class="ca-toc-item ${h}" data-slug="${e.slug}">${v}${t}</a>`}S.innerHTML=D,P.appendChild(m),P.appendChild(S),document.body.appendChild(P);let L=!1;m.addEventListener("click",()=>{L=!L,S.style.display=L?"block":"none",m.textContent=L?"\u2715":"\u2630"}),S.addEventListener("click",e=>{let h=e.target.closest("a");h&&(e.preventDefault(),document.getElementById(h.dataset.slug)?.scrollIntoView({behavior:"smooth",block:"start"}))});let T=new IntersectionObserver(e=>{for(let h of e)if(h.isIntersecting){let v=h.target.id;document.querySelectorAll(".ca-toc-item").forEach(n=>{n.classList.remove("ca-toc-active")});let t=document.querySelector(`.ca-toc-item[data-slug="${v}"]`);t&&(t.classList.add("ca-toc-active"),t.scrollIntoView({block:"nearest",behavior:"smooth"}))}},{rootMargin:"-10% 0px -80% 0px"});a.filter(e=>e.slug).forEach(e=>{let h=document.getElementById(e.slug);h&&T.observe(h)});for(let e of a){if(e.status==="header"||!e.courseAnnotations)continue;let h=e.element,v=h.querySelector("h3")||h.querySelector("h4");if(v){let t=document.createElement("span");t.className="ca-badge",e.isExempt?(t.className+=" ca-badge-exempt",t.textContent="\u2713 EXEMPT"):e.status==="complete"?(t.className+=" ca-badge-complete",t.textContent="\u2713 COMPLETE"):e.status==="satisfied"?(t.className+=" ca-badge-satisfied",t.textContent="MIN MET"):e.status==="optional-available"?(t.className+=" ca-badge-optional",t.textContent="OPTIONAL"):(t.className+=" ca-badge-incomplete",t.textContent=e.reqType==="hour-range"?e.hoursEarned+"/"+(e.minHours||0)+"+ hrs":"AREAS TO EXPLORE"),v.appendChild(t)}if(Array.isArray(e.subDisciplineElements)&&e.subDisciplines)for(let t of e.subDisciplineElements){let n=e.subDisciplines[t.name];if(!n)continue;let r=document.createElement("span");r.className="ca-badge",n.isMaxed?(r.className+=" ca-badge-complete",r.textContent="\u2713 "+n.hoursEarned+"h/"+n.cap+"h"):n.hoursEarned>0?(r.className+=" ca-badge-incomplete",r.textContent=n.hoursEarned+"h/"+n.cap+"h max"):(r.className+=" ca-badge-optional",r.textContent="0h \u2014 up to "+n.cap+"h"),t.element.appendChild(r)}if(e.type==="category"&&e.name==="World Languages I"){let t=document.createElement("span");t.className="ca-hours-note",t.textContent="\u2139\uFE0F World Languages I may already be satisfied through qualifying high school language coursework/exemption. Confirm with your advisor or the Registrar if this applies to you.",h.querySelector("p")?.after(t)}if(e.reqType==="hour-range"&&(e.hoursEarned>0||e.maxPerDiscipline)){let t=document.createElement("span");t.className="ca-hours-note";let n="\u{1F4D0} "+e.hoursEarned+"h earned";if(e.minHours!==null&&(n+=" (need "+e.minHours+"\u2013"+e.maxHours+"h)"),e.maxHours!==null&&e.hoursEarned>e.maxHours&&(n+=" \u26A0\uFE0F over max by "+(e.hoursEarned-e.maxHours)+"h \u2014 only "+e.maxHours+"h count toward K&U total"),Object.keys(e.hoursByDiscipline).length>0){let r=Object.entries(e.hoursByDiscipline).map(([b,$])=>b+": "+$+"h"+(e.maxedDisciplines.has(b)?" \u26A0\uFE0F maxed":"")).join(" \xB7 ");n+=" \u2014 "+r,e.maxPerDiscipline&&(n+=" (max "+e.maxPerDiscipline+"h/discipline)")}t.textContent=n,h.querySelector("p")?.after(t)}e.status==="complete"&&e.type!=="tag"&&h.classList.add("ca-category-complete");for(let t of e.courseAnnotations){if(!t.element)continue;let n=t.element;t.isInProgress?(n.classList.add("ca-course-in-progress"),n.setAttribute("data-ca-note","\u23F3 In Progress ("+t.hours+"h)")):t.isTransfer?(n.classList.add("ca-course-transfer"),n.setAttribute("data-ca-note","\u2713 Transfer ("+t.hours+"h)")):t.isTaken?t.isMultiSection?(n.classList.add("ca-course-taken-multi"),n.setAttribute("data-ca-note","\u2713 "+t.grade+" ("+t.hours+"h) \u21C9 Also: "+t.otherCategories.join(", "))):(n.classList.add("ca-course-taken"),n.setAttribute("data-ca-note","\u2713 "+t.grade+" ("+t.hours+"h)")):t.isPlanned?t.isMultiSection?(n.classList.add("ca-course-planned-multi"),n.setAttribute("data-ca-note","Planned \u21C9 Also: "+t.otherCategories.join(", "))):(n.classList.add("ca-course-planned"),n.setAttribute("data-ca-note","Planned")):e.status==="complete"&&e.type!=="tag"?t.isMultiSection?(n.classList.add("ca-course-double-count"),n.setAttribute("data-ca-note","\u21C9 Also: "+t.otherCategories.join(", "))):n.classList.add("ca-course-maxed"):t.isMaxedDiscipline?n.classList.add("ca-course-maxed"):t.isMultiSection&&!t.isTaken?(n.classList.add("ca-course-double-count"),n.setAttribute("data-ca-note","\u21C9 Also: "+t.otherCategories.join(", "))):e.status!=="complete"?n.classList.add("ca-course-opportunity"):n.classList.add("ca-course-maxed"),!t.isTaken&&!t.isInProgress&&!t.isTransfer&&ae(n,t.code,t.isPlanned,u)}}if(d&&d.length>0){let e={};for(let t of a)if(t.courseAnnotations)for(let n of t.courseAnnotations)e[n.code]||(e[n.code]=[]),e[n.code].push(t.name);let h=document.createElement("div");h.className="ca-transcript-section";let v="";for(let t of d){let n=e[t.code]||[],r=n.length>0?`<span class="ca-transcript-cats">${n.join(", ")}</span>`:'<span class="ca-transcript-none">not in core lists</span>',b=t.status==="in-progress"?' <span style="color:'+c.inProgress+'">\u23F3</span>':t.status==="transfer"?' <span style="color:'+c.transfer+'">\u2197</span>':"";v+=`<tr><td><strong>${t.code}</strong>${b}</td><td>${t.title}</td><td>${t.grade||"\u2014"}</td><td>${t.hours}h</td><td>${r}</td></tr>`}h.innerHTML=`<h3>\u{1F4CB} Transcript Reference (${d.length} courses)</h3>
      <table class="ca-transcript-table">
        <thead><tr><th>Code</th><th>Title</th><th>Grade</th><th>Hrs</th><th>Core Categories</th></tr></thead>
        <tbody>${v}</tbody>
      </table>`,f.parentElement.appendChild(h)}}var K={pathname:"/content.php",catoid:"24",navoid:"780"},E={panel:"ca-launcher-panel",details:"ca-launcher-details",textarea:"ca-transcript-input",status:"ca-launcher-status",styles:"ca-launcher-styles"},I=new Set;function se(){if(document.getElementById(E.styles))return;let a=document.createElement("style");a.id=E.styles,a.textContent=`
    #${E.panel} {
      margin: 16px 0;
      padding: 14px 16px;
      border: 1px solid #cfd8dc;
      border-radius: 10px;
      background: linear-gradient(180deg, #f8fbfc, #eef5f6);
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
      font-family: system-ui, -apple-system, sans-serif;
    }
    #${E.panel} details {
      margin: 0;
    }
    #${E.panel} summary {
      cursor: pointer;
      font-weight: 700;
      color: #163642;
      list-style: none;
    }
    #${E.panel} summary::-webkit-details-marker {
      display: none;
    }
    #${E.panel} summary::before {
      content: '\u25B8';
      display: inline-block;
      margin-right: 8px;
      transition: transform 0.15s ease;
    }
    #${E.panel} details[open] summary::before {
      transform: rotate(90deg);
    }
    #${E.panel} p {
      margin: 10px 0 0;
      color: #35515a;
      line-height: 1.45;
      font-size: 13px;
    }
    #${E.textarea} {
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
    #${E.status} {
      font-size: 12px;
      color: #35515a;
    }
    #${E.status}.ca-status-success {
      color: #2d8a4e;
    }
    #${E.status}.ca-status-error {
      color: #9f2d2d;
    }
  `,document.head.appendChild(a)}function F(a,s){let d=document.getElementById(E.status);d&&(d.textContent=a,d.className="",s==="success"&&d.classList.add("ca-status-success"),s==="error"&&d.classList.add("ca-status-error"))}function ne(){let a=new URL(window.location.href);return a.pathname===K.pathname&&a.searchParams.get("catoid")===K.catoid&&a.searchParams.get("navoid")===K.navoid}function j(a){let s=(a||"").trim();if(s.length===0){F("Paste your Workday Academic History or Academic Progress to see your core opportunities.",null);return}let d=_(s),p,g;if(d==="progress"){let l=Z(s);p=l.courses,g=l.overrides}else p=W(s);if(p.length===0){R(),F("Could not parse any courses. Copy from Workday Academic Record (Academic History or Academic Progress) and paste the full content here.","error");return}let u=X(),y=J(u,p,{plannedCourses:Array.from(I),overrides:g}),x=new Set(y.plannedCourses||[]);I.clear();for(let l of x)I.add(l);Q(y,{onTogglePlanned:l=>{I.has(l)?I.delete(l):I.add(l),j(a)}});let f=p.filter(l=>l.status==="in-progress").length,C=["Progress updated: "+p.filter(l=>l.code).length+" courses",y.kuSummary.totalHours+"/"+y.kuSummary.requiredHours+" K&U hours",y.kuSummary.categoriesUsed+"/"+y.kuSummary.requiredCategories+" K&U categories"];f>0&&C.push(f+" in-progress"),I.size>0&&C.push(I.size+" planned"),F(C.join(", ")+".","success"),console.log("[Core Annotator]",p.length,"courses ("+d+"):",p.filter(l=>l.code).map(l=>l.code+"("+l.hours+"h)")),console.log("[Core Annotator] K&U:",y.kuSummary),f>0&&console.log("[Core Annotator] In-progress:",p.filter(l=>l.status==="in-progress").map(l=>l.code)),I.size>0&&console.log("[Core Annotator] Planned:",Array.from(I))}function Y(){if(document.getElementById(E.panel))return;let a=document.querySelector("div.acalog-core");if(!a||!a.parentElement)return;se();let s=document.createElement("section");s.id=E.panel,s.innerHTML=`
    <details id="${E.details}">
      <summary>Calvin Core Annotator</summary>
      <p>Open Workday, go to Academic Record, open Academic History (or Academic Progress), select all, copy, then paste here. Pasting shows opportunities immediately.</p>
      <textarea id="${E.textarea}" spellcheck="false" placeholder="Paste Workday Academic History or Academic Progress here"></textarea>
      <div class="ca-launcher-actions">
        <button type="button" class="ca-launcher-button" data-action="analyze">Show core opportunities</button>
        <button type="button" class="ca-launcher-button ca-launcher-button-secondary" data-action="reset">Reset annotations</button>
        <span id="${E.status}">Paste your Workday Academic History or Academic Progress to see your core opportunities.</span>
      </div>
    </details>`,a.parentElement.insertBefore(s,a);let d=s.querySelector("details"),p=s.querySelector("textarea");s.addEventListener("click",g=>{let u=g.target.closest("button[data-action]");u&&(u.dataset.action==="analyze"&&j(p.value),u.dataset.action==="reset"&&(p.value="",I.clear(),R(),F("Annotations cleared.",null),d.open=!1))}),p.addEventListener("paste",g=>{let u=g.clipboardData?.getData("text/plain");if(typeof u=="string"&&u.length>0){g.preventDefault(),p.value=u,j(u),d.open=!1;return}window.setTimeout(()=>{j(p.value),d.open=!1},0)})}function V(){if(console.log("v0.0.3"),!!ne()){if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",Y,{once:!0});return}Y()}}window.CalvinCoreAnnotator={main:V};V();})();
