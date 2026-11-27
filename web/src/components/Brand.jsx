
import './Brand.css'
import logoAciona from '../assets/logo-aciona.webp'

function Brand() {
  return (
    <div className="brand">
      <img
        src={logoAciona}
        alt=""
        className="brand__logo"
      />
      <span className="brand__name">Aciona</span>
    </div>
  )
}

export default Brand
