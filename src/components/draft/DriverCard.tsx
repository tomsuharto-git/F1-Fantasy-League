import Image from 'next/image'
import type { Driver } from '@/lib/types'

// Team gradient configurations (exact match from Grid Kings live tracker)
const TEAM_GRADIENTS: Record<string, { from: string; to: string; middle?: { color: string; stop: number } }> = {
  'Red Bull Racing': { from: '#1E2535', middle: { color: '#68302F', stop: 64 }, to: '#F94624' },
  'McLaren': { from: '#7B2E00', middle: { color: '#F26B00', stop: 30 }, to: '#FFC375' },
  'Ferrari': { from: '#66000A', middle: { color: '#A10819', stop: 32 }, to: '#EA122B' },
  'Mercedes': { from: '#000000', to: '#00a19b' },
  'Aston Martin': { from: '#003D2D', to: '#00594A' },
  'Williams': { from: '#003D7A', to: '#0066CC' },
  'Haas': { from: '#4A0000', to: '#CC0000' },
  'Racing Bulls': { from: '#1E2535', middle: { color: '#2952A3', stop: 50 }, to: '#3366CC' },
  'Kick Sauber': { from: '#003D2D', to: '#00B050' },
  'Alpine': { from: '#ff87bc', to: '#2293d1' },
}

interface DriverCardProps {
  driver: Driver
  onClick?: () => void
  disabled?: boolean
  isMyTurn?: boolean
}

export function DriverCard({ driver, onClick, disabled = false, isMyTurn = false }: DriverCardProps) {
  const teamGradient = TEAM_GRADIENTS[driver.team] || { from: '#374151', to: '#6b7280' }

  // Build gradient string (support 2 or 3 color stops)
  const gradientString = teamGradient.middle
    ? `linear-gradient(to right, ${teamGradient.from} 0%, ${teamGradient.middle.color} ${teamGradient.middle.stop}%, ${teamGradient.to} 100%)`
    : `linear-gradient(to right, ${teamGradient.from}, ${teamGradient.to})`

  // Get driver image path
  const driverImagePath = `/drivers/${driver.number}-${driver.code.toLowerCase()} 2.png`

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-gray-800 border rounded-[14px] h-[105px] overflow-hidden transition-all ${
        isMyTurn && !disabled
          ? 'border-[#D2B83E] hover:border-[#E5C94F] transform hover:scale-[1.02] cursor-pointer'
          : 'border-[rgba(255,255,255,0.1)] cursor-not-allowed opacity-60'
      }`}
      style={{ width: '100%', maxWidth: '380px' }}
    >
      {/* Card Background Gradient */}
      <div className="h-[103px] relative">
        {/* Team Gradient Background */}
        <div
          className="absolute inset-0"
          style={{
            background: gradientString,
          }}
        />

        {/* Content Container */}
        <div className="absolute inset-0 flex">
          {/* LEFT SECTION: Starting Position */}
          <div className="w-[70px] flex flex-col items-center justify-center">
            {/* Position */}
            <div className="font-['Formula1-Black'] text-[28px] leading-[28px] text-white">
              P{driver.startPosition}
            </div>
          </div>

          {/* MIDDLE SECTION: Driver Info */}
          <div className="flex-1 relative">
            {/* Driver Image */}
            <div className="absolute left-2 top-3 w-[65px] h-[70px] rounded-[10px] overflow-hidden">
              <Image
                src={driverImagePath}
                alt={driver.name}
                width={65}
                height={70}
                className="object-cover"
              />
            </div>

            {/* Driver Name and Team */}
            <div className="absolute left-[75px] top-5 flex flex-col gap-1 pr-3">
              {/* Driver Name */}
              <div className="border-b border-b-[rgba(255,255,255,0.3)] pb-0.5">
                <p className="font-['Inter'] font-black text-[14px] leading-[18px] text-white">
                  {driver.name.split(' ').pop()?.toUpperCase()}
                </p>
              </div>

              {/* Team Name */}
              <p className="font-['Inter'] font-normal text-[10px] leading-[14px] text-white tracking-[0.0645px]">
                {driver.team}
              </p>

              {/* Draft Selection Indicator */}
              {isMyTurn && !disabled && (
                <div className="bg-[#D2B83E] rounded h-[18px] px-1.5 inline-flex items-center w-fit mt-0.5">
                  <p className="font-['Inter'] font-bold text-[9px] leading-[13px] text-black">
                    ✓ SELECT
                  </p>
                </div>
              )}

              {/* Tier Badge */}
              <div className="mt-1">
                <span className="text-[9px] text-white/60">
                  {driver.tier === 1 && 'T1: P1-P5'}
                  {driver.tier === 2 && 'T2: P6-P10'}
                  {driver.tier === 3 && 'T3: P11-P15'}
                  {driver.tier === 4 && 'T4: P16-P20'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
