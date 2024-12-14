'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './Home.module.css';
import { useInfiniteQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Banner from '@/assets/Banner.gif';
import Header from '@/app/header/page';
import NavBar from '@/app/navBar/page';
import SideBar from '@/app/sideBar/page';
import PostItemCardType from '@/components/post/postItemCardType/page';
import PostItemListType from '@/components/post/postItemListType/page';
import { getRecordRequest } from '@/apis';
import { RecordListItem } from '@/types/interface';
export default function Main() {
  //          state: Splash Screen 상태          //
  const [showSplash, setShowSplash] = useState(true);
  //          state: Fade Out 효과 상태          //
  const [fadeOut, setFadeOut] = useState(false);
  //          state: View Mode(카드형 or 리스트형) 상태         //
  const [viewMode, setViewMode] = useState('card');
  const observerRef = useRef<HTMLDivElement | null>(null);
  const {
    data, // 불러온 데이터
    fetchNextPage, // 다음 페이지 요청
    hasNextPage, // 다음 페이지 여부
    isFetchingNextPage, // 다음 페이지 로드 중인지 여부
  } = useInfiniteQuery({
    queryKey: ['records'],
    queryFn: async ({ pageParam = 0 }) => {
      return await getRecordRequest(pageParam, 5);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.last) {
        // 마지막 페이지면 undefined 반환
        return undefined;
      }
      return lastPage.pageable.pageNumber + 1; // 다음 페이지 번호 반환
    },
    initialPageParam: 0,
  });
  //          effect: 스플래쉬 스크린           //
  useEffect(() => {
    // 0.75초 후에 페이드아웃 시작
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 750);

    // 페이드아웃 애니메이션 후 리디렉션
    const redirectTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1200); // 1.2초 후에 리디렉션

    return () => {
      clearTimeout(timer);
      clearTimeout(redirectTimer);
    };
  }, []);

  //      event handler: 토글 버튼을 클릭할 때 뷰 모드 변경     //
  const toggleViewCardMode = () => setViewMode('card');
  const toggleViewListMode = () => setViewMode('list');

  //          effect: 스크롤 감지해서 다음 페이지로 넘기기(무한 스크롤)          //
  useEffect(() => {
    if (!observerRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [observerRef, hasNextPage, isFetchingNextPage]);

  //          render: 렌더링          //  /
  return (
    <>
      {showSplash && (
        //스플래시 화면(온보딩)
        <div
          className={`${styles['splash-screen']} ${
            fadeOut ? styles['fade-out'] : ''
          }`}>
          <div className={styles['onboard-image']}></div>
          <div className={styles['onboard-text']}>
            Develop flow
            <br />
            <br />A place to make your only develop Floor
            <br />
            <br />
          </div>
        </div>
      )}
      {!showSplash && (
        <>
          <Header />
          <div className={styles['page-container']}>
            <aside className={styles['navbar']}>
              <NavBar />
            </aside>
            <main className={styles['main-content']}>
              <div className={styles['main-banner']}>
                <Image src={Banner} alt="banner" className={styles['banner']} />
              </div>
              <div className={styles['toggle-button']}>
                <button
                  className={styles['card-icon']}
                  onClick={toggleViewCardMode}></button>

                <button
                  className={styles['list-icon']}
                  onClick={toggleViewListMode}></button>
              </div>
              {viewMode === 'card' ? (
                <div className={styles['card-view']}>
                  {data?.pages.map((page) =>
                    page.content.map((record) => (
                      <PostItemCardType
                        key={record.recordId}
                        recordListItem={record}
                      />
                    )),
                  )}
                </div>
              ) : (
                <div className={styles['list-view']}>
                  {data?.pages.map((page) =>
                    page.content.map((record) => (
                      <PostItemListType
                        key={record.recordId}
                        recordListItem={record}
                      />
                    )),
                  )}
                </div>
              )}
              {isFetchingNextPage && <p>Loading more...</p>}
              <div ref={observerRef} style={{ height: '1px' }} />
            </main>
            <aside className={styles['sidebar']}>
              <SideBar />
            </aside>
          </div>
        </>
      )}
    </>
  );
}
