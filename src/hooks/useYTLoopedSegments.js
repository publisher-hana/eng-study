import { useEffect, useRef, useState } from "react";
import { toSeconds } from "../utils/time";

/**
 * YouTube IFrame Player를 구간 반복용으로 제어하는 훅
 * - playerElementId: 플레이어가 붙을 div의 id (라우트 이동 시 고유값 권장: 예) player-:id)
 */
export function useYTLoopedSegments({ videoId, segments, playerElementId = "player" }) {
  const watchRef = useRef(null);
  const playerRef = useRef(null);
  const [ytReady, setYtReady] = useState(false);

  const loopRef = useRef(true);
  const currentIndexRef = useRef(0);
  const startAtRef = useRef(0);
  const endAtRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  // cleanup
  useEffect(
    () => () => {
      if (watchRef.current) clearInterval(watchRef.current);
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    },
    []
  );

  // Player 생성 (최초 / API 준비 후)
  useEffect(() => {
    function createPlayer() {
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player(playerElementId, {
        height: "360",
        width: "640",
        videoId,
        playerVars: {
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          autoplay: 0,
          //controls: 0 
        },
        events: {
          onReady: () => {
            if (!segments?.length) return;
            const { start, end } = segments[0];
            playerRef.current.cueVideoById({
              videoId,
              startSeconds: toSeconds(start),
              endSeconds: toSeconds(end),
              suggestedQuality: "default",
            });
            setYtReady(true);
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED && loopRef.current) {
              const idx = currentIndexRef.current;
              const seg = segments?.[idx];
              if (!seg) return;
              e.target.seekTo(toSeconds(seg.start), true);
              e.target.playVideo();
            }
          },
        },
      });
    }

    // IFrame API 준비 확인
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = () => createPlayer();
    }
  }, [videoId, segments, playerElementId]);

  // 컨테이너(id) 변경 시: 기존 iframe이 없다면 destroy → 재생성
  useEffect(() => {
    if (!window.YT || !window.YT.Player) return;

    const container = document.getElementById(playerElementId);
    if (!container) return;

    const hasIframe = !!container.querySelector("iframe");

    // playerRef는 있는데 현재 컨테이너엔 iframe이 없으면 재생성
    if (playerRef.current && !hasIframe) {
      try {
        playerRef.current.destroy();
      } catch {}
      playerRef.current = null;
    }

    // 플레이어가 없으면 새로 붙임
    if (!playerRef.current) {
      playerRef.current = new window.YT.Player(playerElementId, {
        height: "360",
        width: "640",
        videoId,
        playerVars: {
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          autoplay: 0,
        },
        events: {
          onReady: () => {
            if (!segments?.length) return;
            const { start, end } = segments[0];
            playerRef.current.cueVideoById({
              videoId,
              startSeconds: toSeconds(start),
              endSeconds: toSeconds(end),
              suggestedQuality: "default",
            });
            setYtReady(true);
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED && loopRef.current) {
              const idx = currentIndexRef.current;
              const seg = segments?.[idx];
              if (!seg) return;
              e.target.seekTo(toSeconds(seg.start), true);
              e.target.playVideo();
            }
          },
        },
      });
    }
  }, [playerElementId, videoId, segments]);

  // ✅ 핵심: 구간 로딩 + 끝 감시(루프/정지)
  function loadSegment(index) {
    const p = playerRef.current;
    if (!p) return;
    const seg = segments?.[index];
    if (!seg) return; // 가드
    const { start, end } = seg;
    const ss = toSeconds(start);
    const ee = toSeconds(end);
    startAtRef.current = ss;
    endAtRef.current = ee;

    p.loadVideoById({
      videoId,
      startSeconds: ss,
      endSeconds: ee, // 선택: 내부 스크러빙 안전
      suggestedQuality: "default",
    });

    // 진행 감시: 끝나기 0.2초 전에서 정지(또는 루프)
    if (watchRef.current) clearInterval(watchRef.current);
    watchRef.current = setInterval(() => {
      const t = p.getCurrentTime ? p.getCurrentTime() : 0;
      if (t >= ee - 0.2) {
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

  // 플레이어 준비되거나 인덱스가 바뀌면 해당 세그먼트 로드
  useEffect(() => {
    if (!ytReady) return;
    loadSegment(currentIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytReady, currentIndex]);

  // videoId/segments/playerElementId 변경 시, 인덱스 초기화 + 첫 cue
  useEffect(() => {
    if (!ytReady || !playerRef.current || !segments?.length) return;

    // 1) 인덱스 초기화
    setCurrentIndex(0);
    currentIndexRef.current = 0;

    // 2) 이전 interval 정리
    if (watchRef.current) {
      clearInterval(watchRef.current);
      watchRef.current = null;
    }

    // 3) 첫 세그먼트 cue (자동재생X)
    const { start, end } = segments[0];
    playerRef.current.cueVideoById({
      videoId,
      startSeconds: toSeconds(start),
      endSeconds: toSeconds(end),
      suggestedQuality: "default",
    });
  }, [videoId, segments, ytReady, playerElementId]);

  // ref 동기화
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // 현재 구간 다시
  const replayCurrent = () => {
    if (!ytReady) return;
    loadSegment(currentIndex);
  };

  return {
    playerRef,
    ytReady,
    currentIndex,
    setCurrentIndex,
    loopRef,
    currentIndexRef,
    replayCurrent,
    watchRef,
  };
}
