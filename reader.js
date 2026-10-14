(function () {
  const defaultMode = grade => grade <= 2 ? 'paged' : 'scroll';
  function advance(mode, index, revealed, counts) {
    if (mode === 'board' && revealed < counts[index]) return {index, revealed:revealed+1, done:false};
    if (index < counts.length-1) return {index:index+1, revealed:0, done:false};
    return {index, revealed, done:true};
  }
  function retreat(mode, index, revealed, counts) {
    if (mode === 'board' && revealed > 0) return {index, revealed:revealed-1};
    const previous = Math.max(0,index-1);
    return {index:previous, revealed:mode === 'board' && index > 0 ? counts[previous] : 0};
  }
  function swipeDirection(dx, dy) {
    return Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy)*2 ? (dx < 0 ? 1 : -1) : 0;
  }
  function mount(reader, story, callbacks) {
    const q = selector => reader.querySelector(selector);
    const lifetime = new AbortController(), signal = lifetime.signal;
    const panels = [...reader.querySelectorAll('.integrated-panel')];
    const counts = story.panels.map(panel => panel.lines.length);
    let mode = defaultMode(story.grade), lastMode = mode, index = 0, revealed = 0;
    let active = true, touch = null, ownsFullscreen = false, destroyed = false;
    const on = (element, event, handler, options = {}) => element.addEventListener(event,handler,{...options,signal});
    reader.dataset.grade = story.grade;
    q('#readerModes').innerHTML = '<div class="scene-tools"><button id="sceneMenu" type="button" aria-expanded="false" aria-controls="sceneList"></button><button id="readingMode" type="button"></button><button id="boardMode" type="button" aria-pressed="false">전자칠판</button></div><progress id="sceneProgress" max="'+panels.length+'" value="1" aria-label="웹툰 장면 진행"></progress><div id="sceneList" class="scene-list" hidden>'+panels.map((panel,i)=>'<button type="button" data-jump="'+i+'" aria-label="'+(i+1)+'장면으로 이동">'+(i+1)+'</button>').join('')+'</div>';
    q('#sceneControls').innerHTML = '<button id="previousScene" type="button">← 이전 장면</button><span id="sceneStatus" role="status" aria-live="polite"></span><button id="nextScene" type="button">다음 장면 →</button><button id="readerFullscreen" type="button" hidden>화면 꽉 채우기</button>';
    function fitBoardImage() {
      if (mode !== 'board' || destroyed) return;
      const picture = panels[index].querySelector('.scene-picture');
      const ratio = story.illustration.width*story.illustration.rows/(story.illustration.height*story.illustration.columns);
      const width = Math.min(picture.clientWidth,picture.clientHeight*ratio);
      reader.style.setProperty('--board-art-width',width+'px');
      reader.style.setProperty('--board-art-height',(width/ratio)+'px');
    }
    function paint() {
      if (destroyed) return;
      reader.dataset.readingMode = mode;
      panels.forEach((panel,i)=>{
        panel.hidden = mode !== 'scroll' && i !== index;
        panel.querySelectorAll('.integrated-speech').forEach((speech,line)=>{
          const pending = mode === 'board' && (i !== index || line >= revealed);
          speech.classList.toggle('speech-pending',pending);
          if (pending) speech.setAttribute('aria-hidden','true'); else speech.removeAttribute('aria-hidden');
        });
      });
      q('#sceneMenu').textContent = '장면 '+(index+1)+' / '+panels.length+' ▾';
      q('#sceneProgress').value = index+1;
      q('#sceneProgress').setAttribute('aria-valuetext',(index+1)+' / '+panels.length+'장면');
      q('#readingMode').textContent = mode === 'scroll' ? '한 장면씩' : '스크롤 읽기';
      q('#boardMode').textContent = mode === 'board' ? '칠판 나가기' : '전자칠판';
      q('#boardMode').setAttribute('aria-pressed',String(mode === 'board'));
      q('#sceneControls').hidden = mode === 'scroll';
      q('#previousScene').disabled = index === 0 && (mode !== 'board' || revealed === 0);
      q('#previousScene').textContent = mode === 'board' ? '← 이전' : '← 이전 장면';
      const moreSpeech = mode === 'board' && revealed < counts[index];
      q('#nextScene').textContent = moreSpeech ? '말풍선 '+(revealed+1)+' 보기 →' : index === panels.length-1 ? '개념 정리로 →' : '다음 장면 →';
      q('#sceneStatus').textContent = (index+1)+' / '+panels.length+'장면'+(mode === 'board' ? ' · 말풍선 '+revealed+' / '+counts[index] : '');
      q('#readerFullscreen').hidden = mode !== 'board' || !document.fullscreenEnabled;
      q('#readerFullscreen').textContent = document.fullscreenElement ? '전체 화면 해제' : '화면 꽉 채우기';
      q('#scrollComicDone').hidden = mode !== 'scroll';
      q('#readerModes').querySelectorAll('[data-jump]').forEach(button=>{
        if (+button.dataset.jump === index) button.setAttribute('aria-current','true'); else button.removeAttribute('aria-current');
      });
      requestAnimationFrame(()=>{
        fitBoardImage();
        if (destroyed || mode !== 'board')return;
        const dialogue=panels[index].querySelector('.dialogue-flow');
        const speech=dialogue.children[revealed-1];
        if (!speech) {dialogue.scrollTop=0;return;}
        const box=dialogue.getBoundingClientRect(),line=speech.getBoundingClientRect();
        if(line.bottom>box.bottom)dialogue.scrollTop+=line.bottom-box.bottom+12;
        else if(line.top<box.top)dialogue.scrollTop-=box.top-line.top+12;
      });
    }
    function leaveFullscreen() {
      if (!ownsFullscreen) return;
      ownsFullscreen = false;
      if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    }
    function changeMode(next, focus = true) {
      if (next === 'board' && mode !== 'board') lastMode = mode;
      if (mode === 'board' && next !== 'board') leaveFullscreen();
      mode = next;revealed = 0;touch = null;
      q('#sceneList').hidden = true;q('#sceneMenu').setAttribute('aria-expanded','false');
      paint();
      if (focus) callbacks.onComic();
    }
    function showScene(value) {
      index = Math.max(0,Math.min(panels.length-1,value));revealed = 0;
      q('#sceneList').hidden = true;q('#sceneMenu').setAttribute('aria-expanded','false');
      paint();callbacks.onComic();
      if (mode === 'scroll') {
        panels[index].scrollIntoView({block:'start',behavior:'instant'});
        panels[index].focus({preventScroll:true});
      }
    }
    function next() {
      const frame = advance(mode,index,revealed,counts);
      if (frame.done) {
        if (mode === 'board') changeMode(lastMode,false);
        callbacks.onSummary();return;
      }
      index=frame.index;revealed=frame.revealed;paint();
      if (mode !== 'board') callbacks.onComic();
      else panels[index].focus({preventScroll:true});
    }
    function previous() {
      const frame = retreat(mode,index,revealed,counts);
      index=frame.index;revealed=frame.revealed;paint();
      if (mode !== 'board') callbacks.onComic();
      else panels[index].focus({preventScroll:true});
    }
    on(q('#sceneMenu'),'click',()=>{
      const expanded = q('#sceneList').hidden;
      q('#sceneList').hidden = !expanded;q('#sceneMenu').setAttribute('aria-expanded',String(expanded));
    });
    on(q('#sceneList'),'click',event=>{
      const button=event.target.closest('[data-jump]');if(button)showScene(+button.dataset.jump);
    });
    on(q('#readingMode'),'click',()=>changeMode(mode === 'scroll' ? 'paged' : 'scroll'));
    on(q('#boardMode'),'click',()=>changeMode(mode === 'board' ? lastMode : 'board'));
    on(q('#nextScene'),'click',next);on(q('#previousScene'),'click',previous);
    on(reader,'keydown',event=>{
      if (!active || mode === 'scroll' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      if (['ArrowRight','PageDown','ArrowLeft','PageUp'].includes(event.key)) {
        event.preventDefault();if(event.repeat)return;
        if (event.key === 'ArrowRight' || event.key === 'PageDown')next();else previous();
      }
    });
    on(reader,'cancel',event=>{
      if (mode === 'board') {event.preventDefault();changeMode(lastMode);q('#boardMode').focus({preventScroll:true});}
    });
    const comics=q('.comic-panels');
    on(comics,'pointerdown',event=>{
      if (!active || mode !== 'paged' || event.pointerType !== 'touch' || !event.isPrimary) {touch=null;return;}
      touch={id:event.pointerId,x:event.clientX,y:event.clientY};
    },{passive:true});
    on(comics,'pointerup',event=>{
      if (!touch || touch.id !== event.pointerId) return;
      const direction=swipeDirection(event.clientX-touch.x,event.clientY-touch.y);touch=null;
      if(direction>0)next();else if(direction<0)previous();
    },{passive:true});
    on(comics,'pointercancel',()=>{touch=null;},{passive:true});
    on(q('#readerFullscreen'),'click',async()=>{
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else {await document.documentElement.requestFullscreen();ownsFullscreen=true;}
        paint();
      } catch {q('#sceneStatus').textContent='전체 화면을 사용할 수 없어 현재 창에서 보여 드려요.';}
    });
    on(document,'fullscreenchange',()=>{
      if (ownsFullscreen && !document.fullscreenElement) {ownsFullscreen=false;changeMode(lastMode);}
      else paint();
    });
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fitBoardImage) : null;
    if(resize)resize.observe(comics);else on(window,'resize',fitBoardImage);
    paint();
    return {
      showScene,
      setStage(step) {
        active=step === 'comic';touch=null;
        if (!active && mode === 'board')changeMode(lastMode,false);
        q('#readerModes').hidden=!active;
        if (!active) {q('#sceneList').hidden=true;q('#sceneMenu').setAttribute('aria-expanded','false');}
      },
      target() {return mode === 'scroll' ? q('#stage-comic') : panels[index];},
      trackScroll() {
        if (!active || mode !== 'scroll')return;
        const top=q('.reader-toolbar').getBoundingClientRect().bottom+32;
        let nextIndex=0;
        panels.forEach((panel,i)=>{if(panel.getBoundingClientRect().top<=top)nextIndex=i;});
        if(index!==nextIndex){index=nextIndex;paint();}
      },
      destroy() {
        destroyed=true;lifetime.abort();if(resize)resize.disconnect();leaveFullscreen();
        delete reader.dataset.readingMode;delete reader.dataset.grade;
      }
    };
  }
  window.ComicReader={mount,defaultMode,advance,retreat,swipeDirection};
})();
