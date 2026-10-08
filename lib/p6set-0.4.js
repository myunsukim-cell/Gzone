/* P6 학생 기록 세트 v0.4 (2026-10-08 국존: 「종이」→「계획표」→「기록」 — 하루·한 주·한 달·1년 기록) (seq 365 · 2026-10-08)
   P6Y 연간 · P6M 월간 · P6W 주간 · P6D 일간 — 모두 A4 세로 1장, 네 귀퉁이 표식 + QR, 체크 칸 mm 고정(window.P6_LAYOUT).
   일정 자료 = gz2_planner_events(sid,from,to) 반환 events[{d1,d2,k:내신|모의|수능|휴일|학교,t}] · classes[{dw,t}]
   P6.html(form,d) → HTML. d = {token,name,school,grade,start,goal,goal_draft,milestone,milestone_due,events,classes,printed} */
(function(g){
  var W=210,H=297,M=8,CB=4.4,X0=M+6,IW=W-2*M-12,DW=['월','화','수','목','금','토','일'];
  var KC={'내신':'#A4472F','모의':'#2E5DA8','수능':'#6B3FA0','휴일':'#B03A2E','학교':'#5f6b65'};
  function esc(v){return String(v==null?'':v).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function D(s){return new Date(s+'T00:00:00Z');}
  function iso(d){return d.toISOString().slice(0,10);}
  function addD(s,n){var d=D(s);d.setUTCDate(d.getUTCDate()+n);return iso(d);}
  function md(s){return (+s.slice(5,7))+'/'+(+s.slice(8,10));}
  function dow(s){return (D(s).getUTCDay()+6)%7;}               // 0=월
  function diff(a,b){return Math.round((D(b)-D(a))/864e5);}
  function box(x,y,w,h,cls,html,st){return '<div class="'+(cls||'')+'" style="left:'+x+'mm;top:'+y+'mm;width:'+w+'mm;height:'+h+'mm'+(st||'')+'">'+(html||'')+'</div>';}
  function evOn(d,s){return (d.events||[]).filter(function(e){return e.d1<=s&&e.d2>=s;});}
  function evIn(d,a,b){return (d.events||[]).filter(function(e){return e.d1<=b&&e.d2>=a;});}
  function chip(e,short){var t=e.t;if(short)t=t.replace(/전국연합학력평가/,'학력평가').replace(/^[0-9]+월\s*고[0-9]\s*/,'');
    return '<i class="ev" style="color:'+KC[e.k]+';border-color:'+KC[e.k]+'">'+esc(e.k==='휴일'||e.k==='학교'?t:e.k+' '+t)+'</i>';}
  function cls(d,i){return (d.classes||[]).filter(function(c){return c.dw===i+1;});}
  function upcoming(d,from,n){return (d.events||[]).filter(function(e){return /내신|모의|수능/.test(e.k)&&e.d1>=from;}).slice(0,n);}
  function dday(from,e){var n=diff(from,e.d1);return n===0?'D-day':'D-'+n;}
  function legend(){return '<span class="lg">'+['내신','모의','수능','휴일','학교'].map(function(k){return '<b style="color:'+KC[k]+'">■</b>'+k;}).join(' ')+'</span>';}

  function page(form,d,title,period,L,body){
    var h='';
    h+=box(X0,M+1,120,8,'t1','국존 '+title+' 기록 <span>학생 · '+form+'</span>');
    h+=box(X0,M+10,140,6,'who','<b>'+esc(d.name)+'</b> · '+esc(d.school)+' '+esc(d.grade)+' · <b>'+period+'</b>');
    var ref=d.today&&d.today>d.start?d.today:d.start,up=upcoming(d,ref,3);
    h+=box(X0,M+16.5,145,5,'up',up.length?'다가오는 시험 · '+up.map(function(e){return '<b style="color:'+KC[e.k]+'">'+esc(e.k)+'</b> '+md(e.d1)+(e.d2!==e.d1?'~'+md(e.d2):'')+' '+dday(ref,e);}).join(' · '):'');
    h+=box(X0,M+22,145,4,'hint','손으로 쓰고 ☐에 ✓ → 사진 한 장 → 학생 페이지 「📷 플래너 올리기」 · '+legend());
    h+=box(W-M-30,M+1,24,24,'qr','<div id="qr"></div>')+box(W-M-36,M+25,32,4,'tok',esc(d.token));
    h+=body;
    h+=box(X0,H-M-6,IW,4,'ft','네 귀퉁이 검은 표식과 QR이 다 보이게 위에서 반듯하게 찍어 주세요 · 국존 G-MAP 2.0 · '+form+' v0.4 · 일정 출처: 학원 시험 DB + 나이스 학사일정'+(d.printed?' · 인쇄 '+esc(d.printed):''));
    var cm='<div class="cm" style="left:4mm;top:4mm"></div><div class="cm" style="right:4mm;top:4mm"></div><div class="cm" style="left:4mm;bottom:4mm"></div><div class="cm" style="right:4mm;bottom:4mm"></div>';
    var layout={form:form,ver:'0.4',page:[W,H],corner:{size:6,inset:4},cb:CB,boxes:L,token:d.token,start:d.start};
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>'+form+' '+esc(d.name)+' '+d.start+'</title><style>'+CSS+'</style></head><body>'
      +'<div class="bar">'+form+' '+title+' 기록 · A4 세로 <button onclick="print()">🖨 인쇄 / PDF로 저장</button></div>'
      +'<div class="pg">'+cm+h+'</div><script>window.P6_LAYOUT='+JSON.stringify(layout)+';<\/script></body></html>';
  }
  function goals(d,y,third){var gw=(IW-8)/3,h='';
    [['목표'+(d.goal_draft?' (초안)':''),d.goal||'선생님과 정해요'],['중간 목표',(d.milestone||'선생님과 정해요')+(d.milestone_due?' · '+md(d.milestone_due)+'까지':'')],[third,'']].forEach(function(c,i){
      h+=box(X0+i*(gw+4),y,gw,13,'goal'+(c[1]?'':' blank'),'<small>'+c[0]+(i<2?' →':'')+'</small><b>'+esc(c[1])+'</b>');});return h;}

  /* ── 주간 ── */
  function week(d){var L=[],h='',s=d.start;function cb(id,x,y){L.push({id:id,x:x,y:y,w:CB,h:CB});return box(x,y,CB,CB,'cb');}
    h+=goals(d,M+29,'이번 주 목표');
    var y0=M+50,rh=22.5,cDate=22,cTodo=84,cTime=18,cLine=IW-cDate-cTodo-cTime;
    h+=box(X0,y0-5,cDate,4.5,'th','요일 · 일정')+box(X0+cDate,y0-5,cTodo,4.5,'th','할 일 — 한 것은 ☐에 ✓')+box(X0+cDate+cTodo,y0-5,cTime,4.5,'th','공부 시간')+box(X0+cDate+cTodo+cTime,y0-5,cLine,4.5,'th','하루 한 줄');
    for(var i=0;i<7;i++){var ds=addD(s,i),y=y0+i*rh,ev=evOn(d,ds),off=ev.some(function(e){return e.k==='휴일';});
      h+=box(X0,y,IW,rh,'row'+(i>=5||off?' we':''));
      h+=box(X0+1,y+1.5,cDate-2,6.5,'dw'+(i===6||off?' su':i===5?' sa':''),DW[i]+' <small>'+md(ds)+'</small>');
      var tags=cls(d,i).map(function(c){return '<i class="cl">수업 '+esc(c.t)+'</i>';}).join('')+ev.map(function(e){return chip(e,1);}).join('');
      if(tags)h+=box(X0+0.5,y+8,cDate-1.5,rh-8.5,'tags',tags);
      for(var k=0;k<3;k++){var ly=y+2+k*6.8;h+=cb('d'+(i+1)+'t'+(k+1),X0+cDate+1.5,ly)+box(X0+cDate+7.5,ly+CB-0.2,cTodo-9.5,0.1,'ln');}
      h+=box(X0+cDate+cTodo+2,y+8,cTime-4,7,'tm','<span>분</span>');
      h+=box(X0+cDate+cTodo+cTime+2,y+9,cLine-4,0.1,'ln')+box(X0+cDate+cTodo+cTime+2,y+17,cLine-4,0.1,'ln');}
    var hy=y0+7*rh+5,hn=52,hcw=(IW-hn)/7;
    h+=box(X0,hy-5,hn,4.5,'th','이번 주 습관 (3개까지)');
    for(i=0;i<7;i++)h+=box(X0+hn+i*hcw,hy-5,hcw,4.5,'th c',DW[i]);
    for(var r=0;r<3;r++){var ry=hy+r*8;h+=box(X0,ry,hn,7,'hb','');for(i=0;i<7;i++)h+=cb('h'+(r+1)+'d'+(i+1),X0+hn+i*hcw+(hcw-CB)/2,ry+1.3);}
    var ry2=hy+3*8+3,rw=(IW-8)/3;
    ['이번 주 잘한 것','다음 주에 고칠 것','다음 주 첫 할 일'].forEach(function(t,i){h+=box(X0+i*(rw+4),ry2,rw,H-M-9-ry2,'rv','<small>'+t+'</small>');});
    return page('P6W',d,'한 주',md(s)+' (월) ~ '+md(addD(s,6))+' (일)',L,h);}

  /* ── 일간 ── */
  function day(d){var L=[],h='',s=d.start,i=dow(s);function cb(id,x,y){L.push({id:id,x:x,y:y,w:CB,h:CB});return box(x,y,CB,CB,'cb');}
    h+=goals(d,M+29,'오늘 목표');
    var ev=evOn(d,s),tags=cls(d,i).map(function(c){return '<i class="cl">수업 '+esc(c.t)+'</i>';}).join('')+ev.map(function(e){return chip(e);}).join('');
    h+=box(X0,M+44,IW,5,'tags line',tags||'<span class="mut">오늘 일정 없음</span>');
    /* 왼쪽: 할 일 10줄 / 오른쪽: 시간표 */
    var y0=M+56,lw=96,rx=X0+lw+6,rw=IW-lw-6;
    h+=box(X0,y0-5,lw,4.5,'th','오늘 할 일 — 한 것은 ☐에 ✓ · 걸린 시간');
    for(var k=0;k<10;k++){var ly=y0+1+k*9;h+=cb('t'+(k+1),X0+1,ly+1)+box(X0+7,ly+CB+0.8,lw-25,0.1,'ln')+box(X0+lw-16,ly,15,6.5,'tm sm','<span>분</span>');}
    h+=box(rx,y0-5,rw,4.5,'th','시간표 (계획 | 한 것)');
    var hours=[];for(var t=7;t<=24;t++)hours.push(t);var th=(9*10+1)/hours.length;
    hours.forEach(function(t,j){h+=box(rx,y0+j*th,rw,th,'hr','<b>'+(t>23?'24':t)+'</b>');});
    h+=box(rx+8+(rw-8)/2,y0,0.1,hours.length*th,'vl');
    var by=y0+92+5;
    h+=box(X0,by,lw,13,'rv','<small>오늘 공부 시간 합계</small><span class="big">시간 &nbsp; &nbsp; &nbsp; 분</span>');
    h+=box(rx,by,rw,13,'rv','<small>오늘 습관</small>');
    for(k=0;k<3;k++)h+=cb('h'+(k+1),rx+3+k*(rw-6)/3,by+6.5)+box(rx+8.5+k*(rw-6)/3,by+6.5+CB-0.2,(rw-6)/3-8,0.1,'ln');
    var ry=by+17,rw2=(IW-8)/3;
    ['오늘 잘한 것','못한 것과 이유','내일 첫 할 일'].forEach(function(t,j){h+=box(X0+j*(rw2+4),ry,rw2,H-M-9-ry,'rv','<small>'+t+'</small>');});
    return page('P6D',d,'하루',md(s)+' ('+DW[i]+')',L,h);}

  /* ── 월간 ── */
  function month(d){var L=[],h='',s=d.start.slice(0,8)+'01';function cb(id,x,y){L.push({id:id,x:x,y:y,w:CB,h:CB});return box(x,y,CB,CB,'cb');}
    var y=+s.slice(0,4),m=+s.slice(5,7),last=new Date(Date.UTC(y,m,0)).getUTCDate(),e0=s.slice(0,8)+(last<10?'0':'')+last;
    h+=goals(d,M+29,'이달 목표');
    var g0=addD(s,-dow(s)),weeks=Math.ceil((dow(s)+last)/7),y0=M+50,cw=IW/7,ch=Math.min(33,(H-M-48-y0)/weeks);
    for(var i=0;i<7;i++)h+=box(X0+i*cw,y0-5,cw,4.5,'th c'+(i===6?' su':i===5?' sa':''),DW[i]);
    for(var w=0;w<weeks;w++)for(i=0;i<7;i++){var ds=addD(g0,w*7+i),inM=ds.slice(0,7)===s.slice(0,7),x=X0+i*cw,yy=y0+w*ch;
      var ev=inM?evOn(d,ds):[],off=ev.some(function(e){return e.k==='휴일';});
      h+=box(x,yy,cw,ch,'mc'+(inM?'':' out')+(i>=5||off?' we':''));
      if(!inM)continue;
      h+=box(x+1,yy+0.8,8,5,'mdn'+(i===6||off?' su':i===5?' sa':''),String(+ds.slice(8)));
      h+=cb('d'+(+ds.slice(8)),x+cw-CB-1,yy+1);
      var tg=cls(d,i).map(function(c){return '<i class="cl">'+esc(c.t.replace(/^\d\d:\d\d\s*/,''))+'</i>';}).join('')+ev.map(function(e){return chip(e,1);}).join('');
      if(tg)h+=box(x+0.6,yy+6.5,cw-1.2,ch-7,'tags',tg);}
    var by=y0+weeks*ch+4,bw=(IW-8)/3;
    ['이달 잘한 것','다음 달에 고칠 것','다음 달 목표'].forEach(function(t,j){h+=box(X0+j*(bw+4),by,bw,H-M-9-by,'rv','<small>'+t+'</small>');});
    return page('P6M',d,'한 달',y+'년 '+m+'월 · ☐ = 그날 계획한 공부를 했으면 ✓',L,h);}

  /* ── 연간 ── */
  function year(d){var L=[],h='',s=d.start.slice(0,8)+'01';function cb(id,x,y){L.push({id:id,x:x,y:y,w:CB,h:CB});return box(x,y,CB,CB,'cb');}
    h+=goals(d,M+29,'올해 목표');
    var cols=3,rows=4,gx=4,gy=3,cw=(IW-gx*(cols-1))/cols,y0=M+46,ch=(H-M-9-y0-gy*(rows-1))/rows;
    for(var n=0;n<12;n++){var ms=addD(s,0);var yy0=+s.slice(0,4),mm0=+s.slice(5,7)+n,yy=yy0+Math.floor((mm0-1)/12),mm=(mm0-1)%12+1;
      var f=yy+'-'+(mm<10?'0':'')+mm+'-01',last=new Date(Date.UTC(yy,mm,0)).getUTCDate(),t=f.slice(0,8)+(last<10?'0':'')+last;
      var x=X0+(n%cols)*(cw+gx),y=y0+Math.floor(n/cols)*(ch+gy);
      h+=box(x,y,cw,ch,'yc');
      h+=box(x+1.5,y+1,20,5,'ym',mm+'월'+(mm===1||n===0?' <small>'+yy+'</small>':''));
      h+=cb('m'+(n+1),x+cw-CB-1.5,y+1.2);
      /* 미니 달력 */
      var dw=(cw-3)/7,dh=3.3,st=dow(f),cal='';
      for(var k=1;k<=last;k++){var ds=f.slice(0,8)+(k<10?'0':'')+k,p=st+k-1,ev=evOn(d,ds).filter(function(e){return e.k!=='학교'||/방학|개학|종업/.test(e.t);});
        var c=ev.length?KC[(ev.filter(function(e){return e.k!=='휴일'&&e.k!=='학교';})[0]||ev[0]).k]:'';
        var strong=ev.some(function(e){return /내신|모의|수능/.test(e.k);});
        cal+='<span style="left:'+((p%7)*dw)+'mm;top:'+(Math.floor(p/7)*dh)+'mm;width:'+dw+'mm'+(c?';color:'+c:'')+(strong?';font-weight:900;text-decoration:underline':'')+'">'+k+'</span>';}
      h+=box(x+1.5,y+7,cw-3,6*dh,'mini',cal);
      var list=evIn(d,f,t).filter(function(e){return /내신|모의|수능/.test(e.k)||/방학|개학|종업/.test(e.t);});
      h+=box(x+1.5,y+7+6*dh+0.8,cw-3,ch-(7+6*dh+0.8)-8,'yl',list.map(function(e){return '<div><b style="color:'+KC[e.k]+'">'+md(e.d1)+(e.d2!==e.d1?'~'+md(e.d2):'')+'</b> '+esc(e.k==='학교'||e.k==='휴일'?e.t:e.k+' '+e.t.replace(/전국연합학력평가/,'학력평가').replace(/^[0-9]+월\s*고[0-9]\s*/,''))+'</div>';}).join(''));
      h+=box(x+1.5,y+ch-7.5,cw-3,6.5,'ygoal','<small>이달 목표</small>');}
    return page('P6Y',d,'1년',s.slice(0,4)+'.'+(+s.slice(5,7))+' ~ '+addD(s,365).slice(0,4)+'.'+((+s.slice(5,7)+10)%12+1)+' · ☐ = 이달 목표 달성 ✓',L,h);}

  var CSS='@page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{margin:0;font-family:"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#1d2a24;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
   +'.bar{position:sticky;top:0;background:#1E4D3B;color:#fff;padding:8px 14px;font-size:13px;display:flex;gap:10px;align-items:center;z-index:9}.bar button{font:inherit;padding:4px 12px;border-radius:5px;border:0;cursor:pointer}@media print{.bar{display:none}}'
   +'.pg{position:relative;width:210mm;height:297mm;margin:0 auto;background:#fff;overflow:hidden;page-break-after:always}@media screen{.pg{box-shadow:0 0 0 1px #bbb;margin:10px auto}}.pg>div{position:absolute;overflow:hidden}.pg>.qr{overflow:visible}'
   +'.cm{position:absolute;width:6mm;height:6mm;background:#000}'
   +'.t1{font-size:15pt;font-weight:900;color:#1E4D3B}.t1 span{font-size:7.5pt;background:#1E4D3B;color:#fff;border-radius:2mm;padding:.3mm 2mm;margin-left:2mm;vertical-align:middle}'
   +'.who{font-size:9.5pt}.up{font-size:7.6pt}.hint{font-size:6.5pt;color:#666}.lg{margin-left:2mm}.lg b{margin:0 .4mm 0 1.5mm}.qr svg{width:24mm;height:24mm}.tok{font-size:5.5pt;color:#555;text-align:center}'
   +'.goal{border:.4mm solid #1E4D3B;border-radius:1.5mm;padding:1mm 2mm;font-size:8.6pt;line-height:1.22}.goal small{display:block;font-size:6.5pt;color:#1E4D3B;font-weight:800}.goal.blank{border-style:dashed;border-color:#9aa8a0}'
   +'.th{font-size:6.8pt;font-weight:800;color:#1E4D3B;border-bottom:.3mm solid #1E4D3B}.th.c{text-align:center}.th.su{color:#B03A2E}.th.sa{color:#2E5DA8}'
   +'.row{border-bottom:.25mm solid #c7cfca}.we{background:#FAF8F2}'
   +'.dw{font-size:10.5pt;font-weight:900;line-height:1.3;padding-left:.5mm}.dw small{font-size:7pt;font-weight:500;color:#555}.su{color:#B03A2E}.sa{color:#2E5DA8}'
   +'.tags{font-size:5.6pt;line-height:1.1}.tags.line{font-size:7.5pt}.tags i,.yl i{display:inline-block;font-style:normal;border:.25mm solid;border-radius:.8mm;padding:0 .7mm;margin:0 .5mm .5mm 0;font-weight:700;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tags .cl{background:#1E4D3B;color:#fff;border-color:#1E4D3B}.mut{color:#999}'
   +'.cb{border:.35mm solid #1d2a24;border-radius:.6mm;background:#fff}'
   +'.ln{border-top:.2mm dotted #8f9a94}.vl{border-left:.2mm dotted #8f9a94}'
   +'.tm{border:.3mm solid #8f9a94;border-radius:1mm;font-size:7pt;color:#666;text-align:right;padding:2.2mm 1.2mm 0 0}.tm.sm{padding-top:1.6mm;font-size:6pt}'
   +'.hb{border-bottom:.2mm dotted #8f9a94}'
   +'.hr{border-bottom:.2mm solid #dfe4e1;font-size:6.5pt;color:#1E4D3B;padding:.6mm 0 0 .8mm}'
   +'.rv{border:.3mm solid #8f9a94;border-radius:1.5mm;padding:1mm 2mm}.rv small{display:block;font-size:6.8pt;color:#1E4D3B;font-weight:800}.big{display:block;text-align:right;font-size:9pt;color:#555;margin-top:1mm}'
   +'.mc{border:.2mm solid #c7cfca}.mc.out{background:#f1f3f2}.mdn{font-size:9pt;font-weight:900}'
   +'.yc{border:.3mm solid #1E4D3B;border-radius:1.5mm}.ym{font-size:10pt;font-weight:900;color:#1E4D3B}.ym small{font-size:6.5pt;color:#777}'
   +'.mini span{position:absolute;font-size:5.6pt;text-align:center;line-height:3.3mm}.yl{font-size:5.8pt;line-height:1.3}.yl div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
   +'.ygoal{border-top:.2mm dotted #8f9a94;font-size:5.8pt;color:#1E4D3B;font-weight:800}'
   +'.ft{font-size:5.8pt;color:#777}';
  g.P6={html:function(f,d){return ({P6Y:year,P6M:month,P6W:week,P6D:day})[f](d);}};
})(typeof window!=='undefined'?window:this);
