import { useState, useMemo } from "react";

/* ─── preset project templates ─── */
export const PROJECT_TEMPLATES = [
  { type:"mariage",     label:"Mariage",       icon:"💍", color:"#d4537e", cats:["Salle & lieu","Traiteur","Fleurs & déco","Photographe","Tenues","Musique","Invitations","Divers"] },
  { type:"voyage",      label:"Voyage",        icon:"✈️", color:"#328cf0", cats:["Vols","Hôtel","Activités","Restaurants","Transport local","Shopping","Assurance","Divers"] },
  { type:"anniversaire",label:"Anniversaire",  icon:"🎂", color:"#f0a028", cats:["Lieu","Traiteur","Décoration","Cadeaux","Animation","Invitations","Divers"] },
  { type:"renovation",  label:"Rénovation",    icon:"🏗️", color:"#50b450", cats:["Matériaux","Main d'œuvre","Mobilier","Électroménager","Déco","Imprévus"] },
  { type:"naissance",   label:"Naissance",     icon:"👶", color:"#c850a0", cats:["Chambre bébé","Poussette","Vêtements","Santé","Alimentation","Divers"] },
  { type:"custom",      label:"Projet libre",  icon:"⭐", color:"#6450dc", cats:["Catégorie 1","Catégorie 2","Divers"] },
];

const FONT = "'DM Sans',-apple-system,'Helvetica Neue',Helvetica,sans-serif";
const f  = n => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Math.round(n||0));
const today = new Date();

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const diff = Math.ceil((d - today) / (1000*60*60*24));
  return diff;
}

/* ─── sub-components (receive theme as prop) ─── */
function PModal({title, onClose, children, theme}) {
  const isDark = theme.mode === "dark";
  return (
    <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"rgba(0,0,0,0.2)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:390,background:isDark?"rgba(20,20,32,0.97)":"rgba(255,255,255,0.95)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",borderRadius:"28px 28px 0 0",padding:`0 20px calc(env(safe-area-inset-bottom,16px) + 32px)`,borderTop:`0.5px solid ${theme.cardBorder}`,boxShadow:"0 -8px 40px rgba(0,0,0,0.15)",maxHeight:"92dvh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{width:36,height:4,background:"rgba(128,128,128,0.25)",borderRadius:2,margin:"10px auto 22px"}}/>
        <div style={{fontSize:18,fontWeight:600,letterSpacing:"-0.02em",color:theme.text,marginBottom:18}}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function PI({placeholder,type="text",value,onChange,autoFocus,theme}) {
  const isDark = theme.mode==="dark";
  return <input type={type} placeholder={placeholder} value={value} onChange={onChange} autoFocus={autoFocus}
    style={{width:"100%",background:isDark?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.6)",border:`0.5px solid ${isDark?"rgba(255,255,255,0.12)":"rgba(200,200,220,0.6)"}`,borderRadius:14,padding:"13px 16px",fontSize:16,fontWeight:400,letterSpacing:"-0.01em",color:theme.text,outline:"none",fontFamily:FONT,marginBottom:10}}/>;
}

function PBtn({children,onClick,color="#6450dc",style={}}) {
  return <button onClick={onClick} style={{width:"100%",height:52,border:"none",borderRadius:16,background:`linear-gradient(135deg,${color},${color}bb)`,color:"#fff",fontSize:15,fontWeight:600,letterSpacing:"-0.01em",cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 6px 20px ${color}44,inset 0 1px 0 rgba(255,255,255,0.2)`,...style}}>{children}</button>;
}

function PDelBtn({children,onClick}) {
  return <button onClick={onClick} style={{width:"100%",height:44,border:"0.5px solid rgba(192,57,43,0.25)",borderRadius:14,background:"rgba(192,57,43,0.07)",color:"#c0392b",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:FONT,marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{children}</button>;
}

function GlassCard({theme,s={},children,onClick}) {
  const isDark=theme.mode==="dark";
  return (
    <div onClick={onClick} style={{background:isDark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.42)",backdropFilter:"blur(28px) saturate(200%)",WebkitBackdropFilter:"blur(28px) saturate(200%)",border:`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.75)"}`,boxShadow:isDark?"0 1px 0 rgba(255,255,255,0.1) inset,0 8px 32px rgba(0,0,0,0.22)":"0 1px 0 rgba(255,255,255,0.9) inset,0 8px 32px rgba(0,0,0,0.07)",borderRadius:22,position:"relative",overflow:"hidden",cursor:onClick?"pointer":"default",...s}}>
      <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,rgba(255,255,255,${isDark?0.06:0.16}) 0%,transparent 60%)`,pointerEvents:"none",borderRadius:"inherit"}}/>
      <div style={{position:"relative",zIndex:1}}>{children}</div>
    </div>
  );
}

/* ════════════════════════════════════════
   PROJECTS MAIN COMPONENT
════════════════════════════════════════ */
export default function Projects({ theme, projects, setProjects, showToast = () => {} }) {
  const isDark = theme.mode==="dark";
  const t = theme;

  const [view, setView]     = useState("list"); // "list" | "detail" | "new"
  const [activeId, setActiveId] = useState(null);
  const [mNewExp,  setMNewExp]  = useState(false);
  const [mNewCat,  setMNewCat]  = useState(false);
  const [mEditExp, setMEditExp] = useState(null);
  const [mEditProj,setMEditProj]= useState(false);
  const [showArchived, setShowArchived] = useState(false);

  /* new project form */
  const [step,     setStep]     = useState(1); // 1=template 2=details
  const [fType,    setFType]    = useState(PROJECT_TEMPLATES[0].type);
  const [fName,    setFName]    = useState("");
  const [fIcon,    setFIcon]    = useState(PROJECT_TEMPLATES[0].icon);
  const [fColor,   setFColor]   = useState(PROJECT_TEMPLATES[0].color);
  const [fBudget,  setFBudget]  = useState("");
  const [fDate,    setFDate]    = useState("");
  const [fEditName,setFEditName]= useState("");
  const [fEditBudget,setFEditBudget]=useState("");
  const [fEditDate,setFEditDate]=useState("");

  /* new expense form */
  const [fECat,  setFECat]  = useState("");
  const [fEAmt,  setFEAmt]  = useState("");
  const [fENote, setFENote] = useState("");

  /* new category form */
  const [fCatName, setFCatName] = useState("");

  const activeProject = projects.find(p => p.id === activeId);

  /* note suggestions for current project, scoped per category */
  const projSuggestions=useMemo(()=>{
    if(!activeProject)return {};
    const byCat={};
    for(const e of activeProject.expenses||[]){
      if(!e||!e.note)continue;
      const k=e.catId||"_";
      const lbl=String(e.note).trim();
      if(!lbl)continue;
      if(!byCat[k])byCat[k]={};
      if(!byCat[k][lbl])byCat[k][lbl]={count:0,latest:0};
      byCat[k][lbl].count++;
      if((e.id||0)>byCat[k][lbl].latest)byCat[k][lbl].latest=e.id||0;
    }
    const out={};
    Object.keys(byCat).forEach(k=>{
      out[k]=Object.entries(byCat[k]).map(([label,v])=>({label,count:v.count,latest:v.latest})).sort((a,b)=>b.count-a.count||b.latest-a.latest);
    });
    return out;
  },[activeProject]);
  const projCurrentSuggestions=(projSuggestions[fECat]||[]).slice(0,6);
  const projFilteredSuggestions=fENote&&fENote.trim().length>=1
    ? projCurrentSuggestions.filter(s=>s.label.toLowerCase().includes(fENote.trim().toLowerCase())&&s.label.toLowerCase()!==fENote.trim().toLowerCase())
    : projCurrentSuggestions;

  /* ── project CRUD ── */
  function createProject() {
    if (!fName || !fBudget) return;
    const tmpl = PROJECT_TEMPLATES.find(t=>t.type===fType) || PROJECT_TEMPLATES[0];
    const proj = {
      id: Date.now(),
      name: fName, icon: fIcon, color: fColor,
      budget: parseFloat(fBudget),
      targetDate: fDate || null,
      status: "active",
      cats: tmpl.cats.map((label,i)=>({id:`c${i}`,label})),
      expenses: [],
      createdAt: new Date().toISOString(),
    };
    setProjects(p=>[...p, proj]);
    setFName(""); setFBudget(""); setFDate(""); setStep(1);
    setView("list");
    showToast("Projet créé");
  }

  function saveEditProject() {
    setProjects(p=>p.map(proj=>proj.id===activeId
      ?{...proj,name:fEditName,budget:parseFloat(fEditBudget)||proj.budget,targetDate:fEditDate||null}
      :proj));
    setMEditProj(false);
    showToast("Projet mis à jour");
  }

  function archiveProject(id) {
    const proj = projects.find(p=>p.id===id);
    setProjects(p=>p.map(proj=>proj.id===id?{...proj,status:proj.status==="archived"?"active":"archived"}:proj));
    setView("list");
    showToast(proj?.status==="archived"?"Projet restauré":"Projet archivé");
  }

  function deleteProject(id) {
    setProjects(p=>p.filter(proj=>proj.id!==id));
    setView("list");
    showToast("Projet supprimé");
  }

  /* ── expense CRUD ── */
  function addExpense() {
    if (!fEAmt) return;
    const proj = projects.find(p => p.id === activeId);
    const catId = fECat || proj?.cats[0]?.id;
    if (!catId) return;
    const exp = {id:Date.now(), catId, amount:parseFloat(fEAmt), note:fENote, date:new Date().toLocaleDateString("fr-FR")};
    setProjects(p=>p.map(p2=>p2.id===activeId?{...p2,expenses:[...p2.expenses,exp]}:p2));
    setFEAmt(""); setFENote(""); setMNewExp(false);
    showToast("Dépense enregistrée");
  }

  function saveEditExpense() {
    if (!fEAmt) return;
    setProjects(p=>p.map(proj=>proj.id===activeId?{...proj,expenses:proj.expenses.map(e=>e.id===mEditExp.id?{...e,catId:fECat||e.catId,amount:parseFloat(fEAmt),note:fENote}:e)}:proj));
    setMEditExp(null);
    showToast("Modifications enregistrées");
  }

  function deleteExpense(id) {
    setProjects(p=>p.map(proj=>proj.id===activeId?{...proj,expenses:proj.expenses.filter(e=>e.id!==id)}:proj));
    setMEditExp(null);
    showToast("Supprimé");
  }

  /* ── category CRUD ── */
  function addCategory() {
    if (!fCatName) return;
    const cat = {id:`c${Date.now()}`,label:fCatName};
    setProjects(p=>p.map(proj=>proj.id===activeId?{...proj,cats:[...proj.cats,cat]}:proj));
    setFCatName(""); setMNewCat(false);
    showToast("Catégorie ajoutée");
  }

  function deleteCategory(catId) {
    setProjects(p=>p.map(proj=>proj.id===activeId?{...proj,cats:proj.cats.filter(c=>c.id!==catId),expenses:proj.expenses.filter(e=>e.catId!==catId)}:proj));
    showToast("Catégorie supprimée");
  }

  /* ── shared styles ── */
  const eb = {fontSize:11,fontWeight:500,letterSpacing:"0.06em",color:t.hint,textTransform:"uppercase",marginBottom:6};
  const sh = {fontSize:11,fontWeight:500,letterSpacing:"0.07em",color:t.hint,textTransform:"uppercase",padding:"20px 20px 10px"};
  const rowSep = {display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`0.5px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"}`,cursor:"pointer"};

  /* ════════ LIST VIEW ════════ */
  if (view === "list") {
    const active  = projects.filter(p=>p.status==="active");
    const archived= projects.filter(p=>p.status==="archived");

    return (<>
      <GlassCard theme={t} s={{margin:"14px 16px 0",padding:"22px 22px 20px"}}>
        <p style={eb}>Projets spéciaux</p>
        <p style={{fontSize:40,fontWeight:200,letterSpacing:"-0.03em",lineHeight:1,color:t.text}}>{active.length}</p>
        <p style={{fontSize:13,color:t.sub,marginTop:8,letterSpacing:"-0.01em"}}>
          projet{active.length!==1?"s":""} en cours{archived.length>0?` · ${archived.length} archivé${archived.length!==1?"s":""}`:""}
        </p>
      </GlassCard>

      <div style={{margin:"12px 16px 0"}}>
        <PBtn onClick={()=>{setStep(1);setView("new");}} color={t.accent}>＋ Nouveau projet</PBtn>
      </div>

      {active.length > 0 && <>
        <p style={sh}>En cours</p>
        <div style={{display:"flex",flexDirection:"column",gap:10,margin:"0 16px"}}>
          {active.map(proj => <ProjectCard key={proj.id} proj={proj} theme={t} onOpen={()=>{setActiveId(proj.id);setView("detail");}}/>)}
        </div>
      </>}

      {archived.length > 0 && <>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 20px 10px"}}>
          <p style={{...sh,padding:0}}>Archivés</p>
          <button onClick={()=>setShowArchived(v=>!v)} style={{background:"none",border:"none",fontSize:12,color:t.hint,cursor:"pointer",fontFamily:FONT,letterSpacing:"-0.01em"}}>{showArchived?"Masquer":"Afficher"}</button>
        </div>
        {showArchived && (
          <div style={{display:"flex",flexDirection:"column",gap:10,margin:"0 16px"}}>
            {archived.map(proj => <ProjectCard key={proj.id} proj={proj} theme={t} onOpen={()=>{setActiveId(proj.id);setView("detail");}} archived/>)}
          </div>
        )}
      </>}

      {projects.length === 0 && (
        <div style={{textAlign:"center",padding:"48px 24px"}}>
          <p style={{fontSize:40,marginBottom:12}}>✨</p>
          <p style={{fontSize:16,fontWeight:400,color:t.text,letterSpacing:"-0.02em",marginBottom:6}}>Aucun projet pour l'instant</p>
          <p style={{fontSize:13,color:t.hint,letterSpacing:"-0.01em",lineHeight:1.5}}>Crée un projet spécial pour gérer un budget dédié — mariage, voyage, renovation…</p>
        </div>
      )}
      <div style={{height:16}}/>
    </>);
  }

  /* ════════ NEW PROJECT WIZARD ════════ */
  if (view === "new") {
    return (<>
      {/* back */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 20px 0"}}>
        <button onClick={()=>setView("list")} style={{background:"none",border:"none",fontSize:15,color:t.accent,cursor:"pointer",fontFamily:FONT,letterSpacing:"-0.01em",display:"flex",alignItems:"center",gap:4}}>‹ Retour</button>
      </div>

      {step === 1 && <>
        <GlassCard theme={t} s={{margin:"14px 16px 0",padding:"22px 22px 16px"}}>
          <p style={eb}>Étape 1 / 2</p>
          <p style={{fontSize:26,fontWeight:300,letterSpacing:"-0.03em",color:t.text}}>Quel type de projet ?</p>
        </GlassCard>
        <p style={sh}>Choisir un modèle</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"0 16px"}}>
          {PROJECT_TEMPLATES.map(tmpl=>{
            const sel = fType===tmpl.type;
            return (
              <GlassCard key={tmpl.type} theme={t} s={{padding:"16px",border:sel?`2px solid ${tmpl.color}`:`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.72)"}`,transform:sel?"scale(1.02)":"scale(1)",transition:"all 0.18s"}}
                onClick={()=>{setFType(tmpl.type);setFIcon(tmpl.icon);setFColor(tmpl.color);setFName(tmpl.label);}}>
                <div style={{fontSize:28,marginBottom:8}}>{tmpl.icon}</div>
                <p style={{fontSize:14,fontWeight:500,color:t.text,letterSpacing:"-0.01em"}}>{tmpl.label}</p>
                <p style={{fontSize:11,color:t.hint,marginTop:3,letterSpacing:"-0.01em"}}>{tmpl.cats.length} catégories</p>
                {sel && <div style={{width:"100%",height:2,borderRadius:1,background:tmpl.color,marginTop:8}}/>}
              </GlassCard>
            );
          })}
        </div>
        <div style={{margin:"16px 16px 0"}}>
          <PBtn onClick={()=>setStep(2)} color={fColor}>Continuer →</PBtn>
        </div>
        <div style={{height:16}}/>
      </>}

      {step === 2 && <>
        <GlassCard theme={t} s={{margin:"14px 16px 0",padding:"22px 22px 16px"}}>
          <p style={eb}>Étape 2 / 2</p>
          <p style={{fontSize:26,fontWeight:300,letterSpacing:"-0.03em",color:t.text}}>Les détails</p>
        </GlassCard>
        <div style={{margin:"12px 16px 0",display:"flex",flexDirection:"column",gap:0}}>
          <p style={{fontSize:12,fontWeight:500,color:t.hint,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8,marginTop:8}}>Nom du projet</p>
          <PI placeholder="Ex : Notre mariage, Voyage Japon…" value={fName} onChange={e=>setFName(e.target.value)} autoFocus theme={t}/>
          <p style={{fontSize:12,fontWeight:500,color:t.hint,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8,marginTop:6}}>Budget total</p>
          <PI placeholder="Ex : 12 000" type="number" value={fBudget} onChange={e=>setFBudget(e.target.value)} theme={t}/>
          <p style={{fontSize:12,fontWeight:500,color:t.hint,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8,marginTop:6}}>Date cible (optionnel)</p>
          <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)}
            style={{width:"100%",background:isDark?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.6)",border:`0.5px solid ${isDark?"rgba(255,255,255,0.12)":"rgba(200,200,220,0.6)"}`,borderRadius:14,padding:"13px 16px",fontSize:16,color:t.text,outline:"none",fontFamily:FONT,marginBottom:10,colorScheme:isDark?"dark":"light"}}/>
          <div style={{display:"flex",gap:8,marginTop:6}}>
            <button onClick={()=>setStep(1)} style={{flex:1,height:52,border:`0.5px solid ${isDark?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.12)"}`,borderRadius:16,background:"transparent",color:t.sub,fontSize:15,fontWeight:500,cursor:"pointer",fontFamily:FONT,letterSpacing:"-0.01em"}}>← Retour</button>
            <div style={{flex:2}}><PBtn onClick={createProject} color={fColor}>Créer le projet</PBtn></div>
          </div>
        </div>
        <div style={{height:16}}/>
      </>}
    </>);
  }

  /* ════════ DETAIL VIEW ════════ */
  if (view === "detail" && activeProject) {
    const proj = activeProject;
    const totalSpent = proj.expenses.reduce((s,e)=>s+e.amount,0);
    const remaining  = proj.budget - totalSpent;
    const pct        = proj.budget>0 ? Math.min(100,Math.round(totalSpent/proj.budget*100)) : 0;
    const days       = daysUntil(proj.targetDate);
    const perDay     = days!=null&&days>0 ? remaining/days : null;
    const over       = totalSpent > proj.budget;

    const spentByCat = id => proj.expenses.filter(e=>e.catId===id).reduce((s,e)=>s+e.amount,0);

    return (<>
      {/* header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px 0"}}>
        <button onClick={()=>setView("list")} style={{background:"none",border:"none",fontSize:15,color:t.accent,cursor:"pointer",fontFamily:FONT,letterSpacing:"-0.01em",display:"flex",alignItems:"center",gap:4}}>‹ Projets</button>
        <button onClick={()=>{setFEditName(proj.name);setFEditBudget(String(proj.budget));setFEditDate(proj.targetDate||"");setMEditProj(true);}} style={{background:"none",border:"none",fontSize:13,color:t.hint,cursor:"pointer",fontFamily:FONT,letterSpacing:"-0.01em"}}>✎ Modifier</button>
      </div>

      {/* hero */}
      <GlassCard theme={t} s={{margin:"14px 16px 0",padding:"22px 22px 20px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:48,height:48,borderRadius:14,background:`${proj.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{proj.icon}</div>
            <div>
              <p style={{fontSize:20,fontWeight:500,color:t.text,letterSpacing:"-0.03em"}}>{proj.name}</p>
              {proj.targetDate && <p style={{fontSize:12,color:t.hint,marginTop:2,letterSpacing:"-0.01em"}}>
                {days!=null&&days>0?`Dans ${days} jour${days!==1?"s":""}`:days===0?"Aujourd'hui !":days!=null?"Passé":`Objectif : ${new Date(proj.targetDate).toLocaleDateString("fr-FR")}`}
              </p>}
            </div>
          </div>
          <span style={{fontSize:11,fontWeight:500,padding:"3px 10px",borderRadius:20,background:proj.status==="archived"?"rgba(128,128,128,0.12)":`${proj.color}18`,color:proj.status==="archived"?t.hint:proj.color,letterSpacing:"-0.01em"}}>
            {proj.status==="archived"?"Archivé":"En cours"}
          </span>
        </div>
        <p style={eb}>Dépensé</p>
        <p style={{fontSize:48,fontWeight:200,letterSpacing:"-0.03em",lineHeight:1,color:over?"#c0392b":t.text}}>{f(totalSpent)}</p>
        <p style={{fontSize:13,color:t.sub,marginTop:6,letterSpacing:"-0.01em"}}>sur {f(proj.budget)} · {pct}% utilisé</p>
        <div style={{height:4,background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)",borderRadius:2,marginTop:14,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:2,background:over?`linear-gradient(90deg,#c0392b,#e74c3c)`:`linear-gradient(90deg,${proj.color},${proj.color}aa)`,width:`${pct}%`,transition:"width 0.8s cubic-bezier(.4,0,.2,1)"}}/>
        </div>
      </GlassCard>

      {/* kpis */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"10px 16px 0"}}>
        {[
          [f(remaining), "Restant", over?"#c0392b":"#1a8a5e"],
          [proj.expenses.length+" op.", "Dépenses", t.text],
          [perDay!=null?f(perDay):"—", "/ jour", perDay!=null&&perDay<0?"#c0392b":"#1a6aaa"],
          [days!=null?`${Math.max(0,days)}j`:"—", "Jours restants", "#1a6aaa"],
        ].map(([v,l,c])=>(
          <GlassCard key={l} theme={t} s={{padding:16}}>
            <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.06em",color:t.hint,textTransform:"uppercase",marginBottom:5}}>{l}</p>
            <p style={{fontSize:22,fontWeight:200,letterSpacing:"-0.02em",color:c}}>{v}</p>
          </GlassCard>
        ))}
      </div>

      {/* add expense */}
      <div style={{margin:"12px 16px 0"}}>
        <PBtn onClick={()=>{setFECat(proj.cats[0]?.id||"");setFEAmt("");setFENote("");setMNewExp(true);}} color={proj.color}>＋ Ajouter une dépense</PBtn>
      </div>

      {/* categories with spend */}
      <p style={sh}>Répartition</p>
      <GlassCard theme={t} s={{margin:"0 16px",padding:"8px 16px"}}>
        {proj.cats.map(cat=>{
          const sp=spentByCat(cat.id), pctC=proj.budget>0?Math.min(100,Math.round(sp/proj.budget*100)):0;
          return (
            <div key={cat.id} style={rowSep} onClick={()=>{setFECat(cat.id);setFEAmt("");setFENote("");setMNewExp(true);}}>
              <div style={{width:36,height:36,borderRadius:10,background:`${proj.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:proj.color,flexShrink:0,letterSpacing:"-0.01em"}}>
                {cat.label.substring(0,2)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:400,color:t.text,letterSpacing:"-0.01em"}}>{cat.label}</div>
                <div style={{height:2.5,background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)",borderRadius:2,marginTop:5,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:2,background:proj.color,width:`${pctC}%`,transition:"width 0.7s"}}/>
                </div>
              </div>
              <div style={{fontSize:15,fontWeight:300,color:sp>0?t.text:t.hint,letterSpacing:"-0.01em",minWidth:54,textAlign:"right"}}>{f(sp)}</div>
            </div>
          );
        })}
        <div style={{marginTop:8}}>
          <button onClick={()=>{setFCatName("");setMNewCat(true);}} style={{width:"100%",height:40,background:"none",border:`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"}`,borderRadius:12,color:t.hint,fontSize:13,cursor:"pointer",fontFamily:FONT,letterSpacing:"-0.01em"}}>＋ Ajouter une catégorie</button>
        </div>
      </GlassCard>

      {/* expense history */}
      {proj.expenses.length > 0 && <>
        <p style={sh}>Historique ({proj.expenses.length})</p>
        <GlassCard theme={t} s={{margin:"0 16px",padding:"8px 16px"}}>
          {[...proj.expenses].reverse().map(e=>{
            const cat=proj.cats.find(c=>c.id===e.catId);
            return (
              <div key={e.id} style={rowSep} onClick={()=>{setFECat(e.catId);setFEAmt(String(e.amount));setFENote(e.note||"");setMEditExp(e);}}>
                <div style={{width:36,height:36,borderRadius:10,background:`${proj.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:proj.color,flexShrink:0,letterSpacing:"-0.01em"}}>
                  {(cat?.label||"?").substring(0,2)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:400,color:t.text,letterSpacing:"-0.01em"}}>{e.note||(cat?.label||"Dépense")}</div>
                  <div style={{fontSize:11,color:t.hint,marginTop:3,letterSpacing:"-0.01em"}}>{cat?.label||""} · {e.date}</div>
                </div>
                <div style={{fontSize:15,fontWeight:300,color:"#c0392b",letterSpacing:"-0.01em"}}>−{f(e.amount)}</div>
                <div style={{fontSize:12,color:t.hint,paddingLeft:4}}>✎</div>
              </div>
            );
          })}
        </GlassCard>
      </>}

      {/* danger zone */}
      <p style={sh}>Gérer le projet</p>
      <GlassCard theme={t} s={{margin:"0 16px",padding:"12px 16px"}}>
        <button onClick={()=>archiveProject(proj.id)} style={{width:"100%",height:44,background:"none",border:`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"}`,borderRadius:12,color:t.sub,fontSize:14,cursor:"pointer",fontFamily:FONT,letterSpacing:"-0.01em",marginBottom:8}}>
          {proj.status==="archived"?"♻ Restaurer le projet":"📦 Archiver le projet"}
        </button>
        <PDelBtn onClick={()=>deleteProject(proj.id)}>Supprimer définitivement</PDelBtn>
      </GlassCard>
      <div style={{height:16}}/>

      {/* ── modals ── */}
      {mNewExp && (
        <PModal title={`Dépense · ${proj.name}`} onClose={()=>setMNewExp(false)} theme={t}>
          <p style={{fontSize:12,fontWeight:500,color:t.hint,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8}}>Catégorie</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
            {proj.cats.map(c=>{const s=fECat===c.id;return(<div key={c.id} onClick={()=>setFECat(c.id)} style={{padding:"8px 12px",borderRadius:20,fontSize:13,fontWeight:500,cursor:"pointer",transition:"all 0.18s",border:s?"none":`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)"}`,background:s?proj.color:isDark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.5)",color:s?"#fff":t.sub,letterSpacing:"-0.01em"}}>{c.label}</div>);})}
          </div>
          <PI placeholder="Montant en €" type="number" value={fEAmt} onChange={e=>setFEAmt(e.target.value)} autoFocus theme={t}/>
          <PI placeholder="Libellé · ex : Robe, Vol Tokyo…" value={fENote} onChange={e=>setFENote(e.target.value)} theme={t}/>
          {projFilteredSuggestions.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:-2,marginBottom:12}}>
            {projFilteredSuggestions.map(s=>(
              <div key={s.label} onClick={()=>setFENote(s.label)} style={{padding:"6px 11px",borderRadius:14,fontSize:12,fontWeight:500,cursor:"pointer",background:isDark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.55)",border:`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.06)"}`,color:t.sub,letterSpacing:"-0.01em"}}>
                {s.label}{s.count>1&&<span style={{color:t.hint,marginLeft:5,fontSize:10}}>×{s.count}</span>}
              </div>
            ))}
          </div>}
          <PBtn onClick={addExpense} color={proj.color}>Enregistrer</PBtn>
        </PModal>
      )}

      {mEditExp && (
        <PModal title="Modifier la dépense" onClose={()=>setMEditExp(null)} theme={t}>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
            {proj.cats.map(c=>{const s=fECat===c.id;return(<div key={c.id} onClick={()=>setFECat(c.id)} style={{padding:"8px 12px",borderRadius:20,fontSize:13,fontWeight:500,cursor:"pointer",border:s?"none":`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)"}`,background:s?proj.color:isDark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.5)",color:s?"#fff":t.sub,letterSpacing:"-0.01em"}}>{c.label}</div>);})}
          </div>
          <PI placeholder="Montant en €" type="number" value={fEAmt} onChange={e=>setFEAmt(e.target.value)} autoFocus theme={t}/>
          <PI placeholder="Libellé" value={fENote} onChange={e=>setFENote(e.target.value)} theme={t}/>
          {projFilteredSuggestions.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:-2,marginBottom:12}}>
            {projFilteredSuggestions.map(s=>(
              <div key={s.label} onClick={()=>setFENote(s.label)} style={{padding:"6px 11px",borderRadius:14,fontSize:12,fontWeight:500,cursor:"pointer",background:isDark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.55)",border:`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.06)"}`,color:t.sub,letterSpacing:"-0.01em"}}>
                {s.label}{s.count>1&&<span style={{color:t.hint,marginLeft:5,fontSize:10}}>×{s.count}</span>}
              </div>
            ))}
          </div>}
          <PBtn onClick={saveEditExpense} color={proj.color}>Enregistrer</PBtn>
          <PDelBtn onClick={()=>deleteExpense(mEditExp.id)}>Supprimer</PDelBtn>
        </PModal>
      )}

      {mNewCat && (
        <PModal title="Nouvelle catégorie" onClose={()=>setMNewCat(false)} theme={t}>
          <PI placeholder="Nom de la catégorie" value={fCatName} onChange={e=>setFCatName(e.target.value)} autoFocus theme={t}/>
          <PBtn onClick={addCategory} color={proj.color}>Enregistrer</PBtn>
        </PModal>
      )}

      {mEditProj && (
        <PModal title="Modifier le projet" onClose={()=>setMEditProj(false)} theme={t}>
          <p style={{fontSize:12,fontWeight:500,color:t.hint,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8}}>Nom</p>
          <PI placeholder="Nom du projet" value={fEditName} onChange={e=>setFEditName(e.target.value)} autoFocus theme={t}/>
          <p style={{fontSize:12,fontWeight:500,color:t.hint,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8}}>Budget total</p>
          <PI placeholder="Budget en €" type="number" value={fEditBudget} onChange={e=>setFEditBudget(e.target.value)} theme={t}/>
          <p style={{fontSize:12,fontWeight:500,color:t.hint,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:8}}>Date cible</p>
          <input type="date" value={fEditDate} onChange={e=>setFEditDate(e.target.value)}
            style={{width:"100%",background:isDark?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.6)",border:`0.5px solid ${isDark?"rgba(255,255,255,0.12)":"rgba(200,200,220,0.6)"}`,borderRadius:14,padding:"13px 16px",fontSize:16,color:t.text,outline:"none",fontFamily:FONT,marginBottom:10,colorScheme:isDark?"dark":"light"}}/>
          <PBtn onClick={saveEditProject} color={proj.color}>Enregistrer</PBtn>
        </PModal>
      )}

      {/* manage categories modal — accessible via long press area */}
    </>);
  }

  return null;
}

/* ── Project card for list view ── */
function ProjectCard({ proj, theme, onOpen, archived }) {
  const isDark = theme.mode==="dark";
  const totalSpent = proj.expenses.reduce((s,e)=>s+e.amount,0);
  const remaining  = proj.budget - totalSpent;
  const pct        = proj.budget>0 ? Math.min(100,Math.round(totalSpent/proj.budget*100)) : 0;
  const days       = daysUntil(proj.targetDate);
  const over       = totalSpent > proj.budget;
  const f  = n => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Math.round(n||0));

  return (
    <div onClick={onOpen} style={{background:isDark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.42)",backdropFilter:"blur(28px) saturate(200%)",WebkitBackdropFilter:"blur(28px) saturate(200%)",border:`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.72)"}`,borderLeft:`3px solid ${archived?"rgba(128,128,128,0.4)":proj.color}`,boxShadow:"0 4px 20px rgba(0,0,0,0.07)",borderRadius:22,padding:"18px 18px 16px",cursor:"pointer",opacity:archived?0.65:1,transition:"transform 0.15s",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,rgba(255,255,255,${isDark?0.05:0.14}) 0%,transparent 60%)`,pointerEvents:"none",borderRadius:"inherit"}}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:12,background:`${proj.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{proj.icon}</div>
            <div>
              <p style={{fontSize:15,fontWeight:500,color:theme.text,letterSpacing:"-0.02em"}}>{proj.name}</p>
              <p style={{fontSize:11,color:theme.hint,marginTop:1,letterSpacing:"-0.01em"}}>
                {archived?"Archivé":days!=null&&days>0?`${days}j restants`:days===0?"Aujourd'hui !":proj.targetDate?"Passé":"Sans date"}
              </p>
            </div>
          </div>
          <span style={{fontSize:11,fontWeight:500,padding:"3px 9px",borderRadius:20,background:archived?"rgba(128,128,128,0.1)":`${proj.color}18`,color:archived?theme.hint:proj.color,letterSpacing:"-0.01em",flexShrink:0}}>
            {archived?"Archivé":over?"Dépassé":pct>=100?"Complet":"En cours"}
          </span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
          <span style={{fontSize:24,fontWeight:200,letterSpacing:"-0.03em",color:over?"#c0392b":theme.text}}>{f(totalSpent)}</span>
          <span style={{fontSize:13,color:theme.hint,letterSpacing:"-0.01em"}}>sur {f(proj.budget)}</span>
        </div>
        <div style={{height:3,background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)",borderRadius:2,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:2,background:over?`linear-gradient(90deg,#c0392b,#e74c3c)`:`linear-gradient(90deg,${proj.color},${proj.color}99)`,width:`${pct}%`,transition:"width 0.8s cubic-bezier(.4,0,.2,1)"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
          <span style={{fontSize:11,color:theme.hint,letterSpacing:"-0.01em"}}>{pct}% utilisé</span>
          <span style={{fontSize:11,color:over?"#c0392b":"#1a8a5e",letterSpacing:"-0.01em"}}>{over?"-":"+"}reste {f(Math.abs(remaining))}</span>
        </div>
      </div>
    </div>
  );
}
