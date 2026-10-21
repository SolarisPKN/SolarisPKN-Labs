#!/usr/bin/env python3
"""Generate two compact, selectable-text ATS-friendly SolarisPKN resumes.
Source: published SolarisPKN Labs portfolio, October 2026.
Run: python scripts/generate-cvs.py (requires reportlab, DejaVu Sans fonts).
"""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public'
OUT.mkdir(exist_ok=True)
FONT_ROOTS = ['/usr/share/fonts/truetype/dejavu', '/usr/local/share/fonts',
              '/usr/share/fonts/truetype/msttcorefonts', 'C:/Windows/Fonts']
def find_font(name):
    for folder in FONT_ROOTS:
        candidate = Path(folder) / name
        if candidate.is_file(): return str(candidate)
    raise FileNotFoundError(f'Missing {name}; install fonts-dejavu-core')
pdfmetrics.registerFont(TTFont('DejaVu', find_font('DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DejaVu-Bold', find_font('DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('DejaVu', normal='DejaVu', bold='DejaVu-Bold')
DARK=colors.HexColor('#142737'); TEAL=colors.HexColor('#006F7D')
GREY=colors.HexColor('#465A69'); RULE=colors.HexColor('#C6DEE2')
W,H=A4; LEFT,RIGHT,TOP,BOTTOM=48,48,45,49
WIDTH=W-LEFT-RIGHT

DATA = {
 'en':{
  'roleline':'Systems Administrator  |  IT Infrastructure  |  Automation & Linux',
  'sections':('PROFESSIONAL PROFILE','CORE TECHNICAL SKILLS','PROFESSIONAL EXPERIENCE','SELECTED TECHNICAL PROJECTS','EDUCATION & SELECTED TRAINING','LANGUAGES & PRACTICE','CORE COMPETENCIES (ATS)','FULL PORTFOLIO'),
  'profile':'Systems Administrator at EXO with hands-on experience in Linux, SaltStack, Docker, Azure and Yocto labs. Founder of SolarisPKN since 2015, designing and maintaining servers, networks, web infrastructure and automation. Background in technical troubleshooting, software integration, electronics and technical documentation.',
  'skills':[
   ('Systems & cloud','Debian, Ubuntu, Windows/Server, Linux VPS, SSH, Azure (labs), Cloudflare, DNS, TLS/HTTPS.'),
   ('Automation & DevOps','SaltStack, Docker/Compose, Git/GitHub, CI workflows, PowerShell, Bash, Python, Node.js.'),
   ('Networking & operations','TCP/IP, DHCP, NAT, VPN, firewalls, OpenWRT, Ubiquiti, backups, diagnostics.'),
   ('Web & data','Nginx, Apache, Astro, HTML/CSS, JavaScript/TypeScript, React, APIs, SQLite, MariaDB.'),
   ('Applied technology','Yocto (labs), ESP32/Arduino, local AI (Ollama, MCP, RAG), hardware, OBS/NVENC.')
  ],
  'jobs':[
   ('EXO','Systems Administrator','Oct 2026 - Present',[
     'Enterprise infrastructure experience and supervised hands-on labs with Linux, SaltStack, Docker and Microsoft Azure.',
     'Embedded Linux/Yocto investigation, environment troubleshooting and reproducible technical documentation.'
   ]),
   ('SolarisPKN','Founder - Infrastructure, Automation & Development','2015 - Present',[
     'Designed and administered Linux/Windows servers, VPS hosting, networks, DNS, HTTPS and Cloudflare services.',
     'Developed documented projects spanning automation, web apps, IoT and local AI, using GitHub workflows.',
     'Provided technical support, hardware diagnosis, recovery and maintenance for users and clients.'
   ]),
   ('TheZapas','IT Infrastructure Administrator','2021 - 2022',[
     'Managed Debian e-commerce servers via SSH, hosting, web deployments, DNS and TLS certificates.',
     'Handled infrastructure issues, web performance and technical SEO.'
   ]),
   ('Lubricantes Villars','Automotive Electronics & Diagnostics Technician','2018 - Present',[
     'Diagnosed electrical faults using OBD-II/DTC, ECU and sensor data, wiring diagrams and systematic testing.'
   ])
  ],
  'projects':[
   ('SolarisPKN-Labs','Astro, Cloudflare Workers, GitHub','Bilingual engineering portfolio, edge routing, technical SEO and consent-based analytics.'),
   ('SolarisPKN-Stats','GitHub Actions, Cloudflare, APIs','Automated GitHub, Cloudflare and PageSpeed metrics aggregated into reusable outputs.'),
   ('SolarisPKN-IA','Node.js, Ollama, MCP','Modular privacy-first local AI assistant with agent, tool and model integration (in development).'),
   ('SolarisPKN-Engineer','Python, SQLite, graphs','Local code/dependency visualization and change-impact analysis (in development).'),
   ('Villars Informa','Astro, TypeScript, PMTiles','Community portal for local news, services, transport and vector maps.'),
   ('SolarisPKN-Control','ESP32, C++, Arduino IoT','Remote computer power control independent of the operating system (in development).'),
   ('SolarisPKN-Transport','Python, SQLite, GTFS','Transport data connectors, validation and export pipeline (in development).'),
   ('Game server infrastructure','Linux VPS, PaperMC, BungeeCord','Hosted Minecraft servers with DNS routing and performance optimization.'),
   ('Broadcast & IoT automation','OBS, Streamer.bot, ESP32','Streaming workflows, webhooks and connected-device automation.')
  ],
  'education':'High school diploma in Social Sciences & Humanities - Adultos 2000 (2018-2021)',
  'courses':[
   'Server Administrator - DKA Formación / Fundación Carlos Slim',
   'Frontend Developer and Data Curator - Fundación Carlos Slim',
   'Cloud Computing - Google Actívate',
   'Project Management, Agile and Lean - Fundación Telefónica',
   'Linux, networking and cybersecurity coursework - Udemy'
  ],
  'languages':'<b>Spanish:</b> native &nbsp;&nbsp; <b>English:</b> technical documentation and reading',
  'practice':'Approach: root-cause analysis, hands-on tests, version control, documentation and improvement.',
  'ats':'Linux Administration | Windows Server | Systems Administration | IT Infrastructure | Technical Support | DevOps | SaltStack | Docker | Azure | Cloudflare | Networking | DNS | HTTPS/TLS | SSH | VPS | Automation | PowerShell | Git/GitHub | Incident Response | Troubleshooting | Backups | Documentation',
  'more':'More projects, technologies, certificates and supporting evidence:',
  'footer':'SolarisPKN  |  CV based on detailed public portfolio  |  Updated October 2026',
  'portfolio':'https://labs.solarispkn.com.ar/en/portfolio/'
 },
 'es':{
  'roleline':'Administrador de Sistemas  |  Infraestructura IT  |  Automatización y Linux',
  'sections':('PERFIL PROFESIONAL','COMPETENCIAS TÉCNICAS','EXPERIENCIA PROFESIONAL','PROYECTOS TÉCNICOS DESTACADOS','FORMACIÓN Y CURSOS SELECCIONADOS','IDIOMAS Y ENFOQUE','COMPETENCIAS CLAVE (ATS)','PORTFOLIO COMPLETO'),
  'profile':'Administrador de Sistemas en EXO, con experiencia práctica en laboratorios de Linux, SaltStack, Docker, Azure y Yocto. Fundador de SolarisPKN desde 2015, donde diseño y mantengo servidores, redes, infraestructura web y automatizaciones. Experiencia en soporte, diagnóstico técnico, integración de software, electrónica y documentación.',
  'skills':[
   ('Sistemas y cloud','Debian, Ubuntu, Windows/Server, VPS Linux, SSH, Azure (labs), Cloudflare, DNS, TLS/HTTPS.'),
   ('Automatización y DevOps','SaltStack, Docker/Compose, Git/GitHub, CI, PowerShell, Bash, Python, Node.js.'),
   ('Redes y operaciones','TCP/IP, DHCP, NAT, VPN, firewalls, OpenWRT, Ubiquiti, backups y diagnóstico.'),
   ('Web y datos','Nginx, Apache, Astro, HTML/CSS, JavaScript/TypeScript, React, APIs, SQLite, MariaDB.'),
   ('Tecnología aplicada','Yocto (labs), ESP32/Arduino, IA local (Ollama, MCP, RAG), hardware, OBS/NVENC.')
  ],
  'jobs':[
   ('EXO','Administrador de Sistemas','Oct 2026 - Actualidad',[
     'Experiencia en infraestructura corporativa y laboratorios prácticos supervisados con Linux, SaltStack, Docker y Azure.',
     'Investigación de Linux embebido/Yocto, diagnóstico de entornos y documentación técnica reproducible.'
   ]),
   ('SolarisPKN','Fundador - Infraestructura, Automatización y Desarrollo','2015 - Actualidad',[
     'Diseñé y administré servidores Linux/Windows, VPS, redes, DNS, HTTPS y servicios Cloudflare.',
     'Desarrollé proyectos documentados de automatización, aplicaciones web, IoT e IA local usando GitHub.',
     'Brindé soporte técnico, diagnóstico de hardware, recuperación y mantenimiento a usuarios y clientes.'
   ]),
   ('TheZapas','Administrador de Infraestructura IT','2021 - 2022',[
     'Administré servidores Debian para comercio electrónico vía SSH, hosting, despliegues web, DNS y TLS.',
     'Atendí incidencias de infraestructura, rendimiento web y SEO técnico.'
   ]),
   ('Lubricantes Villars','Técnico en Electrónica y Diagnóstico Automotor','2018 - Actualidad',[
     'Diagnóstico de fallas eléctricas con OBD-II/DTC, análisis de ECU y sensores, esquemas y pruebas sistemáticas.'
   ])
  ],
  'projects':[
   ('SolarisPKN-Labs','Astro, Cloudflare Workers, GitHub','Portfolio de ingeniería bilingüe, enrutamiento edge, SEO y analítica con consentimiento.'),
   ('SolarisPKN-Stats','GitHub Actions, Cloudflare, APIs','Automatización de métricas de GitHub, Cloudflare y PageSpeed con salidas reutilizables.'),
   ('SolarisPKN-IA','Node.js, Ollama, MCP','Asistente de IA local modular, privado e integrado con herramientas y agentes (en desarrollo).'),
   ('SolarisPKN-Engineer','Python, SQLite, grafos','Visualización de dependencias de código y análisis de impacto de cambios (en desarrollo).'),
   ('Villars Informa','Astro, TypeScript, PMTiles','Portal comunitario con noticias, servicios, transporte y mapas vectoriales.'),
   ('SolarisPKN-Control','ESP32, C++, Arduino IoT','Control remoto de encendido de PC independiente del sistema operativo (en desarrollo).'),
   ('SolarisPKN-Transport','Python, SQLite, GTFS','Conectores, validación y exportación de datos de transporte (en desarrollo).'),
   ('Infraestructura de juegos','VPS Linux, PaperMC, BungeeCord','Servidores Minecraft con DNS propio y optimización de rendimiento.'),
   ('Automatización audiovisual e IoT','OBS, Streamer.bot, ESP32','Automatización de transmisiones, webhooks y dispositivos conectados.')
  ],
  'education':'Bachiller en Ciencias Sociales y Humanidades - Adultos 2000 (2018-2021)',
  'courses':[
   'Administrador de Servidores - DKA Formación / Fundación Carlos Slim',
   'Desarrollador Front-End y Curador de Datos - Fundación Carlos Slim',
   'Cloud Computing - Google Actívate',
   'Gestión de Proyectos, Agile y Lean - Fundación Telefónica',
   'Cursos de Linux, redes y ciberseguridad - Udemy'
  ],
  'languages':'<b>Español:</b> nativo &nbsp;&nbsp; <b>Inglés:</b> lectura y documentación técnica',
  'practice':'Enfoque: análisis de causas, pruebas prácticas, control de versiones, documentación y mejora continua.',
  'ats':'Administración Linux | Windows Server | Administración de Sistemas | Infraestructura IT | Soporte Técnico | DevOps | SaltStack | Docker | Azure | Cloudflare | Redes TCP/IP | DNS | HTTPS/TLS | SSH | VPS | Automatización | PowerShell | Git/GitHub | Gestión de Incidentes | Diagnóstico | Backups | Documentación',
  'more':'Más proyectos, tecnologías, certificaciones y evidencias:',
  'footer':'SolarisPKN  |  CV basado en el portfolio público  |  Actualizado en octubre de 2026',
  'portfolio':'https://labs.solarispkn.com.ar/es/portfolio/'
 }
}
ST = {
 'h1':ParagraphStyle('h1',fontName='DejaVu-Bold',fontSize=16.8,leading=22,textColor=DARK),
 'subtitle':ParagraphStyle('sub',fontName='DejaVu-Bold',fontSize=9.5,leading=13,textColor=TEAL),
 'small':ParagraphStyle('small',fontName='DejaVu',fontSize=8.2,leading=12.1,textColor=GREY),
 'text':ParagraphStyle('text',fontName='DejaVu',fontSize=8.95,leading=13.8,textColor=DARK),
 'skill':ParagraphStyle('skill',fontName='DejaVu',fontSize=8.55,leading=12.75,textColor=DARK),
 'job':ParagraphStyle('job',fontName='DejaVu',fontSize=8.6,leading=12.6,textColor=DARK),
 'project':ParagraphStyle('project',fontName='DejaVu',fontSize=8.55,leading=12.4,textColor=DARK),
 'course':ParagraphStyle('course',fontName='DejaVu',fontSize=8.35,leading=12.4,textColor=DARK),
 'ats':ParagraphStyle('ats',fontName='DejaVu',fontSize=8.25,leading=12.7,textColor=DARK)
}
class Resume:
 def __init__(self,lang):
  self.lang=lang;self.data=DATA[lang]
  self.pdf=canvas.Canvas(str(OUT/f'cv-{lang}.pdf'),pagesize=A4,pageCompression=1)
  self.pdf.setTitle('Pablo Sebastian Marchetti Orayen - CV - '+lang.upper())
  self.pdf.setAuthor('Pablo Sebastian Marchetti Orayen')
  self.y=H-TOP;self.page=1
 def line(self,x1,y1,x2,y2):
  self.pdf.setStrokeColor(RULE);self.pdf.setLineWidth(.5);self.pdf.line(x1,y1,x2,y2)
 def para(self,text,style='text',after=4,indent=0):
  p=Paragraph(text,ST[style]);w,h=p.wrap(WIDTH-indent,800)
  if self.y-h<BOTTOM+20:
   raise RuntimeError(f'Page {self.page} overflow: {text[:55]}')
  p.drawOn(self.pdf,LEFT+indent,self.y-h);self.y-=h+after
 def heading(self,text):
  self.y-=11;self.pdf.setFillColor(TEAL);self.pdf.setFont('DejaVu-Bold',10.1)
  self.pdf.drawString(LEFT,self.y,text);self.y-=5;self.line(LEFT,self.y,LEFT+WIDTH,self.y);self.y-=8
 def footer(self):
  self.line(LEFT,37,LEFT+WIDTH,37);self.pdf.setFillColor(GREY)
  self.pdf.setFont('DejaVu',7.1);self.pdf.drawString(LEFT,23,self.data['footer'])
  self.pdf.drawRightString(W-RIGHT,23,f'{self.page}/2')
 def next(self):
  self.footer();self.pdf.showPage();self.page+=1;self.y=H-TOP
 def make(self):
  t=self.data;s=t['sections']
  self.para('PABLO SEBASTIAN MARCHETTI ORAYEN','h1',after=1)
  self.para(t['roleline'],'subtitle',after=5)
  self.para('Buenos Aires, Argentina &nbsp; | &nbsp; <link href="mailto:pablokoutanya@gmail.com" color="#006F7D">pablokoutanya@gmail.com</link> &nbsp; | &nbsp; <link href="https://www.linkedin.com/in/solarispkn" color="#006F7D">linkedin.com/in/solarispkn</link>','small',after=1)
  self.para('<link href="https://github.com/SolarisPKN" color="#006F7D">github.com/SolarisPKN</link> &nbsp; | &nbsp; <link href="'+t['portfolio']+'" color="#006F7D">'+t['portfolio'].replace('https://','')+'</link> &nbsp; | &nbsp; +54 11 7009-5771','small',after=1)
  self.heading(s[0]);self.para(t['profile'],'text',after=0)
  self.heading(s[1])
  for label,value in t['skills']:self.para('<b>'+label+':</b> '+value,'skill',after=2)
  self.heading(s[2])
  for org,title,date,bullets in t['jobs']:
   self.para('<b>'+org+'</b> &nbsp; | &nbsp; '+title+' &nbsp; <font color="#006F7D">· '+date+'</font>','job',after=2)
   for bullet in bullets:self.para('• &nbsp; '+bullet,'job',after=1,indent=11)
   self.y-=3
  self.next()
  self.heading(s[3])
  for name,stack,description in t['projects']:
   self.para('<b>'+name+'</b> &nbsp; <font color="#006F7D">· '+stack+'</font>','project',after=0)
   self.para(description,'project',after=3)
  self.heading(s[4]);self.para('<b>'+t['education']+'</b>','course',after=3)
  for course in t['courses']:self.para('• &nbsp; '+course,'course',after=1)
  self.heading(s[5]);self.para(t['languages'],'course',after=2)
  self.para(t['practice'],'course',after=0)
  self.heading(s[6]);self.para(t['ats'],'ats',after=0)
  self.heading(s[7]);self.para(t['more']+' <link href="'+t['portfolio']+'" color="#006F7D">'+t['portfolio'].replace('https://','')+'</link>','course',after=1)
  self.footer();self.pdf.save()
  print(f'{self.lang}: generated two-page CV, content bottom y={self.y:.1f}')
if __name__=='__main__':
 for lang in ('en','es'):Resume(lang).make()
