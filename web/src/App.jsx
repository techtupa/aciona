import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import NovaOcorrencia from './pages/NovaOcorrencia'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/ocorrencias/nova" element={<NovaOcorrencia />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App