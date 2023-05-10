'use strict'

const maxQuestions = 10
let score = 0,
    questionCount = 0,
    verbs,
    currentVerb,
    currentRun,
    uiState

const mainButton = document.getElementById('button'),
    progressBar = document.getElementById('progress-bar'),
    messageBox = document.getElementById('message'),
    stepInfo = document.getElementById('step-info'),
    inputPreterit = document.getElementById('preterit'),
    inputParticiple = document.getElementById('participle'),
    inputFields = [inputPreterit, inputParticiple]

function getJSONData(url) {
    return fetch(url).then(response => {
      	return response.json()
    })
}

async function main() {
    verbs = await getJSONData('js/verbs-list.json')
    console.log('Loaded ' + verbs.length + ' verbs.')

    // Globally assign the Enter key to the button click event
    window.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault()
            onButtonClick()
        }
    })

    mainButton.addEventListener('click', onButtonClick)
    progressBar.addEventListener('click', onStepSelected)
    startNewGame()
}

function onButtonClick() {
    switch(uiState) {
        case 'start':
            startNewGame()
            break;
        case 'check':
            checkUserAnswer()
            break;
        case 'next':
            showNextVerb()
            break;
        default:
            throw 'Undefined game state.'
    }
}

function setUIState(state) {
    uiState = state
    mainButton.value = uiState
}

function startNewGame() {
    score = 0
    questionCount = 0
    currentRun = []
    removeAllChildElements(messageBox)
    initProgressBar()
    setButtonHighlight(false)
    showNextVerb()
}

function showNextVerb() {
    currentVerb = getRandomVerb()
    currentRun.push(currentVerb)
    document.getElementById('present').textContent = currentVerb[0]
    questionCount += 1

    updateScoreDisplay()
    clearStepInfoDisplay()
    resetInputForm()
    setUIState('check')
}

function getRandomVerb() {
    return verbs.splice(Math.floor(Math.random() * verbs.length), 1)[0]
}

function initProgressBar() {
    removeAllChildElements(progressBar)
    for (let i=0; i < maxQuestions; i++) {
        let el = document.createElement('div')
        let id = 'step-' + String(i)
        el.setAttribute('id', id)
        el.setAttribute('class', 'step')
        el.setAttribute('style', 'grid-column: ' + String(i+1))
        el.classList.add('hidden')
        progressBar.appendChild(el)
        el.textContent = ''
    }
    clearStepInfoDisplay()
}

function removeAllChildElements(el) {
    while (el.firstChild) {
        el.removeChild(el.lastChild)
    }
 }

function checkUserAnswer() {
    clearStepInfoDisplay()
    if (!areBothInputFieldsFilled()) return
    
    let answerScore = getAnswerScore()
    showStepInfoButton(answerScore)
    score += answerScore
    updateScoreDisplay()
    disableInputFields(true)

    if (questionCount < maxQuestions) {
        setUIState('next')
    } else {
        gameOver()
    }
}

function areBothInputFieldsFilled() {
    let result = true
    inputFields.forEach(function(field, i, array) {
        if (field.value.length == 0) { 
            result = false
        } else if (array[1-i].value.length == 0) {
            array[1-i].focus()
            result = false
        }
    })
    return result
}

function getAnswerScore() {
    let answerScore = 0
    let correctAnswer = [currentVerb[1].split('/'), currentVerb[2].split('/')]

    for (let i = 0; i < 2; i++) {
        inputFields[i].classList.remove('default')
        if (correctAnswer[i].includes(inputFields[i].value.trim().toLowerCase())) {
            answerScore += 1
            inputFields[i].classList.add('correct')
        } else {
            inputFields[i].classList.add('incorrect')
        }
        inputFields[i].value = correctAnswer[i]
    }

    return answerScore
}

function showStepInfoButton(answerScore) {
    let stepButton = document.getElementById('step-' + String(questionCount - 1))
    stepButton.classList.remove('hidden')

    if (answerScore === 2) {
        stepButton.classList.add('correct')
    } else if (answerScore == 1) {
        stepButton.classList.add('half-correct')
    } else {
        stepButton.classList.add('incorrect')
    }
}

function disableInputFields(value) {
    inputPreterit.disabled = value
    inputParticiple.disabled = value
    mainButton.focus() // Firefox needs this for Enter key
}

function updateScoreDisplay() {
    document.getElementById('score').textContent = score
}

function onStepSelected(e) {
    if (isNotDelegatingButton(e.target)) {
        return
    } else if (isStepButtonSelected(e.target)) {
        clearStepInfoDisplay()
        return
    } else {
        showStepInfoText(e.target)
    }
}

function isStepButtonSelected(button) {
    return button.classList.contains('selected')
}

function isNotDelegatingButton(button) {
    return !button.classList.contains('step')
}

function showStepInfoText(button) {
    let step = getStepIndex(button)
    clearStepInfoDisplay()
    document.querySelector('#step-' + String(step)).classList.add('selected')

    let verb = currentRun[step]
    let correctAnswer = `${verb[0]} : ${verb[1]}, ${verb[2]}`
    let isUserCorrect = button.classList.contains('correct')

    let paragraph = document.createElement('p')
    paragraph.innerHTML = getStepInfoHTML(correctAnswer, isUserCorrect)
    stepInfo.appendChild(paragraph)

}

function getStepInfoHTML(correctAnswer, isUserCorrect) {
    if (isUserCorrect) {
        return `<span>${correctAnswer}</span> — You got that right!`
    } else {
        return `Remember, it's — <span>${correctAnswer}</span>`
    }
}

function clearStepInfoDisplay() {
    removeAllChildElements(stepInfo)
    let steps = document.querySelectorAll('.step')
    steps.forEach(function(step) {
        step.classList.remove('selected')
    })
}

function getStepIndex(target) {
    // We get the progress bar step index
    // from the 'step-xx' id attribute string
    return Number(target.id.substr(5))
}

function gameOver() {
    showGameOverMessage()
    document.getElementById('present').textContent = ''
    setButtonHighlight(true)
    document.activeElement.blur()  // Hide mobile keyboard
    setUIState('start')
}

function showGameOverMessage() {
    let p = document.createElement('p')
    let msg = `Your score is ${score} out of a possible ${maxQuestions*2}. `
    msg += getScoreEvaluation(score)
    p.textContent = msg
    messageBox.appendChild(p) 

    p = document.createElement('p')
    p.textContent = 'Press Start to play again.'
    messageBox.appendChild(p) 
}

function setButtonHighlight(value) {
    if (value) {
        mainButton.classList.add('highlight')
    } else {
        mainButton.classList.remove('highlight')
    }
}

function resetInputForm() {
    inputFields.forEach(item => {
        item.classList.remove('correct')
        item.classList.remove('incorrect')
        item.classList.add('default')
        item.value = ''
        item.disabled = false
    })
    inputPreterit.focus()
}

function getScoreEvaluation(score) {
    let maxScore = maxQuestions * 2
    if (score == maxScore) {
        return 'Perfect score! Well done indeed.'
    } else if (score > maxScore * 0.8) {
        return 'That was pretty good!'
    } else if (score > maxScore * 0.6) {
        return 'You can do better that this.'
    } else if (score > maxScore * 0.4) {
        return 'Well, that was pretty bad.'
    } else if (score > maxScore * 0.2) {
        return 'Rather awful.'
    } else {
        return 'Quite the disaster, really.'
    }
}

main()
