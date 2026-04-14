(()=>{function W(s){let a=s.replace(/\u00a0/g," ").replace(/\r\n?/g,`
`).replace(/\s+/g," ").trim(),u=/\b([A-Z]{2,5})\s+(\d{3}[A-Z]?)\s*-\s*(.+?)\s+([A-Z]{1,2}[+-]?)\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)\s+\d+(?:\.\d+)?\b/g,d=[],g=u.exec(a);for(;g!==null;){let[,x,m,v,l,i]=g;d.push({code:x+" "+m,title:v.replace(/\s+/g," ").trim(),grade:l,hours:parseFloat(i),status:"completed"}),g=u.exec(a)}let f=new Map,p=[];for(let x of d){let m=x.code.match(/^([A-Z]{2,5}\s+\d{3})L$/);m?p.push({parentCode:m[1],...x}):f.set(x.code,{...x})}for(let x of p)f.has(x.parentCode)?f.get(x.parentCode).hours+=x.hours:f.set(x.code,x);return Array.from(f.values())}function _(s){let a=s.replace(/\u00a0/g," ").replace(/\r\n?/g,`
`).split(`
`).map(i=>i.trim()).filter(i=>i.length>0),u=/^([A-Z]{2,5})\s+(\d{3}[A-Z]?L?)\s*-\s*(.+)$/,d=/^(.+?\bExemption)\s*-\s*(\d{2}\/\d{2}\/\d{4})$/,g=/\(Override Assigned\)/,f=[],p=[],x=new Set;for(let i=0;i<a.length;i++){if(g.test(a[i])){let A=a[i].replace(/\s*\(Click for more details\)/g,"").replace(/\s*\(Override Assigned\)/g,"").trim();x.add(A)}let E=a[i].match(d);if(E){let A=E[1].trim(),h=null;/language/i.test(A)&&(h="World Languages I"),p.push({name:A,date:E[2],target:h});let S=0;for(let D=i+1;D<Math.min(i+4,a.length);D++){if(/^\d+$/.test(a[D])){S=parseInt(a[D]);break}if(u.test(a[D]))break}h&&f.push({code:null,title:A,grade:null,hours:S,status:"exemption",exemptionTarget:h});continue}let I=a[i].match(u);if(!I)continue;let $=I[3].trim(),H="completed";/\(In Progress\)/.test($)?(H="in-progress",$=$.replace(/\s*\(In Progress\)/,"").trim()):/\(Transfer Credit\)/.test($)&&(H="transfer",$=$.replace(/\s*\(Transfer Credit\)/,"").trim());let T=0,o=null,P=null;for(let A=i+1;A<Math.min(i+8,a.length);A++){let h=a[A];if(u.test(h)||d.test(h))break;/^\d{4}\s+(Fall|Spring|Summer|Winter|Interim)$/i.test(h)?P=h:/^\d+$/.test(h)&&T===0?T=parseInt(h):(/^[A-Z]{1,2}[+-]?$/.test(h)||h==="CR")&&(o=h)}f.push({code:I[1]+" "+I[2],title:$,grade:o,hours:T,status:H,period:P})}let m=new Map,v=new Map;for(let i of f){if(i.code===null){m.has(i.title)||m.set(i.title,i);continue}let E=i.code.match(/^([A-Z]{2,5}\s+\d{3})L$/);E?v.has(i.code)||v.set(i.code,{parentCode:E[1],...i}):m.has(i.code)||m.set(i.code,{...i})}for(let i of v.values())m.has(i.parentCode)?m.get(i.parentCode).hours+=i.hours:m.set(i.code,i);return{courses:Array.from(m.values()),exemptions:p,overrides:x}}function V(s){if(/RequirementSort and filter column|StatusSort and filter column|Satisfied With/.test(s))return"progress";if(/Opens in new window/.test(s))return"transcript";let a=W(s).length;return _(s).courses.filter(d=>d.code!==null).length>a?"progress":"transcript"}function q(s){return"ca-"+s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")}function J(s){s||(s=document);let a=s.querySelectorAll("div.acalog-core"),u=[],d="";for(let g=0;g<a.length;g++){let f=a[g],p=f.querySelector("h2"),x=f.querySelector("h3"),m=f.querySelector("h4"),v=f.querySelector("p"),l=v?v.textContent.replace(/\u00a0/g," ").trim():"",i=p||x||m;if(p&&!x&&!m){d=p.textContent.trim(),i&&(i.id=q(d)),u.push({type:"section-header",section:d,instructions:l,element:f,coreIndex:g,slug:q(d)});continue}let E="";i&&(E=Array.from(i.childNodes).filter(L=>L.nodeType===3||L.nodeType===1&&L.tagName==="A").map(L=>L.textContent.trim()).join("").trim(),i.id=q(E));let I=m!==null,$=l.match(/(\d+)[–-](\d+)\s+semester hours/),H=l.match(/up to (\d+)\s+semester hours in any one discipline/),T=$?parseInt($[1]):null,o=$?parseInt($[2]):null,P=H?parseInt(H[1]):null,A=T!==null?"hour-range":"pick-one",h=f.querySelector("ul"),S=[],D=[],B=null;if(h){for(let L of h.children)if(L.classList.contains("acalog-adhoc")){let e=L.textContent.trim();["Or","One from","And"].includes(e)||(B=e,D.push({name:e,element:L}))}else if(L.classList.contains("acalog-course")){let e=L.querySelector("a"),C=(e?e.textContent.trim():"").match(/^([A-Z]{2,5})\s+(\d{3}[A-Z]?)\s*-\s*(.+)$/);C&&S.push({code:C[1]+" "+C[2],title:C[3].trim(),subDiscipline:B,element:L})}}u.push({type:I?"tag":"category",section:d,name:E,instructions:l,reqType:A,minHours:T,maxHours:o,maxPerDiscipline:P,courses:S,subDisciplineElements:D,element:f,coreIndex:g,slug:q(E)})}return u}var G=["World Languages II","Arts, Oral Rhetoric, Visual Rhetoric","Humanities","Mathematical Sciences","Natural Sciences","Social and Behavioral Sciences"];function ae(s){return(s||"").toUpperCase().replace(/\s+/g," ").trim()}function X(s,a,u={}){let d=a.filter(o=>o.status!=="in-progress"&&o.status!=="exemption"),g=a.filter(o=>o.status==="in-progress"),f=a.filter(o=>o.status==="exemption"),p=new Set(f.map(o=>o.exemptionTarget).filter(Boolean)),x=new Set(d.map(o=>o.code).filter(Boolean)),m=new Set(g.map(o=>o.code).filter(Boolean)),v=new Set([...x,...m]),l={};for(let o of a)o.code&&(l[o.code]=o);let i=new Set((u.plannedCourses||[]).map(o=>ae(o)).filter(o=>o.length>0&&!v.has(o))),E={};for(let o of s)if(!(!o.courses||!o.name))for(let P of o.courses)E[P.code]||(E[P.code]=[]),E[P.code].push(o.name);let I={},$=0,H=0,T=[];for(let o of s){if(o.type==="section-header"){T.push({...o,status:"header"});continue}if(!o.courses||o.courses.length===0){if(p.has(o.name)){T.push({...o,status:"complete",hoursEarned:0,hoursEffective:0,hoursByDiscipline:{},maxedDisciplines:new Set,subDisciplines:null,takenCount:0,inProgressCount:0,plannedCount:0,courseAnnotations:[],isExempt:!0});continue}T.push({...o,status:"info-only"});continue}if(p.has(o.name)){let r=o.courses.map(y=>({...y,isTaken:v.has(y.code),isInProgress:m.has(y.code),isPlanned:!1,isMultiSection:!1,otherCategories:[],isMaxedDiscipline:!1,grade:"",hours:0}));T.push({...o,status:"complete",hoursEarned:0,hoursEffective:0,hoursByDiscipline:{},maxedDisciplines:new Set,subDisciplines:null,takenCount:0,inProgressCount:0,plannedCount:0,courseAnnotations:r,isExempt:!0});continue}let P=o.courses.filter(r=>v.has(r.code)),A=o.courses.filter(r=>m.has(r.code)),h=0,S={};for(let r of P){let y=l[r.code],w=y?y.hours:0;h+=w;let z=r.subDiscipline||"General";S[z]=(S[z]||0)+w}let D=o.maxHours!==null?Math.min(h,o.maxHours):h,B=new Set;if(o.maxPerDiscipline)for(let[r,y]of Object.entries(S))y>=o.maxPerDiscipline&&B.add(r);let L=o.courses.some(r=>!v.has(r.code)&&!B.has(r.subDiscipline||"General")),e;if(o.reqType==="pick-one")e=P.length>0?"complete":"incomplete";else{let r=o.minHours||0;h<r?e="incomplete":h===0&&r===0?e="optional-available":o.maxPerDiscipline&&o.maxHours!==null&&D<o.maxHours&&L?e="satisfied":e="complete"}G.includes(o.name)&&(I[o.name]={raw:h,effective:D,max:o.maxHours},$+=D,h>0&&H++);let b=null;if(o.maxPerDiscipline&&P.length>0){b={};let r=new Set(o.courses.map(y=>y.subDiscipline).filter(Boolean));for(let y of r){let w=S[y]||0,z=B.has(y),j=o.courses.filter(N=>N.subDiscipline===y&&!v.has(N.code)).length;b[y]={hoursEarned:w,cap:o.maxPerDiscipline,isMaxed:z,untakenCount:j}}}let C=o.courses.map(r=>{let y=x.has(r.code),w=m.has(r.code),z=y||w,j=!z&&i.has(r.code),N=E[r.code]||[],te=N.filter(oe=>oe!==o.name),U=l[r.code];return{...r,isTaken:y,isInProgress:w,isMultiSection:N.length>1,otherCategories:te,isPlanned:j,isMaxedDiscipline:B.has(r.subDiscipline||"General")&&!z,grade:z&&U?.grade||"",hours:z&&U?.hours||0,isTransfer:U?.status==="transfer"}}),t=C.filter(r=>r.isPlanned).length,n=C.filter(r=>r.isInProgress).length;T.push({...o,status:e,hoursEarned:h,hoursEffective:D,hoursByDiscipline:S,maxedDisciplines:B,subDisciplines:b,takenCount:P.length,inProgressCount:n,plannedCount:t,courseAnnotations:C})}return{results:T,transcript:a,plannedCourses:Array.from(i),overrides:u.overrides||new Set,exemptions:f,kuSummary:{totalHours:$,requiredHours:26,categoriesUsed:H,requiredCategories:5,hoursByCategory:I}}}var c={taken:"#2d8a4e",takenBg:"#e6f7ed",opportunity:"#b8860b",opportunityBg:"#fff8dc",doubleCount:"#1a73e8",doubleCountBg:"#e8f0fe",inProgress:"#5b21b6",inProgressBg:"#ede9fe",transfer:"#0e7490",transferBg:"#ecfeff"};function F(){["ca-styles","ca-toc-styles"].forEach(s=>{document.getElementById(s)?.remove()}),document.querySelectorAll(".ca-legend,.ca-summary-panel,.ca-badge,.ca-hours-note,#ca-toc,.ca-disclaimer,.ca-transcript-section").forEach(s=>{s.remove()}),document.querySelectorAll('[class*="ca-course-"],[class*="ca-category-"]').forEach(s=>{s.className=s.className.replace(/ca-[\w-]+/g,"").trim(),s.removeAttribute("data-ca-note")})}function se(s,a,u,d){if(typeof d!="function")return;let g=document.createElement("button");g.type="button",g.className="ca-plan-toggle"+(u?" ca-plan-toggle-on":""),g.textContent=u?"Planned":"+ Plan",g.title=u?"Remove planned course":"Mark as planned course",g.addEventListener("click",f=>{f.preventDefault(),f.stopPropagation(),d(a)}),s.appendChild(g)}function Y({results:s,kuSummary:a,transcript:u,plannedCourses:d},g={}){let f=g.onTogglePlanned;F();let p=document.createElement("style");p.id="ca-styles",p.textContent=`
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
  `,document.head.appendChild(p);let x=document.createElement("style");x.id="ca-toc-styles",x.textContent=`
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
  `,document.head.appendChild(x);let m=document.querySelector("div.acalog-core");if(!m)return;let v=document.createElement("div");v.className="ca-legend",v.innerHTML=`
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${c.takenBg};border-color:${c.taken}"></div>Taken</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:linear-gradient(90deg,${c.takenBg} 70%,${c.doubleCountBg});border-color:${c.taken}"></div>Taken (multi-section)</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:#fff7e9;border-color:#d97706"></div>Planned</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${c.doubleCountBg};border-color:${c.doubleCount}"></div>Double-count opportunity</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="border-left:3px solid ${c.opportunity}"></div>Open opportunities</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${c.inProgressBg};border-color:${c.inProgress}"></div>In Progress</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:${c.transferBg};border-color:${c.transfer}"></div>Transfer Credit</div>
    <div class="ca-legend-item"><div class="ca-legend-swatch" style="background:#eee;opacity:0.35"></div>Maxed / satisfied</div>
  `;let l=document.createElement("div");l.className="ca-summary-panel";let i=s.filter(e=>e.status!=="header"&&e.status!=="info-only"),E=i.filter(e=>e.status==="complete"||e.isExempt).length,I=[],$=null;for(let e of s){if(e.status==="header"){$={name:e.section,items:[]},I.push($);continue}$&&e.status!=="info-only"&&$.items.push(e)}function H(e){return e.isExempt?"exempt":e.status==="complete"||e.status==="satisfied"?"complete":e.status==="optional-available"?"optional":"incomplete"}function T(e){return e.isExempt?"Exempt":e.status==="complete"?"\u2713":e.status==="satisfied"?"Min met":e.status==="optional-available"?"Optional":"\u25CB"}let o="";for(let e of I){if(e.items.length===0)continue;let b=e.name==="KNOWLEDGE AND UNDERSTANDING";if(o+=`<div class="ca-summary-section-label">${e.name}</div>`,b){let C=Math.min(100,Math.round(a.totalHours/a.requiredHours*100)),t=a.totalHours>=a.requiredHours?"#4ade80":"#fbbf24",n=a.categoriesUsed>=a.requiredCategories?"#4ade80":"#fbbf24";o+=`<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span>Hours: <strong style="color:${t}">${a.totalHours} / ${a.requiredHours}</strong></span>
        <span>Categories: <strong style="color:${n}">${a.categoriesUsed} / ${a.requiredCategories}</strong></span>
      </div>
      <div class="ca-progress-bar"><div class="ca-progress-fill" style="width:${C}%;background:${t}"></div>
        <div class="ca-progress-label">${C}%</div></div>`;let r="";for(let y of G){let w=a.hoursByCategory[y]||{raw:0,effective:0,max:null},z=w.raw>0?"complete":"incomplete",j=w.max!==null&&w.raw>w.max?`<div class="cap-note">${w.raw}h earned, capped at ${w.max}h</div>`:"",N=q(y);r+=`<a href="#${N}" class="ca-summary-item ${z}" data-slug="${N}">
          <span class="label">${y}</span><br><span class="value">${w.effective} hrs</span>${j}</a>`}o+=`<div class="ca-summary-grid">${r}</div>`}else{let C=e.items.length===4?" ca-summary-grid-4":"",t="";for(let n of e.items){let r=H(n),y=T(n),w=n.slug,z=n.name;t+=`<a href="#${w}" class="ca-summary-item ${r}" data-slug="${w}">
          <span class="label">${z}</span><br><span class="value">${y}</span></a>`}o+=`<div class="ca-summary-grid${C}">${t}</div>`}}l.innerHTML=`
    <h3>\u{1F4CA} Core Opportunities</h3>
    <div style="font-size:13px;margin-bottom:4px">
      <span>Overall: <strong style="color:${E>=i.length?"#4ade80":"#fbbf24"}">${E} / ${i.length}</strong> requirements complete</span>
    </div>
    <div style="font-size:12px;color:#d5dbe5;margin-bottom:2px">Planned courses: <strong>${(d||[]).length}</strong> (do not count toward completed hours until taken)</div>
    ${o}`,l.addEventListener("click",e=>{let b=e.target.closest(".ca-summary-item");b&&(e.preventDefault(),document.getElementById(b.dataset.slug)?.scrollIntoView({behavior:"smooth",block:"start"}))});let P=document.createElement("div");P.className="ca-disclaimer",P.textContent="\u26A0\uFE0F These results are unofficial and for planning purposes only. They may not reflect all institutional policies, transfer credit decisions, or advisor overrides. Always verify your core program status with your academic advisor or the Registrar.",m.parentElement.insertBefore(v,m),m.parentElement.insertBefore(l,m),m.parentElement.insertBefore(P,m);let A=document.createElement("div");A.id="ca-toc";let h=document.createElement("button");h.id="ca-toc-toggle",h.textContent="\u2630",h.title="Table of Contents";let S=document.createElement("div");S.id="ca-toc-panel";let D='<div class="ca-toc-header">\u{1F4D1} Core Program</div>';for(let e of s){if(!e.slug)continue;let b=e.type==="section-header"?"":e.type==="tag"?"ca-toc-tag":"ca-toc-cat",C=e.name||e.section,t="";e.status==="complete"?t='<span class="ca-toc-status ca-toc-status-done">\u2713</span>':e.status==="satisfied"?t='<span class="ca-toc-status ca-toc-status-satisfied">\u25D4</span>':e.status==="incomplete"?t='<span class="ca-toc-status ca-toc-status-needed">\u25CB</span>':e.status==="optional-available"&&(t='<span class="ca-toc-status ca-toc-status-optional">\u25CB</span>'),D+=`<a href="#${e.slug}" class="ca-toc-item ${b}" data-slug="${e.slug}">${C}${t}</a>`}S.innerHTML=D,A.appendChild(h),A.appendChild(S),document.body.appendChild(A);let B=!1;h.addEventListener("click",()=>{B=!B,S.style.display=B?"block":"none",h.textContent=B?"\u2715":"\u2630"}),S.addEventListener("click",e=>{let b=e.target.closest("a");b&&(e.preventDefault(),document.getElementById(b.dataset.slug)?.scrollIntoView({behavior:"smooth",block:"start"}))});let L=new IntersectionObserver(e=>{for(let b of e)if(b.isIntersecting){let C=b.target.id;document.querySelectorAll(".ca-toc-item").forEach(n=>{n.classList.remove("ca-toc-active")});let t=document.querySelector(`.ca-toc-item[data-slug="${C}"]`);t&&(t.classList.add("ca-toc-active"),t.scrollIntoView({block:"nearest",behavior:"smooth"}))}},{rootMargin:"-10% 0px -80% 0px"});s.filter(e=>e.slug).forEach(e=>{let b=document.getElementById(e.slug);b&&L.observe(b)});for(let e of s){if(e.status==="header"||!e.courseAnnotations)continue;let b=e.element,C=b.querySelector("h3")||b.querySelector("h4");if(C){let t=document.createElement("span");t.className="ca-badge",e.isExempt?(t.className+=" ca-badge-exempt",t.textContent="\u2713 EXEMPT"):e.status==="complete"?(t.className+=" ca-badge-complete",t.textContent="\u2713 COMPLETE"):e.status==="satisfied"?(t.className+=" ca-badge-satisfied",t.textContent="MIN MET"):e.status==="optional-available"?(t.className+=" ca-badge-optional",t.textContent="OPTIONAL"):(t.className+=" ca-badge-incomplete",t.textContent=e.reqType==="hour-range"?e.hoursEarned+"/"+(e.minHours||0)+"+ hrs":"AREAS TO EXPLORE"),C.appendChild(t)}if(Array.isArray(e.subDisciplineElements)&&e.subDisciplines)for(let t of e.subDisciplineElements){let n=e.subDisciplines[t.name];if(!n)continue;let r=document.createElement("span");r.className="ca-badge",n.isMaxed?(r.className+=" ca-badge-complete",r.textContent="\u2713 "+n.hoursEarned+"h/"+n.cap+"h"):n.hoursEarned>0?(r.className+=" ca-badge-incomplete",r.textContent=n.hoursEarned+"h/"+n.cap+"h max"):(r.className+=" ca-badge-optional",r.textContent="0h \u2014 up to "+n.cap+"h"),t.element.appendChild(r)}if(e.type==="category"&&e.name==="World Languages I"){let t=document.createElement("span");t.className="ca-hours-note",t.textContent="\u2139\uFE0F World Languages I may already be satisfied through qualifying high school language coursework/exemption. Confirm with your advisor or the Registrar if this applies to you.",b.querySelector("p")?.after(t)}if(e.reqType==="hour-range"&&(e.hoursEarned>0||e.maxPerDiscipline)){let t=document.createElement("span");t.className="ca-hours-note";let n="\u{1F4D0} "+e.hoursEarned+"h earned";if(e.minHours!==null&&(n+=" (need "+e.minHours+"\u2013"+e.maxHours+"h)"),e.maxHours!==null&&e.hoursEarned>e.maxHours&&(n+=" \u26A0\uFE0F over max by "+(e.hoursEarned-e.maxHours)+"h \u2014 only "+e.maxHours+"h count toward K&U total"),Object.keys(e.hoursByDiscipline).length>0){let r=Object.entries(e.hoursByDiscipline).map(([y,w])=>y+": "+w+"h"+(e.maxedDisciplines.has(y)?" \u26A0\uFE0F maxed":"")).join(" \xB7 ");n+=" \u2014 "+r,e.maxPerDiscipline&&(n+=" (max "+e.maxPerDiscipline+"h/discipline)")}t.textContent=n,b.querySelector("p")?.after(t)}e.status==="complete"&&e.type!=="tag"&&b.classList.add("ca-category-complete");for(let t of e.courseAnnotations){if(!t.element)continue;let n=t.element;t.isInProgress?(n.classList.add("ca-course-in-progress"),n.setAttribute("data-ca-note","\u23F3 In Progress ("+t.hours+"h)")):t.isTransfer?(n.classList.add("ca-course-transfer"),n.setAttribute("data-ca-note","\u2713 Transfer ("+t.hours+"h)")):t.isTaken?t.isMultiSection?(n.classList.add("ca-course-taken-multi"),n.setAttribute("data-ca-note","\u2713 "+t.grade+" ("+t.hours+"h) \u21C9 Also: "+t.otherCategories.join(", "))):(n.classList.add("ca-course-taken"),n.setAttribute("data-ca-note","\u2713 "+t.grade+" ("+t.hours+"h)")):t.isPlanned?t.isMultiSection?(n.classList.add("ca-course-planned-multi"),n.setAttribute("data-ca-note","Planned \u21C9 Also: "+t.otherCategories.join(", "))):(n.classList.add("ca-course-planned"),n.setAttribute("data-ca-note","Planned")):e.status==="complete"&&e.type!=="tag"?t.isMultiSection?(n.classList.add("ca-course-double-count"),n.setAttribute("data-ca-note","\u21C9 Also: "+t.otherCategories.join(", "))):n.classList.add("ca-course-maxed"):t.isMaxedDiscipline?n.classList.add("ca-course-maxed"):t.isMultiSection&&!t.isTaken?(n.classList.add("ca-course-double-count"),n.setAttribute("data-ca-note","\u21C9 Also: "+t.otherCategories.join(", "))):e.status!=="complete"?n.classList.add("ca-course-opportunity"):n.classList.add("ca-course-maxed"),!t.isTaken&&!t.isInProgress&&!t.isTransfer&&se(n,t.code,t.isPlanned,f)}}if(u&&u.length>0){let e={};for(let t of s)if(t.courseAnnotations)for(let n of t.courseAnnotations)e[n.code]||(e[n.code]=[]),e[n.code].push(t.name);let b=document.createElement("div");b.className="ca-transcript-section";let C="";for(let t of u){let n=e[t.code]||[],r=n.length>0?`<span class="ca-transcript-cats">${n.join(", ")}</span>`:'<span class="ca-transcript-none">not in core lists</span>',y=t.status==="in-progress"?' <span style="color:'+c.inProgress+'">\u23F3</span>':t.status==="transfer"?' <span style="color:'+c.transfer+'">\u2197</span>':"";C+=`<tr><td><strong>${t.code}</strong>${y}</td><td>${t.title}</td><td>${t.grade||"\u2014"}</td><td>${t.hours}h</td><td>${r}</td></tr>`}b.innerHTML=`<h3>\u{1F4CB} Transcript Reference (${u.length} courses)</h3>
      <table class="ca-transcript-table">
        <thead><tr><th>Code</th><th>Title</th><th>Grade</th><th>Hrs</th><th>Core Categories</th></tr></thead>
        <tbody>${C}</tbody>
      </table>`,m.parentElement.appendChild(b)}}var Z={pathname:"/content.php",catoid:"24",navoid:"780"},k={panel:"ca-launcher-panel",details:"ca-launcher-details",textarea:"ca-transcript-input",pdfInput:"ca-pdf-input",status:"ca-launcher-status",styles:"ca-launcher-styles"},ne="4.9.155",Q=`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${ne}`;async function re(s){let a;a=await import(`${Q}/pdf.min.mjs`),a.GlobalWorkerOptions.workerSrc=`${Q}/pdf.worker.min.mjs`;let u=await s.arrayBuffer(),d=await a.getDocument({data:u}).promise,g=[];for(let f=1;f<=d.numPages;f++){let x=await(await d.getPage(f)).getTextContent(),m=[],v=null;for(let l of x.items)v!==null&&Math.abs(l.transform[5]-v)>2&&m.push(`
`),m.push(l.str),v=l.transform[5];g.push(m.join(""))}return g.join(`
`)}var M=new Set;function ie(){if(document.getElementById(k.styles))return;let s=document.createElement("style");s.id=k.styles,s.textContent=`
    #${k.panel} {
      margin: 16px 0;
      padding: 14px 16px;
      border: 1px solid #cfd8dc;
      border-radius: 10px;
      background: linear-gradient(180deg, #f8fbfc, #eef5f6);
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
      font-family: system-ui, -apple-system, sans-serif;
    }
    #${k.panel} details {
      margin: 0;
    }
    #${k.panel} summary {
      cursor: pointer;
      font-weight: 700;
      color: #163642;
      list-style: none;
    }
    #${k.panel} summary::-webkit-details-marker {
      display: none;
    }
    #${k.panel} summary::before {
      content: '\u25B8';
      display: inline-block;
      margin-right: 8px;
      transition: transform 0.15s ease;
    }
    #${k.panel} details[open] summary::before {
      transform: rotate(90deg);
    }
    #${k.panel} p {
      margin: 10px 0 0;
      color: #35515a;
      line-height: 1.45;
      font-size: 13px;
    }
    #${k.textarea} {
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
    #${k.status} {
      font-size: 12px;
      color: #35515a;
    }
    #${k.status}.ca-status-success {
      color: #2d8a4e;
    }
    #${k.status}.ca-status-error {
      color: #9f2d2d;
    }
  `,document.head.appendChild(s)}function O(s,a){let u=document.getElementById(k.status);u&&(u.textContent=s,u.className="",a==="success"&&u.classList.add("ca-status-success"),a==="error"&&u.classList.add("ca-status-error"))}function ce(){let s=new URL(window.location.href);return s.pathname===Z.pathname&&s.searchParams.get("catoid")===Z.catoid&&s.searchParams.get("navoid")===Z.navoid}function R(s){let a=(s||"").trim();if(a.length===0){O("Paste your Workday Academic History or Academic Progress to see your core opportunities.",null);return}let u=V(a),d,g;if(u==="progress"){let l=_(a);d=l.courses,g=l.overrides}else d=W(a);if(d.length===0){F(),O("Could not parse any courses. Copy from Workday Academic Record (Academic History or Academic Progress) and paste the full content here.","error");return}let f=J(),p=X(f,d,{plannedCourses:Array.from(M),overrides:g}),x=new Set(p.plannedCourses||[]);M.clear();for(let l of x)M.add(l);Y(p,{onTogglePlanned:l=>{M.has(l)?M.delete(l):M.add(l),R(s)}});let m=d.filter(l=>l.status==="in-progress").length,v=["Progress updated: "+d.filter(l=>l.code).length+" courses",p.kuSummary.totalHours+"/"+p.kuSummary.requiredHours+" K&U hours",p.kuSummary.categoriesUsed+"/"+p.kuSummary.requiredCategories+" K&U categories"];m>0&&v.push(m+" in-progress"),M.size>0&&v.push(M.size+" planned"),O(v.join(", ")+".","success"),console.log("[Core Annotator]",d.length,"courses ("+u+"):",d.filter(l=>l.code).map(l=>l.code+"("+l.hours+"h)")),console.log("[Core Annotator] K&U:",p.kuSummary),m>0&&console.log("[Core Annotator] In-progress:",d.filter(l=>l.status==="in-progress").map(l=>l.code)),M.size>0&&console.log("[Core Annotator] Planned:",Array.from(M))}function ee(){if(document.getElementById(k.panel))return;let s=document.querySelector("div.acalog-core");if(!s||!s.parentElement)return;ie();let a=document.createElement("section");a.id=k.panel,a.innerHTML=`
    <details id="${k.details}">
      <summary>Calvin Core Annotator</summary>
      <p>Open Workday, go to Academic Record, open Academic History (or Academic Progress), select all, copy, then paste here \u2014 or load a PDF transcript below.</p>
      <textarea id="${k.textarea}" spellcheck="false" placeholder="Paste Workday Academic History or Academic Progress here"></textarea>
      <input type="file" id="${k.pdfInput}" accept=".pdf" style="display:none">
      <div class="ca-launcher-actions">
        <button type="button" class="ca-launcher-button" data-action="analyze">Show core opportunities</button>
        <button type="button" class="ca-launcher-button ca-launcher-button-secondary" data-action="load-pdf">Load from PDF\u2026</button>
        <button type="button" class="ca-launcher-button ca-launcher-button-secondary" data-action="reset">Reset annotations</button>
        <span id="${k.status}">Paste your Workday Academic History or Academic Progress to see your core opportunities.</span>
      </div>
    </details>`,s.parentElement.insertBefore(a,s);let u=a.querySelector("details"),d=a.querySelector("textarea"),g=a.querySelector(`#${k.pdfInput}`);g.addEventListener("change",async()=>{let f=g.files[0];if(f){g.value="",O("Extracting text from PDF\u2026",null);try{let p=await re(f);d.value=p,R(p),u.open=!1}catch(p){O(`PDF extraction failed: ${p.message}`,"error")}}}),a.addEventListener("click",f=>{let p=f.target.closest("button[data-action]");p&&(p.dataset.action==="analyze"&&R(d.value),p.dataset.action==="load-pdf"&&g.click(),p.dataset.action==="reset"&&(d.value="",M.clear(),F(),O("Annotations cleared.",null),u.open=!1))}),d.addEventListener("paste",f=>{let p=f.clipboardData?.getData("text/plain");if(typeof p=="string"&&p.length>0){f.preventDefault(),d.value=p,R(p),u.open=!1;return}window.setTimeout(()=>{R(d.value),u.open=!1},0)})}function K(){if(console.log("v0.0.3"),!!ce()){if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",ee,{once:!0});return}ee()}}window.CalvinCoreAnnotator={main:K};K();})();
