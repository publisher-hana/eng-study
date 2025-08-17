import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import './styles/global.css'
import './styles/common.css'
import './styles/responsive.css'
import Home from './pages/Home';
import DetailPage from './pages/DetailPage';
function App() {
  return (
    <>
      <Router>
        <div className='wrapper'>
          <div className='container-wrap'>
            <Routes>  
              <Route path='/' element={<Home />} />
              <Route path="/detail/:id" element={<DetailPage  />} /> 
            </Routes>
          </div>
        </div>
      </Router>
    </>
  )
}

export default App
