import React,{memo,useCallback}from'react';
import{useSelector}from'react-redux';
import{useNavigate}from'react-router-dom';
import{motion,useReducedMotion}from'framer-motion';
import{ArrowRight,Sparkles,CheckCircle2,Image as ImageIcon,Headphones,Gamepad2,BarChart3,BookOpen,ShieldCheck,Crown,MapPin,Flame,Coins,Gem,Lock,Compass,Trophy,}from'lucide-react';
import Button from'../ui/Button';
import herosectionimg from'../assets/hero/herosectionimg.webp';
const LEARNING_FEATURES=[
{icon:ImageIcon,title:'Real-Life\nLearning',desc:'Everyday words\nand situations',iconBg:'bg-rose-100',iconColor:'text-rose-500'},
{icon:Headphones,title:'Native\nAudio',desc:'Hear natural\npronunciation',iconBg:'bg-purple-100',iconColor:'text-purple-600'},
{icon:Gamepad2,title:'Interactive\nPractice',desc:'Fun quizzes\nand activities',iconBg:'bg-blue-100',iconColor:'text-blue-500'},
{icon:BarChart3,title:'Learning\nProgress',desc:"Track your\nchild's journey",iconBg:'bg-amber-100',iconColor:'text-amber-500'},
];
const BOTTOM_STATS=[
{icon:ImageIcon,title:'Visual Learning',desc:'Learn with pictures\nand audio',iconColor:'text-blue-600',iconBg:'bg-blue-50'},
{icon:BookOpen,title:'Everyday Topics',desc:'Home, school, food, travel\nand more',iconColor:'text-emerald-500',iconBg:'bg-emerald-50'},
{icon:ShieldCheck,title:'Safe for Kids',desc:'A child-friendly and secure\nlearning experience',iconColor:'text-teal-500',iconBg:'bg-teal-50'},
{icon:Crown,title:'Free + Premium',desc:'Start free, unlock more\nwith Premium',iconColor:'text-amber-500',iconBg:'bg-amber-50'},
];
const GAME_BADGES=[
{icon:Flame,title:'Daily Streak',sub:'Build Habits 🔥',wrap:'bg-orange-50 border-orange-100',iconWrap:'bg-orange-500',text:'text-orange-600'},
{icon:Coins,title:'Earn Coins',sub:'Unlock Rewards 🪙',wrap:'bg-amber-50 border-amber-100',iconWrap:'bg-amber-500',text:'text-amber-600'},
{icon:Gem,title:'Collect Gems',sub:'Special Milestones 💎',wrap:'bg-cyan-50 border-cyan-100',iconWrap:'bg-cyan-500',text:'text-cyan-600'},
{icon:Trophy,title:'Level Progress',sub:'Earn XP 🌟',wrap:'bg-purple-50 border-purple-100',iconWrap:'bg-purple-500',text:'text-purple-600'},
];
const TRUST_BADGES=['Free to Start','Learn with Real Pictures','Child-Friendly Learning'];
const containerVariants={
hidden:{opacity:0},
visible:{opacity:1,transition:{staggerChildren:0.12,delayChildren:0.1}},
};
const itemVariants={
hidden:{opacity:0,y:20},
visible:{opacity:1,y:0,transition:{duration:0.5,ease:'easeOut'}},
};
const loop=(duration)=>({duration,repeat:Infinity,ease:'easeInOut'});
const FeatureCard=memo(({icon:Icon,title,desc,iconBg,iconColor,reduceMotion})=>(
<motion.div whileHover={reduceMotion?{}:{y:-3}} whileTap={{scale:0.98}} className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl bg-white/95 shadow-[0_5px_18px_rgba(15,23,42,0.07)] border border-gray-200 transition-all duration-200 hover:border-teal-300 hover:shadow-[0_10px_26px_rgba(15,23,42,0.12)]">
<div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-2 shrink-0 ${iconBg} ${iconColor}`}>
<Icon size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} aria-hidden="true"/>
</div>
<h3 className="text-[11px] sm:text-[13px] font-bold text-slate-800 whitespace-pre-line leading-tight mb-0.5">{title}</h3>
<p className="text-[9px] sm:text-[10px] text-slate-500 whitespace-pre-line leading-tight">{desc}</p>
</motion.div>
));
const StatItem=memo(({icon:Icon,title,desc,iconBg,iconColor})=>(
<motion.div whileHover={{scale:1.02}} className="flex items-center gap-2 sm:gap-3 flex-1 w-full justify-start lg:justify-center">
<div className={`p-1.5 sm:p-2.5 rounded-full sm:rounded-[14px] ${iconBg} ${iconColor} shrink-0`}>
<Icon size={16} className="sm:w-[22px] sm:h-[22px]" strokeWidth={2.5} aria-hidden="true"/>
</div>
<div>
<h4 className="text-[11px] sm:text-[13px] font-bold text-[#1e293b] mb-0.5 leading-tight">{title}</h4>
<p className="text-[9px] sm:text-[11px] text-slate-500 whitespace-pre-line leading-[1.2] font-medium hidden sm:block">{desc}</p>
</div>
</motion.div>
));
const BadgeCard=memo(({icon:Icon,title,sub,wrap,iconWrap,text})=>(
<div className={`flex items-center gap-3 p-3 rounded-2xl border ${wrap}`}>
<div className={`p-2.5 text-white rounded-xl ${iconWrap}`}>
<Icon size={20} aria-hidden="true"/>
</div>
<div>
<h4 className="text-xs font-extrabold text-slate-800">{title}</h4>
<p className={`text-[11px] font-bold ${text}`}>{sub}</p>
</div>
</div>
));
const LockedNode=memo(({label,className=''})=>ucel=>(
<div className={`flex flex-col items-center ${className}`}>
<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/60 border-2 border-white/40 backdrop-blur-md flex items-center justify-center text-white">
<Lock size={20} aria-hidden="true"/>
</div>
<span className="mt-2 text-[10px] sm:text-xs font-semibold text-white/80">{label}</span>
</div>
));
const HeroSection=({onGetStarted})=>{
const navigate=useNavigate();
const reduceMotion=useReducedMotion();
const isAuthenticated=useSelector((s)=>s.auth.isAuthenticated);
const userName=useSelector((s)=>s.auth.user?.name??s.user.user?.name);
const goToMap=useCallback(()=>navigate('/adventure-map'),[navigate]);
const handleAction=useCallback(()=>(isAuthenticated?goToMap():onGetStarted?.()),[isAuthenticated,goToMap,onGetStarted]);
const float=(anim,duration)=>reduceMotion?{}:{animate:anim,transition:loop(duration)};
return(
<div className="w-full flex flex-col bg-gray-100">
<section className="relative w-full lg:min-h-[540px] flex flex-col justify-between py-2 sm:py-3 font-sans overflow-x-hidden">
<div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
<motion.div {...float({scale:[1,1.1,1],x:[0,15,0]},8)} className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-slate-200/55 rounded-full blur-3xl will-change-transform"/>
<motion.div {...float({scale:[1,1.15,1],y:[0,-15,0]},10)} className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-gray-200/70 rounded-full blur-3xl will-change-transform"/>
</div>
<div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 flex-1 flex flex-col lg:flex-row items-center justify-center gap-3 lg:gap-6">
<motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full lg:w-[50%] flex flex-col gap-2 sm:gap-2.5 lg:gap-3 text-left z-20">
<motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-[#e6f7f4] text-teal-700 text-[11px] sm:text-xs font-bold shadow-sm">
<Sparkles size={12} className={`text-teal-500 ${reduceMotion?'':'animate-pulse'}`} aria-hidden="true"/>
{isAuthenticated?`Keep up the streak, ${userName||'Learner'}!`:'A Visual Way to Learn'}
</motion.div>
<motion.h1 variants={itemVariants} className="text-2xl sm:text-4xl lg:text-[46px] font-extrabold leading-[1.15] lg:leading-[1.1] text-slate-900 tracking-tight">
Learn Languages<br/>
Through{' '}
<span className="text-teal-500 relative inline-block">
Pictures
<motion.svg {...float({rotate:[0,15,-10,0],scale:[1,1.15,1]},3)} className="absolute -top-2 sm:-top-3 -right-5 sm:-right-6 w-5 h-5 sm:w-6 sm:h-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
<path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
</motion.svg>
</span>
</motion.h1>
<motion.p variants={itemVariants} className="text-[12px] sm:text-sm lg:text-[15px] text-slate-600 leading-relaxed max-w-lg font-medium pr-2">
Learn useful words and everyday sentences through real-life pictures, native audio and interactive practice.
</motion.p>
<motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-1 w-full max-w-[580px]">
{LEARNING_FEATURES.map((f)=><FeatureCard key={f.title} {...f} reduceMotion={reduceMotion}/>)}
</motion.div>
<motion.div variants={itemVariants} className="mt-0.5 sm:mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
<motion.div whileHover={{scale:1.03}} whileTap={{scale:0.97}} className="w-full sm:w-auto">
<Button onClick={handleAction} className="group inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 text-[13px] sm:text-[15px] font-bold rounded-full shadow-[0_6px_20px_rgba(20,184,166,0.3)] bg-[#0eb999] hover:bg-teal-500 text-white transition-all w-full sm:w-auto border-none">
{isAuthenticated?'Continue Your Adventure 🚀':'Start Learning Free'}
<ArrowRight size={18} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" aria-hidden="true"/>
</Button>
</motion.div>
</motion.div>
<motion.ul variants={itemVariants} className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 mt-0.5">
{TRUST_BADGES.map((t)=>(
<li key={t} className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[#1e293b]">
<span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#1a237e] flex items-center justify-center shrink-0">
<CheckCircle2 size={8} className="text-white" strokeWidth={3} aria-hidden="true"/>
</span>
{t}
</li>
))}
</motion.ul>
</motion.div>
<motion.div initial={{opacity:0,scale:0.9,y:20}} animate={{opacity:1,scale:1,y:0}} transition={{duration:0.8,ease:'easeOut'}} className="w-full lg:w-[50%] relative flex justify-center lg:justify-end items-center my-1 lg:my-0 z-10 pointer-events-none">
<motion.img src={herosectionimg} alt="Pic2Speak learning environment" width={800} height={600} loading="eager" fetchPriority="high" decoding="async" {...float({y:[0,-12,0]},4)} className="w-full max-w-[320px] sm:max-w-[480px] lg:max-w-[110%] h-auto max-h-[22vh] sm:max-h-[30vh] lg:max-h-[48vh] object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.12)] lg:origin-right lg:scale-105 will-change-transform"/>
</motion.div>
</div>
<motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.4}} className="relative z-20 mx-auto w-full max-w-[1400px] px-3 sm:px-6 lg:px-8 mt-2 mb-1">
<div className="bg-white/95 backdrop-blur-xl rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3 shadow-[0_4px_20px_rgba(0,0,0,0.07)] border border-gray-200 grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-row justify-between items-center gap-2 sm:gap-4">
{BOTTOM_STATS.map((s)=><StatItem key={s.title} {...s}/>)}
</div>
</motion.div>
</section>
<section className="relative w-full py-10 lg:py-16 bg-gradient-to-b from-[#f4f9ff] via-white to-teal-50/30">
<div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
<div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold mb-3">
<Compass size={14} className={`text-emerald-600 ${reduceMotion?'':'animate-spin'}`} style={{animationDuration:'10s'}} aria-hidden="true"/>
Interactive Learning Map
</div>
<h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
Learn Like Playing a <span className="text-teal-500">Fun Game! 🎮</span>
</h2>
<p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium mt-2">
Embark on an exciting journey. Complete lessons, unlock new worlds, collect gems, and keep your daily streak glowing!
</p>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center bg-white/90 backdrop-blur-lg border border-gray-200 rounded-[28px] sm:rounded-[36px] p-5 sm:p-8 lg:p-10 shadow-[0_10px_40px_rgba(20,184,166,0.08)]">
<div className="lg:col-span-7 relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-[24px] p-5 sm:p-8 text-white overflow-hidden shadow-xl min-h-[300px] sm:min-h-[360px] flex flex-col justify-between">
<div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center" aria-hidden="true">
<svg className="w-full h-full" viewBox="0 0 500 300" fill="none">
<path d="M 50 220 Q 180 50 250 150 T 450 80" stroke="white" strokeWidth="12" strokeDasharray="16 12" strokeLinecap="round"/>
</svg>
</div>
<div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-3">
<div className="flex items-center gap-2">
<MapPin className={`text-amber-300 ${reduceMotion?'':'animate-bounce'}`} size={20} aria-hidden="true"/>
<span className="font-extrabold text-sm sm:text-base tracking-wide">Adventure Path: English</span>
</div>
<span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold">Level 1 Unlocked</span>
</div>
<div className="relative z-10 my-6 flex items-center justify-around gap-2 sm:gap-4">
<motion.button type="button" whileHover={{scale:1.1}} onClick={goToMap} aria-label="Open Home lesson" className="flex flex-col items-center group">
<span className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400 border-4 border-white shadow-lg flex items-center justify-center text-slate-900 font-extrabold text-lg sm:text-xl group-hover:bg-amber-300 transition-colors">
🏠
</span>
<span className="mt-2 text-[11px] sm:text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full">Home (0/1)</span>
</motion.button>
<LockedNode label="School" className="opacity-80"/>
<LockedNode label="Travel" className="opacity-70 hidden sm:flex"/>
</div>
<div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
<p className="text-xs sm:text-sm font-medium text-teal-50 text-center sm:text-left">
Ready to start your next lesson on the map?
</p>
<button type="button" onClick={goToMap} className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shrink-0">
Open Map 🗺️
</button>
</div>
</div>
<div className="lg:col-span-5 flex flex-col gap-4">
<h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 leading-tight">
Track Progress, Earn Rewards & Level Up!
</h3>
<p className="text-xs sm:text-sm text-slate-600 font-medium">
Our visual adventure map turns language learning into an immersive quest. Every completed sentence gives you XP and coins.
</p>
<div className="grid grid-cols-2 gap-3 my-1">
{GAME_BADGES.map((b)=><BadgeCard key={b.title} {...b}/>)}
</div>
<motion.button type="button" whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={goToMap} className="w-full py-3.5 px-6 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all mt-2">
Explore Full Adventure Map
<ArrowRight size={18} aria-hidden="true"/>
</motion.button>
</div>
</div>
</div>
</section>
</div>
);
};
export default memo(HeroSection);