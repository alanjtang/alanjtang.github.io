import json
from pathlib import Path
import sys
from urllib.request import urlopen

root=Path(__file__).parent
topo=json.loads(Path(sys.argv[1]).read_text() if len(sys.argv)>1 else urlopen('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json').read())
arcs=[]
for arc in topo['arcs']:
 x=y=0; out=[]
 for dx,dy in arc:
  x+=dx;y+=dy;out.append([round(x*topo['transform']['scale'][0]+topo['transform']['translate'][0],5),round(y*topo['transform']['scale'][1]+topo['transform']['translate'][1],5)])
 arcs.append(out)
def ring(ids):
 out=[]
 for i in ids:
  a=arcs[i] if i>=0 else arcs[~i][::-1]
  out.extend(a if not out else a[1:])
 return out
def geometry(g):
 if g['type']=='Polygon':return {'type':'Polygon','coordinates':[ring(r) for r in g['arcs']]}
 return {'type':'MultiPolygon','coordinates':[[ring(r) for r in p] for p in g['arcs']]}
geos={}
for g in topo['objects']['countries']['geometries']:
 id=g.get('id')
 if id not in geos:geos[id]={'type':'MultiPolygon','arcs':[]}
 geos[id]['arcs'].extend(g['arcs'] if g['type']=='MultiPolygon' else [g['arcs']])
# Transfer Natural Earth's separate Crimea polygon to internationally recognized Ukraine.
crimea=[];retained=[]
for poly in geos['643']['arcs']:
 points=ring(poly[0]);xs=[p[0] for p in points];ys=[p[1] for p in points]
 if min(xs)>32 and max(xs)<37 and min(ys)>44 and max(ys)<47:crimea.append(poly)
 else:retained.append(poly)
assert crimea, 'Crimea geometry must be identified before export'
geos['643']['arcs']=retained
geos['804']['arcs'].extend(crimea)
sources={
 'nato':['NATO membership','https://www.nato.int/en/what-is-nato.html'],
 'china':['NATO–China dialogue','https://www.nato.int/en/news-and-events/articles/news/2026/03/25/9th-nato-military-staff-talks-with-china'],
 'pacific':['U.S. Indo-Pacific alliances','https://2021-2025.state.gov/a-free-and-open-indo-pacific/'],
 'rio':['Rio Treaty depositary','https://www.oas.org/juridico/english/sigs/b-29.html'],
 'russia':['U.S.–China Commission','https://www.uscc.gov/research/china-russia-fact-sheet-short-primer-relationship'],
 'nk':['U.S. Army War College','https://publications.armywarcollege.edu/News/Display/Article/4361525/security-implications-of-the-china-russia-north-korea-triangle/'],
 'pakistan':['China–Pakistan joint statement','https://www.mfa.gov.cn/eng/zy/gb/202405/t20240531_11367373.html'],
 'mnna':['U.S. MNNA designation','https://2021-2025.state.gov/major-non-nato-ally-status/'],
 'iran':['China–Iran talks','https://www.mfa.gov.cn/mfa_eng/wjbzhd/202605/t20260507_11905849.html'],
 'belarus':['China–Belarus talks','https://www.mfa.gov.cn/eng/gjhdq_665435/3265_665445/3140_664302/3142_664306/202606/t20260609_11940589.html'],
 'neighbors':['China neighborhood policy','https://www.mfa.gov.cn/mfa_eng/xw/zyxw/202405/t20240530_11332399.html'],
 'nz':['New Zealand alliance status','https://www.mfat.govt.nz/en/countries-and-regions/australia-and-pacific/australia']}
rows=[]
def add(id,name,group,us,china,refs):
 g=geos[id];rows.append({'type':'Feature','id':id,'geometry':geometry(g),'properties':{'name':name,'group':group,'us':us,'china':china,'sources':[sources[k] for k in refs]}})
nato='008:Albania|056:Belgium|100:Bulgaria|124:Canada|191:Croatia|203:Czechia|208:Denmark|233:Estonia|246:Finland|250:France|276:Germany|300:Greece|348:Hungary|352:Iceland|380:Italy|428:Latvia|440:Lithuania|442:Luxembourg|499:Montenegro|528:Netherlands|807:North Macedonia|578:Norway|616:Poland|620:Portugal|642:Romania|703:Slovakia|705:Slovenia|724:Spain|752:Sweden|792:Türkiye|826:United Kingdom|840:United States'
for entry in nato.split('|'):
 id,name=entry.split(':');add(id,name,'nato','NATO member: shares collective-defense commitments with the United States under the North Atlantic Treaty. Each member determines the action it considers necessary.','Maintains its own China policy. NATO combines security concerns about China with dialogue; alliance membership does not mean a bilateral conflict or a ban on trade with China.',['nato','china'])
pacific=[('036','Australia','ANZUS treaty ally; close U.S. defense cooperation.','Economic engagement with China coexists with strategic competition.'),('392','Japan','Bilateral mutual-security treaty ally; hosts U.S. forces.','Trade and diplomatic ties coexist with East China Sea disputes and regional security concerns.'),('410','South Korea','Mutual-defense treaty ally; hosts U.S. forces.','Economic ties coexist with disagreements over regional security and North Korea.'),('608','Philippines','Mutual-defense treaty ally; defense cooperation includes access arrangements.','Diplomatic and economic relations coexist with South China Sea disputes.'),('764','Thailand','Treaty ally through the Manila Pact and subsequent security commitments.','Maintains close economic and defense ties with China alongside its U.S. alliance.')]
for id,n,u,c in pacific:add(id,n,'treaty',u,c,['pacific'])
rio='032:Argentina|044:Bahamas|076:Brazil|152:Chile|170:Colombia|188:Costa Rica|214:Dominican Republic|222:El Salvador|320:Guatemala|332:Haiti|340:Honduras|591:Panama|600:Paraguay|604:Peru|780:Trinidad and Tobago|858:Uruguay'
for entry in rio.split('|'):
 id,n=entry.split(':');add(id,n,'rio','Party to the Rio Treaty with the United States: a regional collective-security framework, not an automatic bilateral military guarantee.','The Rio Treaty does not prescribe relations with China. Membership alone does not establish either alignment with or opposition to Beijing.',['rio'])
red=[('408','North Korea','China treaty ally','Adversarial security relationship with Washington, centered on nuclear weapons and regional deterrence.','The 1961 treaty with China includes mutual assistance; this is a formal defense relationship.',['nk']),('643','Russia','China strategic partner','Strategic rivalry with the United States, intensified by Russia’s war in Ukraine.','Close strategic, economic and military cooperation; not a formal mutual-defense alliance.',['russia']),('586','Pakistan','China strategic partner','Also a U.S.-designated Major Non-NATO Ally; that designation does not provide a defense guarantee.','Longstanding strategic cooperation, defense ties and the China–Pakistan Economic Corridor.',['pakistan','mnna']),('364','Iran','China strategic partner','Adversarial relationship with Washington, with longstanding nuclear and regional-security disputes.','Comprehensive strategic partnership; not a mutual-defense treaty.',['iran']),('112','Belarus','China strategic partner','Relations with Washington are strained by governance and regional-security disputes.','An all-weather comprehensive strategic partnership with Beijing, not a Chinese defense guarantee.',['belarus']),('116','Cambodia','China close partner','Maintains relations with Washington alongside disagreements over governance and security.','Close cooperation and a shared-future framework with Beijing; not a mutual-defense alliance.',['neighbors']),('418','Laos','China close partner','Maintains diplomatic relations and practical cooperation with Washington.','Close political and economic cooperation and a shared-future framework with Beijing; not a mutual-defense alliance.',['neighbors'])]
for id,n,g,u,c,refs in red:add(id,n,'partner',u,c,refs);rows[-1]['properties']['category']=g
add('554','New Zealand','uspartner','Close U.S. security partner and Major Non-NATO Ally, but U.S. ANZUS obligations toward New Zealand were suspended in 1986. Australia is its only formal defense ally.','Maintains diplomatic and economic relations with China; security cooperation with Washington does not eliminate those ties.',['nz','mnna'])
sources['un']=['UN: territorial integrity of Ukraine','https://press.un.org/en/2014/ga11493.doc.htm']
add('804','Ukraine','special','Supported by the United States; not a NATO member. Crimea is shown as Ukrainian territory in accordance with internationally recognized borders.','Maintains diplomatic relations with China. Its sovereignty is not altered by Russian occupation of Crimea.',['un'])
rows[-1]['properties']['category']='Ukraine · internationally recognized borders'
sources['currentmnna']=['U.S. Major Non-NATO Ally designations','https://www.law.cornell.edu/cfr/text/22/120.23']
sources['gcc']=['GCC–China cooperation','https://www.mofa.gov.sa/en/ministry/statements/Pages/Statement-of-the-Riyadh-Summit-for-Cooperation-and-Development-between-the-GCC-and-the-People%27s-Republic-of-China.aspx']
sources['arab']=['China–Arab cooperation','https://www.mfa.gov.cn/mfa_eng/xw/zyxw/202405/t20240530_11332972.html']
for id,n in [('048','Bahrain'),('414','Kuwait'),('634','Qatar'),('682','Saudi Arabia'),('400','Jordan'),('818','Egypt'),('376','Israel')]:
 cn='Maintains diplomatic and economic ties with China. U.S. security cooperation does not make those relationships exclusive.'
 if n in ['Bahrain','Kuwait','Qatar','Saudi Arabia']:cn='Participates in GCC cooperation with China, including economic, energy and diplomatic engagement, alongside its U.S. security relationship.'
 add(id,n,'uspartner','U.S.-designated Major Non-NATO Ally with defense-cooperation benefits. The designation itself does not create a mutual-defense guarantee.',cn,['currentmnna']+(['gcc'] if n in ['Bahrain','Kuwait','Qatar','Saudi Arabia'] else ['arab'] if n!='Israel' else []))
for id,n,slug in [('784','United Arab Emirates','the-united-arab-emirates'),('512','Oman','oman')]:
 sources[slug]=['U.S. security cooperation','https://2021-2025.state.gov/u-s-security-cooperation-with-'+slug+'/']
 add(id,n,'uspartner','U.S. security partner through defense-cooperation and access arrangements; not shown as a mutual-defense treaty ally.','Participates in GCC–China strategic cooperation while maintaining its U.S. security partnership.',[slug,'gcc'])
for id,n in [('192','Cuba'),('862','Venezuela')]:add(id,n,'special','The OAS depositary lists a Rio Treaty record, but this does not make its government a U.S. ally. Shown neutrally rather than as part of a U.S. bloc.','Treaty registration alone cannot characterize relations with China; this country is not assigned to either alliance color here.',['rio'])
assert len([r for r in rows if r['properties']['group']=='nato'])==32
add('304','Greenland','territory','','',[])
rows[-1]['properties']['category']='Self-governing territory · Kingdom of Denmark / NATO'
add('158','Taiwan / Republic of China','taiwan','','',[])
rows[-1]['properties']['category']='Taiwan / Republic of China · U.S. security partner'
for row in rows:
 if row['id']=='804':row['properties']['group']='uspartner';row['properties']['category']='Ukraine · U.S. security partner, not a treaty ally'
profiles_path=root/'country-profiles.json'
if profiles_path.exists():
 profiles={p['id']:p for p in json.loads(profiles_path.read_text())}
 for row in rows:
  if row['id']!='840':
   assert row['id'] in profiles, 'Missing detailed profile: '+row['id']
   row['properties'].update({key:profiles[row['id']][key] for key in ['us','china','sources','reviewed']})
(root/'dist/relationships.json').write_text(json.dumps({'reviewed':'2026-10-10','features':rows},separators=(',',':')))
