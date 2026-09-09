import * as THREE from 'three';

const scene=new THREE.Scene(); scene.background=new THREE.Color(0x87a86b); scene.fog=new THREE.Fog(0x87a86b,180,520);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.1,900); camera.position.set(0,2,8);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'}); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.25)); document.body.appendChild(renderer.domElement);
const hemi=new THREE.HemisphereLight(0xddeeff,0x334422,1.5); scene.add(hemi); const sun=new THREE.DirectionalLight(0xffffff,1.5); sun.position.set(80,140,40); scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(700,700),new THREE.MeshLambertMaterial({color:0x5d7b45})); ground.rotation.x=-Math.PI/2; scene.add(ground);
const grid=new THREE.GridHelper(700,70,0x607950,0x657b55); grid.position.y=.02; grid.material.opacity=.18; grid.material.transparent=true; scene.add(grid);

const keys={}; addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyR')reload();if(e.code==='KeyE')loot();if(e.code==='KeyF')vehicle();if(e.code==='Tab'){e.preventDefault();inventory=!inventory;document.getElementById('msg').textContent=inventory?'INVENTORY • E PICKUP':' ';}});addEventListener('keyup',e=>keys[e.code]=false);
let yaw=0,pitch=0,locked=false,inventory=false; renderer.domElement.addEventListener('click',()=>renderer.domElement.requestPointerLock());document.addEventListener('pointerlockchange',()=>locked=document.pointerLockElement===renderer.domElement);document.addEventListener('mousemove',e=>{if(!locked)return;yaw-=e.movementX*.0022;pitch-=e.movementY*.0022;pitch=Math.max(-1.35,Math.min(1.35,pitch));});

const player={pos:new THREE.Vector3(0,1.8,40),hp:100,armor:0,ammo:30,reserve:180,mag:30,kills:0,skin:0,inCar:false,speed:7};
const bots=[],lootItems=[],vehicles=[];
function mat(c){return new THREE.MeshLambertMaterial({color:c});}
function box(x,y,z,c){const m=new THREE.Mesh(new THREE.BoxGeometry(x,y,z),mat(c));return m;}
function building(x,z,s=1){const b=box(12*s,8*s,10*s,0x77746c);b.position.set(x,4*s,z);scene.add(b);for(let i=-1;i<=1;i++){let w=box(1.7*s,1.5*s,.12,0x1b3540);w.position.set(x+i*3*s,4*s,z-5.06*s);scene.add(w);}return b;}
for(let i=0;i<26;i++){const x=(Math.random()-.5)*430,z=(Math.random()-.5)*430;if(Math.hypot(x,z)<70)continue;building(Math.round(x/12)*12,Math.round(z/12)*12,.7+Math.random()*.8);}
function tree(x,z){const t=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,3,8),mat(0x66452b));trunk.position.y=1.5;t.add(trunk);const crown=new THREE.Mesh(new THREE.DodecahedronGeometry(2.4,0),mat(0x294f2c));crown.position.y=4;t.add(crown);t.position.set(x,0,z);scene.add(t);}
for(let i=0;i<150;i++){let x=(Math.random()-.5)*620,z=(Math.random()-.5)*620;if(Math.hypot(x,z)>35)tree(x,z);}

function makeBot(i){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.45,1.1,4,8),mat(i%3===0?0x222b38:0x806d45));body.position.y=1.05;g.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.35,8,8),mat(0xc58f68));head.position.y=2.0;g.add(head);const gun=box(.12,.12,1.4,0x171717);gun.position.set(.5,1.25,-.5);gun.rotation.x=.2;g.add(gun);g.position.set((Math.random()-.5)*420,0,(Math.random()-.5)*420);if(g.position.distanceTo(player.pos)<90)g.position.z+=130;scene.add(g);bots.push({g,hp:100,next:Math.random()*2,alive:true,skill:.25+Math.random()*.5});}
for(let i=0;i<24;i++)makeBot(i);

function lootBox(x,z,type){const colors={ammo:0xe1bd39,med:0xc63838,armor:0x3b73b9,weapon:0x777777};const g=new THREE.Mesh(new THREE.BoxGeometry(.7,.5,.7),mat(colors[type]));g.position.set(x,.3,z);scene.add(g);lootItems.push({g,type,taken:false});}
for(let i=0;i<70;i++){const x=(Math.random()-.5)*430,z=(Math.random()-.5)*430;lootBox(x,z,['ammo','ammo','med','armor','weapon'][Math.floor(Math.random()*5)]);}
function makeCar(x,z){const g=new THREE.Group();const body=box(2.4,.7,4.5,0x263b2a);body.position.y=.7;g.add(body);for(const sx of[-1,1])for(const sz of[-1,1]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.28,12),mat(0x111111));w.rotation.z=Math.PI/2;w.position.set(sx*1.3,.42,sz*1.45);g.add(w);}g.position.set(x,.0,z);scene.add(g);vehicles.push({g,speed:0,occupied:false});}
for(let i=0;i<8;i++)makeCar((Math.random()-.5)*360,(Math.random()-.5)*360);

const zone={center:new THREE.Vector3(0,0,0),radius:300,target:70,t:0};const ring=new THREE.Mesh(new THREE.RingGeometry(zone.radius-1,zone.radius,96),new THREE.MeshBasicMaterial({color:0x4da6ff,side:THREE.DoubleSide,transparent:true,opacity:.3}));ring.rotation.x=-Math.PI/2;ring.position.y=.05;scene.add(ring);
function distZone(){return Math.hypot(player.pos.x-zone.center.x,player.pos.z-zone.center.z);}
function fire(){if(player.inCar||player.ammo<=0)return;player.ammo--;const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);let best=null,bd=999;for(const b of bots){if(!b.alive)continue;const p=b.g.position.clone().add(new THREE.Vector3(0,1,0));const to=p.sub(camera.position),d=to.length();if(d>160)continue;const a=dir.angleTo(to.normalize());if(a<.045&&d<bd){best=b;bd=d;}}if(best){best.hp-=34;if(best.hp<=0){best.alive=false;best.g.visible=false;player.kills++;lootBox(best.g.position.x,best.g.position.z,'ammo');}}
}
let firing=false;addEventListener('mousedown',e=>{if(e.button===0){firing=true;fire();}});addEventListener('mouseup',e=>{if(e.button===0)firing=false;});
function reload(){if(player.ammo>=player.mag||player.reserve<=0)return;const n=Math.min(player.mag-player.ammo,player.reserve);player.ammo+=n;player.reserve-=n;}
function nearest(arr,max=4){let best=null,bd=max;for(const a of arr){if(a.taken)continue;const d=a.g.position.distanceTo(player.pos);if(d<bd){best=a;bd=d;}}return best;}
function loot(){const l=nearest(lootItems,4);if(!l)return;l.taken=true;l.g.visible=false;if(l.type==='ammo')player.reserve+=90;if(l.type==='med')player.hp=Math.min(100,player.hp+35);if(l.type==='armor')player.armor=Math.min(100,player.armor+25);if(l.type==='weapon'){player.mag=40;player.ammo=40;}}
let car=null;function vehicle(){if(player.inCar){player.inCar=false;if(car){player.pos.copy(car.g.position).add(new THREE.Vector3(3,2,0));car.occupied=false;car=null;}return;}for(const v of vehicles){if(v.g.position.distanceTo(player.pos)<5){car=v;car.occupied=true;player.inCar=true;break;}}}
function move(dt){const forward=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));let f=(keys.KeyW?1:0)-(keys.KeyS?1:0),r=(keys.KeyD?1:0)-(keys.KeyA?1:0);const v=player.inCar?18:player.speed*(keys.ShiftLeft?1.45:1)*(keys.KeyC?.55:1);if(f||r){const d=forward.multiplyScalar(f).add(right.multiplyScalar(r)).normalize().multiplyScalar(v*dt);player.pos.add(d);}player.pos.x=Math.max(-330,Math.min(330,player.pos.x));player.pos.z=Math.max(-330,Math.min(330,player.pos.z));if(player.inCar&&car){car.g.position.copy(player.pos);car.g.position.y=0;}}
function botAI(dt){for(const b of bots){if(!b.alive)continue;const d=b.g.position.distanceTo(player.pos);const to=player.pos.clone().sub(b.g.position);if(d<85){to.y=0;to.normalize();b.g.position.add(to.multiplyScalar(dt*(1.2+b.skill*1.5)));b.g.lookAt(player.pos.x,b.g.position.y,player.pos.z);b.next-=dt;if(b.next<=0){b.next=1.1+Math.random()*1.8;if(Math.random()<b.skill*.55){const dmg=7+Math.random()*8;player.hp-=Math.max(2,dmg-player.armor*.04);}}}else{b.g.rotation.y+=dt*.25;}}}
function updateZone(dt){zone.t+=dt;if(zone.t>25&&zone.radius>zone.target){zone.radius-=dt*2.2;ring.scale.set(zone.radius/300,zone.radius/300,1);}if(distZone()>zone.radius)player.hp-=dt*4;}
function cameraUpdate(){if(player.inCar){camera.position.lerp(player.pos.clone().add(new THREE.Vector3(0,5,9).applyAxisAngle(new THREE.Vector3(0,1,0),yaw)),.18);camera.lookAt(player.pos.clone().add(new THREE.Vector3(0,1,0)));}else{camera.position.copy(player.pos);camera.rotation.set(pitch,yaw,0,'YXZ');}}
function ui(){document.getElementById('ammo').textContent=`${player.ammo} / ${player.reserve}`;document.getElementById('stats').textContent=`HP ${Math.max(0,player.hp|0)} • Armor ${player.armor} • Alive ${bots.filter(b=>b.alive).length+1} • Kills ${player.kills} • Zone ${zone.radius|0}m`;}
let last=performance.now(),dead=false;function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!dead){move(dt);botAI(dt);updateZone(dt);if(firing&&now%140<35)fire();cameraUpdate();ui();if(player.hp<=0){dead=true;document.getElementById('msg').textContent='YOU ARE ELIMINATED';}else if(bots.every(b=>!b.alive)){dead=true;document.getElementById('msg').textContent='WINNER WINNER • OFFLINE';} }renderer.render(scene,camera);requestAnimationFrame(loop);}requestAnimationFrame(loop);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
