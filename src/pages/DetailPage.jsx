import React, { useEffect, useMemo, useState } from 'react';
import { IoReload } from "react-icons/io5";
import { TfiLoop } from "react-icons/tfi";
import { useParams, Link } from 'react-router-dom';
import { useYTLoopedSegments } from '../hooks/useYTLoopedSegments';
import { lessons } from "../data/data";

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const DetailPage = () => {
  const { id } = useParams();
  const lessonId = Number(id);
  const lesson = lessons.find(l => l.id === lessonId);

  if (!lesson) {
    return (
      <div style={{ padding: 16 }}>
        <p>레슨을 찾을 수 없습니다.</p>
        <Link to="/">← 목록으로</Link>
      </div>
    );
  }

  const playerElementId = `player-${id}`; // ✅ 고유 id
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
  const [wrongIndex, setWrongIndex] = useState(null);
  const isComplete = filled.every(Boolean);

  // loop UI ↔ 훅 loopRef 연동
  const [loop, setLoop] = useState(true);
  useEffect(() => { loopRef.current = loop; }, [loop, loopRef]);

  // 레슨 변경 시 인덱스 초기화(안전)
  useEffect(() => { setCurrentIndex(0); }, [lessonId, setCurrentIndex]);

  // 문장 바뀌면 퍼즐 초기화
  useEffect(() => {
    setFilled(Array(originalWords.length).fill(null));
    setWrongIndex(null);
    setTokens(shuffle(en.replace(/[.,]/g, '').split(' ')));
    //setShowKo(false);
    setAnswer(false);
  }, [en, originalWords.length]);

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
    setCurrentIndex(i => Math.min(i + 1, segments.length - 1));
  };

  const handleSkip = () => {
    setCurrentIndex(i => Math.min(i + 1, segments.length - 1));
  };
  //초기화
  const handleReset = () => {
    setFilled(Array(originalWords.length).fill(null)); //  모두 비우기
    setTokens(shuffle([...originalWords]));            //  모든 단어 다시 풀어놓기
    setWrongIndex(null);                               //  오답 표시 초기화
  };
  //이전
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);   // 이전 세그먼트로
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
            <button className='next-btn' onClick={handleSkip}>넘어가기</button>
            <button className='btn' onClick={handlePrev}>이전</button>
          </div>
        </div>
      </div>

      <div className='quiz-block'>
        {showEn ? (
          <div className="show-en">
            {showEn}
          </div>
        ) : (
          // 기존 퍼즐 방식
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
        {!showEn && tokens.map((word, i) => (
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
        <button onClick={() => setShowKo(v => !v)} className='btn' style={{marginRight:'10px'}}>{showKo ? '번역 숨기기' : '번역'}</button>
        <span id="ko-translation">{showKo ? ko : ''}</span>
      </div>

      <div className='answer' style={{ marginTop:'20px' }}>
        <button onClick={() => setAnswer(v => !v)} className='btn' style={{marginRight:'10px'}}>{answer ? '답 숨기기' : '답 보기'}</button>
        <span id="ko-translation">{answer ? en : ''}</span>
      </div>
    </div>
  );
};

export default DetailPage;
