// A fake YouTube IFrame Player API, served instead of youtube.com/iframe_api
// in every test not tagged @youtube (spec 005, plan: YouTube in tests).
// It builds the same embed iframe as the real player, and lets tests end the
// video or report a player error through window.__youtubeStub.
export const YOUTUBE_STUB = `(() => {
  const players = []

  class Player {
    constructor(target, options) {
      const element = typeof target === 'string' ? document.getElementById(target) : target
      const iframe = document.createElement('iframe')
      iframe.src = (options.host || 'https://www.youtube.com') + '/embed/' + options.videoId
      iframe.width = '640'
      iframe.height = '360'
      element.replaceWith(iframe)
      this.iframe = iframe
      this.videoId = options.videoId
      this.events = options.events || {}
      players.push(this)
      setTimeout(() => this.events.onReady?.({ target: this }), 0)
    }

    getIframe() {
      return this.iframe
    }

    destroy() {
      this.iframe.remove()
      players.splice(players.indexOf(this), 1)
    }
  }

  window.YT = { Player, PlayerState: { ENDED: 0 } }
  window.__youtubeStub = {
    videoIds: () => players.map((player) => player.videoId),
    end: () => [...players].forEach((p) => p.events.onStateChange?.({ target: p, data: 0 })),
    fail: (code) => [...players].forEach((p) => p.events.onError?.({ target: p, data: code })),
  }
  window.onYouTubeIframeAPIReady?.()
})()`

export const EMBED_STUB = '<!doctype html><title>Video</title><body style="margin:0;background:#000"></body>'
