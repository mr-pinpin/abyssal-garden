// Optional, user-initiated procedural ambience: no audio or timers at definition.
function pinpinCreateAmbience() {
  let context,wind,timer,enabled=false;
  const chirp=()=>{
    if(!enabled||document.hidden||!context)return;
    const now=context.currentTime;
    for(let i=0;i<3;i++){
      const oscillator=context.createOscillator(),gain=context.createGain();
      oscillator.type='sine';oscillator.frequency.setValueAtTime(1800+i*280,now+i*.15);
      oscillator.frequency.exponentialRampToValueAtTime(3200+i*200,now+i*.15+.09);
      gain.gain.setValueAtTime(0,now+i*.15);gain.gain.linearRampToValueAtTime(.018,now+i*.15+.025);
      gain.gain.exponentialRampToValueAtTime(.0001,now+i*.15+.13);
      oscillator.connect(gain).connect(context.destination);oscillator.start(now+i*.15);oscillator.stop(now+i*.15+.15);
    }
  };
  const visibility=()=>{if(context){if(document.hidden)context.suspend();else if(enabled)context.resume();}};
  const setEnabled=async value=>{
    enabled=value;
    if(value&&!context){
      const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!Audio)throw new Error('Sound is unavailable in this browser.');
      context=new Audio();
      const noise=context.createBuffer(1,context.sampleRate*3,context.sampleRate),data=noise.getChannelData(0);
      let seed=371;
      for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;data[i]=((seed>>>0)/2147483648-1)*.14;}
      wind=context.createBufferSource();wind.buffer=noise;wind.loop=true;
      const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=480;
      const gain=context.createGain();gain.gain.value=.22;
      wind.connect(filter).connect(gain).connect(context.destination);wind.start();
      timer=setInterval(chirp,7000);document.addEventListener('visibilitychange',visibility);
    }
    if(context){if(value&&!document.hidden){await context.resume();chirp();}else await context.suspend();}
  };
  return {setEnabled,dispose:()=>{enabled=false;clearInterval(timer);document.removeEventListener('visibilitychange',visibility);if(context)context.close();}};
}
