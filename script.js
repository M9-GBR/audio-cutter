const selectBtn = document.getElementById('select-btn'),
    cancelBtn = document.getElementById('cancel-btn'),
    /**@type HTMLInputElement */
    fileInput = document.getElementById('file-input'),
    audioName = document.querySelector('#select-sec p'),
    /**@type HTMLAudioElement */
    audioElem = document.querySelector('#select-sec audio'),
    audioElem2 = document.querySelector('#play-wrap audio'),
    stInput = document.getElementById('st-input'),
    etInput = document.getElementById('et-input'),
    sTimeElem = document.getElementById('s-time'),
    eTimeElem = document.getElementById('e-time'),
    playBtn = document.getElementById('play-btn'),
    cutBtn = document.getElementById('cut-btn'),
    downloadBtn = document.getElementById('download-btn'),
    audioCtx = new AudioContext()

let startTime = 0, endTime = 0,
    /**@type AudioBuffer */
    sourceBuffer, cutBuffer

function enable(bool, ...elems) {
    elems.forEach(elem => elem.disabled = !bool)
}

selectBtn.addEventListener('click', () => fileInput.click())

fileInput.addEventListener('input', async () => {
    if (fileInput.files[0]) {
        enable(false, cancelBtn, stInput, etInput, playBtn, cutBtn, downloadBtn)
        audioName.textContent = '...'
        audioElem.src = ''
        audioElem2.src = ''
        etInput.value = ''
        stInput.value = ''
        eTimeElem.textContent = '0:00'
        sTimeElem.textContent = '0:00'

        audioName.textContent = fileInput.files[0].name

        enable(false, etInput, stInput, cancelBtn, playBtn, cutBtn)
        audioElem.src = ''

        sourceBuffer = await audioCtx.decodeAudioData(await fileInput.files[0].arrayBuffer())

        enable(true, etInput, stInput, cancelBtn, playBtn, cutBtn)

        audioElem.src = URL.createObjectURL(fileInput.files[0])

        startTime = 0
        endTime = sourceBuffer.duration
        stInput.value = startTime
        etInput.value = endTime
        updateTimeElems()
    }
})

cancelBtn.addEventListener('click', () => {
    enable(false, cancelBtn, stInput, etInput, playBtn, cutBtn, downloadBtn)
    fileInput.value = ''
    audioName.textContent = '...'
    audioElem.src = ''
    audioElem2.src = ''
    etInput.value = ''
    stInput.value = ''
    eTimeElem.textContent = '0:00'
    sTimeElem.textContent = '0:00'
})

stInput.addEventListener('input', () => {
    startTime = +stInput.value || 0
    updateTimeElems()
})

etInput.addEventListener('input', () => {
    endTime = +etInput.value || 0
    updateTimeElems()
})

stInput.addEventListener('change', () => fixInput())
etInput.addEventListener('change', () => fixInput())

function fixInput() {
    startTime = Math.max(0, Math.min(startTime, sourceBuffer.duration))
    endTime = Math.max(0, Math.min(endTime, sourceBuffer.duration))

    if (endTime < startTime) endTime = startTime

    stInput.value = startTime
    etInput.value = endTime

    updateTimeElems()
}

function updateTimeElems() {
    sTimeElem.textContent = formatTime(startTime)
    eTimeElem.textContent = formatTime(endTime)
    audioElem.currentTime = startTime
    audioElem.pause()
}

function formatTime(value) {
    let min = 0, secs = Math.floor(value)

    min = Math.floor(secs / 60)
    secs = `${secs % 60}`.padStart(2, 0)

    return min + `:${secs}`
}

playBtn.addEventListener('click', () => {
    audioElem.currentTime = startTime

    audioElem.play().then(() => {
        audioElem.ontimeupdate = () => {
            if (audioElem.currentTime >= endTime) {
                audioElem.pause()
            }
        }
    })
})

audioElem.addEventListener("pause", () => audioElem.ontimeupdate = null)

cutBtn.addEventListener('click', () => {
    if (endTime - startTime) {
        cutBuffer = audioCtx.createBuffer(
            sourceBuffer.numberOfChannels,
            Math.ceil((endTime - startTime) * sourceBuffer.sampleRate),
            sourceBuffer.sampleRate
        )

        for (let i = 0; i < cutBuffer.numberOfChannels; i++) {
            cutBuffer.getChannelData(i).set(
                sourceBuffer.getChannelData(i).slice(startTime * sourceBuffer.sampleRate, endTime * sourceBuffer.sampleRate)
            )
        }

        let wav = audioBufferToWav(cutBuffer),
            blob = new Blob([wav], { type: "audio/wav" })

        let url = URL.createObjectURL(blob)

        audioElem2.src = url

        enable(true, downloadBtn)
    } else {
        alert("Duration of the audio must be greater than zero.")
    }
})

downloadBtn.addEventListener("click", () => {
    let a = document.createElement("a"),
        nameArr = audioName.textContent.split(/\.(?=[^.]*$)/)

    nameArr.pop()

    a.download = nameArr[0] + "(audio-cutter).wav"
    a.href = audioElem2.src
    a.click()
})