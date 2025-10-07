const Logo = ({ className = "h-12" }) => {
  return (
    <svg className={className} viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Icône goutte d'eau */}
      <g transform="translate(10, 5)">
        <circle cx="15" cy="20" r="18" fill="#175C64" opacity="0.2"/>
        <path d="M15 5 C15 5, 5 15, 5 22 C5 28, 9 32, 15 32 C21 32, 25 28, 25 22 C25 15, 15 5, 15 5 Z" fill="#175C64"/>
        <circle cx="12" cy="18" r="3" fill="#EEF2F2" opacity="0.6"/>
        <path d="M15 12 C15 12, 10 18, 10 22 C10 25, 12 27, 15 27 C18 27, 20 25, 20 22 C20 18, 15 12, 15 12 Z" fill="#0E3A40"/>
      </g>
      
      {/* Texte COLLABLE */}
      <text x="50" y="32" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="600">
        <tspan fill="#F7C7BB">COLL</tspan>
        <tspan fill="#175C64">ABLE</tspan>
      </text>
    </svg>
  )
}

export default Logo
