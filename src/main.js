import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/controls/OrbitControls.js';
import {GLTFExporter} from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/exporters/GLTFExporter.js';
const host=document.querySelector('#viewport'),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(3.1,2.2,5.1);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;host.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.45,0);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.86;
scene.add(new THREE.HemisphereLight(0xd9e8ff,0x46334c,2));const sun=new THREE.DirectionalLight(0xffffff,2.3);sun.position.set(3,6,4);sun.castShadow=true;scene.add(sun);const fill=new THREE.DirectionalLight(0x8ab7ff,.8);fill.position.set(-4,3,-2);scene.add(fill);
const floor=new THREE.Mesh(new THREE.CircleGeometry(4,48),new THREE.MeshStandardMaterial({color:0x202c48,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.03;scene.add(floor);const grid=new THREE.GridHelper(8,32,0x53658d,0x293957);grid.position.y=-.02;scene.add(grid);
const root=new THREE.Group();root.name='AF3D_Hero';scene.add(root);const material=(c,r=.75)=>new THREE.MeshStandardMaterial({color:c,roughness:r});const M={skin:material('#f1c6b4'),hair:material('#283c70'),cloth:material('#8b4cc2'),dark:material('#252b40'),eye:material('#42b9e8',.25),white:material('#fff4e9'),shoe:material('#20263a'),gold:material('#e8bd62')};const sphere=new THREE.SphereGeometry(1,24,18);
let p={height:1,shoulder:1,head:1,legs:1,eyes:1,hair:1,style:'anime',hairColor:'#283c70',clothColor:'#8b4cc2',eyeColor:'#42b9e8'};
function mesh(name,g,m,pos,scale=[1,1,1]){let o=new THREE.Mesh(g,m);o.name=name;o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;root.add(o);return o}function ball(n,m,pos,sc){return mesh(n,sphere,m,pos,sc)}
function link(n,m,a,b,ra,rb){let A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A);let o=mesh(n,new THREE.CylinderGeometry(rb,ra,d.length(),14),m,A.clone().add(B).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());ball(n+'_capA',m,a,[ra,ra,ra]);ball(n+'_capB',m,b,[rb,rb,rb]);}
function bodySurface(){const h=p.height,s=p.shoulder;const pts=[[1.08*h,.27],[1.28*h,.30],[1.47*h,.25],[1.70*h,.31*s],[1.91*h,.39*s],[2.06*h,.33*s],[2.14*h,.18]].map(v=>new THREE.Vector2(v[1],v[0]));let g=new THREE.LatheGeometry(pts,32);let o=mesh('AF3D_Torso',g,M.cloth,[0,0,0],[1,1,.68]);return o}
function hand(side,x,y,z){ball('AF3D_Hand_'+side,M.skin,[x,y,z],[.078,.095,.055]);for(let i=0;i<4;i++){let fx=x+(i-1.5)*.036,len=.085-Math.abs(i-1.5)*.012;link(`AF3D_Finger_${side}_${i+1}`,M.skin,[fx,y-.04,z],[fx,y-.04-len,z+.004],.016,.011)}link('AF3D_Thumb_'+side,M.skin,[x-side*.04,y,z],[x-side*.105,y-.065,z+.01],.022,.014)}

// AF3D 0.4: humanoid rig plus vertex-weighted SkinnedMesh limbs.
let rig=null, skeletonHelper=null, rigBones={}, afSkeleton=null, weightMeshes=[], showWeights=false;
function makeBone(name,parent,position){const b=new THREE.Bone();b.name=name;b.position.set(...position);parent.add(b);rigBones[name]=b;return b}
function createRig(){
  rig=new THREE.Group();rig.name="AF3D_Rig";root.add(rig);rigBones={};
  const h=p.height,sh=p.shoulder,leg=p.legs;
  const hips=makeBone("AF3D_Hips",rig,[0,1.17*h,0]);
  const spine=makeBone("AF3D_Spine",hips,[0,.35*h,0]);
  const chest=makeBone("AF3D_Chest",spine,[0,.45*h,0]);
  const neck=makeBone("AF3D_Neck_Bone",chest,[0,.25*h,0]);
  const head=makeBone("AF3D_Head_Bone",neck,[0,.37*h,0]);
  for(const side of [-1,1]){
    const L=side<0?"L":"R";
    const clav=makeBone("AF3D_Clavicle_"+L,chest,[side*.34*sh,.05*h,0]);
    const upper=makeBone("AF3D_UpperArm_Bone_"+L,clav,[side*.08*sh,-.39*h,0]);
    const fore=makeBone("AF3D_Forearm_Bone_"+L,upper,[side*.08*sh,-.36*h,.01]);
    const hand=makeBone("AF3D_Hand_Bone_"+L,fore,[0,-.08*h,.01]);
    const thigh=makeBone("AF3D_Thigh_Bone_"+L,hips,[side*.18,-.10*h,0]);
    const calf=makeBone("AF3D_Calf_Bone_"+L,thigh,[0,-.53*h*leg,0]);
    makeBone("AF3D_Foot_Bone_"+L,calf,[0,-.42*h,0]);
  }
  rig.updateMatrixWorld(true);
  // Keep the generated meshes in place while parenting each rigid part to its controlling bone.
  const children=[...root.children].filter(o=>o!==rig);
  const findBone=(name)=>{
    if(name==="AF3D_Torso"||name==="AF3D_Collar"||name==="AF3D_Belt")return rigBones.AF3D_Spine;
    if(name==="AF3D_Pelvis")return rigBones.AF3D_Hips;
    if(name.startsWith("AF3D_Head")||name.startsWith("AF3D_Jaw")||name.startsWith("AF3D_Ear")||name.startsWith("AF3D_Hair")||name.startsWith("AF3D_Eye")||name.startsWith("AF3D_Iris")||name.startsWith("AF3D_Pupil")||name.startsWith("AF3D_Brow")||name.startsWith("AF3D_Nose")||name.startsWith("AF3D_Mouth"))return rigBones.AF3D_Head_Bone;
    if(name==="AF3D_Neck")return rigBones.AF3D_Neck_Bone;
    if(name.startsWith("AF3D_Shoulder_"))return rigBones["AF3D_Clavicle_"+name.slice(-1)];
    if(name.startsWith("AF3D_UpperArm_")||name.startsWith("AF3D_Elbow_"))return rigBones["AF3D_UpperArm_Bone_"+name.slice(-1)];
    if(name.startsWith("AF3D_Forearm_"))return rigBones["AF3D_Forearm_Bone_"+name.slice(-1)];
    if(name.startsWith("AF3D_Finger_"))return rigBones["AF3D_Hand_Bone_"+name.split("_")[2]];
    if(name.startsWith("AF3D_Hand_")||name.startsWith("AF3D_Thumb_"))return rigBones["AF3D_Hand_Bone_"+name.split("_").slice(-1)[0]];
    if(name.startsWith("AF3D_Thigh_")||name.startsWith("AF3D_Knee_"))return rigBones["AF3D_Thigh_Bone_"+(name.endsWith("-1")?"L":"R")];
    if(name.startsWith("AF3D_Calf_"))return rigBones["AF3D_Calf_Bone_"+(name.endsWith("-1")?"L":"R")];
    if(name.startsWith("AF3D_Boot_"))return rigBones["AF3D_Foot_Bone_"+(name.endsWith("-1")?"L":"R")];
    return null;
  };
  for(const obj of children){
    // Smoothly deformable limbs replace the v0.3 rigid cylinder chains.
    if(/^(AF3D_(UpperArm|Elbow|Forearm|Thigh|Knee|Calf|Boot)_)/.test(obj.name)){obj.parent.remove(obj);continue;}
    const b=findBone(obj.name);if(b)b.attach(obj);
  }
  const boneList=Object.values(rigBones);afSkeleton=new THREE.Skeleton(boneList);
  const boneIndex=name=>boneList.indexOf(rigBones[name]);
  function skinnedLimb(label, startName, jointName, endName, upperRadius, lowerRadius){
    const a=rigBones[startName].getWorldPosition(new THREE.Vector3());
    const j=rigBones[jointName].getWorldPosition(new THREE.Vector3());
    const e=rigBones[endName].getWorldPosition(new THREE.Vector3());
    // Three control points give a continuous tube across the joint.
    const curve=new THREE.CatmullRomCurve3([a,j,e]);
    const segs=32, radial=12, geo=new THREE.TubeGeometry(curve,segs,Math.max(upperRadius,lowerRadius),radial,false);
    const pos=geo.attributes.position, indices=[], weights=[], colors=[];
    const iA=boneIndex(startName),iB=boneIndex(jointName);
    for(let v=0;v<pos.count;v++){
      const ring=Math.floor(v/(radial+1)), t=Math.min(1,ring/segs);
      // Smooth transition centered on the elbow/knee; weights sum to one.
      const q=THREE.MathUtils.clamp((t-.38)/.24,0,1), blend=q*q*(3-2*q);
      const wa=1-blend, wb=blend;
      indices.push(iA,iB,0,0);weights.push(wa,wb,0,0);
      colors.push(.25+.75*wa,.25+.75*wb,.35);
    }
    geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
    geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const mat=M.skin.clone();mat.vertexColors=showWeights;mat.roughness=.72;
    const sm=new THREE.SkinnedMesh(geo,mat);sm.name=label;sm.castShadow=true;sm.receiveShadow=true;root.add(sm);sm.bind(afSkeleton);weightMeshes.push(sm);
  }
  weightMeshes=[];
  for(const side of ['L','R']){
    skinnedLimb('AF3D_SkinnedArm_'+side,'AF3D_UpperArm_Bone_'+side,'AF3D_Forearm_Bone_'+side,'AF3D_Hand_Bone_'+side,.085,.062);
    skinnedLimb('AF3D_SkinnedLeg_'+side,'AF3D_Thigh_Bone_'+side,'AF3D_Calf_Bone_'+side,'AF3D_Foot_Bone_'+side,.12,.075);
  }
  skeletonHelper=new THREE.SkeletonHelper(rigBones.AF3D_Hips);skeletonHelper.visible=document.querySelector("#showSkeleton")?.checked||false;skeletonHelper.material.color.set(0x68f0c0);scene.add(skeletonHelper);
  rig.updateMatrixWorld(true);
}
function setPose(mode){
  if(!rigBones.AF3D_Hips)return;
  for(const b of Object.values(rigBones)){b.rotation.set(0,0,0)}
  const l=rigBones,r=mode;
  if(r==="arms"){l.AF3D_UpperArm_Bone_L.rotation.z=-.9;l.AF3D_UpperArm_Bone_R.rotation.z=.9}
  if(r==="left"){l.AF3D_UpperArm_Bone_L.rotation.z=-1.55;l.AF3D_Forearm_Bone_L.rotation.x=-.25}
  if(r==="right"){l.AF3D_UpperArm_Bone_R.rotation.z=1.55;l.AF3D_Forearm_Bone_R.rotation.x=-.25}
  if(r==="combat"){l.AF3D_UpperArm_Bone_L.rotation.z=-.85;l.AF3D_Forearm_Bone_L.rotation.z=.55;l.AF3D_UpperArm_Bone_R.rotation.z=.75;l.AF3D_Forearm_Bone_R.rotation.z=-.6;l.AF3D_Spine.rotation.y=.12}
  rig.updateMatrixWorld(true);if(afSkeleton)afSkeleton.update();if(skeletonHelper)skeletonHelper.update();
}

function build(){if(skeletonHelper){scene.remove(skeletonHelper);skeletonHelper=null}root.clear();rig=null;rigBones={};M.hair.color.set(p.hairColor);M.cloth.color.set(p.clothColor);M.eye.color.set(p.eyeColor);let h=p.height,hd=p.head,sh=p.shoulder,leg=p.legs;
bodySurface();ball('AF3D_Pelvis',M.dark,[0,1.17*h,0],[.33,.22,.21]);
for(let s of [-1,1]){let x=s*.18,k=.54*h*leg;link('AF3D_Thigh_'+s,M.dark,[x,1.07*h,0],[x*.98,k,0],.145,.105);ball('AF3D_Knee_'+s,M.dark,[x*.98,k,0],[.105,.11,.105]);link('AF3D_Calf_'+s,M.dark,[x*.98,k,0],[x,.12*h,0],.105,.07);ball('AF3D_Boot_'+s,M.shoe,[x,.07,.07],[.115,.08,.20]);}
for(let s of [-1,1]){let L=s<0?'L':'R',sx=s*.37*sh,ex=s*.48*sh,wx=s*.49*sh;ball('AF3D_Shoulder_'+L,M.cloth,[sx,2.02*h,0],[.15,.15,.16]);link('AF3D_UpperArm_'+L,M.skin,[sx,2.02*h,0],[ex,1.63*h,0],.105,.082);ball('AF3D_Elbow_'+L,M.skin,[ex,1.63*h,0],[.08,.08,.08]);link('AF3D_Forearm_'+L,M.skin,[ex,1.63*h,0],[wx,1.27*h,.01],.082,.06);hand(L,wx,1.19*h,.02)}
link('AF3D_Neck',M.skin,[0,2.14*h,0],[0,2.4*h,0],.105,.10);let hy=2.59*h;ball('AF3D_Head',M.skin,[0,hy,0],[.285*hd,.37*hd,.255*hd]);ball('AF3D_Jaw',M.skin,[0,hy-.19*hd,.025],[.22*hd,.15*hd,.21*hd]);for(let s of [-1,1])ball('AF3D_Ear_'+s,M.skin,[s*.28*hd,hy-.02,0],[.05,.085,.05]);
ball('AF3D_Hair_Cap',M.hair,[0,hy+.19*hd,-.015],[.30*hd,.235*hd,.28*hd]);ball('AF3D_Hair_Back',M.hair,[0,hy-.12*hd,-.19*p.hair],[.275*hd,.34*hd,.16*p.hair]);for(let i=-2;i<=2;i++){let lock=ball('AF3D_Hair_Lock_'+(i+3),M.hair,[i*.105*hd,hy+.015*hd,.215*hd],[.068*hd,.19*hd,.075]);lock.rotation.z=-i*.12}
for(let s of [-1,1]){let x=s*.112*hd;ball('AF3D_EyeWhite_'+s,M.white,[x,hy+.015*hd,.237*hd],[.071*p.eyes*hd,.088*p.eyes*hd,.026]);ball('AF3D_Iris_'+s,M.eye,[x,hy+.01*hd,.262*hd],[.042*p.eyes*hd,.061*p.eyes*hd,.016]);ball('AF3D_Pupil_'+s,M.dark,[x,hy+.01*hd,.277*hd],[.018,.04,.009]);ball('AF3D_Brow_'+s,M.hair,[x,hy+.115*hd,.24*hd],[.065,.012,.014])}ball('AF3D_Nose',M.skin,[0,hy-.055*hd,.255*hd],[.025,.04,.025]);ball('AF3D_Mouth',M.dark,[0,hy-.145*hd,.246*hd],[.042,.009,.009]);ball('AF3D_Collar',M.white,[0,2.12*h,.18],[.15,.07,.04]);ball('AF3D_Belt',M.gold,[0,1.36*h,.19],[.27,.03,.03]);createRig();}
build();function resize(){let w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}addEventListener('resize',resize);resize();(function loop(){requestAnimationFrame(loop);controls.update();renderer.render(scene,camera)})();
function read(){for(let k of ['height','shoulder','head','legs','eyes','hair'])p[k]=+document.getElementById(k).value;p.style=document.querySelector('#styleMode').value;p.hairColor=document.querySelector('#hairColor').value;p.clothColor=document.querySelector('#clothColor').value;p.eyeColor=document.querySelector('#eyeColor').value;for(let k of ['height','shoulder','head','legs','eyes','hair'])document.getElementById(k+'Out').value=p[k].toFixed(2)}function sync(){for(let k of ['height','shoulder','head','legs','eyes','hair'])document.getElementById(k).value=p[k];document.querySelector('#styleMode').value=p.style;document.querySelector('#hairColor').value=p.hairColor;document.querySelector('#clothColor').value=p.clothColor;document.querySelector('#eyeColor').value=p.eyeColor;read()}
document.querySelectorAll('#body input,#face input,#style input,#style select').forEach(e=>e.addEventListener('input',()=>{read();build()}));
document.querySelector('#showSkeleton').addEventListener('change',e=>{if(skeletonHelper)skeletonHelper.visible=e.target.checked});
document.querySelector('#poseMode').addEventListener('change',e=>setPose(e.target.value));
document.querySelector('#resetRig').addEventListener('click',()=>{document.querySelector('#poseMode').value='neutral';setPose('neutral');});document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button,.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelector('#'+b.dataset.tab).classList.add('active')});
document.querySelector('#front').onclick=()=>{camera.position.set(0,2.1,6);controls.target.set(0,1.45,0);controls.update()};document.querySelector('#reset').onclick=()=>{camera.position.set(3.1,2.2,5.1);controls.target.set(0,1.45,0);controls.update()};document.querySelector('#random').onclick=()=>{p.height=.9+Math.random()*.2;p.shoulder=.85+Math.random()*.3;p.head=.9+Math.random()*.25;p.legs=.9+Math.random()*.2;p.eyes=.85+Math.random()*.5;p.hair=.85+Math.random()*.5;sync();build()};
document.querySelector('#showWeights').addEventListener('change',e=>{showWeights=e.target.checked;for(const m of weightMeshes){m.material.vertexColors=showWeights;m.material.needsUpdate=true}});
document.querySelector('#mirrorWeights').onclick=()=>{document.querySelector('#status').textContent='Pesos simétricos: ambos lados usan la misma distribución procedural'};
document.querySelector('#save').onclick=()=>{read();localStorage.setItem('af3d_project_v04',JSON.stringify({version:'0.4',params:p}));document.querySelector('#status').textContent='Proyecto guardado'};document.querySelector('#load').onclick=()=>{let v=localStorage.getItem('af3d_project_v04')||localStorage.getItem('af3d_project_v03')||localStorage.getItem('af3d_project_v02')||localStorage.getItem('af3d_project_v01');if(!v){document.querySelector('#status').textContent='Sin proyecto guardado';return}try{p=JSON.parse(v).params;sync();build();document.querySelector('#status').textContent='Proyecto cargado'}catch{document.querySelector('#status').textContent='Error de carga'}};document.querySelector('#export').onclick=async()=>{try{let data=await new GLTFExporter().parseAsync(root,{binary:true});let url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'}));let a=document.createElement('a');a.href=url;a.download='AF3D_Hero_v04_skinning_prototype.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);document.querySelector('#status').textContent='GLB 0.4 con mallas ponderadas exportado'}catch(e){console.error(e);document.querySelector('#status').textContent='Error de exportación'}};
