import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip } from "chart.js";
import { THEMES, DEFAULT_THEME_ID } from "./themes";
import Projects from "./Projects";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip);

/* ─── constants ─── */
const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MOS    = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const FONT   = "'DM Sans',-apple-system,'Helvetica Neue',Helvetica,sans-serif";
const PRESET_ICONS  = ["🏠","🛒","🚗","❤️","✨","💎","🏥","🎓","🐾","🍽️","✈️","🎬","👗","🏋️","💻","🎮","📚","🌿","🛋️","🎁"];
const PRESET_COLORS = [
  {bg:"rgba(100,80,220,0.14)",bar:"#6450dc"},{bg:"rgba(220,80,80,0.12)",bar:"#dc5050"},
  {bg:"rgba(50,140,240,0.13)",bar:"#328cf0"},{bg:"rgba(40,180,120,0.13)",bar:"#28b478"},
  {bg:"rgba(240,160,40,0.13)",bar:"#f0a028"},{bg:"rgba(60,160,220,0.13)",bar:"#3ca0dc"},
  {bg:"rgba(200,80,160,0.13)",bar:"#c850a0"},{bg:"rgba(80,180,80,0.13)",bar:"#50b450"},
];
const DEFAULT_CATS = [
  {id:"logement",  label:"Logement",     icon:"🏠",bg:"rgba(100,80,220,0.14)",bar:"#6450dc"},
  {id:"alim",      label:"Alimentation", icon:"🛒",bg:"rgba(220,80,80,0.12)", bar:"#dc5050"},
  {id:"transport", label:"Transport",    icon:"🚗",bg:"rgba(50,140,240,0.13)",bar:"#328cf0"},
  {id:"sante",     label:"Santé",        icon:"❤️",bg:"rgba(40,180,120,0.13)",bar:"#28b478"},
  {id:"loisirs",   label:"Loisirs",      icon:"✨",bg:"rgba(240,160,40,0.13)",bar:"#f0a028"},
  {id:"epargne",   label:"Épargne",      icon:"💎",bg:"rgba(60,160,220,0.13)",bar:"#3ca0dc"},
];

/* ─── helpers ─── */
const f  = n=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Math.round(n||0));
const f2 = n=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2}).format(n||0);
function useLS(key,init){const[v,sv]=useState(()=>{try{const s=localStorage.getItem(key);return s?JSON.parse(s):init;}catch{return init;}});useEffect(()=>{localStorage.setItem(key,JSON.stringify(v));},[key,v]);return[v,sv];}
const today=new Date();
const daysInMonth=m=>new Date(today.getFullYear(),m+1,0).getDate();

/* ─── Theme context ─── */
const ThemeCtx = createContext(THEMES[0]);
const useTheme = () => useContext(ThemeCtx);

/* ─── Glass card — theme-aware ─── */
function GC({dark=false,s={},children,onClick}){
  const t=useTheme();
  const base={
    background: dark ? t.cardDark : t.card,
    backdropFilter:"blur(28px) saturate(200%) brightness(1.06)",
    WebkitBackdropFilter:"blur(28px) saturate(200%) brightness(1.06)",
    border:`0.5px solid ${dark ? t.cardDarkBorder : t.cardBorder}`,
    boxShadow: dark
      ? `0 1px 0 ${t.cardDarkBorder} inset,0 8px 32px rgba(0,0,0,0.22)`
      : `0 1px 0 rgba(255,255,255,0.9) inset,0 -0.5px 0 rgba(0,0,0,0.04) inset,0 8px 32px rgba(0,0,0,0.07)`,
    borderRadius:22,position:"relative",overflow:"hidden",
  };
  const shineOpacity = dark ? 0.07 : 0.18;
  return(
    <div onClick={onClick} style={{...base,...s,cursor:onClick?"pointer":"default"}}>
      <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,rgba(255,255,255,${shineOpacity}) 0%,transparent 60%)`,pointerEvents:"none",borderRadius:"inherit"}}/>
      <div style={{position:"relative",zIndex:1}}>{children}</div>
    </div>
  );
}

/* ─── Ring ─── */
function Ring({pct,size=38,stroke=3.5,color="#6450dc"}){const r=(size-stroke)/2,c=2*Math.PI*r;return(<svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={pct>1?"#c0392b":color} strokeWidth={stroke} strokeDasharray={`${c*Math.min(Math.max(pct,0),1)} ${c}`} strokeLinecap="round" style={{transition:"stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)"}}/></svg>);}

/* ─── Modal ─── */
function Modal({title,onClose,children}){
  const t=useTheme();
  const isDark=t.mode==="dark";
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"rgba(0,0,0,0.2)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:390,background:isDark?"rgba(20,20,32,0.97)":"rgba(255,255,255,0.95)",backdropFilter:"blur(40px) saturate(200%)",WebkitBackdropFilter:"blur(40px) saturate(200%)",borderRadius:"28px 28px 0 0",padding:`0 20px calc(env(safe-area-inset-bottom,16px) + 32px)`,borderTop:`0.5px solid ${t.cardBorder}`,boxShadow:"0 -8px 40px rgba(0,0,0,0.15)",maxHeight:"92dvh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{width:36,height:4,background:"rgba(128,128,128,0.25)",borderRadius:2,margin:"10px auto 22px"}}/>
        <div style={{fontSize:18,fontWeight:600,letterSpacing:"-0.02em",color:t.text,marginBottom:18}}>{title}</div>
        {children}
      </div>
    </div>
  );
}

/* ─── Input ─── */
function GI({placeholder,type="text",value,onChange,autoFocus}){
  const t=useTheme();
  const isDark=t.mode==="dark";
  return(<input type={type} placeholder={placeholder} value={value} onChange={onChange} autoFocus={autoFocus} style={{width:"100%",background:isDark?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.6)",border:`0.5px solid ${isDark?"rgba(255,255,255,0.12)":"rgba(200,200,220,0.6)"}`,borderRadius:14,padding:"13px 16px",fontSize:16,fontWeight:400,letterSpacing:"-0.01em",color:t.text,outline:"none",fontFamily:FONT,marginBottom:10}}/>);
}

/* ─── Btn ─── */
function Btn({children,onClick,grad,style={}}){
  const t=useTheme();
  const g=grad||`linear-gradient(135deg,${t.accent},${t.b3.replace(/[\d.]+\)$/,"0.9)")})`;
  return(<button onClick={onClick} style={{width:"100%",height:52,border:"none",borderRadius:16,background:g,color:"#fff",fontSize:15,fontWeight:600,letterSpacing:"-0.01em",cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 6px 20px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,255,255,0.2)",...style}}>{children}</button>);
}
function DelBtn({children,onClick}){return(<button onClick={onClick} style={{width:"100%",height:44,border:"0.5px solid rgba(192,57,43,0.25)",borderRadius:14,background:"rgba(192,57,43,0.07)",color:"#c0392b",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:FONT,marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{children}</button>);}

/* ─── chart defaults ─── */
const chOpts={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:"rgba(20,20,40,0.88)",titleColor:"rgba(255,255,255,0.75)",bodyColor:"rgba(255,255,255,0.6)",cornerRadius:10,padding:10,titleFont:{family:FONT,size:12},bodyFont:{family:FONT,size:12}}}};
const sc={ticks:{font:{family:FONT,size:10},color:"rgba(128,128,128,0.6)"},grid:{color:"rgba(128,128,128,0.08)"},border:{display:false}};

/* ══════════════════════════════
   MAIN APP
══════════════════════════════ */
export default function App(){
  const [view,setView]=useState("month");
  const [curM,setCurM]=useState(today.getMonth());
  const [curY,setCurY]=useState(today.getFullYear());
  const [tab,setTab]=useState(0);
  const [themeId,setThemeId]=useLS("lg_theme",DEFAULT_THEME_ID);

  const theme=THEMES.find(t=>t.id===themeId)||THEMES[0];
  const isDark=theme.mode==="dark";

  const [salary,   setSalary]  =useLS("lg_salary",  "");
  const [charges,  setCharges] =useLS("lg_charges", []);
  const [expenses, setExpenses]=useLS("lg_expenses",[]);
  const [cats,     setCats]    =useLS("lg_cats",    DEFAULT_CATS);
  const [budgets,  setBudgets] =useLS("lg_budgets", {});
  const [projects, setProjects]=useLS("lg_projects",[]);
  const [extraIncomes, setExtraIncomes]=useLS("lg_extras", []); /* [{id,month,year,amount,note}] */

  /* migrate old recurring into charges once */
  useEffect(()=>{
    const oldRec = JSON.parse(localStorage.getItem("lg_recurring")||"[]");
    if(oldRec.length>0) {
      setCharges(p=>[...p,...oldRec.map(r=>({id:r.id||Date.now()+Math.random(),label:r.note||"Dépense récurrente",amount:r.amount,catId:r.catId}))]);
      localStorage.removeItem("lg_recurring");
    }
  },[]);

  /* modals */
  const [mSalary,  setMSalary] =useState(false);
  const [mCharge,  setMCharge] =useState(false);
  const [mECharge, setMECharge]=useState(null);
  const [mExpense, setMExpense]=useState(false);
  const [mEExpense,setMEExpense]=useState(null);
  const [mCat,     setMCat]    =useState(false);
  const [mBudget,  setMBudget] =useState(null);
  const [mExtra,   setMExtra]  =useState(false);
  const [mEExtra,  setMEExtra] =useState(null);
  const [restoreMsg,setRestoreMsg]=useState("");
  const [toast,setToast]=useState(""); /* feedback after save actions */
  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(""),1800);};
  const [search,   setSearch]  =useState("");
  const [filterCat,setFilterCat]=useLS("lg_filterCat","all");

  /* form fields */
  const [fSal,setFSal]=useState("");
  const [fCN,setFCN]=useState("");const [fCA,setFCA]=useState("");
  const [fECat,setFECat]=useState(cats[0]?.id);const [fEA,setFEA]=useState("");const [fEN,setFEN]=useState("");
  const [fNCL,setFNCL]=useState("");const [fNCI,setFNCI]=useState(PRESET_ICONS[0]);const [fNCC,setFNCC]=useState(0);
  const [fBudget,setFBudget]=useState("");
  const [fCCat,setFCCat]=useState(cats[0]?.id);
  const [fXAmt,setFXAmt]=useState("");
  const [fXNote,setFXNote]=useState("");

  /* computed */
  const salN=parseFloat(salary)||0;
  const isNow=curM===today.getMonth()&&curY===today.getFullYear();
  const dimM=daysInMonth(curM);
  const dayN=isNow?today.getDate():dimM;

  /* charges are now "dépenses fixes" — virtual, not injected into expenses.
     They're calculated on-the-fly each month. */

  const mExp=expenses.filter(e=>e.month===curM&&e.year===curY);
  const mExtras=extraIncomes.filter(x=>x.month===curM&&x.year===curY);
  const totExtras=mExtras.reduce((s,x)=>s+x.amount,0);
  const totFixed=charges.reduce((s,c)=>s+c.amount,0);
  const totPonctual=mExp.reduce((s,e)=>s+e.amount,0);
  const totSp=totFixed+totPonctual;
  const totIncome=salN+totExtras;
  const rest=totIncome-totSp;
  const sCat=id=>{
    const ponct=mExp.filter(e=>e.catId===id).reduce((s,e)=>s+e.amount,0);
    const fix=charges.filter(c=>c.catId===id).reduce((s,c)=>s+c.amount,0);
    return ponct+fix;
  };
  const pp=n=>totIncome>0?Math.min(100,Math.round(n/totIncome*100)):0;
  const cumSav=()=>{let s=0;for(let m=0;m<=curM;m++){const t=expenses.filter(e=>e.month===m&&e.year===curY).reduce((a,e)=>a+e.amount,0);const x=extraIncomes.filter(ex=>ex.month===m&&ex.year===curY).reduce((a,ex)=>a+ex.amount,0);s+=salN+x-totFixed-t;}return s;};
  const dailyBurn=totPonctual/Math.max(dayN,1);
  const projSpend=totFixed+dailyBurn*dimM;
  const dailyBudget=(totIncome-totFixed)/dimM;
  const remDays=dimM-dayN;
  const budPerRemDay=rest/Math.max(remDays,1);
  const alerts=useMemo(()=>cats.filter(c=>{const b=budgets[c.id];return b&&sCat(c.id)>b;}),[cats,budgets,mExp,charges]);

  /* note suggestions per category, sorted by frequency then recency */
  const noteSuggestions=useMemo(()=>{
    const byCat={};
    const list=Array.isArray(expenses)?expenses:[];
    for(const e of list){
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
  },[expenses]);
  const currentSuggestions=(noteSuggestions[fECat]||[]).slice(0,6);
  const filteredSuggestions=fEN&&fEN.trim().length>=1
    ? currentSuggestions.filter(s=>s.label.toLowerCase().includes(fEN.trim().toLowerCase())&&s.label.toLowerCase()!==fEN.trim().toLowerCase())
    : currentSuggestions;
  const mTotals=yr=>Array.from({length:12},(_,m)=>{const t=expenses.filter(e=>e.month===m&&e.year===yr).reduce((s,e)=>s+e.amount,0);const x=extraIncomes.filter(ex=>ex.month===m&&ex.year===yr).reduce((a,ex)=>a+ex.amount,0);return{total:totFixed+t,saved:salN+x-totFixed-t};});

  /* nav */
  const prev=()=>{if(view==="month"){let m=curM-1,y=curY;if(m<0){m=11;y--;}setCurM(m);setCurY(y);}else setCurY(y=>y-1);};
  const next=()=>{if(view==="month"){let m=curM+1,y=curY;if(m>11){m=0;y++;}setCurM(m);setCurY(y);}else setCurY(y=>y+1);};

  /* actions */
  const addCharge=()=>{if(!fCN||!fCA)return;setCharges(p=>[...p,{id:Date.now()+Math.random(),label:fCN,amount:parseFloat(fCA),catId:fCCat}]);setFCN("");setFCA("");setMCharge(false);showToast("Dépense fixe ajoutée");};
  const openEC=c=>{setFCN(c.label);setFCA(String(c.amount));setFCCat(c.catId||cats[0]?.id);setMECharge(c);};
  const saveEC=()=>{if(!fCN||!fCA)return;setCharges(p=>p.map(c=>c.id===mECharge.id?{...c,label:fCN,amount:parseFloat(fCA),catId:fCCat}:c));setMECharge(null);showToast("Modifications enregistrées");};
  const delC=id=>{setCharges(p=>p.filter(c=>c.id!==id));setMECharge(null);showToast("Supprimé");};
  const addExp=()=>{if(!fEA)return;setExpenses(p=>[...p,{id:Date.now(),catId:fECat,amount:parseFloat(fEA),note:fEN,month:curM,year:curY,date:new Date().toLocaleDateString("fr-FR")}]);setFEA("");setFEN("");setMExpense(false);showToast("Dépense enregistrée");};
  const openEE=e=>{setFECat(e.catId);setFEA(String(e.amount));setFEN(e.note||"");setMEExpense(e);};
  const saveEE=()=>{if(!fEA)return;setExpenses(p=>p.map(e=>e.id===mEExpense.id?{...e,catId:fECat,amount:parseFloat(fEA),note:fEN}:e));setMEExpense(null);showToast("Modifications enregistrées");};
  const delE=id=>{setExpenses(p=>p.filter(e=>e.id!==id));setMEExpense(null);showToast("Supprimé");};
  const saveBudget=()=>{if(!mBudget)return;setBudgets(p=>({...p,[mBudget.id]:parseFloat(fBudget)||0}));setMBudget(null);showToast("Budget mis à jour");};
  const openBudget=c=>{setFBudget(String(budgets[c.id]||""));setMBudget(c);};
  const addCat=()=>{if(!fNCL)return;const col=PRESET_COLORS[fNCC];setCats(p=>[...p,{id:"c"+Date.now(),label:fNCL,icon:fNCI,...col}]);setFNCL("");setFNCI(PRESET_ICONS[0]);setFNCC(0);setMCat(false);showToast("Catégorie créée");};
  const delCat=id=>{if(DEFAULT_CATS.find(c=>c.id===id))return;setCats(p=>p.filter(c=>c.id!==id));showToast("Catégorie supprimée");};
  const addExtra=()=>{if(!fXAmt)return;setExtraIncomes(p=>[...p,{id:Date.now(),month:curM,year:curY,amount:parseFloat(fXAmt),note:fXNote,date:new Date().toLocaleDateString("fr-FR")}]);setFXAmt("");setFXNote("");setMExtra(false);showToast("Rentrée enregistrée");};
  const openEX=x=>{setFXAmt(String(x.amount));setFXNote(x.note||"");setMEExtra(x);};
  const saveEX=()=>{if(!fXAmt)return;setExtraIncomes(p=>p.map(x=>x.id===mEExtra.id?{...x,amount:parseFloat(fXAmt),note:fXNote}:x));setMEExtra(null);showToast("Modifications enregistrées");};
  const delX=id=>{setExtraIncomes(p=>p.filter(x=>x.id!==id));setMEExtra(null);showToast("Supprimé");};
  const exportData=()=>{const d={salary,charges,expenses,cats,budgets,projects,extraIncomes,themeId,exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(d,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`budget-${new Date().toLocaleDateString("fr-FR").replace(/\//g,"-")}.json`;a.click();URL.revokeObjectURL(url);};
  const importData=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(d.salary!==undefined)setSalary(d.salary);if(d.charges!==undefined)setCharges(d.charges);if(d.expenses!==undefined)setExpenses(d.expenses);if(d.cats!==undefined)setCats(d.cats);if(d.budgets!==undefined)setBudgets(d.budgets);if(d.projects!==undefined)setProjects(d.projects);if(d.extraIncomes!==undefined)setExtraIncomes(d.extraIncomes);if(d.themeId!==undefined)setThemeId(d.themeId);if(d.recurringExp!==undefined&&Array.isArray(d.recurringExp)&&d.recurringExp.length>0){setCharges(p=>[...p,...d.recurringExp.map(r=>({id:r.id||Date.now()+Math.random(),label:r.note||"Dépense récurrente",amount:r.amount,catId:r.catId}))]);}setRestoreMsg("✓ Données restaurées !");setTimeout(()=>setRestoreMsg(""),3000);}catch{setRestoreMsg("✗ Fichier invalide.");setTimeout(()=>setRestoreMsg(""),3000);}};reader.readAsText(file);e.target.value="";};

  /* style tokens — theme-aware */
  const t=theme;
  const eb={fontSize:11,fontWeight:500,letterSpacing:"0.06em",color:t.hint,textTransform:"uppercase",marginBottom:6};
  const sh={fontSize:11,fontWeight:500,letterSpacing:"0.07em",color:t.hint,textTransform:"uppercase",padding:"20px 20px 10px"};
  const bn=(col)=>({fontSize:52,fontWeight:200,letterSpacing:"-0.02em",lineHeight:1,color:col||t.text});
  const rw={display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`0.5px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"}`,cursor:"pointer"};
  const br={display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`0.5px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"}`};
  const pos="#1a8a5e", neg="#c0392b", blu="#1a6aaa";

  const CatChips=({sel,onSel})=>(<div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>{cats.map(c=>{const s=sel===c.id;return(<div key={c.id} onClick={()=>onSel(c.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderRadius:20,fontSize:13,fontWeight:500,cursor:"pointer",transition:"all 0.18s cubic-bezier(.34,1.56,.64,1)",border:s?"none":`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)"}`,background:s?c.bar:isDark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.5)",color:s?"#fff":t.sub,transform:s?"scale(1.04)":"scale(1)",letterSpacing:"-0.01em"}}>{c.icon} {c.label}</div>);})}</div>);

  /* ── NavBtn ── */
  const NavBtn=({onClick,children})=>(<button onClick={onClick} style={{width:34,height:34,borderRadius:"50%",background:isDark?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.4)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:`0.5px solid ${isDark?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.7)"}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:17,color:t.sub,fontFamily:FONT}}>{children}</button>);

  /* ════════ HOME MONTH ════════ */
  function HomeMonth(){
    const bc=rest>=0?`linear-gradient(90deg,${t.accent},${t.b1.replace(/[\d.]+\)$/,"0.9)")})`:`linear-gradient(90deg,#db5a5a,#db8a5a)`;
    const m6=[];for(let i=Math.max(0,curM-5);i<=curM;i++)m6.push(i);

    /* previous month comparison */
    const prevM = curM===0?11:curM-1;
    const prevY = curM===0?curY-1:curY;
    const prevPonctual = expenses.filter(e=>e.month===prevM&&e.year===prevY).reduce((s,e)=>s+e.amount,0);
    const prevTotal = totFixed + prevPonctual;
    const diffTotal = totSp - prevTotal;
    const diffPct = prevTotal>0 ? Math.round(diffTotal/prevTotal*100) : null;
    const hasPrev = prevPonctual > 0; /* only show if previous month has meaningful data */

    const ld={labels:m6.map(m=>MOS[m]),datasets:[
      {data:m6.map(m=>expenses.filter(e=>e.month===m&&e.year===curY).reduce((s,e)=>s+e.amount,0)),borderColor:"#dc5050",backgroundColor:"rgba(220,80,80,0.06)",tension:0.45,fill:true,pointRadius:3,pointBackgroundColor:"#dc5050",pointBorderColor:isDark?"rgba(20,20,40,0.9)":"rgba(255,255,255,0.9)",pointBorderWidth:1.5,borderWidth:1.5},
      {data:m6.map(m=>Math.max(0,salN-totFixed-expenses.filter(e=>e.month===m&&e.year===curY).reduce((s,e)=>s+e.amount,0))),borderColor:"#28b478",backgroundColor:"rgba(40,180,120,0.06)",tension:0.45,fill:true,pointRadius:3,pointBackgroundColor:"#28b478",pointBorderColor:isDark?"rgba(20,20,40,0.9)":"rgba(255,255,255,0.9)",pointBorderWidth:1.5,borderWidth:1.5,borderDash:[5,4]},
    ]};
    return(<>
      {alerts.length>0&&<div style={{margin:"14px 16px 0",padding:"12px 16px",background:"rgba(220,80,80,0.1)",borderRadius:16,border:"0.5px solid rgba(220,80,80,0.25)"}}><p style={{fontSize:12,fontWeight:600,color:neg,letterSpacing:"0.02em",marginBottom:6}}>⚠ BUDGET DÉPASSÉ</p>{alerts.map(c=>{const b=budgets[c.id],sp=sCat(c.id);return(<p key={c.id} style={{fontSize:13,color:neg,letterSpacing:"-0.01em"}}>{c.icon} {c.label} · {f(sp)} / {f(b)} (+{f(sp-b)})</p>);})}</div>}
      {salN===0?(
        <GC s={{margin:"14px 16px 0",padding:"32px 22px",textAlign:"center"}} onClick={()=>{setFSal("");setMSalary(true);}}>
          <p style={{fontSize:36,marginBottom:12}}>💼</p>
          <p style={{fontSize:18,fontWeight:600,letterSpacing:"-0.02em",color:t.text,marginBottom:6}}>Bienvenue !</p>
          <p style={{fontSize:13,color:t.sub,letterSpacing:"-0.01em",lineHeight:1.5,marginBottom:18}}>Saisis ton salaire net pour commencer à suivre ton budget.</p>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"12px 22px",borderRadius:14,background:`linear-gradient(135deg,${t.accent},${t.b3.replace(/[\d.]+\)$/,"0.9)")})`,color:"#fff",fontSize:14,fontWeight:600,letterSpacing:"-0.01em",boxShadow:"0 4px 14px rgba(0,0,0,0.15)"}}>＋ Saisir mon salaire</div>
        </GC>
      ):(<>
      <GC s={{margin:"14px 16px 0",padding:"22px 22px 20px"}}>
        <p style={eb}>Budget disponible</p>
        <p style={bn(rest<0?neg:t.text)}>{f(rest)}</p>
        <p style={{fontSize:13,color:t.sub,marginTop:8,letterSpacing:"-0.01em"}}>sur {f(totIncome)}{totExtras>0?` (${f(salN)} + ${f(totExtras)} extra)`:""} · {pp(totSp)}% dépensé</p>
        <div style={{height:3,background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)",borderRadius:2,marginTop:18,overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,background:bc,width:`${pp(totSp)}%`,transition:"width 0.8s cubic-bezier(.4,0,.2,1)"}}/></div>
      </GC>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"10px 16px 0"}}>
        {[
          [f(totSp),"Dépensé",t.text,hasPrev?{diff:diffTotal,pct:diffPct}:null],
          [(rest>=0?"+":"")+f(rest),"Économisé",rest>=0?pos:neg,null],
          [`${Math.round(rest/Math.max(totIncome,1)*100)}%`,"Taux épargne",blu,null],
          [f(cumSav()),`Cumulé ${curY}`,blu,null],
        ].map(([v,l,c,comp])=>(
          <GC key={l} s={{padding:16}}>
            <p style={eb}>{l}</p>
            <p style={{fontSize:23,fontWeight:200,letterSpacing:"-0.01em",color:c}}>{v}</p>
            {comp && (
              <div style={{display:"flex",alignItems:"center",gap:4,marginTop:4}}>
                <span style={{fontSize:11,fontWeight:600,color:comp.diff>0?neg:comp.diff<0?pos:t.hint,letterSpacing:"-0.01em"}}>
                  {comp.diff>0?"↗":comp.diff<0?"↘":"→"} {comp.diff>0?"+":""}{f(comp.diff)}
                </span>
                {comp.pct!=null&&<span style={{fontSize:10,color:t.hint,letterSpacing:"-0.01em"}}>({comp.pct>0?"+":""}{comp.pct}%)</span>}
                <span style={{fontSize:10,color:t.hint,letterSpacing:"-0.01em",marginLeft:"auto"}}>vs {MOS[prevM]}</span>
              </div>
            )}
          </GC>
        ))}
      </div>
      {isNow&&salN>0&&<>
        <p style={sh}>Rythme du mois</p>
        <GC s={{margin:"0 16px",padding:"16px 20px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[[f2(dailyBurn),"Dépense / jour",t.text],[f2(budPerRemDay),"Restant / jour",budPerRemDay>=dailyBudget?pos:neg],[f(projSpend),"Projection fin mois",projSpend>totIncome?neg:pos],[`${remDays}j`,"Jours restants",blu]].map(([v,l,c])=>(
              <div key={l}><p style={{fontSize:11,fontWeight:500,letterSpacing:"0.05em",color:t.hint,textTransform:"uppercase",marginBottom:4}}>{l}</p><p style={{fontSize:20,fontWeight:200,letterSpacing:"-0.02em",color:c}}>{v}</p></div>
            ))}
          </div>
        </GC>
      </>}
      <div style={{margin:"12px 16px 0",display:"flex",gap:8}}>
        <div style={{flex:2}}><Btn onClick={()=>{setFECat(cats[0]?.id);setFEA("");setFEN("");setMExpense(true);}}>＋ Dépense</Btn></div>
        <div style={{flex:1}}><Btn onClick={()=>{setFXAmt("");setFXNote("");setMExtra(true);}} grad="linear-gradient(135deg,#28b478,#3ca0dc)">＋ Rentrée</Btn></div>
      </div>

      {/* Extras section — only if any this month */}
      {mExtras.length>0&&<>
        <p style={sh}>Revenus exceptionnels du mois</p>
        <GC s={{margin:"0 16px",padding:"8px 16px"}}>
          {mExtras.map(x=>(
            <div key={x.id} style={rw} onClick={()=>openEX(x)}>
              <div style={{width:36,height:36,borderRadius:10,background:"rgba(40,180,120,0.13)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>💰</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:400,color:t.text,letterSpacing:"-0.01em"}}>{x.note||"Revenu exceptionnel"}</div>
                <div style={{fontSize:11,color:t.hint,marginTop:2,letterSpacing:"-0.01em"}}>{x.date||""}</div>
              </div>
              <div style={{fontSize:15,fontWeight:300,color:pos,letterSpacing:"-0.01em"}}>+{f(x.amount)}</div>
              <div style={{fontSize:12,color:t.hint,paddingLeft:4}}>✎</div>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0 2px",borderTop:`0.5px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"}`,marginTop:4}}>
            <span style={{fontSize:13,fontWeight:500,color:t.hint,letterSpacing:"-0.01em"}}>Total</span>
            <span style={{fontSize:16,fontWeight:300,letterSpacing:"-0.01em",color:pos}}>+{f(totExtras)}</span>
          </div>
        </GC>
      </>}

      <p style={sh}>Répartition</p>
      <GC s={{margin:"0 16px",padding:"8px 16px"}}>
        {cats.map(c=>{const sp=sCat(c.id),b=budgets[c.id],over=b&&sp>b,bW=b?Math.min(100,Math.round(sp/b*100)):pp(sp);return(
          <div key={c.id} style={rw}>
            <div style={{width:36,height:36,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:14,fontWeight:400,color:t.text,letterSpacing:"-0.01em"}}>{c.label}</div>
                {b&&<div style={{fontSize:10,fontWeight:500,color:over?neg:t.hint,letterSpacing:"-0.01em"}}>{f(sp)} / {f(b)}</div>}
              </div>
              <div style={{height:2.5,background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)",borderRadius:2,marginTop:5,overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,background:over?neg:c.bar,width:`${bW}%`,transition:"width 0.7s cubic-bezier(.4,0,.2,1)"}}/></div>
            </div>
            <Ring pct={b?sp/b:(salN>0?sp/salN:0)} color={over?neg:c.bar}/>
            <div style={{fontSize:15,fontWeight:300,color:over?neg:t.sub,letterSpacing:"-0.01em",minWidth:54,textAlign:"right"}}>{f(sp)}</div>
          </div>
        );})}
      </GC>

      {/* Category-level month comparison — only if meaningful prev data */}
      {hasPrev && (()=>{
        const catDiffs = cats.map(c=>{
          const curSp = sCat(c.id);
          const prevSp = expenses.filter(e=>e.month===prevM&&e.year===prevY&&e.catId===c.id).reduce((s,e)=>s+e.amount,0)
                      + charges.filter(ch=>ch.catId===c.id).reduce((s,ch)=>s+ch.amount,0);
          return { cat:c, curSp, prevSp, diff: curSp-prevSp };
        }).filter(d => Math.abs(d.diff) >= 10 && (d.curSp>0 || d.prevSp>0))
          .sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff))
          .slice(0,4);
        if (catDiffs.length===0) return null;
        return (<>
          <p style={sh}>vs {MONTHS[prevM]}</p>
          <GC s={{margin:"0 16px",padding:"8px 16px"}}>
            {catDiffs.map(d=>{
              const up = d.diff>0;
              return (
                <div key={d.cat.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`0.5px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"}`}}>
                  <div style={{width:32,height:32,borderRadius:9,background:d.cat.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{d.cat.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:400,color:t.text,letterSpacing:"-0.01em"}}>{d.cat.label}</div>
                    <div style={{fontSize:11,color:t.hint,marginTop:2,letterSpacing:"-0.01em"}}>{f(d.prevSp)} → {f(d.curSp)}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4,fontSize:13,fontWeight:500,color:up?neg:pos,letterSpacing:"-0.01em"}}>
                    <span>{up?"↗":"↘"}</span>
                    <span>{up?"+":""}{f(d.diff)}</span>
                  </div>
                </div>
              );
            })}
          </GC>
        </>);
      })()}
      <p style={sh}>Tendance 6 mois</p>
      <GC s={{margin:"0 16px",padding:16}}>
        <div style={{position:"relative",width:"100%",height:160}}><Line data={ld} options={{...chOpts,scales:{y:{...sc,ticks:{...sc.ticks,callback:v=>v>=1000?(v/1000).toFixed(1)+"k":v}},x:{...sc,grid:{display:false}}}}}/></div>
        <div style={{display:"flex",gap:18,marginTop:10}}>{[["#dc5050","Dépenses",false],["#28b478","Épargne",true]].map(([col,lbl,d])=>(<span key={lbl} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:t.hint,fontWeight:500,letterSpacing:"-0.01em"}}><span style={{width:14,height:0,borderTop:`2px ${d?"dashed":"solid"} ${col}`,display:"inline-block"}}/>{lbl}</span>))}</div>
      </GC>
      <p style={sh}>Bilan épargne</p>
      <GC s={{margin:"0 16px",padding:"4px 20px 4px"}}>
        {[["Épargne potentielle",f(Math.max(0,salN-totFixed)),t.text],["Épargne réelle",(rest>=0?"+":"")+f(rest),rest>=0?pos:neg],["Cumul depuis jan.",f(cumSav()),blu],["Projection annuelle",f(rest*12),t.text]].map(([l,v,c])=>(
          <div key={l} style={br}><span style={{fontSize:14,color:t.sub,letterSpacing:"-0.01em"}}>{l}</span><span style={{fontSize:15,fontWeight:300,letterSpacing:"-0.01em",color:c}}>{v}</span></div>
        ))}
      </GC>
      </>)}
      <div style={{height:16}}/>
    </>);
  }

  /* ════════ HOME YEAR ════════ */
  function HomeYear(){
    const mts=mTotals(curY),totY=mts.reduce((s,m)=>s+m.total,0),savY=mts.reduce((s,m)=>s+m.saved,0),totS=salN*12;
    const bd={labels:MOS,datasets:[{data:mts.map(m=>Math.max(0,m.saved)),backgroundColor:mts.map(m=>m.saved>=0?"rgba(40,180,120,0.72)":"rgba(220,80,80,0.62)"),borderRadius:5,borderSkipped:false}]};
    const catYear=cats.map(c=>({...c,total:expenses.filter(e=>e.year===curY&&e.catId===c.id).reduce((s,e)=>s+e.amount,0)})).filter(c=>c.total>0);
    const doughnutData={labels:catYear.map(c=>c.label),datasets:[{data:catYear.map(c=>c.total),backgroundColor:catYear.map(c=>c.bar),borderWidth:0,hoverOffset:4}]};
    return(<>
      <GC dark s={{margin:"14px 16px 0",padding:"22px 22px 20px"}}>
        <p style={{...eb,color:isDark?"rgba(255,255,255,0.3)":t.hint}}>Économies {curY}</p>
        <p style={bn(isDark?"rgba(255,255,255,0.92)":t.text)}>{f(savY)}</p>
        <p style={{fontSize:13,color:isDark?"rgba(255,255,255,0.38)":t.sub,marginTop:8,letterSpacing:"-0.01em"}}>Taux {Math.round(savY/Math.max(totS,1)*100)}% · sur {f(totS)}</p>
        <div style={{height:3,background:"rgba(255,255,255,0.08)",borderRadius:2,marginTop:18,overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,background:`linear-gradient(90deg,${t.accent},#3ca0dc)`,width:`${Math.min(100,Math.round(savY/Math.max(totS,1)*100))}%`,transition:"width 0.8s"}}/></div>
      </GC>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"10px 16px 0"}}>
        {[[f(totS),"Revenus",t.text],[f(totY),"Dépenses",t.text],[f(savY/12),"Moy. épargne",pos],[f(savY*5),"Proj. 5 ans",blu]].map(([v,l,c])=>(
          <GC key={l} s={{padding:16}}><p style={eb}>{l}</p><p style={{fontSize:23,fontWeight:200,letterSpacing:"-0.01em",color:c}}>{v}</p></GC>
        ))}
      </div>
      {catYear.length>0&&<><p style={sh}>Répartition annuelle</p><GC s={{margin:"0 16px",padding:16}}><div style={{display:"flex",gap:16,alignItems:"center"}}><div style={{position:"relative",width:120,height:120,flexShrink:0}}><Doughnut data={doughnutData} options={{...chOpts,cutout:"68%",plugins:{...chOpts.plugins,tooltip:{...chOpts.plugins.tooltip,callbacks:{label:i=>` ${f(i.raw)}`}}}}}/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}><p style={{fontSize:11,color:t.hint,fontWeight:500}}>Total</p><p style={{fontSize:15,fontWeight:300,letterSpacing:"-0.02em",color:t.text}}>{f(totY)}</p></div></div><div style={{flex:1}}>{catYear.slice(0,5).map(c=>(<div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:c.bar,flexShrink:0}}/><span style={{fontSize:12,color:t.sub,letterSpacing:"-0.01em"}}>{c.label}</span></div><span style={{fontSize:12,fontWeight:500,color:t.text,letterSpacing:"-0.01em"}}>{Math.round(c.total/totY*100)}%</span></div>))}</div></div></GC></>}
      <p style={sh}>Mois</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,margin:"0 16px"}}>
        {MOS.map((ms,i)=>{const m=mts[i],act=i===curM;return(<div key={i} onClick={()=>{setCurM(i);setView("month");}} style={{padding:"9px 4px",borderRadius:12,cursor:"pointer",textAlign:"center",background:act?isDark?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.78)":isDark?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.32)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",border:act?`1px solid ${t.cardBorder}`:`0.5px solid ${t.cardBorder}`,transition:"all 0.18s"}}><div style={{fontSize:12,fontWeight:500,color:t.text,letterSpacing:"-0.01em"}}>{ms}</div><div style={{fontSize:10,color:t.sub,marginTop:2,letterSpacing:"-0.01em"}}>{f(m.total)}</div><div style={{width:5,height:5,borderRadius:"50%",margin:"5px auto 0",background:m.saved>=0?"#28b478":"#dc5050"}}/></div>);})}
      </div>
      <p style={sh}>Épargne mensuelle</p>
      <GC s={{margin:"0 16px",padding:16}}><div style={{position:"relative",width:"100%",height:160}}><Bar data={bd} options={{...chOpts,scales:{y:{...sc,ticks:{...sc.ticks,callback:v=>v+"€"}},x:{...sc,grid:{display:false}}}}}/></div></GC>
      <p style={sh}>Bilan annuel</p>
      <GC s={{margin:"0 16px",padding:"4px 20px 4px"}}>
        {[[`${mts.filter(m=>m.saved>=0).length} / 12`,"Mois dans le vert",pos],[`${mts.filter(m=>m.saved<0).length} / 12`,"Mois dans le rouge",neg],[f(savY*10),"Projection 10 ans",blu]].map(([v,l,c])=>(
          <div key={l} style={br}><span style={{fontSize:14,color:t.sub,letterSpacing:"-0.01em"}}>{l}</span><span style={{fontSize:15,fontWeight:300,letterSpacing:"-0.01em",color:c}}>{v}</span></div>
        ))}
      </GC>
      <div style={{height:16}}/>
    </>);
  }

  /* ════════ FIXED EXPENSES ════════ */
  function Charges(){return(<>
    <GC s={{margin:"14px 16px 0",padding:"22px 22px 20px"}}>
      <p style={eb}>Dépenses fixes</p>
      <p style={bn()}>{f(totFixed)}</p>
      <p style={{fontSize:13,color:t.sub,marginTop:8,letterSpacing:"-0.01em"}}>{salN>0?`${Math.round(totFixed/salN*100)}% du salaire · chaque mois`:"Saisissez votre salaire"}</p>
    </GC>
    <div style={{margin:"12px 16px 0"}}>
      <Btn onClick={()=>{setFCN("");setFCA("");setFCCat(cats[0]?.id);setMCharge(true);}} grad="linear-gradient(135deg,#328cf0,#6450dc)">＋ Ajouter une dépense fixe</Btn>
    </div>
    <p style={{fontSize:13,color:t.hint,padding:"14px 20px 0",lineHeight:1.5,letterSpacing:"-0.01em"}}>Loyer, abonnements, crédits… Tout ce qui revient chaque mois. Automatiquement comptabilisé dans ton budget.</p>
    {charges.length>0&&<>
      <p style={sh}>Liste</p>
      <GC s={{margin:"0 16px",padding:"8px 16px"}}>
        {charges.map(c=>{
          const cat=cats.find(x=>x.id===c.catId);
          return(
            <div key={c.id} style={rw} onClick={()=>openEC(c)}>
              <div style={{width:36,height:36,borderRadius:10,background:cat?.bg||"rgba(128,128,128,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{cat?.icon||"•"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:400,color:t.text,letterSpacing:"-0.01em"}}>{c.label}</div>
                <div style={{fontSize:11,color:t.hint,marginTop:2,letterSpacing:"-0.01em"}}>{cat?.label||"Sans catégorie"} · mensuel</div>
              </div>
              <div style={{fontSize:15,fontWeight:300,color:t.sub,letterSpacing:"-0.01em"}}>{f(c.amount)}</div>
              <div style={{fontSize:12,color:t.hint,paddingLeft:4}}>✎</div>
            </div>
          );
        })}
        <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0 2px",borderTop:`0.5px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"}`,marginTop:4}}>
          <span style={{fontSize:13,fontWeight:500,color:t.hint,letterSpacing:"-0.01em"}}>Total</span>
          <span style={{fontSize:16,fontWeight:300,letterSpacing:"-0.01em",color:t.text}}>{f(totFixed)}</span>
        </div>
      </GC>
    </>}
    <div style={{height:16}}/>
  </>);}

  /* ════════ HISTORY ════════ */
  function History(){
    const filtered=useMemo(()=>{let list=[...mExp].reverse();if(filterCat!=="all")list=list.filter(e=>e.catId===filterCat);if(search.trim())list=list.filter(e=>{const c=cats.find(x=>x.id===e.catId);return(e.note||"").toLowerCase().includes(search.toLowerCase())||(c?.label||"").toLowerCase().includes(search.toLowerCase());});return list;},[mExp,filterCat,search]);
    const total=filtered.reduce((s,e)=>s+e.amount,0);
    return(<>
      <GC s={{margin:"14px 16px 0",padding:"22px 22px 20px"}}><p style={eb}>{MONTHS[curM]} · {filtered.length} opération{filtered.length!==1?"s":""}</p><p style={bn()}>{f(total)}</p><p style={{fontSize:13,color:t.sub,marginTop:8,letterSpacing:"-0.01em"}}>dépensé{filterCat!=="all"||search?" (filtré)":""} ce mois</p></GC>
      <div style={{margin:"12px 16px 0",position:"relative"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{width:"100%",background:isDark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.5)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.7)"}`,borderRadius:14,padding:"11px 16px 11px 40px",fontSize:14,color:t.text,outline:"none",fontFamily:FONT,letterSpacing:"-0.01em"}}/>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:15,color:t.hint}}>⌕</span>
        {search&&<span onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:t.hint,cursor:"pointer"}}>✕</span>}
      </div>
      <div style={{display:"flex",gap:7,padding:"10px 16px 0",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        {[{id:"all",label:"Toutes",icon:"◎",bar:t.accent},...cats].map(c=>{const s=filterCat===c.id;return(<div key={c.id} onClick={()=>setFilterCat(c.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:20,fontSize:12,fontWeight:500,cursor:"pointer",flexShrink:0,transition:"all 0.18s",border:s?"none":`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)"}`,background:s?c.bar:isDark?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.5)",color:s?"#fff":t.sub,letterSpacing:"-0.01em"}}>{c.icon} {c.label}</div>);})}
      </div>
      <div style={{margin:"12px 16px 0"}}><Btn onClick={()=>{setFECat(cats[0]?.id);setFEA("");setFEN("");setMExpense(true);}}>＋ Ajouter une dépense</Btn></div>
      {filtered.length>0&&<><p style={sh}>Opérations</p><GC s={{margin:"0 16px",padding:"8px 16px"}}>{filtered.map(e=>{const c=cats.find(x=>x.id===e.catId)||cats[0];return(<div key={e.id} style={rw} onClick={()=>openEE(e)}><div style={{width:36,height:36,borderRadius:10,background:c?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c?.icon}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:400,color:t.text,letterSpacing:"-0.01em"}}>{e.note||c?.label}</div><div style={{fontSize:11,color:t.hint,marginTop:3,letterSpacing:"-0.01em"}}>{c?.label} · {e.date}</div></div><div style={{fontSize:15,fontWeight:300,color:neg,letterSpacing:"-0.01em"}}>−{f(e.amount)}</div><div style={{fontSize:12,color:t.hint,paddingLeft:4}}>✎</div></div>);})}</GC></>}
      {filtered.length===0&&search&&<p style={{textAlign:"center",padding:"32px 20px",color:t.hint,fontSize:14,letterSpacing:"-0.01em"}}>Aucun résultat pour « {search} »</p>}
      <div style={{height:16}}/>
    </>);
  }

  /* ════════ BUDGETS ════════ */
  function Budgets(){
    const totalBudgeted=Object.values(budgets).reduce((s,v)=>s+(v||0),0);
    return(<>
      <GC s={{margin:"14px 16px 0",padding:"22px 22px 20px"}}><p style={eb}>Budgets par catégorie</p><p style={{...bn(),fontSize:36}}>{Object.keys(budgets).filter(k=>budgets[k]>0).length} définis</p><p style={{fontSize:13,color:t.sub,marginTop:8,letterSpacing:"-0.01em"}}>sur {cats.length} catégories · {f(totalBudgeted)} alloués / mois</p></GC>
      <p style={sh}>Plafonds mensuels</p>
      <GC s={{margin:"0 16px",padding:"8px 16px"}}>
        {cats.map(c=>{const b=budgets[c.id]||0,sp=sCat(c.id),over=b&&sp>b;return(<div key={c.id} style={rw} onClick={()=>openBudget(c)}><div style={{width:36,height:36,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.icon}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:400,color:t.text,letterSpacing:"-0.01em"}}>{c.label}</div>{b>0?<div style={{height:2.5,background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)",borderRadius:2,marginTop:5,overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,background:over?neg:c.bar,width:`${Math.min(100,Math.round(sp/b*100))}%`,transition:"width 0.7s"}}/></div>:<div style={{fontSize:11,color:t.hint,marginTop:3,letterSpacing:"-0.01em"}}>Appuyer pour définir un plafond</div>}</div><div style={{textAlign:"right",flexShrink:0}}>{b>0?<><div style={{fontSize:13,fontWeight:400,color:over?neg:t.sub,letterSpacing:"-0.01em"}}>{f(sp)} / {f(b)}</div><div style={{fontSize:10,color:over?neg:t.hint,letterSpacing:"-0.01em"}}>{over?"−"+f(sp-b):"reste "+f(b-sp)}</div></>:<div style={{fontSize:12,color:t.hint}}>✎</div>}</div></div>);})}
      </GC>
      <p style={{fontSize:13,color:t.hint,padding:"12px 20px 20px",lineHeight:1.5,letterSpacing:"-0.01em"}}>Appuie sur une catégorie pour définir ou modifier son plafond mensuel.</p>
    </>);
  }

  /* ════════ SETTINGS ════════ */
  function Settings(){
    return(<>
      <GC s={{margin:"14px 16px 0",padding:"22px 22px 20px"}}><p style={eb}>Paramètres</p><p style={{...bn(),fontSize:36}}>⚙</p><p style={{fontSize:13,color:t.sub,marginTop:8,letterSpacing:"-0.01em"}}>Thème, catégories, sauvegarde</p></GC>

      {/* ── THEME PICKER ── */}
      <p style={sh}>Ambiance</p>
      <div style={{padding:"0 16px"}}>
        {/* light themes */}
        <p style={{fontSize:11,fontWeight:500,color:t.hint,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:10}}>Modes clairs</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {THEMES.filter(th=>th.mode==="light").map(th=>{
            const active=th.id===themeId;
            return(
              <div key={th.id} onClick={()=>setThemeId(th.id)}
                style={{borderRadius:18,overflow:"hidden",border:`${active?"2px":"1px"} solid ${active?t.accent:"rgba(255,255,255,0.5)"}`,cursor:"pointer",transition:"all 0.2s",transform:active?"scale(1.02)":"scale(1)",boxShadow:active?`0 4px 16px ${t.accent}44`:"none"}}>
                <div style={{background:th.bg,padding:"14px 14px 10px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",width:80,height:80,top:-20,left:-20,borderRadius:"50%",background:`radial-gradient(circle,${th.b1} 0%,transparent 70%)`,filter:"blur(20px)"}}/>
                  <div style={{position:"absolute",width:60,height:60,bottom:-10,right:-10,borderRadius:"50%",background:`radial-gradient(circle,${th.b2} 0%,transparent 70%)`,filter:"blur(15px)"}}/>
                  <div style={{position:"relative",zIndex:1}}>
                    <div style={{fontSize:16,marginBottom:4}}>{th.emoji}</div>
                    <div style={{fontSize:13,fontWeight:600,color:th.text,letterSpacing:"-0.02em"}}>{th.name}</div>
                    <div style={{width:"60%",height:3,borderRadius:2,background:th.accent,marginTop:6,opacity:0.8}}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{fontSize:11,fontWeight:500,color:t.hint,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:10}}>Modes sombres</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:4}}>
          {THEMES.filter(th=>th.mode==="dark").map(th=>{
            const active=th.id===themeId;
            return(
              <div key={th.id} onClick={()=>setThemeId(th.id)}
                style={{borderRadius:18,overflow:"hidden",border:`${active?"2px":"1px"} solid ${active?t.accent:"rgba(255,255,255,0.12)"}`,cursor:"pointer",transition:"all 0.2s",transform:active?"scale(1.02)":"scale(1)",boxShadow:active?`0 4px 16px ${t.accent}44`:"none"}}>
                <div style={{background:th.bg,padding:"14px 14px 10px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",width:80,height:80,top:-20,left:-20,borderRadius:"50%",background:`radial-gradient(circle,${th.b1} 0%,transparent 70%)`,filter:"blur(20px)"}}/>
                  <div style={{position:"absolute",width:60,height:60,bottom:-10,right:-10,borderRadius:"50%",background:`radial-gradient(circle,${th.b2} 0%,transparent 70%)`,filter:"blur(15px)"}}/>
                  <div style={{position:"relative",zIndex:1}}>
                    <div style={{fontSize:16,marginBottom:4}}>{th.emoji}</div>
                    <div style={{fontSize:13,fontWeight:600,color:th.text,letterSpacing:"-0.02em"}}>{th.name}</div>
                    <div style={{width:"60%",height:3,borderRadius:2,background:th.accent,marginTop:6,opacity:0.8}}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <p style={sh}>Catégories</p>
      <GC s={{margin:"0 16px",padding:"8px 16px"}}>
        {cats.map(c=>{const isDef=!!DEFAULT_CATS.find(d=>d.id===c.id);return(<div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:`0.5px solid ${isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)"}`}}><div style={{width:36,height:36,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.icon}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:400,color:t.text,letterSpacing:"-0.01em"}}>{c.label}</div><div style={{fontSize:11,color:t.hint,marginTop:2,letterSpacing:"-0.01em"}}>{isDef?"Par défaut":"Personnalisée"}</div></div>{!isDef&&<button onClick={()=>delCat(c.id)} style={{background:"rgba(255,59,48,0.1)",border:"none",color:"#FF3B30",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT}}>✕</button>}</div>);})}
        <div style={{marginTop:8}}><Btn onClick={()=>{setFNCL("");setFNCI(PRESET_ICONS[0]);setFNCC(0);setMCat(true);}} grad="linear-gradient(135deg,#f0a028,#dc5050)" style={{height:44,fontSize:14}}>＋ Nouvelle catégorie</Btn></div>
      </GC>

      {/* ── SALARY ── */}
      <p style={sh}>Salaire</p>
      <GC s={{margin:"0 16px",padding:"14px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}} onClick={()=>{setFSal(salary);setMSalary(true);}}>
          <div><p style={{fontSize:14,color:t.sub,letterSpacing:"-0.01em"}}>Salaire net mensuel</p><p style={{fontSize:22,fontWeight:200,letterSpacing:"-0.02em",color:t.text,marginTop:2}}>{salary?f(salN):"Non défini"}</p></div>
          <span style={{fontSize:18,color:t.hint}}>›</span>
        </div>
      </GC>

      {/* ── BACKUP ── */}
      <p style={sh}>Sauvegarde</p>
      <GC s={{margin:"0 16px",padding:"16px 20px"}}>
        <p style={{fontSize:14,color:t.sub,letterSpacing:"-0.01em",marginBottom:14,lineHeight:1.5}}>Exporte toutes tes données dans un fichier JSON. Importe-le après une réinstallation.</p>
        <Btn onClick={exportData} grad="linear-gradient(135deg,#28b478,#3ca0dc)" style={{marginBottom:10}}>↓ Exporter mes données</Btn>
        <label style={{display:"block"}}>
          <input type="file" accept=".json" onChange={importData} style={{display:"none"}}/>
          <div style={{width:"100%",height:52,borderRadius:16,background:`linear-gradient(135deg,${t.accent},#328cf0)`,color:"#fff",fontSize:15,fontWeight:600,letterSpacing:"-0.01em",cursor:"pointer",fontFamily:FONT,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 6px 20px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,255,255,0.2)"}}>↑ Importer une sauvegarde</div>
        </label>
        {restoreMsg&&<div style={{marginTop:12,padding:"10px 14px",borderRadius:12,background:restoreMsg.startsWith("✓")?"rgba(40,180,120,0.12)":"rgba(220,80,80,0.12)",color:restoreMsg.startsWith("✓")?pos:neg,fontSize:13,fontWeight:500,letterSpacing:"-0.01em",textAlign:"center"}}>{restoreMsg}</div>}
      </GC>
      <div style={{height:16}}/>
    </>);
  }

  const TABS=[["◎","Accueil"],["≡","Fixes"],["◷","Histo."],["◐","Budgets"],["✦","Projets"],["⚙","Réglages"]];

  return(
    <ThemeCtx.Provider value={theme}>
      <style>{`@keyframes drift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(24px,18px) scale(1.06)}66%{transform:translate(-16px,28px) scale(0.94)}}@keyframes toastIn{0%{opacity:0;transform:translate(-50%,12px) scale(0.96)}100%{opacity:1;transform:translate(-50%,0) scale(1)}}input::placeholder{color:rgba(128,128,128,0.4)}*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{display:none}`}</style>

      {/* blobs */}
      {[[260,260,"-60px","0",undefined,undefined,theme.b1,0],[220,220,"30%",undefined,"0",undefined,theme.b2,-5],[200,200,undefined,"30px",undefined,"200px",theme.b3,-9]].map(([w,h,top,left,right,bottom,col,d],i)=>(
        <div key={i} style={{position:"fixed",width:w,height:h,borderRadius:"50%",background:`radial-gradient(circle,${col} 0%,transparent 70%)`,filter:"blur(55px)",pointerEvents:"none",zIndex:0,top,left,right,bottom,animation:`drift ${12+Math.abs(d)}s ease-in-out ${d}s infinite`}}/>
      ))}

      {/* app bg */}
      <div style={{position:"fixed",inset:0,background:theme.bg,zIndex:-1}}/>

      <div style={{maxWidth:390,minHeight:"100dvh",margin:"0 auto",position:"relative",overflow:"hidden",fontFamily:FONT,WebkitFontSmoothing:"antialiased",letterSpacing:"-0.01em"}}>
        <div style={{overflowY:"auto",minHeight:"100dvh",paddingBottom:`calc(env(safe-area-inset-bottom,16px) + 92px)`,paddingTop:"env(safe-area-inset-top,16px)",position:"relative",zIndex:1,WebkitOverflowScrolling:"touch"}}>

          {/* salary bar — hidden on home tab when empty (hero handles CTA) */}
          {!salary?(
            tab!==0&&<div onClick={()=>{setFSal("");setMSalary(true);}} style={{margin:"12px 16px 0",padding:"14px 18px",background:`${theme.accent}18`,borderRadius:16,border:`0.5px solid ${theme.accent}33`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:14,fontWeight:500,color:theme.text,letterSpacing:"-0.01em"}}>💼 Saisir mon salaire net</span>
              <span style={{color:theme.accent,fontSize:18}}>›</span>
            </div>
          ):(
            <div onClick={()=>{setFSal(salary);setMSalary(true);}} style={{margin:"12px 16px 0",padding:"11px 18px",background:isDark?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.3)",borderRadius:14,border:`0.5px solid ${theme.cardBorder}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:13,color:theme.hint,letterSpacing:"-0.01em"}}>Salaire net mensuel</span>
              <span style={{fontSize:16,fontWeight:300,letterSpacing:"-0.01em",color:theme.text}}>{f(salN)} ›</span>
            </div>
          )}

          {/* view toggle */}
          {tab===0&&(
            <div style={{display:"flex",margin:"10px 16px 0",background:theme.segBg,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:`0.5px solid ${theme.cardBorder}`,borderRadius:12,padding:3,gap:3}}>
              {["Mois","Année"].map((lbl,i)=>{const on=(i===0&&view==="month")||(i===1&&view==="year");return(<button key={lbl} onClick={()=>setView(i===0?"month":"year")} style={{flex:1,padding:"7px 0",border:"none",borderRadius:9,fontSize:13,fontWeight:on?600:500,cursor:"pointer",fontFamily:FONT,letterSpacing:"-0.01em",transition:"all 0.22s cubic-bezier(.4,0,.2,1)",background:on?theme.segActive:"transparent",color:on?theme.text:theme.hint,boxShadow:on?isDark?"0 1px 4px rgba(0,0,0,0.3)":"0 1px 4px rgba(0,0,0,0.1),0 0.5px 0 rgba(255,255,255,0.9) inset":"none"}}>{lbl}</button>);})}
            </div>
          )}

          {/* nav */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px 0"}}>
            <NavBtn onClick={prev}>‹</NavBtn>
            <span style={{fontSize:17,fontWeight:600,color:theme.text,letterSpacing:"-0.02em"}}>{view==="month"?`${MONTHS[curM]} ${curY}`:`${curY}`}</span>
            <NavBtn onClick={next}>›</NavBtn>
          </div>

          {tab===0&&(view==="month"?<HomeMonth/>:<HomeYear/>)}
          {tab===1&&<Charges/>}
          {tab===2&&<History/>}
          {tab===3&&<Budgets/>}
          {tab===4&&<Projects theme={theme} projects={projects} setProjects={setProjects} showToast={showToast}/>}
          {tab===5&&<Settings/>}
        </div>

        {/* tab bar */}
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:390,display:"flex",padding:`8px 4px calc(env(safe-area-inset-bottom,16px) + 12px)`,gap:2,background:theme.navBg,backdropFilter:"blur(28px) saturate(200%)",WebkitBackdropFilter:"blur(28px) saturate(200%)",borderTop:`0.5px solid ${theme.navBorder}`,zIndex:100}}>
          {TABS.map(([ico,lbl],i)=>(
            <div key={i} onClick={()=>setTab(i)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",padding:"6px 2px",borderRadius:12,position:"relative",minWidth:0}}>
              <span style={{fontSize:19,transition:"transform 0.25s cubic-bezier(.34,1.56,.64,1)",transform:tab===i?"scale(1.15)":"scale(1)",lineHeight:1}}>{ico}</span>
              <span style={{fontSize:10,fontWeight:tab===i?600:500,color:tab===i?theme.text:theme.hint,letterSpacing:"-0.01em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%"}}>{lbl}</span>
              {tab===i&&<div style={{width:4,height:4,borderRadius:"50%",background:theme.accent,marginTop:0}}/>}
              {i===0&&alerts.length>0&&<div style={{position:"absolute",top:4,right:"50%",transform:"translateX(14px)",width:8,height:8,borderRadius:"50%",background:neg}}/>}
              {i===4&&projects.some(p=>p.status==="active"&&p.expenses.reduce((s,e)=>s+e.amount,0)>p.budget)&&<div style={{position:"absolute",top:4,right:"50%",transform:"translateX(14px)",width:8,height:8,borderRadius:"50%",background:"#f0a028"}}/>}
            </div>
          ))}
        </div>
      </div>

      {/* ── modals ── */}
      {mSalary&&<Modal title="💼 Salaire net mensuel" onClose={()=>setMSalary(false)}><GI placeholder="Ex : 2 500" type="number" value={fSal} onChange={e=>setFSal(e.target.value)} autoFocus/><Btn onClick={()=>{setSalary(fSal);setMSalary(false);}}>Enregistrer</Btn></Modal>}
      {mCharge&&<Modal title="Nouvelle dépense fixe" onClose={()=>setMCharge(false)}><p style={{fontSize:13,color:theme.sub,marginBottom:14,letterSpacing:"-0.01em"}}>Cette dépense sera automatiquement comptabilisée chaque mois.</p><GI placeholder="Montant en €" type="number" value={fCA} onChange={e=>setFCA(e.target.value)} autoFocus/><GI placeholder="Libellé · ex : Loyer, Netflix…" value={fCN} onChange={e=>setFCN(e.target.value)}/><CatChips sel={fCCat} onSel={setFCCat}/><Btn onClick={addCharge} grad="linear-gradient(135deg,#328cf0,#6450dc)">Enregistrer</Btn></Modal>}
      {mECharge&&<Modal title="Modifier la dépense fixe" onClose={()=>setMECharge(null)}><GI placeholder="Montant en €" type="number" value={fCA} onChange={e=>setFCA(e.target.value)} autoFocus/><GI placeholder="Libellé" value={fCN} onChange={e=>setFCN(e.target.value)}/><CatChips sel={fCCat} onSel={setFCCat}/><Btn onClick={saveEC} grad="linear-gradient(135deg,#328cf0,#6450dc)">Enregistrer</Btn><DelBtn onClick={()=>delC(mECharge.id)}>Supprimer</DelBtn></Modal>}
      {mExpense&&<Modal title="Nouvelle dépense" onClose={()=>setMExpense(false)}>
        <CatChips sel={fECat} onSel={setFECat}/>
        <GI placeholder="Montant en €" type="number" value={fEA} onChange={e=>setFEA(e.target.value)} autoFocus/>
        <GI placeholder="Libellé · ex : Tabac, Bar, Vélo…" value={fEN} onChange={e=>setFEN(e.target.value)}/>
        {filteredSuggestions.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:-2,marginBottom:12}}>
          {filteredSuggestions.map(s=>(
            <div key={s.label} onClick={()=>setFEN(s.label)} style={{padding:"6px 11px",borderRadius:14,fontSize:12,fontWeight:500,cursor:"pointer",background:isDark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.55)",border:`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.06)"}`,color:theme.sub,letterSpacing:"-0.01em"}}>
              {s.label}{s.count>1&&<span style={{color:theme.hint,marginLeft:5,fontSize:10}}>×{s.count}</span>}
            </div>
          ))}
        </div>}
        <Btn onClick={addExp}>Enregistrer</Btn>
      </Modal>}
      {mEExpense&&<Modal title="Modifier la dépense" onClose={()=>setMEExpense(null)}>
        <p style={{fontSize:13,color:theme.sub,marginBottom:14,letterSpacing:"-0.01em"}}>Dépense du {mEExpense.date}</p>
        <CatChips sel={fECat} onSel={setFECat}/>
        <GI placeholder="Montant en €" type="number" value={fEA} onChange={e=>setFEA(e.target.value)} autoFocus/>
        <GI placeholder="Libellé · ex : Tabac, Bar, Vélo…" value={fEN} onChange={e=>setFEN(e.target.value)}/>
        {filteredSuggestions.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:-2,marginBottom:12}}>
          {filteredSuggestions.map(s=>(
            <div key={s.label} onClick={()=>setFEN(s.label)} style={{padding:"6px 11px",borderRadius:14,fontSize:12,fontWeight:500,cursor:"pointer",background:isDark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.55)",border:`0.5px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.06)"}`,color:theme.sub,letterSpacing:"-0.01em"}}>
              {s.label}{s.count>1&&<span style={{color:theme.hint,marginLeft:5,fontSize:10}}>×{s.count}</span>}
            </div>
          ))}
        </div>}
        <Btn onClick={saveEE}>Enregistrer</Btn>
        <DelBtn onClick={()=>delE(mEExpense.id)}>Supprimer</DelBtn>
      </Modal>}
      {mBudget&&<Modal title={`Budget · ${mBudget.icon} ${mBudget.label}`} onClose={()=>setMBudget(null)}><p style={{fontSize:13,color:theme.sub,marginBottom:12,letterSpacing:"-0.01em"}}>Dépensé ce mois : {f(sCat(mBudget.id))}</p><GI placeholder="Plafond mensuel en €" type="number" value={fBudget} onChange={e=>setFBudget(e.target.value)} autoFocus/><Btn onClick={saveBudget} grad={`linear-gradient(135deg,${mBudget.bar},#3ca0dc)`}>Définir le budget</Btn>{budgets[mBudget.id]>0&&<DelBtn onClick={()=>{setBudgets(p=>{const n={...p};delete n[mBudget.id];return n;});setMBudget(null);}}>Supprimer le plafond</DelBtn>}</Modal>}
      {mExtra&&<Modal title="💰 Revenu exceptionnel" onClose={()=>setMExtra(false)}><p style={{fontSize:13,color:theme.sub,marginBottom:14,letterSpacing:"-0.01em"}}>Vente, prime, cadeau, remboursement… Ajouté à ton budget de {MONTHS[curM]}.</p><GI placeholder="Montant en €" type="number" value={fXAmt} onChange={e=>setFXAmt(e.target.value)} autoFocus/><GI placeholder="Libellé · ex : Vente Vinted, Prime…" value={fXNote} onChange={e=>setFXNote(e.target.value)}/><Btn onClick={addExtra} grad="linear-gradient(135deg,#28b478,#3ca0dc)">Enregistrer</Btn></Modal>}
      {mEExtra&&<Modal title="Modifier le revenu" onClose={()=>setMEExtra(null)}><GI placeholder="Montant en €" type="number" value={fXAmt} onChange={e=>setFXAmt(e.target.value)} autoFocus/><GI placeholder="Libellé" value={fXNote} onChange={e=>setFXNote(e.target.value)}/><Btn onClick={saveEX} grad="linear-gradient(135deg,#28b478,#3ca0dc)">Enregistrer</Btn><DelBtn onClick={()=>delX(mEExtra.id)}>Supprimer</DelBtn></Modal>}
      {mCat&&<Modal title="Nouvelle catégorie" onClose={()=>setMCat(false)}>
        <GI placeholder="Nom de la catégorie" value={fNCL} onChange={e=>setFNCL(e.target.value)} autoFocus/>
        <p style={{fontSize:12,fontWeight:500,letterSpacing:"0.05em",color:theme.hint,textTransform:"uppercase",marginBottom:8}}>Icône</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>{PRESET_ICONS.map(ico=>(<div key={ico} onClick={()=>setFNCI(ico)} style={{width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,cursor:"pointer",background:fNCI===ico?`${theme.accent}22`:"rgba(128,128,128,0.08)",border:fNCI===ico?`1.5px solid ${theme.accent}`:"0.5px solid rgba(128,128,128,0.15)",transition:"all 0.15s"}}>{ico}</div>))}</div>
        <p style={{fontSize:12,fontWeight:500,letterSpacing:"0.05em",color:theme.hint,textTransform:"uppercase",marginBottom:8}}>Couleur</p>
        <div style={{display:"flex",gap:10,marginBottom:16}}>{PRESET_COLORS.map((col,i)=>(<div key={i} onClick={()=>setFNCC(i)} style={{width:32,height:32,borderRadius:"50%",cursor:"pointer",background:col.bar,border:fNCC===i?"2.5px solid rgba(10,10,25,0.5)":"2.5px solid transparent",transition:"all 0.15s",transform:fNCC===i?"scale(1.15)":"scale(1)"}}/>))}</div>
        {fNCL&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:PRESET_COLORS[fNCC].bg,borderRadius:14,marginBottom:14,border:`0.5px solid ${PRESET_COLORS[fNCC].bar}33`}}><span style={{fontSize:22}}>{fNCI}</span><span style={{fontSize:15,fontWeight:400,color:theme.text,letterSpacing:"-0.01em"}}>{fNCL}</span></div>}
        <Btn onClick={addCat} grad={`linear-gradient(135deg,${PRESET_COLORS[fNCC].bar},${PRESET_COLORS[(fNCC+2)%PRESET_COLORS.length].bar})`}>Créer la catégorie</Btn>
      </Modal>}

      {/* Toast feedback */}
      {toast&&<div style={{position:"fixed",bottom:`calc(env(safe-area-inset-bottom,16px) + 100px)`,left:"50%",transform:"translateX(-50%)",zIndex:500,padding:"10px 18px",borderRadius:24,background:isDark?"rgba(40,40,50,0.96)":"rgba(20,20,30,0.92)",backdropFilter:"blur(20px) saturate(180%)",WebkitBackdropFilter:"blur(20px) saturate(180%)",color:"#fff",fontSize:13,fontWeight:500,letterSpacing:"-0.01em",boxShadow:"0 8px 24px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.08)",border:"0.5px solid rgba(255,255,255,0.08)",animation:"toastIn 0.25s cubic-bezier(.34,1.56,.64,1)",pointerEvents:"none",fontFamily:FONT,whiteSpace:"nowrap"}}>
        ✓ {toast}
      </div>}
    </ThemeCtx.Provider>
  );
}
