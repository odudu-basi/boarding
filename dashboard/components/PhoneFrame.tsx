import { theme } from '@/lib/theme'

interface Device {
  id: string
  name: string
  platform: 'ios' | 'android'
  width: number
  height: number
}

interface PhoneFrameProps {
  children: React.ReactNode
  device?: Device
  orientation?: 'portrait' | 'landscape'
}

export function PhoneFrame({ children, device, orientation = 'portrait' }: PhoneFrameProps) {
  // Default to iPhone 16 Pro
  const defaultDevice: Device = {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro',
    platform: 'ios',
    width: 402,
    height: 874,
  }

  const selectedDevice = device || defaultDevice
  const isLandscape = orientation === 'landscape'

  // Swap width and height for landscape
  const frameWidth = isLandscape ? selectedDevice.height : selectedDevice.width
  const frameHeight = isLandscape ? selectedDevice.width : selectedDevice.height

  // Scale down to fit nicely in preview (max 450px to account for padding)
  const scale = Math.min(1, 450 / Math.max(frameWidth, frameHeight))
  const displayWidth = (frameWidth * scale) + 18  // Add padding (9px * 2)
  const displayHeight = (frameHeight * scale) + 18  // Add padding (9px * 2)

  // Determine if device has Dynamic Island (iPhone 14 Pro and newer)
  const hasDynamicIsland = selectedDevice.platform === 'ios' && (
    selectedDevice.id.includes('14-pro') ||
    selectedDevice.id.includes('15-pro') ||
    selectedDevice.id.includes('16-pro')
  )

  // Determine if device has old-style notch (iPhone X to 13, but not Pro models with Dynamic Island)
  const hasNotch = selectedDevice.platform === 'ios' &&
    !selectedDevice.id.includes('se') &&
    !selectedDevice.id.includes('ipad') &&
    !hasDynamicIsland

  // Different frame styles for iOS vs Android
  const borderRadius = selectedDevice.platform === 'ios' ?
    (selectedDevice.id.includes('ipad') ? 20 : 50) : 40

  return (
    <div
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
        backgroundColor: selectedDevice.platform === 'ios' ? '#000' : '#1a1a1a',
        borderRadius: `${borderRadius}px`,
        padding: '9px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
      }}
    >
      {/* Dynamic Island (iPhone 14 Pro, 15 Pro, 16 Pro) */}
      {hasDynamicIsland && !isLandscape && (
        <div
          style={{
            position: 'absolute',
            top: '15px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100px',
            height: '30px',
            backgroundColor: '#000',
            borderRadius: '15px',
            zIndex: 10,
          }}
        />
      )}

      {/* Notch (older iPhones: X, 11, 12, 13) */}
      {hasNotch && !isLandscape && (
        <div
          style={{
            position: 'absolute',
            top: '9px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '150px',
            height: '30px',
            backgroundColor: '#000',
            borderRadius: '0 0 20px 20px',
            zIndex: 10,
          }}
        />
      )}

      {/* Screen */}
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#fff',
          borderRadius: `${borderRadius - 10}px`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${frameWidth}px`,
            height: `${frameHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      </div>

      {/* Android home indicator */}
      {selectedDevice.platform === 'android' && (
        <div
          style={{
            position: 'absolute',
            bottom: '17px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '4px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: '2px',
          }}
        />
      )}
    </div>
  )
}
