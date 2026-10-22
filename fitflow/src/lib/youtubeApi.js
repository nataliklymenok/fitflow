// Loads the YouTube IFrame Player API once, on first use (NFR-1).
// No API key is involved: this is YouTube's public embed script.

const API_URL = 'https://www.youtube.com/iframe_api'

let apiPromise = null

export function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve(window.YT)
    }
    const script = document.createElement('script')
    script.src = API_URL
    script.async = true
    script.onerror = () => {
      apiPromise = null
      script.remove()
      reject(new Error('The YouTube player could not be loaded'))
    }
    document.head.append(script)
  })
  return apiPromise
}

// Player error codes that mean the video itself cannot be played here:
// 100 = removed or private, 101 and 150 = the owner does not allow embedding.
export const UNAVAILABLE_ERRORS = [100, 101, 150]

export const PLAYER_ENDED = 0
