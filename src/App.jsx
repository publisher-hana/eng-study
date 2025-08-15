import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import './styles/global.css'
import './styles/common.css'
import Home from './pages/Home';
function App() {
  return (
    <>
      <Router>
        <div className='wrapper'>
          <div className='container-wrap'>
            <Routes>  
              <Route path='/' element={<Home />} />
           
            </Routes>
          </div>
        </div>
      </Router>
    </>
  )
}

export default App
