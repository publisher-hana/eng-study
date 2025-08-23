import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IoReload } from "react-icons/io5";
import { TfiLoop } from "react-icons/tfi";
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useYTLoopedSegments } from '../hooks/useYTLoopedSegments';
import { lessons } from "../data/data";
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const DetailPage = () => {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const lessonId = Number(routeId);
  const lesson = lessons.find(l => l.id === lessonId);
  const sliderRef = useRef(null);

  if (!lesson) {
    return (
      <div style={{ padding: 16 }}>
        <p>레슨을 찾을 수 없습니다.</p>
        <Link to="/">← 목록으로</Link>
      </div>
    );
  }

  const playerElementId = `player-${routeId}`; // ✅ 고유 id
  const { videoId, segments, title, artist } = lesson;

  const { ytReady, currentIndex, setCurrentIndex, replayCurrent, loopRef } =
    useYTLoopedSegments({
      videoId,
      segments,
      playerElementId, // ✅ 전달
    });

  const [showKo, setShowKo] = useState(false);
  const [answer, setAnswer] = useState(false);

  const { en, ko, showEn } = segments[currentIndex];

  const originalWords = useMemo(() => en.replace(/[,]/g, '').split(' '), [en]);
  const parts = useMemo(() => en.split(',').map(s => s.trim()), [en]);

  const [tokens, setTokens] = useState([]);
  const [filled, setFilled] = useState(() => Array(originalWords.length).fill(null));
  const [wrongIds, setWrongIds] = useState(new Set());
  const isComplete = filled.every(Boolean);

   const sliderSettings = useMemo(() => ({
      infinite: false,
      speed: 300,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
       swipe: isComplete,  
      draggable: true,      // 마우스 드래그도 허용
      touchMove: true,
      adaptiveHeight: true,

      // 이동 직전에 검사
      beforeChange: (_old, next) => setCurrentIndex(next),
  }), [isComplete, setCurrentIndex]);

   useEffect(() => {
    setCurrentIndex(0);
    sliderRef.current?.slickGoTo(0);
  }, [lessonId, setCurrentIndex]);

  // loop UI ↔ 훅 loopRef 연동
  const [loop, setLoop] = useState(true);
  useEffect(() => { loopRef.current = loop; }, [loop, loopRef]);

  // 레슨 변경 시 인덱스 초기화(안전)
  useEffect(() => { setCurrentIndex(0); }, [lessonId, setCurrentIndex]);

  // 문장 바뀌면 퍼즐 초기화
  useEffect(() => {
    setFilled(Array(originalWords.length).fill(null));
    setWrongIds(new Set());
    const words = en.replace(/[.,]/g, '').split(' ');
    const tokenObjs = words.map((w, i) => ({
      id: `${i}-${w}-${Math.random().toString(36).slice(2, 8)}`, // 안정적 키
      word: w,
    }));
  setTokens(shuffle(tokenObjs));
    setAnswer(false);
  }, [en, originalWords.length]);

  const handleWordClick = (token) => {
  const { word, id } = token;
  const emptyIndex = filled.findIndex((f) => f === null);
  if (emptyIndex === -1) return;

  const isCorrect = originalWords[emptyIndex] === word;

  if (isCorrect) {
    // 1) 빈칸 채우기
    setFilled(prev => {
      const next = [...prev];
      next[emptyIndex] = word;
      return next;
    });

    // 2) 맞춘 토큰은 버튼 목록에서 제거
    setTokens(prev => prev.filter(t => t.id !== id));

    // 3) 오답 강조 전부 원복(초기화)
    setWrongIds(new Set());
  } else {
    // 오답이면 이 토큰만 'wrong' 유지
    setWrongIds(prev => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });
  }
};

  const handleNext = () => {
    if (!isComplete) return;
    if (currentIndex < segments.length - 1) {
      //setCurrentIndex(i => Math.min(i + 1, segments.length - 1));
      sliderRef.current?.slickGoTo(currentIndex + 1); // ← 시각적으로 슬라이드
    } else {
      // ✅ 마지막 구간 + 완료 → 목록으로 이동
      navigate('/');
    }
  };

  const handleSkip = () => {
    if (currentIndex < segments.length - 1) {
      sliderRef.current?.slickGoTo(currentIndex + 1);
    } else {
      navigate('/');
    }
  };
  //초기화
  const handleReset = () => {
    setFilled(Array(originalWords.length).fill(null));
    setWrongIds(new Set()); // ⬅️ 같이 초기화
    const words = en.replace(/[.,]/g, '').split(' ');
    const tokenObjs = words.map((w, i) => ({
      id: `${i}-${w}-${Math.random().toString(36).slice(2, 8)}`,
      word: w,
    }));
    setTokens(shuffle(tokenObjs));
  };
  //이전
  const handlePrev = () => {
    if (currentIndex > 0) {
      //setCurrentIndex(i => i - 1);   // 이전 세그먼트로
      sliderRef.current?.slickGoTo(currentIndex - 1); // ← 이전 슬라이드
    } else {
      // 맨 앞이면 선택: 무시/알림/루프 등
      console.log('첫 구간입니다');
    }
  };

  const breakAfter = useMemo(() => {
    const idxSet = new Set();
    let acc = 0;
    parts.forEach((p, i) => {
      const cnt = p.replace(/[.]/g, '').split(/\s+/).filter(Boolean).length;
      acc += cnt;
      if (i < parts.length - 1) idxSet.add(acc - 1);
    });
    return idxSet;
  }, [parts]);

  return (
    <div className='lesson-wrap movie'>
    
      <div className='link-back'>
        <Link to="/">← 목록으로</Link>
      </div>

      <h1 className='lesson-title'>{title}</h1>
      <h2 className='lesson-artist'>{artist}</h2>

      {/* ✅ 고유한 플레이어 컨테이너 id 사용 */}
      <div id={playerElementId} className="player" />
      <div className='title-area'>
        <h2 className="lesson-title">빈칸 채우기</h2>
        <button className='btn' onClick={handleReset}>초기화</button>
      </div>
    
      <div className='control'>
        <button
          className={`loop-btn ${loop ? 'active' : ''}`}
          aria-pressed={loop}
          title={loop ? '구간 반복 끄기' : '구간 반복 켜기'}
          onClick={() => setLoop(v => !v)}
        >
          <TfiLoop size={28} />
        </button>

        <div className='section-info'>
          <span>구간 {currentIndex + 1} / {segments.length}</span>
          <div className="controls">
            <button type="button" onClick={replayCurrent} disabled={!ytReady}><IoReload size={20}/></button>
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
            <button className='btn' onClick={handlePrev}>이전</button>
          </div>
        </div>
      </div>
      <Slider ref={sliderRef} {...sliderSettings} key={isComplete ? 'swipe-on' : 'swipe-off'}>
        {segments.map((seg, idx) => {
          // ✅ 여기서 변수 선언 (문장)
          const active = idx === currentIndex;
          const lineEn = active ? en : seg.en;           // 활성 슬라이드는 전역 상태 사용
          const lineKo = active ? ko : seg.ko;
          const lineShowEn = active ? showEn : seg.showEn;

          return (                                       // ✅ JSX는 return으로 반환
            <div key={`${lessonId}-${idx}`} className="slide">
              {active ? (
                <>
                  <div className='quiz-block'>
                    {lineShowEn ? (
                      <div className="show-en">{lineShowEn}</div>
                    ) : (
                      originalWords.map((word, i) => (
                        <React.Fragment key={i}>
                          <span className="splice-cover">
                            <span className={filled[i] ? 'splice' : 'splice blank'}>
                              {filled[i] || word}
                            </span>
                          </span>
                          {breakAfter.has(i) && <span className="comma-break" />}
                        </React.Fragment>
                      ))
                    )}
                  </div>

                  <div className='radom-word'>
                    {!lineShowEn && tokens.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleWordClick(t)}
                        className={wrongIds.has(t.id) ? 'wrong' : ''}
                      >
                        {t.word}
                      </button>
                    ))}
                  </div>

                  <div className='translation'>
                    <button onClick={() => setShowKo(v => !v)} className='btn' style={{marginRight:'10px'}}>
                      {showKo ? '번역 숨기기' : '번역'}
                    </button>
                    <span id="ko-translation">{showKo ? lineKo : ''}</span>
                  </div>

                  <div className='answer' style={{ marginTop:'20px' }}>
                    <button onClick={() => setAnswer(v => !v)} className='btn' style={{marginRight:'10px'}}>
                      {answer ? '답 숨기기' : '답 보기'}
                    </button>
                    <span id="ko-translation">{answer ? lineEn : ''}</span>
                  </div>

                  <div className='bottom-btn'>
                    <button className='next-btn' onClick={handleSkip}>넘어가기</button>
                  </div>
                </>
              ) : (
                // 비활성 슬라이드: 가벼운 프리뷰/높이 유지
                <div className="quiz-block" style={{ minHeight: 240, opacity: 0.5 }}>
                  {lineShowEn ? (
                    <div className="show-en">{lineShowEn}</div>
                  ) : (
                    <div>{lineEn}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Slider>
     
    </div>
  );
};

export default DetailPage;
