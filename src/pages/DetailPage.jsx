import React, { useEffect, useState, useRef } from 'react';
import { IoReload } from "react-icons/io5";
import { TfiLoop } from "react-icons/tfi";
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useYTLoopedSegments } from '../hooks/useYTLoopedSegments';
import { lessons } from "../data/data";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const DetailPage = () => {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const lessonId = Number(routeId);
  const lesson = lessons.find(l => l.id === lessonId);

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
  
  const swiperRef = useRef(null);
  const [quizData, setQuizData] = useState([]);

  // loop UI ↔ 훅 loopRef 연동
  const [loop, setLoop] = useState(true);
  useEffect(() => { loopRef.current = loop; }, [loop, loopRef]);

  // 레슨 변경 시 인덱스 초기화(안전)
  useEffect(() => {
    setCurrentIndex(0);
    const initialQuizData = lessons.find(l => l.id === lessonId)?.segments.map(segment => {
      const { en } = segment;
      const originalWords = en.replace(/[.,]/g, '').split(' ');
      const tokenObjs = originalWords.map((w, i) => ({
        id: `${i}-${w}-${Math.random().toString(36).slice(2, 8)}`,
        word: w,
      }));
      const parts = en.split(',').map(s => s.trim());
      const breakAfter = new Set();
      let acc = 0;
      parts.forEach((p, i) => {
        const cnt = p.replace(/[.]/g, '').split(/\s+/).filter(Boolean).length;
        acc += cnt;
        if (i < parts.length - 1) breakAfter.add(acc - 1);
      });

      return {
        en: segment.en,
        ko: segment.ko,
        showEn: segment.showEn,
        originalWords,
        parts,
        breakAfter,
        tokens: shuffle(tokenObjs),
        filled: Array(originalWords.length).fill(null),
        wrongIds: new Set(),
        isComplete: false,
        showKo: false,
        showAnswer: false,
      };
    }) || [];
    setQuizData(initialQuizData);
  }, [lessonId, setCurrentIndex]);

  useEffect(() => {
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slideTo(currentIndex);
    }
  }, [currentIndex]);

  const isComplete = quizData[currentIndex]?.isComplete ?? false;

  const handleWordClick = (token, index) => {
    setQuizData(prevData => {
      const newData = [...prevData];
      const quiz = { ...newData[index] };
      const { word, id } = token;
      const emptyIndex = quiz.filled.findIndex((f) => f === null);
      if (emptyIndex === -1) return prevData;

      const isCorrect = quiz.originalWords[emptyIndex] === word;

      if (isCorrect) {
        const nextFilled = [...quiz.filled];
        nextFilled[emptyIndex] = word;
        quiz.filled = nextFilled;
        quiz.tokens = quiz.tokens.filter(t => t.id !== id);
        quiz.wrongIds = new Set();
        quiz.isComplete = nextFilled.every(Boolean);
      } else {
        const newWrongIds = new Set(quiz.wrongIds);
        newWrongIds.add(id);
        quiz.wrongIds = newWrongIds;
      }
      newData[index] = quiz;
      return newData;
    });
  };

  const handleNext = () => {
    if (!isComplete) return;
    if (currentIndex < segments.length - 1) {
      swiperRef.current?.swiper.slideNext();
    } else {
      // ✅ 마지막 구간 + 완료 → 목록으로 이동
      navigate('/');
    }
  };

  const handleSkip = () => {
    if (currentIndex < segments.length - 1) {
      swiperRef.current?.swiper.slideNext();
    }
  };
  //초기화
  const handleReset = (index) => {
    setQuizData(prevData => {
      const newData = [...prevData];
      const quiz = newData[index];
      const words = quiz.en.replace(/[.,]/g, '').split(' ');
      const tokenObjs = words.map((w, i) => ({
        id: `${i}-${w}-${Math.random().toString(36).slice(2, 8)}`,
        word: w,
      }));
      newData[index] = {
        ...quiz,
        filled: Array(quiz.originalWords.length).fill(null),
        wrongIds: new Set(),
        tokens: shuffle(tokenObjs),
        isComplete: false,
      };
      return newData;
    });
  };
  //이전
  const handlePrev = () => {
    swiperRef.current?.swiper.slidePrev();
  };

  const onSlideChange = (swiper) => {
    setCurrentIndex(swiper.activeIndex);
  };

  const toggleShowKo = (index, value) => {
    setQuizData(prev => prev.map((q, i) => i === index ? { ...q, showKo: value } : q));
  };

  const toggleShowAnswer = (index, value) => {
    setQuizData(prev => prev.map((q, i) => i === index ? { ...q, showAnswer: value } : q));
  };


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
        <button className='btn' onClick={() => handleReset(currentIndex)}>초기화</button>
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

      <Swiper
        ref={swiperRef}
        onSlideChange={onSlideChange}
        allowSwipeToPrev={true}
        allowSwipeToNext={isComplete || (quizData[currentIndex]?.showAnswer ?? false)}
        className="quiz-swiper"
      >
        {quizData.map((quiz, index) => (
          <SwiperSlide key={index}>
            <div className='quiz-block'>
              {quiz.showEn ? (
                <div className="show-en">
                  {quiz.showEn}
                </div>
              ) : (
                quiz.originalWords.map((word, i) => (
                  <React.Fragment key={i}>
                    <span className="splice-cover">
                      <span className={quiz.filled[i] ? 'splice' : 'splice blank'}>
                        {quiz.filled[i] || word}
                      </span>
                    </span>
                    {quiz.breakAfter.has(i) && <span className="comma-break" />}
                  </React.Fragment>
                ))
              )}
            </div>

            <div className='radom-word'>
              {!quiz.showEn && quiz.tokens.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleWordClick(t, index)}
                  className={quiz.wrongIds.has(t.id) ? 'wrong' : ''}
                >
                  {t.word}
                </button>
              ))}
            </div>

            <div className='translation'>
              <button onClick={() => toggleShowKo(index, !quiz.showKo)} className='btn' style={{ marginRight: '10px' }}>{quiz.showKo ? '번역 숨기기' : '번역'}</button>
              <span id="ko-translation">{quiz.showKo ? quiz.ko : ''}</span>
            </div>

            <div className='answer' style={{ marginTop: '10px' }}>
              <button onClick={() => toggleShowAnswer(index, !quiz.showAnswer)} className='btn' style={{ marginRight: '10px' }}>{quiz.showAnswer ? '답 숨기기' : '답 보기'}</button>
              <span id="ko-translation">{quiz.showAnswer ? quiz.en : ''}</span>
            </div>
            <div className='bottom-btn' style={{ marginTop: '10px' }}>
                  <button className='next-btn' onClick={handleSkip}>넘어가기</button>
                </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default DetailPage;
