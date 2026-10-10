import sqlite3,struct,math,json,heapq
from pathlib import Path
# Place the pinned network file beside this script as marnet.gpkg.
root=Path(__file__).resolve().parent
def parse(b):
 env=(b[3]>>1)&7; off=8+{0:0,1:32,2:48,3:48,4:64}[env]; b=b[off:];end='<' if b[0] else '>';typ,n=struct.unpack_from(end+'II',b,1);assert typ==2,typ
 return [tuple(round(v,6)for v in struct.unpack_from(end+'dd',b,9+i*16))for i in range(n)]
def dist(a,b):
 x,y=map(math.radians,a);u,v=map(math.radians,b);z=math.sin((v-y)/2)**2+math.cos(y)*math.cos(v)*math.sin((u-x)/2)**2;return 6371*2*math.asin(min(1,math.sqrt(z)))
g={};features=[]
for fid,b,pa in sqlite3.connect(root/'marnet.gpkg').execute('select * from type'):
 co=parse(b);a,b=co[0],co[-1];w=sum(dist(c,d)for c,d in zip(co,co[1:]));g.setdefault(a,[]).append((b,w,co,pa));g.setdefault(b,[]).append((a,w,list(reversed(co)),pa))
for a in list(g):
 if abs(a[0])==180:
  b=(-a[0],a[1])
  if b in g:g[a].append((b,0,[a,b],None))
def route(p,q,avoid=()):
 a=min(g,key=lambda x:dist(x,p));b=min(g,key=lambda x:dist(x,q));ds={a:0};prev={};heap=[(0,a)]
 while heap:
  d,u=heapq.heappop(heap)
  if d!=ds[u]:continue
  if u==b:break
  for v,w,cs,pa in g[u]:
   if pa in avoid or any(pt[1]>60 for pt in cs):continue
   nd=d+w
   if nd<ds.get(v,float('inf')):ds[v]=nd;prev[v]=(u,cs);heapq.heappush(heap,(nd,v))
 paths=[];v=b
 while v!=a:u,cs=prev[v];paths.append(cs);v=u
 coords=[]
 for cs in paths[::-1]:coords+=cs if not coords else cs[1:]
 return coords,ds[b],dist(p,a),dist(q,b)
ports={'Shanghai':(122,30.6),'Los Angeles':(-118.3,33.7),'Rotterdam':(4,52),'New York':(-74,40.5),'Singapore':(103.8,1.2),'Mumbai':(72.7,18.9),'Persian Gulf':(52,26),'Santos':(-46.2,-24),'Port Hedland':(118.5,-20),'Tokyo':(140,35),'Panama':(-79.6,9)}
routes=[('Trans-Pacific: East Asia–North America','Shanghai','Los Angeles',()),('North Atlantic: Europe–North America','Rotterdam','New York',()),('Asia–Europe via Suez (historical corridor)','Shanghai','Rotterdam',()),('Asia–Europe via Cape of Good Hope','Singapore','Rotterdam',('suez',)),('Indian Ocean: Singapore–Mumbai','Singapore','Mumbai',()),('Gulf–East Asia via Hormuz and Malacca (historical corridor)','Persian Gulf','Singapore',()),('South Atlantic–East Asia','Santos','Singapore',('suez','panama')),('Australia–East Asia','Port Hedland','Shanghai',()),('Pacific–Atlantic via Panama (network corridor)','Tokyo','New York',('suez',)),('Europe–South America','Rotterdam','Santos',())]
for name,a,b,avoid in routes:
 cs,d,s,t=route(ports[a],ports[b],avoid)
 # Split dateline joins; source coordinates retained with no hand-drawn waypoints.
 segments=[[]]
 for c in cs:
  if segments[-1] and abs(c[0]-segments[-1][-1][0])>180:segments.append([])
  segments[-1].append(c)
 for i,seg in enumerate(segments):
  if len(seg)<2:continue
  features.append({'type':'Feature','properties':{'name':name,'segment':i+1,'dataYear':'2000 baseline; Eurostat network file dated 2021-09-08','sourceURL':'https://github.com/eurostat/searoute','method':'Dijkstra shortest path through published Eurostat SeaRoute 20km maritime network, based on ORNL 2000 shipping lanes with AIS-derived European additions. Approximate port points snapped to network. No traffic weights; not an observed voyage or live route.','distanceKm':round(d),'startSnapKm':round(s),'endSnapKm':round(t),'avoidedPassages':list(avoid)+['Arctic links north of 60N']},'geometry':{'type':'LineString','coordinates':seg}})
 print(name,len(cs),round(d),round(s),round(t))
obj={'type':'FeatureCollection','metadata':{'title':'Representative historical shipping corridors','warning':'Modelled paths through a published shipping-lane network; not live AIS tracks, current 2026 service availability, trade volumes or navigational advice. Suez/Hormuz paths depict historical network connectivity and may be disrupted.','credit':'Eurostat SeaRoute; Oak Ridge National Laboratory CTA Transportation Network Group (Global Shipping Lane Network, 2000); European AIS additions. Derived 2026-10-10.','license':'EUPL-1.2; retain attribution and source/data download.','networkFile':'https://raw.githubusercontent.com/eurostat/searoute/master/modules/core/src/main/resources/marnet/marnet_plus_20km.gpkg'},'features':features}
(root/'shipping-routes.json').write_text(json.dumps(obj,separators=(',',':')))
