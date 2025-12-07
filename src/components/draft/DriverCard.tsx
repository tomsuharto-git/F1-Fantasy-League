import Image from 'next/image'
import type { Driver } from '@/lib/types'

// Team gradient configurations (from Grid Kings live tracker)
const TEAM_GRADIENTS: Record<string, { from: string; to: string; middle?: { color: string; stop: number } }> = {
  'Red Bull Racing': { from: '#1E2535', middle: { color: '#68302F', stop: 64 }, to: '#F94624' },
  'McLaren': { from: '#7B2E00', middle: { color: '#F26B00', stop: 30 }, to: '#FFC375' },
  'Ferrari': { from: '#66000A', middle: { color: '#A10819', stop: 32 }, to: '#EA122B' },
  'Mercedes': { from: '#000000', to: '#00a19b' },
  'Aston Martin': { from: '#003F27', middle: { color: '#14714F', stop: 32 }, to: '#1F8E66' },
  'Williams': { from: '#012564', to: '#64c4ff' },
  'Haas F1 Team': { from: '#E73725', middle: { color: '#919598', stop: 71 }, to: '#5D6163' },
  'Racing Bulls': { from: '#6692ff', to: '#1634cb' },
  'Kick Sauber': { from: '#04B810', to: '#015901' },
  'Alpine': { from: '#ff87bc', to: '#2293d1' },
}

// Display names for teams (shorter/cleaner versions)
const TEAM_DISPLAY_NAMES: Record<string, string> = {
  'Red Bull Racing': 'Red Bull',
  'Haas F1 Team': 'Haas',
}

interface DriverCardProps {
  driver: Driver
  onClick?: () => void
  disabled?: boolean
}

export function DriverCard({ driver, onClick, disabled = false }: DriverCardProps) {
  const teamGradient = TEAM_GRADIENTS[driver.team] || { from: '#374151', to: '#6b7280' }

  // Build gradient string (support 2 or 3 color stops)
  const gradientString = teamGradient.middle
    ? `linear-gradient(to right, ${teamGradient.from} 0%, ${teamGradient.middle.color} ${teamGradient.middle.stop}%, ${teamGradient.to} 100%)`
    : `linear-gradient(to right, ${teamGradient.from}, ${teamGradient.to})`

  // Get driver image - prefer API headshot, fallback to local file
  const driverImagePath = driver.headshotUrl || `/drivers/${driver.number}-${driver.code.toLowerCase()}.png`

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-gray-800 border border-[rgba(255,255,255,0.1)] rounded-[14px] h-[80px] overflow-hidden transition-all ${
        !disabled
          ? 'hover:border-[rgba(255,255,255,0.3)] transform hover:scale-[1.02] cursor-pointer'
          : 'cursor-not-allowed opacity-30'
      }`}
      style={{ width: '100%' }}
    >
      {/* Card Background Gradient */}
      <div className="h-[78px] relative">
        {/* Team Gradient Background */}
        <div
          className="absolute inset-0"
          style={{
            background: gradientString,
          }}
        />

        {/* Content Container */}
        <div className="absolute inset-0 flex pl-3">
          {/* LEFT SECTION: Starting Position */}
          <div className="w-[50px] flex flex-col items-center justify-center">
            {/* Position - using inline style for Safari font compatibility */}
            <div
              className="text-[24px] leading-[24px] text-white"
              style={{ fontFamily: 'Formula1-Black, sans-serif' }}
            >
              P{driver.startPosition}
            </div>
          </div>

          {/* MIDDLE SECTION: Driver Info */}
          <div className="flex-1 relative">
            {/* Driver Image */}
            <div className="absolute left-2 top-1 w-[55px] h-[60px] rounded-[8px] overflow-hidden">
              <Image
                src={driverImagePath}
                alt={driver.name}
                width={55}
                height={60}
                className="object-cover"
              />
            </div>

            {/* Driver Name and Team */}
            <div className="absolute left-[75px] top-4 flex flex-col gap-0.5 pr-3 text-left">
              {/* Driver Name */}
              <div className="border-b border-b-[rgba(255,255,255,0.3)] pb-0.5">
                <p
                  className="font-black text-[13px] leading-[16px] text-white text-left"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {driver.name.split(' ').pop()?.toUpperCase()}
                </p>
              </div>

              {/* Team Name */}
              <p
                className="font-normal text-[10px] leading-[14px] text-white tracking-[0.0645px] text-left"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {TEAM_DISPLAY_NAMES[driver.team] || driver.team}
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
