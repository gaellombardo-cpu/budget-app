import { useState, useEffect, useRef, useCallback } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Filler, Tooltip
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip);

/* ─── constants ─── */
const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MOS    = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const FONT   = "'DM Sans', -apple-system, 'Helvetica Neue', Helvetica, sans-serif";

const DEFAULT_CATS = [
  { id:"logement",    label:"Logement",     icon:"🏠", bg:"rgba(100,80,220,0.14)", bar:"#6450dc" },
  { id:"alim",        label:"Alimentation", icon:"🛒", bg:"rgba(220,80,80,0.12)",  bar:"#dc5050" },
  { id:"transport",   label:"Transport",    icon:"🚗", bg:"rgba(50,140,240,0.13)", bar:"#328cf0" },
  { id:"sante",       label:"Santé",        icon:"❤️", bg:"rgba(40,180,120,0.13)", bar:"#28b478" },
  { id:"loisirs",     label:"Loisirs",      icon:"✨", bg:"rgba(240,160,40,0.13)", bar:"#f0a028" },
  { id:"epargne",     label:"Épargne",      icon:"💎", bg:"rgba(60,160,220,0.13)", bar:"#3ca0dc" },
  { id:"sante2",      label:"Santé",        icon:"🏥", bg:"rgba(40,180,120,0.13)", bar:"#28b478" },
  { id:"autre",       label:"Autre",        icon:"•••", bg:"rgba(150,150,150,0.13)", bar:"#888" },
];

/* ─── helpers ─── */
const f = n => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Math.round(n||0));
function useLS(key, init) {
  const [v,sv] = useState(()=>{try{const s=localStorage.getItem(key);return s?JSON.parse(s):init;}catch{return init;}});
  useEffect(()=>{localStorage.setItem(key,JSON.stringify(v));},[key,v]);
  return [v,sv];
}
const today = new Date();

/* ─── styles ─── */
const S = {
  app: {
    maxWidth:390, minHeight:"100dvh", margin:"0 auto", position:"relative",
    overflow:"hidden", fontFamily:FONT, WebkitFontSmoothing:"antialiased",
    letterSpacing:"-0.01em", background:"transparent",
  },
  blob: (w,h,top,left,right,bottom,col,delay) => ({
    position:"fixed", width:w, height:h, borderRadius:"50%",
    background:`radial-gradient(circle, ${col} 0%, transparent 70%)`,
    filter:"blur(55px)", pointerEvents:"none", zIndex:0,
    top,left,right,bottom,
    animation:`drift ${12+delay}s ease-in-out ${delay}s infinite`,
  }),
  scroll: { overflowY:"auto", minHeight:"100dvh", paddingBottom:100, position:"relative", zIndex:1 },
  lg: {
    background:"rgba(255,255,255,0.38)",
    backdropFilter:"blur(28px) saturate(200%) brightness(1.08)",
    WebkitBackdropFilter:"blur(28px) saturate(200%) brightness(1.08)",
    border:"0.5px solid rgba(255,255,255,0.72)",
    boxShadow:"0 1px 0 0 rgba(255,255,255,0.9) inset, 0 -0.5px 0 0 rgba(0,0,0,0.04) inset, 0 8px 32px rgba(0,0,0,0.07)",
    borderRadius:22, position:"relative", overflow:"hidden",
  },
  lgDark: {
    background:"rgba(18,18,30,0.72)",
    backdropFilter:"blur(32px) saturate(180%)",
    WebkitBackdropFilter:"blur(32px) saturate(180%)",
    border:"0.5px solid rgba(255,255,255,0.12)",
    boxShadow:"0 1px 0 0 rgba(255,255,255,0.12) inset, 0 8px 32px rgba(0,0,0,0.22)",
    borderRadius:22, position:"relative", overflow:"hidden",
  },
};

/* ─── sub-components ─── */
function GlassCard({ dark=false, style={}, children }) {
  return (
    <div style={{...( dark ? S.lgDark : S.lg ), ...style}}>
      <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,rgba(255,255,255,${dark?0.07:0.18}) 0%,transparent 60%)`,pointerEvents:"none",borderRadius:"inherit"}}/>
      <div style={{position:"relative",zIndex:1}}>{children}</div>
    </div>
  );
}

function Ring({ pct, size=38, stroke=3.5, color="#6450dc" }) {
  const r=(size-stroke)/2, circ=2*Math.PI*r, dash=circ*Math.min(Math.max(pct,0),1);
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)",flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={pct>1?"#c0392b":color}
        strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{transition:"stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)"}}/>
    </svg>
  );
}

function HeroAmount({ value, dark=false }) {
  const col = value < 0 ? "#c0392b" : (dark ? "rgba(255,255,255,0.92)" : "rgba(10,10,25,0.9)");
  return <div style={{fontSize:52,fontWeight:200,letterSpacing:"-0.05em",lineHeight:1,color:col}}>{f(value)}</div>;
}

function BarRow({ label, value, max, color, rightLabel }) {
  const pct = max>0 ? Math.min(100,Math.round(value/max*100)) : 0;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:"0.5px solid rgba(0,0,0,0.05)"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:400,color:"rgba(10,10,25,0.82)",letterSpacing:"-0.02em"}}>{label}</div>
        <div style={{height:2.5,background:"rgba(0,0,0,0.06)",borderRadius:2,marginTop:5,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:2,background:color,width:`${pct}%`,transition:"width 0.7s cubic-bezier(.4,0,.2,1)"}}/>
        </div>
      </div>
      <div style={{fontSize:15,fontWeight:300,color:"rgba(10,10,25,0.72)",flexShrink:0,letterSpacing:"-0.03em"}}>{rightLabel||f(value)}</div>
    </div>
  );
}

/* ─── modal components ─── */
function Modal({ title, onClose, children }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"rgba(0,0,0,0.15)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:390,background:"rgba(255,255,255,0.88)",backdropFilter:"blur(40px) saturate(200%)",WebkitBackdropFilter:"blur(40px) saturate(200%)",borderRadius:"28px 28px 0 0",padding:"0 20px 48px",borderTop:"0.5px solid rgba(255,255,255,0.9)",boxShadow:"0 -8px 40px rgba(0,0,0,0.12)"}}>
        <div style={{width:36,height:4,background:"rgba(0,0,0,0.13)",borderRadius:2,margin:"10px auto 22px"}}/>
        <div style={{fontSize:18,fontWeight:600,letterSpacing:"-0.03em",color:"rgba(10,10,25,0.88)",marginBottom:18}}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function GlassInput({ placeholder, type="text", value, onChange, autoFocus }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} autoFocus={autoFocus}
      style={{width:"100%",background:"rgba(255,255,255,0.6)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"0.5px solid rgba(255,255,255,0.8)",borderRadius:14,padding:"13px 16px",fontSize:16,fontWeight:400,letterSpacing:"-0.02em",color:"rgba(10,10,25,0.88)",outline:"none",fontFamily:FONT,boxShadow:"inset 0 2px 8px rgba(0,0,0,0.04),0 1px 0 rgba(255,255,255,0.9)",marginBottom:10}}/>
  );
}

function PrimaryBtn({ children, onClick, color="linear-gradient(135deg,#6450dc,#3ca0dc)" }) {
  return (
    <button onClick={onClick} style={{width:"100%",height:52,border:"none",borderRadius:16,background:color,color:"#fff",fontSize:15,fontWeight:600,letterSpacing:"-0.02em",cursor:"pointer",fontFamily:FONT,marginTop:6,boxShadow:"0 8px 24px rgba(100,80,220,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",transition:"transform 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
      {children}
    </button>
  );
}

/* ─── chart helpers ─── */
const chartDefaults = {
  responsive:true, maintainAspectRatio:false,
  plugins:{legend:{display:false},tooltip:{backgroundColor:"rgba(20,20,40,0.88)",titleColor:"rgba(255,255,255,0.75)",bodyColor:"rgba(255,255,255,0.6)",borderColor:"rgba(255,255,255,0.1)",borderWidth:0.5,cornerRadius:10,padding:10,titleFont:{family:FONT,size:12},bodyFont:{family:FONT,size:12}}},
};
const scaleStyle = { ticks:{font:{family:FONT,size:10},color:"rgba(20,20,40,0.38)"}, grid:{color:"rgba(0,0,0,0.04)"}, border:{display:false} };

/* ══════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════ */
export default function App() {
  const [view,    setView]   = useState("month");
  const [curM,    setCurM]   = useState(today.getMonth());
  const [curY,    setCurY]   = useState(today.getFullYear());
  const [tab,     setTab]    = useState(0);

  /* persistent data */
  const [salary,   setSalary]   = useLS("lg_salary", "");
  const [charges,  setCharges]  = useLS("lg_charges", []);
  const [expenses, setExpenses] = useLS("lg_expenses", []);

  /* modals */
  const [modalSalary,  setModalSalary]  = useState(false);
  const [modalCharge,  setModalCharge]  = useState(false);
  const [modalExpense, setModalExpense] = useState(false);

  /* form state */
  const [fSal,    setFSal]   = useState("");
  const [fCName,  setFCName] = useState("");
  const [fCAmt,   setFCAmt]  = useState("");
  const [fECat,   setFECat]  = useState(DEFAULT_CATS[0].id);
  const [fEAmt,   setFEAmt]  = useState("");
  const [fENote,  setFENote] = useState("");

  const salaryNum = parseFloat(salary)||0;
  const totalCharges = charges.reduce((s,c)=>s+c.amount,0);
  const disponible = salaryNum - totalCharges;

  /* expenses for a given month/year */
  const monthExpenses = expenses.filter(e=>e.month===curM&&e.year===curY);
  const totalSpent = monthExpenses.reduce((s,e)=>s+e.amount,0);
  const restant = disponible - totalSpent;
  const spentCat = id => monthExpenses.filter(e=>e.catId===id).reduce((s,e)=>s+e.amount,0);

  /* yearly */
  function getMonthTotals(year) {
    return Array.from({length:12},(_,m)=>{
      const me = expenses.filter(e=>e.month===m&&e.year===year);
      const tot = me.reduce((s,e)=>s+e.amount,0);
      return { total:tot, saved: disponible-tot };
    });
  }

  /* navigation */
  function prev() {
    if(view==="month"){let m=curM-1,y=curY;if(m<0){m=11;y--;}setCurM(m);setCurY(y);}
    else setCurY(y=>y-1);
  }
  function next() {
    if(view==="month"){let m=curM+1,y=curY;if(m>11){m=0;y++;}setCurM(m);setCurY(y);}
    else setCurY(y=>y+1);
  }

  function addCharge() {
    if(!fCName||!fCAmt) return;
    setCharges(p=>[...p,{id:Date.now(),label:fCName,amount:parseFloat(fCAmt)}]);
    setFCName("");setFCAmt("");setModalCharge(false);
  }
  function addExpense() {
    if(!fEAmt) return;
    setExpenses(p=>[...p,{id:Date.now(),catId:fECat,amount:parseFloat(fEAmt),note:fENote,month:curM,year:curY,date:new Date().toLocaleDateString("fr-FR")}]);
    setFEAmt("");setFENote("");setModalExpense(false);
  }

  const periodLabel = view==="month" ? `${MONTHS[curM]} ${curY}` : `${curY}`;
  const pct = n => salaryNum>0 ? Math.min(100,Math.round(n/salaryNum*100)) : 0;
  const cumSaved = () => { let s=0; for(let m=0;m<=curM;m++){const me=expenses.filter(e=>e.month===m&&e.year===curY);const tot=me.reduce((a,e)=>a+e.amount,0);s+=disponible-tot;} return s; };

  /* ── RENDER VIEWS ── */
  function renderHomeMonth() {
    const barCol = restant>=0 ? "linear-gradient(90deg,#5a8fdb,#8a5fdb)" : "linear-gradient(90deg,#db5a5a,#db8a5a)";
    const months6 = []; for(let i=Math.max(0,curM-5);i<=curM;i++) months6.push(i);
    const line6tots = months6.map(m=>expenses.filter(e=>e.month===m&&e.year===curY).reduce((s,e)=>s+e.amount,0));
    const line6savs = months6.map(m=>Math.max(0,disponible-expenses.filter(e=>e.month===m&&e.year===curY).reduce((s,e)=>s+e.amount,0)));
    const lineData = {
      labels:months6.map(m=>MOS[m]),
      datasets:[
        {label:"Dépenses",data:line6tots,borderColor:"#dc5050",backgroundColor:"rgba(220,80,80,0.06)",tension:0.45,fill:true,pointRadius:3,pointBackgroundColor:"#dc5050",pointBorderColor:"rgba(255,255,255,0.9)",pointBorderWidth:1.5,borderWidth:1.5},
        {label:"Épargne",data:line6savs,borderColor:"#28b478",backgroundColor:"rgba(40,180,120,0.06)",tension:0.45,fill:true,pointRadius:3,pointBackgroundColor:"#28b478",pointBorderColor:"rgba(255,255,255,0.9)",pointBorderWidth:1.5,borderWidth:1.5,borderDash:[5,4]},
      ]
    };
    return (
      <>
        {/* hero */}
        <GlassCard style={{margin:"14px 16px 0",padding:"22px 22px 20px"}}>
          <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.06em",color:"rgba(20,20,40,0.38)",textTransform:"uppercase",marginBottom:6}}>Budget disponible</p>
          <HeroAmount value={restant}/>
          <p style={{fontSize:13,color:"rgba(20,20,40,0.42)",marginTop:8,letterSpacing:"-0.01em"}}>sur {f(salaryNum)} de salaire · {pct(totalSpent)}% dépensé</p>
          <div style={{height:3,background:"rgba(0,0,0,0.07)",borderRadius:2,marginTop:18,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:2,background:barCol,width:`${pct(totalSpent)}%`,transition:"width 0.8s cubic-bezier(.4,0,.2,1)"}}/>
          </div>
        </GlassCard>

        {/* kpis */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"10px 16px 0"}}>
          {[
            {label:"Dépensé",val:f(totalSpent),cls:""},
            {label:"Économisé",val:(restant>=0?"+":"")+f(restant),cls:restant>=0?"pos":"neg"},
            {label:"Taux épargne",val:`${Math.round(restant/salaryNum*100)}%`,cls:"blu"},
            {label:"Cumulé "+curY,val:f(cumSaved()),cls:"blu"},
          ].map(k=>(
            <GlassCard key={k.label} style={{padding:16}}>
              <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.06em",color:"rgba(20,20,40,0.36)",textTransform:"uppercase",marginBottom:5}}>{k.label}</p>
              <p style={{fontSize:23,fontWeight:200,letterSpacing:"-0.04em",color:k.cls==="pos"?"#1a8a5e":k.cls==="neg"?"#c0392b":k.cls==="blu"?"#1a6aaa":"rgba(10,10,25,0.88)"}}>{k.val}</p>
            </GlassCard>
          ))}
        </div>

        {/* add expense cta */}
        <div style={{margin:"12px 16px 0"}}>
          <PrimaryBtn onClick={()=>setModalExpense(true)}>＋ Ajouter une dépense</PrimaryBtn>
        </div>

        {/* categories */}
        <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.07em",color:"rgba(20,20,40,0.36)",textTransform:"uppercase",padding:"20px 20px 10px"}}>Répartition</p>
        <GlassCard style={{margin:"0 16px",padding:"8px 16px"}}>
          {DEFAULT_CATS.slice(0,6).map(c=>{
            const spent=spentCat(c.id);
            return (
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:"0.5px solid rgba(0,0,0,0.05)"}}>
                <div style={{width:36,height:36,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                  {c.icon}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:400,color:"rgba(10,10,25,0.82)",letterSpacing:"-0.02em"}}>{c.label}</div>
                  <div style={{height:2.5,background:"rgba(0,0,0,0.06)",borderRadius:2,marginTop:5,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:2,background:c.bar,width:`${pct(spent)}%`,transition:"width 0.7s cubic-bezier(.4,0,.2,1)"}}/>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Ring pct={salaryNum>0?spent/salaryNum:0} color={c.bar}/>
                  <div style={{fontSize:15,fontWeight:300,color:"rgba(10,10,25,0.72)",flexShrink:0,letterSpacing:"-0.03em",minWidth:52,textAlign:"right"}}>{f(spent)}</div>
                </div>
              </div>
            );
          })}
        </GlassCard>

        {/* 6-month trend */}
        <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.07em",color:"rgba(20,20,40,0.36)",textTransform:"uppercase",padding:"20px 20px 10px"}}>Tendance 6 mois</p>
        <GlassCard style={{margin:"0 16px",padding:16}}>
          <div style={{position:"relative",width:"100%",height:160}}>
            <Line data={lineData} options={{...chartDefaults,scales:{y:{...scaleStyle,ticks:{...scaleStyle.ticks,callback:v=>v>=1000?(v/1000).toFixed(1)+"k":v}},x:{...scaleStyle,grid:{display:false}}}}}/>
          </div>
          <div style={{display:"flex",gap:18,marginTop:10}}>
            {[["#dc5050","Dépenses",false],["#28b478","Épargne",true]].map(([col,lbl,dashed])=>(
              <span key={lbl} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"rgba(20,20,40,0.4)",fontWeight:500,letterSpacing:"-0.01em"}}>
                <span style={{width:14,height:0,borderTop:`2px ${dashed?"dashed":"solid"} ${col}`,display:"inline-block"}}/>
                {lbl}
              </span>
            ))}
          </div>
        </GlassCard>

        {/* savings recap */}
        <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.07em",color:"rgba(20,20,40,0.36)",textTransform:"uppercase",padding:"20px 20px 10px"}}>Bilan épargne</p>
        <GlassCard style={{margin:"0 16px",padding:"4px 20px 4px"}}>
          {[
            ["Épargne budgétée",f(totalCharges>0?salaryNum-totalCharges:0),""],
            ["Épargne réelle",(restant>=0?"+":"")+f(restant),restant>=0?"pos":"neg"],
            ["Cumul depuis jan.",f(cumSaved()),"blu"],
            ["Projection annuelle",f(restant*12),""],
          ].map(([lbl,val,cls])=>(
            <div key={lbl} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"0.5px solid rgba(0,0,0,0.05)"}}>
              <span style={{fontSize:14,color:"rgba(20,20,40,0.52)",letterSpacing:"-0.02em"}}>{lbl}</span>
              <span style={{fontSize:15,fontWeight:400,letterSpacing:"-0.03em",color:cls==="pos"?"#1a8a5e":cls==="neg"?"#c0392b":cls==="blu"?"#1a6aaa":"rgba(10,10,25,0.88)"}}>{val}</span>
            </div>
          ))}
        </GlassCard>
        <div style={{height:16}}/>
      </>
    );
  }

  function renderHomeYear() {
    const mts = getMonthTotals(curY);
    const totY = mts.reduce((s,m)=>s+m.total,0);
    const savY = mts.reduce((s,m)=>s+m.saved,0);
    const totSal = salaryNum*12;
    const barData = {
      labels:MOS,
      datasets:[{data:mts.map(m=>Math.max(0,m.saved)),backgroundColor:mts.map(m=>m.saved>=0?"rgba(40,180,120,0.72)":"rgba(220,80,80,0.62)"),borderRadius:5,borderSkipped:false}]
    };
    return (
      <>
        <GlassCard dark style={{margin:"14px 16px 0",padding:"22px 22px 20px"}}>
          <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.06em",color:"rgba(255,255,255,0.32)",textTransform:"uppercase",marginBottom:6}}>Économies {curY}</p>
          <HeroAmount value={savY} dark/>
          <p style={{fontSize:13,color:"rgba(255,255,255,0.38)",marginTop:8,letterSpacing:"-0.01em"}}>Taux annuel {Math.round(savY/totSal*100)}% · sur {f(totSal)}</p>
          <div style={{height:3,background:"rgba(255,255,255,0.08)",borderRadius:2,marginTop:18,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:2,background:"linear-gradient(90deg,#28b478,#3ca0dc)",width:`${Math.min(100,Math.round(savY/totSal*100))}%`,transition:"width 0.8s cubic-bezier(.4,0,.2,1)"}}/>
          </div>
        </GlassCard>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"10px 16px 0"}}>
          {[
            {label:"Revenus",val:f(totSal)},
            {label:"Dépenses",val:f(totY)},
            {label:"Moy. épargne",val:f(savY/12),pos:true},
            {label:"Proj. 5 ans",val:f(savY*5),blu:true},
          ].map(k=>(
            <GlassCard key={k.label} style={{padding:16}}>
              <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.06em",color:"rgba(20,20,40,0.36)",textTransform:"uppercase",marginBottom:5}}>{k.label}</p>
              <p style={{fontSize:23,fontWeight:200,letterSpacing:"-0.04em",color:k.pos?"#1a8a5e":k.blu?"#1a6aaa":"rgba(10,10,25,0.88)"}}>{k.val}</p>
            </GlassCard>
          ))}
        </div>

        <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.07em",color:"rgba(20,20,40,0.36)",textTransform:"uppercase",padding:"20px 20px 10px"}}>Sélectionner un mois</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,margin:"0 16px"}}>
          {MOS.map((ms,i)=>{
            const m=mts[i];
            const active=i===curM;
            return (
              <div key={i} onClick={()=>{setCurM(i);setView("month");}}
                style={{padding:"9px 4px",borderRadius:12,cursor:"pointer",textAlign:"center",
                  background:active?"rgba(255,255,255,0.78)":"rgba(255,255,255,0.32)",
                  backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
                  border:active?"0.5px solid rgba(255,255,255,0.9)":"0.5px solid rgba(255,255,255,0.6)",
                  boxShadow:active?"0 4px 16px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.95) inset":"none",
                  transition:"all 0.18s"}}>
                <div style={{fontSize:12,fontWeight:500,color:"rgba(10,10,25,0.78)",letterSpacing:"-0.02em"}}>{ms}</div>
                <div style={{fontSize:10,color:"rgba(20,20,40,0.36)",marginTop:2}}>{f(m.total)}</div>
                <div style={{width:5,height:5,borderRadius:"50%",margin:"5px auto 0",background:m.saved>=0?"#28b478":"#dc5050"}}/>
              </div>
            );
          })}
        </div>

        <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.07em",color:"rgba(20,20,40,0.36)",textTransform:"uppercase",padding:"20px 20px 10px"}}>Épargne mensuelle</p>
        <GlassCard style={{margin:"0 16px",padding:16}}>
          <div style={{position:"relative",width:"100%",height:160}}>
            <Bar data={barData} options={{...chartDefaults,scales:{y:{...scaleStyle,ticks:{...scaleStyle.ticks,callback:v=>v+"€"}},x:{...scaleStyle,grid:{display:false}}}}}/>
          </div>
        </GlassCard>

        <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.07em",color:"rgba(20,20,40,0.36)",textTransform:"uppercase",padding:"20px 20px 10px"}}>Bilan annuel</p>
        <GlassCard style={{margin:"0 16px",padding:"4px 20px 4px"}}>
          {[
            ["Mois dans le vert",`${mts.filter(m=>m.saved>=0).length} / 12`,"pos"],
            ["Mois dans le rouge",`${mts.filter(m=>m.saved<0).length} / 12`,"neg"],
            ["Projection 10 ans",f(savY*10),"blu"],
          ].map(([lbl,val,cls])=>(
            <div key={lbl} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"0.5px solid rgba(0,0,0,0.05)"}}>
              <span style={{fontSize:14,color:"rgba(20,20,40,0.52)",letterSpacing:"-0.02em"}}>{lbl}</span>
              <span style={{fontSize:15,fontWeight:400,letterSpacing:"-0.03em",color:cls==="pos"?"#1a8a5e":cls==="neg"?"#c0392b":"#1a6aaa"}}>{val}</span>
            </div>
          ))}
        </GlassCard>
        <div style={{height:16}}/>
      </>
    );
  }

  function renderCharges() {
    return (
      <>
        <GlassCard style={{margin:"14px 16px 0",padding:"22px 22px 20px"}}>
          <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.06em",color:"rgba(20,20,40,0.38)",textTransform:"uppercase",marginBottom:6}}>Charges fixes</p>
          <HeroAmount value={totalCharges}/>
          <p style={{fontSize:13,color:"rgba(20,20,40,0.42)",marginTop:8}}>{salaryNum>0?`${Math.round(totalCharges/salaryNum*100)}% du salaire`:"Saisissez votre salaire"}</p>
        </GlassCard>
        <div style={{margin:"12px 16px 0"}}>
          <PrimaryBtn onClick={()=>setModalCharge(true)} color="linear-gradient(135deg,#328cf0,#6450dc)">＋ Ajouter une charge</PrimaryBtn>
        </div>
        {charges.length>0 && (
          <>
            <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.07em",color:"rgba(20,20,40,0.36)",textTransform:"uppercase",padding:"20px 20px 10px"}}>Détail mensuel</p>
            <GlassCard style={{margin:"0 16px",padding:"8px 16px"}}>
              {charges.map(c=>(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:"0.5px solid rgba(0,0,0,0.05)"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:400,color:"rgba(10,10,25,0.82)",letterSpacing:"-0.02em"}}>{c.label}</div>
                    <div style={{height:2.5,background:"rgba(0,0,0,0.06)",borderRadius:2,marginTop:5,overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:2,background:"#8870e8",width:`${totalCharges>0?Math.round(c.amount/totalCharges*100):0}%`,transition:"width 0.7s cubic-bezier(.4,0,.2,1)"}}/>
                    </div>
                  </div>
                  <div style={{fontSize:15,fontWeight:300,color:"rgba(10,10,25,0.72)",letterSpacing:"-0.03em"}}>{f(c.amount)}</div>
                  <button onClick={()=>setCharges(p=>p.filter(x=>x.id!==c.id))}
                    style={{background:"rgba(255,59,48,0.1)",border:"none",color:"#FF3B30",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0 2px",borderTop:"0.5px solid rgba(0,0,0,0.06)",marginTop:4}}>
                <span style={{fontSize:13,fontWeight:500,color:"rgba(20,20,40,0.5)",letterSpacing:"-0.01em"}}>Total</span>
                <span style={{fontSize:16,fontWeight:300,letterSpacing:"-0.04em",color:"rgba(10,10,25,0.88)"}}>{f(totalCharges)}</span>
              </div>
            </GlassCard>
          </>
        )}
        <div style={{height:16}}/>
      </>
    );
  }

  function renderHistory() {
    const all = [...expenses].filter(e=>e.month===curM&&e.year===curY).reverse();
    const total = all.reduce((s,e)=>s+e.amount,0);
    return (
      <>
        <GlassCard style={{margin:"14px 16px 0",padding:"22px 22px 20px"}}>
          <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.06em",color:"rgba(20,20,40,0.38)",textTransform:"uppercase",marginBottom:6}}>Ce mois · {all.length} opération{all.length!==1?"s":""}</p>
          <HeroAmount value={total}/>
          <p style={{fontSize:13,color:"rgba(20,20,40,0.42)",marginTop:8}}>dépensé en {MONTHS[curM]} {curY}</p>
        </GlassCard>
        <div style={{margin:"12px 16px 0"}}>
          <PrimaryBtn onClick={()=>setModalExpense(true)}>＋ Ajouter une dépense</PrimaryBtn>
        </div>
        {all.length>0 && (
          <>
            <p style={{fontSize:11,fontWeight:500,letterSpacing:"0.07em",color:"rgba(20,20,40,0.36)",textTransform:"uppercase",padding:"20px 20px 10px"}}>Opérations récentes</p>
            <GlassCard style={{margin:"0 16px",padding:"8px 16px"}}>
              {all.map(e=>{
                const c=DEFAULT_CATS.find(x=>x.id===e.catId)||DEFAULT_CATS[0];
                return (
                  <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:"0.5px solid rgba(0,0,0,0.05)"}}>
                    <div style={{width:36,height:36,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:400,color:"rgba(10,10,25,0.82)",letterSpacing:"-0.02em"}}>{e.note||c.label}</div>
                      <div style={{fontSize:11,color:"rgba(20,20,40,0.36)",marginTop:3,letterSpacing:"-0.01em"}}>{c.label} · {e.date}</div>
                    </div>
                    <div style={{fontSize:15,fontWeight:300,color:"#c0392b",letterSpacing:"-0.03em"}}>−{f(e.amount)}</div>
                    <button onClick={()=>setExpenses(p=>p.filter(x=>x.id!==e.id))}
                      style={{background:"rgba(255,59,48,0.1)",border:"none",color:"#FF3B30",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
                  </div>
                );
              })}
            </GlassCard>
          </>
        )}
        <div style={{height:16}}/>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes drift {
          0%,100%{transform:translate(0,0) scale(1)}
          33%{transform:translate(24px,18px) scale(1.06)}
          66%{transform:translate(-16px,28px) scale(0.94)}
        }
        input::placeholder{color:rgba(20,20,40,0.3)}
        *{box-sizing:border-box;margin:0;padding:0}
      `}</style>

      {/* background blobs */}
      <div style={S.blob(260,260,"-60px","0",undefined,undefined,"rgba(120,100,255,0.22)",0)}/>
      <div style={S.blob(220,220,"30%",undefined,"0",undefined,"rgba(255,90,130,0.18)",-5)}/>
      <div style={S.blob(200,200,undefined,"30px",undefined,"200px","rgba(60,180,255,0.2)",-9)}/>

      <div style={S.app}>
        <div style={S.scroll}>
          {/* status bar */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 24px 0",fontSize:15,fontWeight:600,color:"rgba(20,20,40,0.85)",letterSpacing:"-0.02em"}}>
            <span>{String(today.getHours()).padStart(2,"0")}:{String(today.getMinutes()).padStart(2,"0")}</span>
            <span style={{fontSize:13}}>●●● WiFi ▮▮▮</span>
          </div>

          {/* salary banner if not set */}
          {!salary && (
            <div onClick={()=>{setFSal("");setModalSalary(true);}}
              style={{margin:"12px 16px 0",padding:"14px 18px",background:"rgba(100,80,220,0.1)",borderRadius:16,border:"0.5px solid rgba(100,80,220,0.2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:14,fontWeight:500,color:"rgba(10,10,25,0.7)",letterSpacing:"-0.02em"}}>💼 Saisir mon salaire net</span>
              <span style={{color:"rgba(100,80,220,0.7)",fontSize:18}}>›</span>
            </div>
          )}
          {salary && (
            <div onClick={()=>{setFSal(salary);setModalSalary(true);}}
              style={{margin:"12px 16px 0",padding:"11px 18px",background:"rgba(255,255,255,0.3)",borderRadius:14,border:"0.5px solid rgba(255,255,255,0.6)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:13,color:"rgba(20,20,40,0.45)",letterSpacing:"-0.01em"}}>Salaire net mensuel</span>
              <span style={{fontSize:16,fontWeight:300,letterSpacing:"-0.03em",color:"rgba(10,10,25,0.8)"}}>{f(salaryNum)} ›</span>
            </div>
          )}

          {/* view toggle */}
          <div style={{display:"flex",margin:"10px 16px 0",background:"rgba(255,255,255,0.3)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"0.5px solid rgba(255,255,255,0.65)",borderRadius:12,padding:3,gap:3,boxShadow:"0 1px 0 rgba(255,255,255,0.8) inset"}}>
            {["Mois","Année"].map((lbl,i)=>{
              const on=(i===0&&view==="month")||(i===1&&view==="year");
              return <button key={lbl} onClick={()=>setView(i===0?"month":"year")}
                style={{flex:1,padding:"7px 0",border:"none",borderRadius:9,fontSize:13,fontWeight:on?600:500,cursor:"pointer",fontFamily:FONT,letterSpacing:"-0.02em",transition:"all 0.22s cubic-bezier(.4,0,.2,1)",background:on?"rgba(255,255,255,0.82)":"transparent",color:on?"rgba(20,20,40,0.88)":"rgba(20,20,40,0.45)",boxShadow:on?"0 1px 4px rgba(0,0,0,0.1), 0 0.5px 0 rgba(255,255,255,0.9) inset":"none"}}>{lbl}</button>;
            })}
          </div>

          {/* nav row */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px 0"}}>
            <button onClick={prev} style={{width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.4)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"0.5px solid rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:17,color:"rgba(20,20,40,0.7)",boxShadow:"0 1px 0 rgba(255,255,255,0.85) inset",fontFamily:FONT}}>‹</button>
            <span style={{fontSize:17,fontWeight:600,color:"rgba(20,20,40,0.88)",letterSpacing:"-0.03em"}}>{periodLabel}</span>
            <button onClick={next} style={{width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.4)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",border:"0.5px solid rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:17,color:"rgba(20,20,40,0.7)",boxShadow:"0 1px 0 rgba(255,255,255,0.85) inset",fontFamily:FONT}}>›</button>
          </div>

          {/* main content */}
          {tab===0 && (view==="month" ? renderHomeMonth() : renderHomeYear())}
          {tab===1 && renderCharges()}
          {tab===2 && renderHistory()}
        </div>

        {/* tab bar */}
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:390,display:"flex",padding:"8px 16px 34px",gap:4,background:"rgba(255,255,255,0.35)",backdropFilter:"blur(28px) saturate(200%)",WebkitBackdropFilter:"blur(28px) saturate(200%)",borderTop:"0.5px solid rgba(255,255,255,0.68)",boxShadow:"0 -0.5px 0 rgba(0,0,0,0.05)",zIndex:100}}>
          {[["◎","Accueil"],["≡","Charges"],["◷","Historique"]].map(([ico,lbl],i)=>(
            <div key={i} onClick={()=>setTab(i)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",padding:"6px 0",borderRadius:12}}>
              <span style={{fontSize:20,transition:"transform 0.25s cubic-bezier(.34,1.56,.64,1)",transform:tab===i?"scale(1.15)":"scale(1)"}}>{ico}</span>
              <span style={{fontSize:10,fontWeight:tab===i?600:500,letterSpacing:"0.01em",color:tab===i?"rgba(10,10,25,0.78)":"rgba(20,20,40,0.35)"}}>{lbl}</span>
              {tab===i && <div style={{width:4,height:4,borderRadius:"50%",background:"rgba(100,100,200,0.7)"}}/>}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL SALARY */}
      {modalSalary && (
        <Modal title="💼 Mon salaire net" onClose={()=>setModalSalary(false)}>
          <GlassInput placeholder="Ex : 2 500" type="number" value={fSal} onChange={e=>setFSal(e.target.value)} autoFocus/>
          <PrimaryBtn onClick={()=>{setSalary(fSal);setModalSalary(false);}}>Enregistrer</PrimaryBtn>
        </Modal>
      )}

      {/* MODAL CHARGE */}
      {modalCharge && (
        <Modal title="Nouvelle charge" onClose={()=>setModalCharge(false)}>
          <GlassInput placeholder="Nom · ex : Loyer, Netflix…" value={fCName} onChange={e=>setFCName(e.target.value)} autoFocus/>
          <GlassInput placeholder="Montant en €" type="number" value={fCAmt} onChange={e=>setFCAmt(e.target.value)}/>
          <PrimaryBtn onClick={addCharge} color="linear-gradient(135deg,#328cf0,#6450dc)">Ajouter</PrimaryBtn>
        </Modal>
      )}

      {/* MODAL EXPENSE */}
      {modalExpense && (
        <Modal title="Nouvelle dépense" onClose={()=>setModalExpense(false)}>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
            {DEFAULT_CATS.slice(0,6).map(c=>{
              const sel=fECat===c.id;
              return (
                <div key={c.id} onClick={()=>setFECat(c.id)}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderRadius:20,fontSize:13,fontWeight:500,cursor:"pointer",transition:"all 0.2s cubic-bezier(.34,1.56,.64,1)",border:sel?"none":"0.5px solid rgba(0,0,0,0.08)",background:sel?c.bar:"rgba(255,255,255,0.5)",color:sel?"#fff":"rgba(20,20,40,0.65)",transform:sel?"scale(1.04)":"scale(1)",letterSpacing:"-0.01em"}}>
                  {c.icon} {c.label}
                </div>
              );
            })}
          </div>
          <GlassInput placeholder="Montant en €" type="number" value={fEAmt} onChange={e=>setFEAmt(e.target.value)} autoFocus/>
          <GlassInput placeholder="Note (optionnel)" value={fENote} onChange={e=>setFENote(e.target.value)}/>
          <PrimaryBtn onClick={addExpense}>Enregistrer</PrimaryBtn>
        </Modal>
      )}
    </>
  );
}
