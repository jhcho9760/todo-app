'use client'

import { useEffect, useState } from 'react'

type Platform = 'ios' | 'android' | 'other'

function getPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone === true)
  )
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [platform, setPlatform] = useState<Platform>('other')
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) return  // 이미 설치되어 앱으로 실행 중

    const p = getPlatform()
    setPlatform(p)

    if (p === 'ios') {
      // iOS: 이미 설치 여부 확인 후 배너 표시
      const dismissed = sessionStorage.getItem('pwa-banner-dismissed')
      if (!dismissed) setShowBanner(true)
      return
    }

    // Android/Chrome: beforeinstallprompt 이벤트 대기
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as Event & { prompt: () => Promise<void> })
      const dismissed = sessionStorage.getItem('pwa-banner-dismissed')
      if (!dismissed) setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    setDeferredPrompt(null)
    setShowBanner(false)
  }

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1')
    setShowBanner(false)
    setShowIOSGuide(false)
  }

  if (!showBanner) return null

  return (
    <>
      {/* 하단 설치 배너 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] flex items-center gap-3 px-4 py-3 shadow-lg"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          bottom: 'calc(56px + env(safe-area-inset-bottom))',
        }}
      >
        {/* 앱 아이콘 */}
        <img src="/icons/icon-192.png" alt="앱 아이콘" style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0 }} />

        <div className="flex-1 min-w-0">
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>나윤&apos;s Board</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>홈 화면에 추가하면 앱처럼 사용할 수 있어요</p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '6px 10px' }}
          >
            닫기
          </button>
          {platform === 'ios' ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-4 py-2 rounded-full font-semibold"
              style={{ fontSize: '13px', backgroundColor: '#0066cc', color: '#ffffff' }}
            >
              방법 보기
            </button>
          ) : (
            <button
              onClick={handleInstall}
              className="px-4 py-2 rounded-full font-semibold"
              style={{ fontSize: '13px', backgroundColor: '#0066cc', color: '#ffffff' }}
            >
              설치
            </button>
          )}
        </div>
      </div>

      {/* iOS 설치 안내 모달 */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full rounded-t-[24px] p-6 pb-10"
            style={{ backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: 'var(--border)' }} />
            <h2 className="font-semibold text-center mb-6" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
              홈 화면에 추가하기
            </h2>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#0066cc' }}>1</span>
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>Safari 하단 공유 버튼 탭</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>화면 아래쪽 중앙의 □↑ 아이콘</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#0066cc' }}>2</span>
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>아래로 스크롤해서 &ldquo;홈 화면에 추가&rdquo; 선택</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>+ 아이콘과 함께 표시됩니다</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#0066cc' }}>3</span>
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>오른쪽 위 &ldquo;추가&rdquo; 버튼 탭</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>홈 화면에 앱 아이콘이 생성됩니다</p>
                </div>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-6 py-3 rounded-full font-semibold"
              style={{ backgroundColor: '#0066cc', color: '#ffffff', fontSize: '16px' }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  )
}
