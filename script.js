const videos = [
  {title:'The rice terraces: farming in harmony with nature',channel:'The Soil Story',initials:'SS',avatar:'avatar-soil',image:'rice-terraces.jpg',category:'Stories',duration:'12:48',views:'1.2M',age:'3 weeks ago',description:'Journey into the hills to meet growers who have perfected the art of terrace farming over generations. A story of patience, community, and working with the land.'},
  {title:'Natural compost at home — from kitchen waste to black gold',channel:'Green Acre',initials:'GA',avatar:'avatar-green',image:'onions.jpg',category:'Organic',duration:'08:24',views:'486K',age:'5 days ago',description:'Turn everyday kitchen scraps into rich, living compost. This practical step-by-step guide covers the right mix, moisture, aeration, and common mistakes to avoid.'},
  {title:'Inside the greenhouse growing tomorrow’s food',channel:'Future Fields',initials:'FF',avatar:'avatar-green',image:'greenhouse.jpg',category:'Technology',duration:'15:06',views:'829K',age:'1 week ago',description:'See how sensor-driven irrigation, thoughtful design, and renewable energy are helping a new generation of growers produce more with fewer resources.'},
  {title:'A farmer’s guide to healthy, living soil',channel:'Rural Knowledge',initials:'RK',avatar:'avatar-gold',image:'farmer-crops.jpg',category:'Crops',duration:'10:32',views:'2.1M',age:'2 weeks ago',description:'Learn to read the signs of healthy soil and build fertility naturally with cover crops, organic matter, and simple low-cost field practices.'},
  {title:'Women leading India’s organic farming movement',channel:'The Soil Story',initials:'SS',avatar:'avatar-soil',image:'woman-farmer.jpg',category:'Stories',duration:'18:45',views:'654K',age:'4 days ago',description:'Meet the women building resilient farms and stronger rural communities through organic growing, shared knowledge, and entrepreneurship.'},
  {title:'Harvesting rice: traditions passed through generations',channel:'Rural Knowledge',initials:'RK',avatar:'avatar-gold',image:'rice-harvest.jpg',category:'Crops',duration:'09:17',views:'340K',age:'1 month ago',description:'From field preparation to the final harvest, discover the knowledge and careful timing behind a successful rice crop.'},
  {title:'Small farm, big harvest: growing vegetables naturally',channel:'Green Acre',initials:'GA',avatar:'avatar-green',image:'vegetables.jpg',category:'Organic',duration:'11:09',views:'975K',age:'6 days ago',description:'Make the most of a small growing space with companion planting, succession sowing, and simple organic pest management.'},
  {title:'Smart farming tools that actually save you money',channel:'Future Fields',initials:'FF',avatar:'avatar-green',image:'agritech.jpg',category:'Technology',duration:'13:51',views:'718K',age:'3 days ago',description:'A practical look at affordable farm technology—from soil sensors to efficient irrigation—and how to choose tools that earn their keep.'},
  {title:'The complete guide to washing and storing carrots',channel:'Harvest & Home',initials:'HH',avatar:'avatar-gold',image:'carrots.jpg',category:'Business',duration:'06:40',views:'225K',age:'1 week ago',description:'Protect quality after harvest with gentle washing, correct curing, and simple storage methods that reduce waste.'},
  {title:'From field to market: building a farm brand',channel:'Harvest & Home',initials:'HH',avatar:'avatar-gold',image:'harvest.jpg',category:'Business',duration:'16:20',views:'432K',age:'2 weeks ago',description:'Learn how small growers can tell their story, pack produce beautifully, and build direct relationships with local customers.'},
  {title:'Reading your rice field: water, weeds, and growth',channel:'Rural Knowledge',initials:'RK',avatar:'avatar-gold',image:'rice-aerial.jpg',category:'Crops',duration:'14:12',views:'389K',age:'5 days ago',description:'Understand water levels, spot common nutrient deficiencies, and use field observation to make better crop-care decisions.'},
  {title:'One acre, many possibilities: a farmer’s journey',channel:'The Soil Story',initials:'SS',avatar:'avatar-soil',image:'farmer-hoe.jpg',category:'Stories',duration:'20:05',views:'1.6M',age:'1 month ago',description:'A thoughtful portrait of a smallholder using crop diversity and traditional knowledge to create a resilient one-acre farm.'}
];
let state={category:'All',query:'',saved:new Set(JSON.parse(localStorage.getItem('agriSaved')||'[]')),history:[],mode:'home',current:null,subscribed:false,liked:false,playing:false,timer:null,progress:0};
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const grid=$('#videoGrid');
function visibleVideos(){
  let list=videos.map((v,i)=>({...v,id:i}));
  if(state.mode==='library') list=list.filter(v=>state.saved.has(v.id));
  if(state.mode==='history') list=list.filter(v=>state.history.includes(v.id));
  if(state.mode==='following') list=list.filter(v=>['Rural Knowledge','The Soil Story','Green Acre'].includes(v.channel));
  if(state.mode==='playlists') list=list.filter(v=>['Organic','Crops'].includes(v.category));
  if(state.category!=='All') list=list.filter(v=>v.category===state.category);
  if(state.query){const q=state.query.toLowerCase();list=list.filter(v=>(v.title+' '+v.channel+' '+v.category).toLowerCase().includes(q));}
  return list;
}
function render(){
  const list=visibleVideos();
  grid.innerHTML=list.map(v=>`<article class="video-card" data-video="${v.id}" tabindex="0" aria-label="Play ${v.title}"><div class="thumb"><img src="assets/images/${v.image}" alt="${v.title}" loading="lazy"/><span class="duration">${v.duration}</span><button class="thumb-save ${state.saved.has(v.id)?'saved':''}" data-save="${v.id}" aria-label="${state.saved.has(v.id)?'Remove from saved':'Save video'}"><svg><use href="#i-bookmark"/></svg></button></div><div class="video-info"><span class="mini-avatar ${v.avatar}">${v.initials}</span><div class="video-copy"><h3>${v.title}</h3><span class="channel-name">${v.channel}<span class="verified">✓</span></span><div class="video-stats">${v.views} views &nbsp;·&nbsp; ${v.age}</div></div><button class="video-more" aria-label="More options"><svg><use href="#i-more"/></svg></button></div></article>`).join('');
  $('#emptyState').hidden=list.length>0;
  $$('.chip').forEach(b=>b.classList.toggle('active',b.dataset.category===state.category));
}
function toast(text){const el=$('#toast');el.querySelector('span').textContent=text;el.classList.add('show');clearTimeout(el.t);el.t=setTimeout(()=>el.classList.remove('show'),2600)}
function toggleSave(id){id=Number(id);state.saved.has(id)?state.saved.delete(id):state.saved.add(id);localStorage.setItem('agriSaved',JSON.stringify([...state.saved]));render();if(state.current===id)updateWatchActions();toast(state.saved.has(id)?'Saved to your library':'Removed from your library')}
function openVideo(id){
  id=Number(id);const v=videos[id];state.current=id;state.progress=0;state.playing=false;clearInterval(state.timer);
  if(!state.history.includes(id))state.history.unshift(id);
  $('#playerImage').src=`assets/images/${v.image}`;$('#playerImage').alt=v.title;$('#watchCategory').textContent=v.category.toUpperCase()+' · AGRICULTURE TUBE ORIGINAL';$('#watchTitle').textContent=v.title;$('#watchMeta').textContent=`${v.views} views · ${v.age}`;$('#watchChannel').textContent=v.channel;$('#watchAvatar').textContent=v.initials;$('#watchAvatar').className=`mini-avatar ${v.avatar}`;$('#watchDescription').textContent=v.description;$('#duration').textContent=v.duration;$('#progress').value=0;$('#currentTime').textContent='0:00';state.liked=false;updateWatchActions();updatePlayUI();$('#watchModal').hidden=false;document.body.style.overflow='hidden';
}
function updateWatchActions(){const saved=state.saved.has(state.current);$('#saveBtn').classList.toggle('active',saved);$('#saveBtn span').textContent=saved?'Saved':'Save';$('#likeBtn').classList.toggle('active',state.liked);$('#likeBtn span').textContent=state.liked?'Liked':'Like'}
function updatePlayUI(){const icon=state.playing?'#i-pause':'#i-play';$('#bigPlay use').setAttribute('href',state.playing?'#i-pause':'#i-play');$('#playToggle use').setAttribute('href',icon);$('#bigPlay').style.opacity=state.playing?'0':'1';$('#bigPlay').style.pointerEvents=state.playing?'none':'auto'}
function togglePlay(){state.playing=!state.playing;clearInterval(state.timer);if(state.playing){state.timer=setInterval(()=>{state.progress=Math.min(100,state.progress+.35);$('#progress').value=state.progress;const seconds=Math.round(state.progress*7.68);$('#currentTime').textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;if(state.progress>=100){state.playing=false;clearInterval(state.timer);updatePlayUI()}},250)}updatePlayUI()}
function closeModal(id){$('#'+id).hidden=true;document.body.style.overflow='';if(id==='watchModal'){state.playing=false;clearInterval(state.timer);updatePlayUI()}}
function navigate(mode){state.mode=mode;state.category='All';state.query='';$('#searchInput').value='';const titles={home:['Good things are growing.','Practical wisdom from fields, farms, and people who feed the world.'],discover:['Discover something growing.','Explore ideas, techniques, and voices from across the farming world.'],following:['From channels you follow.','Fresh knowledge from your trusted farming community.'],library:['Your saved videos.','A little library of ideas to return to whenever you need them.'],history:['Your watch history.','Pick up where you left off and revisit what you’ve learned.'],playlists:['From seed to harvest.','Your curated collection of practical growing guides.']};$('#pageTitle').textContent=titles[mode][0];$('#pageSubtitle').textContent=titles[mode][1];$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.nav===mode));$('#sidebar').classList.remove('open');render();window.scrollTo({top:0,behavior:'smooth'})}

grid.addEventListener('click',e=>{const save=e.target.closest('[data-save]');if(save){e.stopPropagation();toggleSave(save.dataset.save);return}const card=e.target.closest('[data-video]');if(card)openVideo(card.dataset.video)});
grid.addEventListener('keydown',e=>{if(e.key==='Enter'){const card=e.target.closest('[data-video]');if(card)openVideo(card.dataset.video)}});
$('.hero-card').addEventListener('click',()=>openVideo(0));
$('#categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(b){state.category=b.dataset.category;render()}});
$('#searchInput').addEventListener('input',e=>{state.query=e.target.value.trim();render()});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#searchInput').focus()}if(e.key==='Escape'){$$('.modal-backdrop').forEach(m=>m.hidden=true);document.body.style.overflow='';state.playing=false;clearInterval(state.timer)}});
$('#resetSearch').onclick=()=>{state.query='';state.category='All';state.mode='home';$('#searchInput').value='';render()};
$$('[data-nav]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav)));
$$('[data-channel]').forEach(b=>b.addEventListener('click',()=>{navigate('following');state.query=b.dataset.channel;$('#searchInput').value=state.query;render()}));
$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');
$$('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
$$('.modal-backdrop').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)}));
$('#bigPlay').onclick=togglePlay;$('#playToggle').onclick=togglePlay;
$('#progress').oninput=e=>{state.progress=Number(e.target.value);const s=Math.round(state.progress*7.68);$('#currentTime').textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
$('#likeBtn').onclick=()=>{state.liked=!state.liked;updateWatchActions();toast(state.liked?'Thanks for the appreciation':'Like removed')};
$('#saveBtn').onclick=()=>toggleSave(state.current);
$('#subscribeBtn').onclick=()=>{state.subscribed=!state.subscribed;$('#subscribeBtn').classList.toggle('subscribed',state.subscribed);$('#subscribeBtn').textContent=state.subscribed?'Subscribed ✓':'Subscribe';toast(state.subscribed?'Welcome to the growing community':'Subscription removed')};
$('#shareBtn').onclick=async()=>{const text=`${videos[state.current].title} — Agriculture Tube`;try{if(navigator.share)await navigator.share({title:text,url:location.href});else{await navigator.clipboard.writeText(location.href);toast('Video link copied to clipboard')}}catch(e){toast('Sharing cancelled')}};
$('#readNote').onclick=()=>$('#noteModal').hidden=false;
$('#collectionBtn').onclick=()=>navigate('playlists');
$('#uploadBtn').onclick=()=>$('#uploadModal').hidden=false;
$('#fileInput').onchange=e=>$('#fileLabel').textContent=e.target.files[0]?.name||'Choose a video file';
$('#publishBtn').onclick=async()=>{
  const title=$('#uploadTitle').value.trim(),file=$('#fileInput').files[0];
  if(!title){toast('Please add a title for your video');$('#uploadTitle').focus();return}
  if(!file){toast('Please choose a video file');return}
  if(file.size>2*1024*1024*1024){toast('Please choose a file smaller than 2 GB');return}
  if(!window.apiIntegrations?.mux){closeModal('uploadModal');toast('Demo only: add Mux keys to enable real uploads');return}
  const button=$('#publishBtn');button.disabled=true;button.textContent='Preparing secure upload…';
  try{
    const uploadResponse=await fetch('/api/uploads/mux',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    const upload=await uploadResponse.json();if(!uploadResponse.ok)throw new Error(upload.error||'Could not create upload');
    button.textContent='Uploading video…';
    const putResponse=await fetch(upload.url,{method:'PUT',body:file,headers:{'Content-Type':file.type||'video/mp4'}});
    if(!putResponse.ok)throw new Error('Video upload failed');
    if(window.apiIntegrations.supabase){
      const saveResponse=await fetch('/api/videos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,muxUploadId:upload.id})});
      if(!saveResponse.ok)throw new Error('Uploaded, but video details could not be saved');
    }
    closeModal('uploadModal');toast('Upload complete! Your video is now processing.');$('#uploadTitle').value='';$('#fileInput').value='';$('#fileLabel').textContent='Choose a video file';
  }catch(error){toast(error.message||'Upload failed. Please try again.')}finally{button.disabled=false;button.textContent='Publish video'}
};
async function connectLiveServices(){
  try{
    const response=await fetch('/api/health');if(!response.ok)return;
    const health=await response.json();window.apiIntegrations=health.integrations;
    if(health.integrations.weather){
      const weatherResponse=await fetch('/api/weather?city=Chennai');if(!weatherResponse.ok)return;
      const weather=await weatherResponse.json();const card=$('.weather');
      card.querySelector('div strong').textContent=`${weather.temperature}°C`;card.querySelector('div span').textContent=`${weather.city}, ${weather.region}`;
      card.querySelector('p').innerHTML=`${weather.humidity}% humidity<br/><strong>${weather.windKph} km/h wind</strong>`;
    }
  }catch(error){/* Static demo remains available when the backend is offline. */}
}
connectLiveServices();
function setupPopover(btn,popup){$(btn).onclick=e=>{e.stopPropagation();const p=$(popup);const open=!p.hidden;$$('.popover').forEach(x=>x.hidden=true);p.hidden=open}}
setupPopover('#notificationBtn','#notifications');setupPopover('#profileBtn','#profileMenu');
document.addEventListener('click',e=>{if(!e.target.closest('.popover-anchor'))$$('.popover').forEach(x=>x.hidden=true)});
render();
