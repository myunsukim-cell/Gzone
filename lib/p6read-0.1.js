/* P6 종이 플래너 사진 판독기 v0.1 (seq 365 ③ · 2026-10-08)
   사진 → ① QR(jsQR)로 어느 학생·어느 종이인지 ② 네 귀퉁이 검은 표식으로 종이 좌표(mm) ↔ 사진 좌표 변환식
   ③ 체크 칸(☐)마다 먹 비율 → ✓ 판정 ④ 할 일 줄에 글씨가 있는지(쓴 줄 수).
   P6R.read(canvas) → {token, ok, corners, why}; P6R.tally(read, layout) → {checked:[id], written:[id], ratio:{}, summary, ...}
   의존: jsQR (lib/jsqr-1.4.0.js). 좌표표 layout = P6.html()이 만든 window.P6_LAYOUT과 같은 모양. */
(function(g){
  var PAPER_MARK={size:6,inset:4};
  var K={dark:0.78,wdark:0.86,cb:0.08,wr:0.012};   /* 먹 판정 기준 — 합성 시험(연필·흐림·그늘)으로 맞춤 */
  function gray(cv){var c=cv.getContext('2d'),w=cv.width,h=cv.height,d=c.getImageData(0,0,w,h).data,o=new Uint8Array(w*h);
    for(var i=0,j=0;i<o.length;i++,j+=4)o[i]=(d[j]*77+d[j+1]*150+d[j+2]*29)>>8; return {w:w,h:h,p:o,rgba:d};}
  function down(G,max){var s=Math.min(1,max/Math.max(G.w,G.h));if(s===1)return {w:G.w,h:G.h,p:G.p,s:1};
    var w=Math.round(G.w*s),h=Math.round(G.h*s),o=new Uint8Array(w*h);
    for(var y=0;y<h;y++){var sy=Math.min(G.h-1,Math.floor(y/s));for(var x=0;x<w;x++)o[y*w+x]=G.p[sy*G.w+Math.min(G.w-1,Math.floor(x/s))];}
    return {w:w,h:h,p:o,s:s};}
  function otsu(p){var hist=new Array(256).fill(0);for(var i=0;i<p.length;i++)hist[p[i]]++;var tot=p.length,sum=0;for(i=0;i<256;i++)sum+=i*hist[i];
    var sB=0,wB=0,best=0,th=128;for(i=0;i<256;i++){wB+=hist[i];if(!wB)continue;var wF=tot-wB;if(!wF)break;sB+=i*hist[i];var mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>best){best=v;th=i;}}return th;}
  /* 사진을 칸(블록)으로 나눠 그 칸의 밝은 쪽(종이 흰색)을 기준으로 어둡기 판정 — 그늘·조명 차이 견딤 */
  function darkMap(D){var B=Math.max(16,Math.round(Math.min(D.w,D.h)/12)),bw=Math.ceil(D.w/B),bh=Math.ceil(D.h/B),wht=new Float32Array(bw*bh);
    for(var by=0;by<bh;by++)for(var bx=0;bx<bw;bx++){var a=[];for(var y=by*B;y<Math.min(D.h,(by+1)*B);y+=2)for(var x=bx*B;x<Math.min(D.w,(bx+1)*B);x+=2)a.push(D.p[y*D.w+x]);a.sort(function(u,v){return u-v;});wht[by*bw+bx]=a[Math.floor(a.length*0.9)]||255;}
    var m=new Uint8Array(D.w*D.h);for(var y2=0;y2<D.h;y2++)for(var x2=0;x2<D.w;x2++){var wv=wht[Math.floor(y2/B)*bw+Math.floor(x2/B)];m[y2*D.w+x2]=D.p[y2*D.w+x2]<wv*0.55?1:0;}
    return {m:m,B:B,bw:bw,wht:wht};}
  function comps(D,M,x0,y0,x1,y1){var w=D.w,seen=new Uint8Array(D.w*D.h),out=[],st=[];
    for(var y=y0;y<y1;y++)for(var x=x0;x<x1;x++){var i=y*w+x;if(!M[i]||seen[i])continue;
      var n=0,minx=x,maxx=x,miny=y,maxy=y,sx=0,sy=0;st.length=0;st.push(i);seen[i]=1;
      while(st.length){var k=st.pop(),kx=k%w,ky=(k/w)|0;n++;sx+=kx;sy+=ky;if(kx<minx)minx=kx;if(kx>maxx)maxx=kx;if(ky<miny)miny=ky;if(ky>maxy)maxy=ky;
        var nb=[k-1,k+1,k-w,k+w];for(var q=0;q<4;q++){var j=nb[q];if(j<0||j>=M.length||seen[j]||!M[j])continue;var jx=j%w;if(Math.abs(jx-kx)>1)continue;var jy=(j/w)|0;if(jx<x0||jx>=x1||jy<y0||jy>=y1)continue;seen[j]=1;st.push(j);}}
      out.push({n:n,minx:minx,maxx:maxx,miny:miny,maxy:maxy,cx:sx/n,cy:sy/n});}
    return out;}
  function findMarks(D){var M=darkMap(D).m,mn=Math.min(D.w,D.h),lo=mn*0.012,hi=mn*0.075,res=[];
    var Q=[[0,0],[1,0],[1,1],[0,1]];  /* 사진 기준 왼위·오위·오아래·왼아래 */
    for(var q=0;q<4;q++){var x0=Q[q][0]?Math.floor(D.w*0.62):0,x1=Q[q][0]?D.w:Math.ceil(D.w*0.38),y0=Q[q][1]?Math.floor(D.h*0.62):0,y1=Q[q][1]?D.h:Math.ceil(D.h*0.38);
      var cs=comps(D,M,x0,y0,x1,y1).filter(function(c){var bw=c.maxx-c.minx+1,bh=c.maxy-c.miny+1,ar=bw/bh,fill=c.n/(bw*bh);return bw>=lo&&bh>=lo&&bw<=hi&&bh<=hi&&ar>0.55&&ar<1.8&&fill>0.72;});
      var cx=Q[q][0]?D.w:0,cy=Q[q][1]?D.h:0;cs.sort(function(a,b){return Math.hypot(a.cx-cx,a.cy-cy)-Math.hypot(b.cx-cx,b.cy-cy);});
      if(!cs.length)return null; res.push(cs[0]);}
    return res;}
  /* 4점 변환식(호모그래피): 종이 mm → 사진 px */
  function homog(src,dst){var A=[],b=[];for(var i=0;i<4;i++){var x=src[i][0],y=src[i][1],u=dst[i][0],v=dst[i][1];
      A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v);}
    for(var c=0;c<8;c++){var p=c;for(var r=c+1;r<8;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;var t=A[c];A[c]=A[p];A[p]=t;t=b[c];b[c]=b[p];b[p]=t;
      for(r=0;r<8;r++){if(r===c)continue;var f=A[r][c]/A[c][c];for(var k=c;k<8;k++)A[r][k]-=f*A[c][k];b[r]-=f*b[c];}}
    var h=[];for(c=0;c<8;c++)h.push(b[c]/A[c][c]);h.push(1);
    return function(x,y){var w=h[6]*x+h[7]*y+1;return [(h[0]*x+h[1]*y+h[2])/w,(h[3]*x+h[4]*y+h[5])/w];};}
  function read(cv){
    var G=gray(cv),r={ok:false,token:null,why:''};
    try{ if(g.jsQR){var q=g.jsQR(G.rgba,G.w,G.h,{inversionAttempts:'dontInvert'});
        if(!q){var D2=down(G,1100),c2=document.createElement('canvas');c2.width=D2.w;c2.height=D2.h;c2.getContext('2d').drawImage(cv,0,0,D2.w,D2.h);var d2=c2.getContext('2d').getImageData(0,0,D2.w,D2.h);q=g.jsQR(d2.data,D2.w,D2.h);if(q){var s=G.w/D2.w;['topLeftCorner','bottomRightCorner'].forEach(function(k){q.location[k]={x:q.location[k].x*s,y:q.location[k].y*s};});}}
        if(q){r.token=q.data;r.qr={x:(q.location.topLeftCorner.x+q.location.bottomRightCorner.x)/2,y:(q.location.topLeftCorner.y+q.location.bottomRightCorner.y)/2};}}}catch(e){}
    var D=down(G,900),mk=findMarks(D);
    if(!mk){r.why='네 귀퉁이 검은 표식을 다 찾지 못했어요 — 종이 전체가 나오게 다시 찍어 주세요';return r;}
    var img=mk.map(function(c){return [c.cx/D.s,c.cy/D.s];});
    var a=PAPER_MARK.inset+PAPER_MARK.size/2, P=[[a,a],[210-a,a],[210-a,297-a],[a,297-a]], k=0;
    if(r.qr){var best=1e18;for(var i=0;i<4;i++){var dd=Math.hypot(img[i][0]-r.qr.x,img[i][1]-r.qr.y);if(dd<best){best=dd;k=i;}} k=(k-1+4)%4;}  /* QR은 종이 오른쪽 위 → 그 표식이 P[1] */
    var dst=[];for(i=0;i<4;i++)dst.push(img[(i+k)%4]);
    r.map=homog(P,dst);r.G=G;r.ok=true;r.rot=k;r.corners=dst;return r;}
  function inkRatio(R,x,y,w,h,inset,nx,ny,dark){var G=R.G,cnt=0,dk=0,vals=[];
    for(var j=0;j<ny;j++)for(var i=0;i<nx;i++){var pt=R.map(x+inset+(w-2*inset)*(i+0.5)/nx,y+inset+(h-2*inset)*(j+0.5)/ny),px=Math.round(pt[0]),py=Math.round(pt[1]);
      if(px<0||py<0||px>=G.w||py>=G.h)continue;vals.push(G.p[py*G.w+px]);}
    /* 주변 종이 흰색: 칸 바깥 고리에서 밝은 쪽(75%) */
    var ring=[];for(var t=0;t<32;t++){var an=t/32*2*Math.PI,rx=x+w/2+Math.cos(an)*(w/2+1.8),ry=y+h/2+Math.sin(an)*(h/2+1.8),p2=R.map(rx,ry),qx=Math.round(p2[0]),qy=Math.round(p2[1]);if(qx>=0&&qy>=0&&qx<G.w&&qy<G.h)ring.push(G.p[qy*G.w+qx]);}
    ring.sort(function(a,b){return a-b;});var wv=ring.length?ring[Math.floor(ring.length*0.75)]:200;
    vals.forEach(function(v){cnt++;if(v<wv*(dark||K.dark))dk++;});return cnt?dk/cnt:0;}
  function tally(R,L){var out={checked:[],written:[],ratio:{},form:L.form,boxes:L.boxes.length};
    L.boxes.forEach(function(b){var rt=inkRatio(R,b.x,b.y,b.w,b.h,0.9,16,16);out.ratio[b.id]=Math.round(rt*1000)/1000;if(rt>=K.cb)out.checked.push(b.id);
      if(/^d\dt\d$|^t\d+$/.test(b.id)){var wr=inkRatio(R,b.x+6.5,b.y-0.6,52,b.h-0.4,0,130,8,K.wdark);out.ratio['w_'+b.id]=Math.round(wr*1000)/1000;if(wr>=K.wr)out.written.push(b.id);}});
    out.checked.forEach(function(id){if(/^d\dt\d$|^t\d+$/.test(id)&&out.written.indexOf(id)<0)out.written.push(id);});  /* ✓한 줄은 쓴 줄로 셈 */
    delete out.ratio_raw;
    var C=function(re){return out.checked.filter(function(id){return re.test(id);}).length;},W=function(re){return out.written.filter(function(id){return re.test(id);}).length;};
    var f=L.form,s='';
    if(f==='P6W'){var tw=W(/^d\dt\d$/),tc=out.checked.filter(function(id){return /^d\dt\d$/.test(id);}).length,hc=C(/^h\dd\d$/);
      out.todo={written:tw,checked:tc};out.habit={checked:hc,of:21};s='할 일 '+tc+'/'+tw+' ✓ · 습관 '+hc+'칸';
      out.days=[1,2,3,4,5,6,7].map(function(d){return {dw:d,todo:C(new RegExp('^d'+d+'t\\d$')),written:W(new RegExp('^d'+d+'t\\d$')),habit:C(new RegExp('^h\\dd'+d+'$'))};});}
    else if(f==='P6D'){var dw=W(/^t\d+$/),dc=C(/^t\d+$/);out.todo={written:dw,checked:dc};out.habit={checked:C(/^h\d$/),of:3};s='할 일 '+dc+'/'+dw+' ✓ · 습관 '+out.habit.checked+'/3';}
    else if(f==='P6M'){var mc=C(/^d\d+$/);out.days_checked=mc;s='공부한 날 '+mc+'일';}
    else if(f==='P6Y'){var yc=C(/^m\d+$/);out.months_checked=yc;s='목표 이룬 달 '+yc+'개';}
    out.summary=s;out.ver='p6read-0.1';return out;}
  g.P6R={read:read,tally:tally,_homog:homog,K:K};
})(typeof window!=='undefined'?window:this);
