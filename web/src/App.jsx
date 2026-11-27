
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RotaProtegida from './components/RotaProtegida'
import Login from './pages/Login'
import Home from './pages/Home'
import NovaOcorrencia from './pages/NovaOcorrencia'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route
          path="/ocorrencias/nova"
          element={<RotaProtegida><NovaOcorrencia /></RotaProtegida>}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
