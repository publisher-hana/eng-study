import { Link, useSearchParams } from 'react-router-dom'
import './Header.css'

const categories = [
  { name: '전체', category: null, path: '/' },
  { name: '팝송', category: 'popsong', path: '/?category=popsong' },
  { name: '영드', category: 'bdrama', path: '/?category=bdrama' },
  { name: '미드', category: 'adrama', path: '/?category=adrama' },
  { name: '책', category: 'book', path: '/?category=book' },
]

const Header = () => {
  const [searchParams] = useSearchParams()
  const currentCategory = searchParams.get('category')

  return (
    <header className='header'>
      <ul>
        {categories.map((item) => (
          <li key={item.name}>
            <Link
              to={item.path}
              className={currentCategory === item.category ? 'active' : ''}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </header>
  )
}

export default Header