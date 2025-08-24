import { useState } from "react";
import DetailItem from "../component/DetailItem";
import Header from "../component/Header";
import { lessons } from "../data/data";
import { useSearchParams } from "react-router-dom";

const Home = () => {
  const [sortOrder, setSortOrder] = useState('oldest'); // 'latest' | 'oldest'
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');

  // URL의 category 값에 따라 lessons 배열을 필터링합니다.
  // category 값이 없으면(예: '전체' 메뉴) 전체 목록을 보여줍니다.
  const filteredLessons = category
    ? lessons.filter(lesson => lesson.category === category)
    : lessons;

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  // sortOrder 상태에 따라 filteredLessons를 정렬합니다.
  const sortedLessons = [...filteredLessons].sort((a, b) => {
    if (sortOrder === 'latest') {
      return b.id - a.id; // 최신순 (id 내림차순)
    } else {
      return a.id - b.id; // 오래된순 (id 오름차순)
    }
  });

  return (
    <div className="lesson-wrap">
      <Header />
      <div className="sort">
        <select value={sortOrder} onChange={handleSortChange}>
          <option value="oldest">오래된 순</option>
          <option value="latest">최신 순</option>
        </select>
      </div>
      <ul className="lesson-list">
        {/* 정렬된 배열을 사용하여 목록을 렌더링합니다. */}
        {sortedLessons.map((value) => (
          <DetailItem
            key={value.id}
            value={value}                       // 곡/레슨 데이터 전체 넘김
            link={`/detail/${value.id}`}        // 이동 경로
          />
        ))}
        
      </ul>
    </div>
  )
}

export default Home