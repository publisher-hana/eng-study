import { Link } from 'react-router-dom'
import './Header.css'

const Header = () => {
  return (
    <header className='header'>
      <ul>
        <li>
          <Link to="/">전체</Link>
        </li>
        <li>
          <Link to="/?category=popsong">팝송</Link>
        </li>
        <li>
          <Link to="/?category=bdrama">영드</Link>
        </li>
        <li>
          <Link to="/?category=adrama">미드</Link>
        </li>
        <li>
          <Link to="/?category=book">책</Link>
        </li>
      </ul>
    </header>
  )
}

export default Header