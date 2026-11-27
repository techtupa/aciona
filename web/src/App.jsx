import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import NovaOcorrencia from './pages/NovaOcorrencia'
import FilaOcorrencias from './pages/FilaOcorrencias'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/ocorrencias/nova" element={<NovaOcorrencia />} />
        <Route path="/ocorrencias/fila" element={<FilaOcorrencias />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App