import React, { useEffect, useRef, useMemo, useState } from 'react';
import { IoReload } from "react-icons/io5";
import { TfiLoop } from "react-icons/tfi";

const VIDEO_ID = 'yebNIHKAC4A';

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}


const Detail = () => {
  const segments = useMemo(
    () => [
      //{ start: 18, end: 26, en: "I was a ghost, I was alone", quiz_kr: "hah 어두워진, hah, 앞길속에 (Ah)", ko: "유령 같았던 나, 혼자서." },
      //{ start: 27, end: 31, en: "Given the throne, I didn't know how to believe", ko: "왕좌에 앉아도 알지 못했고, 믿지 못했어" },
      //{ start: 31, end: 34, en: "I was the queen that I'm meant to be", ko: "난 여왕이 되기 위해 태어났다는 걸" },
      //{ start: 34, end: 38, en: "I lived two lives, tried to play both sides", ko: "주어진 두 개의 삶, 양쪽에 충실하려 했지만" },
      //{ start: 38, end: 41, en: "But I couldn't find my own place", ko: "하지만 내 자리를 찾을 순 없었어" },
      //{ start: 41, end: 49, en: "Called a problem child 'cause I got too wild, But now that's how I'm getting paid", ko: "문제아라고 그랬지, 거친 성격 탓에, 하지만 그게 날 이곳까지 이끌었어" },
      { start: 49, end: 57, en: "I'm done hidin', now I'm shinin' like I'm born to be", ko: "더는 숨지 않아, 찬란히 빛나는 나, 이게 내 모습이야" },
      { start: 57, end: "1:04", en: "We dreamin' hard, we came so far, now I believe", ko: "간절한 우리의 꿈, 먼 길을 왔어, 이제 난 믿어" },
      { start: "1:04", end: "1:13", en: "We're goin' up-up-up, it's our moment, You know together we're glowing", ko: "우린 하늘 높이 날아, 지금이 바로 우리의 순간이야, 우린 함께여서 더욱 빛나" },
      { start: "1:13", end: "1:20", en: "with our voices", ko: "목소리를 더 높게 올려" },
      { start: "1:20", end: "1:28", en: "I'm done hidin', now I'm shinin' like I'm born to be", ko: "더 이상 숨지 않아, 난 빛나기 위해 태어났으니까" },
      { start: "1:28", end: "1:36", en: "Oh, our time, no fears, no lies, That's who we're born to be", ko: "우리의 시간이야, 두려움도 거짓도 없어, 그게 바로 우리가 태어난 이유야" },
    ],
    []
  );

  const playerRef = useRef(null);
  const [ytReady, setYtReady] = useState(false);
  const [showKo, setShowKo] = useState(false);
  const [answer, setAnswer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { en, ko, quiz_kr  } = segments[currentIndex];

  // 현재 구간의 단어/토큰
  const originalWords = useMemo(() => en.replace(/[,]/g, '').split(' '), [en]);
  const parts = useMemo(() => en.split(',').map(s => s.trim()), [en]);
  const [tokens, setTokens] = useState([]);

  const [filled, setFilled] = useState(() => Array(originalWords.length).fill(null));
  const [wrongIndex, setWrongIndex] = useState(null);
  const isComplete = filled.every(Boolean);

  const [loop, setLoop] = useState(true);
  const loopRef = useRef(false);
  useEffect(() => { loopRef.current = loop; }, [loop]);

  const currentIndexRef = useRef(0);

  //구간 끝난 후
  const watchRef = useRef(null);
  const startAtRef = useRef(0);
  const endAtRef = useRef(0);

  useEffect(() => () => { if (watchRef.current) clearInterval(watchRef.current); }, []);

  // 문장(en)이 바뀌면 빈칸/오답 리셋
  useEffect(() => {
    setFilled(Array(originalWords.length).fill(null));
    setWrongIndex(null);
    
    setTokens(shuffle(en.replace(/[.,]/g, '').split(' ')));
  }, [en, originalWords.length]);

  // 유튜브 IFrame API 로드 + 플레이어 생성
  useEffect(() => {
    function createPlayer() {
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player('player', {
        height: '360',
        width: '640',
        videoId: VIDEO_ID, // 기본 로드만, 재생은 cue/load로 조절
        playerVars: {
          //controls: 0,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          autoplay: 0, // 초기 자동재생 방지
        },
        events: {
          onReady: () => {
            // ✅ 준비되면 첫 세그먼트를 "cue"하여 처음부터 나오는 걸 차단
            const { start, end } = segments[0];
            playerRef.current.cueVideoById({
              videoId: VIDEO_ID,
              startSeconds: start,
              endSeconds: end,
              suggestedQuality: 'default',
            });
            setYtReady(true);
          },
           onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED && loopRef.current) {
              const idx = currentIndexRef.current;
              const { start } = segments[idx];
              e.target.seekTo(toSeconds(start), true); // 현재 세그먼트 시작으로
              e.target.playVideo();
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    }

    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy();
    };
  }, [segments]);

  // ✅ 플레이어가 준비된 뒤이거나 인덱스가 바뀔 때, 해당 세그먼트를 로드/재생
  useEffect(() => {
    if (!ytReady) return;
    loadSegment(currentIndex);
    currentIndexRef.current = currentIndex;
    //setShowKo(false); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytReady, currentIndex]);

  function toSeconds(v) {
  if (typeof v === 'number') return v;           // 이미 초 단위
  if (typeof v === 'string') {
    const m = v.trim().match(/^(\d+):(\d{1,2})(?:\.(\d+))?$/); // "m:ss" or "m:ss.xxx"
    if (m) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const frac = m[3] ? parseFloat('0.' + m[3]) : 0;
      return min * 60 + sec + frac;
    }
    const f = parseFloat(v);                     // "65.5" 같은 순수 숫자 문자열
    if (!isNaN(f)) return f;
  }
  return 0;
}

  function loadSegment(index) {
    const p = playerRef.current;
    if (!p) return;
    const { start, end } = segments[index];
    const ss = toSeconds(start);
    const ee = toSeconds(end);
    startAtRef.current = ss;
    endAtRef.current = ee;

    p.loadVideoById({
      videoId: VIDEO_ID,
       startSeconds: ss,
      suggestedQuality: 'default',
    }); // loadVideoById는 자동 재생

    // 진행 감시: 끝나기 0.2초 전에서 정지(또는 루프)
    if (watchRef.current) clearInterval(watchRef.current);
    watchRef.current = setInterval(() => {
      const t = p.getCurrentTime ? p.getCurrentTime() : 0;
      if (t >= ee - 0.2) {
        // 루프 모드면 시작으로, 아니면 끝 직전에 멈춤
        if (loopRef?.current) {
          p.seekTo(ss, true);
          p.playVideo();
        } else {
          p.pauseVideo();
          p.seekTo(Math.max(ss, ee - 0.05), true); // 추천 그리드 방지
        }
      }
    }, 50);
  }
  // 정답/오답 처리
  const handleWordClick = (word, idx) => {
    const emptyIndex = filled.findIndex((f) => f === null);
    if (emptyIndex === -1) return;

    if (originalWords[emptyIndex] === word) {
      const updated = [...filled];
      updated[emptyIndex] = word;
      setFilled(updated);
      setWrongIndex(null);

      setTokens(prev => prev.filter((_, i) => i !== idx));
    } else {
      setWrongIndex(idx);
    }
  };

  const handleNext = () => {
    if (!isComplete) return;
    if (currentIndex < segments.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      console.log('모든 구간 완료!');
    }
  };
  const handleSkip = () => {
     setCurrentIndex((i) => i + 1);
  }

  // 옵션: 현재 구간 다시 재생
  const replayCurrent = () => {
    if (!ytReady) return;
    loadSegment(currentIndex);
  };

  // 줄바꿈을 넣을 “단어 인덱스”들 계산 (이 인덱스 뒤에 <br/> 삽입)
  const breakAfter = useMemo(() => {
    const idxSet = new Set();
    let acc = 0;
    parts.forEach((p, i) => {
      const cnt = p.replace(/[.]/g, '').split(/\s+/).filter(Boolean).length;
      acc += cnt;
      if (i < parts.length - 1) idxSet.add(acc - 1); // 이 인덱스 뒤에서 줄바꿈
    });
    return idxSet;
  }, [parts]);

  return (
    <div className='movie-wrap'>
      <div id="player" className='player'></div>

      <h2 className="font-semibold">빈칸 채우기</h2>
      <div className='control'>
         <button
          className={`loop-btn ${loop ? 'active' : ''}`}
          aria-pressed={loop}
          title={loop ? '구간 반복 끄기' : '구간 반복 켜기'}
          onClick={() => setLoop(v => !v)}
        ><TfiLoop size={28} /></button>
        <div className='section-info'>
          <span>구간 {currentIndex + 1} / {segments.length}</span>
          <div className="controls">
            <button type="button" onClick={replayCurrent} disabled={!ytReady}><IoReload /></button>
            <button
              onClick={handleNext}
              disabled={!isComplete}
              className={`next-btn ${isComplete ? 'ready' : 'disabled'}`}
              title={isComplete ? '다음 구간으로' : '모든 단어를 맞추면 이동할 수 있어요'}
            >
              {currentIndex < segments.length - 1 ? '다음' : isComplete ? '완료' : '다음'}
            </button>
          </div>
          <div className='section-info'>
            <button className='next-btn' onClick={handleSkip}>넘어가기</button>
          </div>
        </div>
      </div>

      <div className='quiz-block'>
        {originalWords.map((word, i) => (
          <React.Fragment key={i}>
            <span className='splice-cover'>
              <span className={filled[i] ? 'splice' : 'splice blank'}>
                {filled[i] || word}
              </span>
            </span>
            {breakAfter.has(i) && <br className="comma-break" />} {/* ← 콤마 뒤 줄바꿈 */}
          </React.Fragment>
        ))}
      </div>

      <div className='radom-word'>
        {tokens.map((word, i) => (
          <button
            key={i}
            onClick={() => handleWordClick(word, i)}
            className={wrongIndex === i ? 'wrong' : ''}
          >
            {word}
          </button>
        ))}
      </div>
      <div className='translation'>
        <button onClick={() => setShowKo((v) => !v)} className='btn'>{showKo ? '번역 숨기기' : '번역'}</button>
        <span id="ko-translation">{showKo ? ko : ''}</span>
      </div>
      <div className='answer' style={{marginTop:'20px'}}>
        <button onClick={() => setAnswer((v) => !v)}  className='btn'>{answer ? '답 숨기기' : '답 보기'}</button>
        <span id="ko-translation">{answer ? en : ''}</span>
      </div>
      
    </div>
  );
};

export default Detail;