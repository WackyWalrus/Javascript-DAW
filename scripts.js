    // setup variables
var audioContext = (window.AudioContext) ? new window.AudioContext() : new window.webkitAudioContext(),
    gain = audioContext.createGain(),
    sheet = document.querySelector('.sheet'),
    mouse = sheet.querySelector('.mouse'),
    needle = document.querySelector('.needle'),
    playAnimation;

/* this is necessary for figuring out the frequency of notes */
var a = Math.pow(2, 1 / 12);

/*
  Oscillators: one sound being played, not different instruments
 */
var oscillators = {}, /* array of different oscillators being played */
    instruments = {}, /* array of instruments */
    keys = {}, /* array of keys */
    /* what keys play what notes */
    keyMap = {
        65: { note: 'C', steps: -9 },
        87: { note: 'C#', steps: -8 },
        83: { note: 'D', steps: -7 },
        69: { note: 'D#', steps: -6 },
        68: { note: 'E', steps: -5 },
        70: { note: 'F', steps: -4 },
        84: { note: 'F#', steps: -3 },
        71: { note: 'G', steps: -2 },
        89: { note: 'G#', steps: -1 },
        72: { note: 'A', steps: 0 },
        85: { note: 'A#', steps: 1 },
        74: { note: 'B', steps: 2, },
        75: { note: 'C', steps: 3 },
        79: { note: 'C#', steps: 4 },
        76: { note: 'D', steps: 5 },
        80: { note: 'D#', steps: 6 },
        59: { note: 'E', steps: 7 },
        222: { note: 'F', steps: 8 }
    };

/**
 * Generate a random ID
 */
function random_id() {
    'use strict';

    var length = Math.ceil(Math.random() * 25),
        text = '',
        possible = 'ABCDEF-HIJ123KL3456MNOP865QR890STUVWXYZ',
        i;

    for (i = 0; i < length; i += 1) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

/**
 * Stop playing
 */
function stop() {
    'use strict';

    // clear the animation interval
    clearInterval(playAnimation);
    // reset the needle
    needle.style.left = '0px';
}

/**
 * Start playing
 */
function play(loop) {
    'use strict';

    if (loop === undefined) {
        loop = false;
    }

    var left = -3, // needle starts at 0
        stopAt, // this is the end of the sheet
        measures = document.querySelectorAll('.sheet .measure'),
        measuresData = {},
        i,
        x,
        oscs = {};

    for (i = 0; i < measures.length; i += 1) {
        measuresData[i] = measures[i].getBoundingClientRect();
        measuresData[i].DOM = measures[i];
    }

    /**
     * plays one frame
     */
    function frame() {
        var posX, // will use this l8r
            currentMeasures = {},
            y = 0,
            z = 0,
            notes,
            configs = '';
        // check where the sheet music stops
        stopAt = sheet.offsetWidth;
        // if it's at the stopping point:
        if (left === stopAt) {
            if (loop === false) {
                stop(); // run the stop function
            } else {
                left = -1;
            }
        } else { // otherwise keep playing
            // move the needle one pixel to the right
            left += 1;
            needle.style.left = left + 'px';
            // this is where it'll check if it's hitting a note
            //      get the measures that this is on
            for (x = 0; x < Object.keys(measuresData).length; x += 1) {
                posX = measuresData[x].left - 154;
                if (left > posX && left < (posX + measuresData[x].width)) {
                    currentMeasures[y] = measuresData[x];
                    y += 1;
                }
            }
            // run through the current measures
            for (x = 0; x < Object.keys(currentMeasures).length; x += 1) {
                // query the notes for the measure we're currently looping on
                notes = currentMeasures[x].DOM.querySelectorAll('.note');
                // run through the notes
                for (z = 0; z < notes.length; z += 1) {
                    // if the need is on the note we're looping on right now
                    if (left === (notes[z].offsetLeft + notes[z].parentElement.offsetLeft)) {
                        // if the note has a step, some might not if they're visually in-between measures
                        if (notes[z].dataset.step !== undefined) {
                            // get the note configuration
                            configs = JSON.parse(currentMeasures[x].DOM.parentNode.dataset.config);
                            // if getting the configs worked:
                            if (configs !== undefined) {
                                // play the note
                                oscs[z] = audioContext.createOscillator();
                                oscs[z].type = configs.type;
                                oscs[z].frequency.value = 440 * Math.pow(a, parseInt(notes[z].dataset.step, 10) + parseInt(configs.scale * 12, 10));
                                oscs[z].connect(audioContext.destination);
                                oscs[z].start();
                                oscs[z].stop(audioContext.currentTime + 0.25);
                            }
                        }
                    }
                }
            }
        }
    }

    // setup the animation at 10ms
    playAnimation = setInterval(frame, 10);
}

/**
 * Adds an instrument to the instrument list & sheet music
 */
function addInstrument() {
    'use strict';

    var instrumentsDOM = document.querySelector('.instruments'), // the list of instruments
        // this is the instrument in the instrument list
        INSTRUMENT_HTML = {
            DIV: document.createElement('div'), // the wrapper
            INPUT: document.createElement('input'), // the text input
            TAB: document.createElement('div'), // the tab at the top
            PIANO_ROLL: document.createElement('div'),
            SELECT_TYPE: document.createElement('select'),
            SCALE_UP: document.createElement('div'),
            SCALE_DOWN: document.createElement('div')
        },
        // this is what we'll inject in the sheet music div
        SHEET_HTML = {
            DIV: document.createElement('div'), // the wrapper
            MEASURE: document.createElement('div') // a measure
        },
        // the number of measures
        measureCount = document.querySelectorAll('.time-key .measure').length,
        // this is for incrementing
        i,
        n,
        _note,
        types = ['sine', 'square', 'sawtooth', 'triangle'],
        noteList = ['E', 'D', 'C', 'B', 'A', 'G', 'F', 'E'],
        randomId = random_id(),
        option,
        config = '{"type": "sine", "scale": "0"}';

    // setup the instrument HTML
    INSTRUMENT_HTML.INPUT.type = 'text'; // input type
    INSTRUMENT_HTML.INPUT.placeholder = '#' + Object.keys(instruments).length; // the placeholder attribute
    // what happens when you click on the input one
    // I wanted this to be a double clicker, so blur on one click
    INSTRUMENT_HTML.INPUT.onclick = function () {
        this.blur();
    };
    // focus on two
    INSTRUMENT_HTML.INPUT.ondblclick = function () {
        this.focus();
    };
    // add a class to the tab at the top
    INSTRUMENT_HTML.TAB.className = 'tab';
    // piano roll
    INSTRUMENT_HTML.PIANO_ROLL.className = 'piano-roll';
    for (n = 0; n < 8; n += 1) {
        _note = document.createElement('div');
        _note.className = '_note';
        _note.innerHTML = noteList[n];
        INSTRUMENT_HTML.PIANO_ROLL.appendChild(_note);
    }
    // add a class to the wrapper
    INSTRUMENT_HTML.DIV.className = 'instrument';
    INSTRUMENT_HTML.DIV.dataset.id = randomId;
    // give it some data, this will eventually be the options
    INSTRUMENT_HTML.DIV.dataset.config = config;
    // select thing
    INSTRUMENT_HTML.SELECT_TYPE.className = 'select-type';
    for (n = 0; n < 4; n += 1) {
        option = document.createElement('option');
        option.value = types[n];
        option.innerHTML = types[n];
        INSTRUMENT_HTML.SELECT_TYPE.appendChild(option);
    }
    // make onchange thing for oscillator type
    INSTRUMENT_HTML.SELECT_TYPE.onchange = function () {
        var tempconfig = JSON.parse(this.parentElement.dataset.config);
        tempconfig.type = this.value;
        tempconfig = JSON.stringify(tempconfig);
        this.parentElement.dataset.config = tempconfig;
        document.querySelector('.sheet #' + this.parentElement.id).dataset.config = tempconfig;
    };
    // scale up and down elements
    INSTRUMENT_HTML.SCALE_UP.className = 'scale-up';
    INSTRUMENT_HTML.SCALE_DOWN.className = 'scale-down';
    INSTRUMENT_HTML.SCALE_UP.innerHTML = '<i class="fa fa-arrow-up" aria-hidden="true"></i>';
    INSTRUMENT_HTML.SCALE_DOWN.innerHTML = '<i class="fa fa-arrow-down" aria-hidden="true"></i>';
    INSTRUMENT_HTML.SCALE_UP.onclick = function () {
        var tempconfig = JSON.parse(this.parentElement.dataset.config);
        tempconfig.scale = parseInt(tempconfig.scale, 10) + 1;
        tempconfig = JSON.stringify(tempconfig);
        this.parentElement.dataset.config = tempconfig;
        document.getElementById(this.parentElement.dataset.id).dataset.config = tempconfig;
    };
    INSTRUMENT_HTML.SCALE_DOWN.onclick = function () {
        var tempconfig = JSON.parse(this.parentElement.dataset.config);
        tempconfig.scale = parseInt(tempconfig.scale, 10) - 1;
        tempconfig = JSON.stringify(tempconfig);
        this.parentElement.dataset.config = tempconfig;
        document.getElementById(this.parentElement.dataset.id).dataset.config = tempconfig;
    };
    // insert tab into wrapper
    INSTRUMENT_HTML.DIV.appendChild(INSTRUMENT_HTML.TAB);
    // insert input into wrapper
    INSTRUMENT_HTML.DIV.appendChild(INSTRUMENT_HTML.INPUT);
    INSTRUMENT_HTML.DIV.appendChild(INSTRUMENT_HTML.PIANO_ROLL);
    INSTRUMENT_HTML.DIV.appendChild(INSTRUMENT_HTML.SELECT_TYPE);
    INSTRUMENT_HTML.DIV.appendChild(INSTRUMENT_HTML.SCALE_UP);
    INSTRUMENT_HTML.DIV.appendChild(INSTRUMENT_HTML.SCALE_DOWN);
    // what happens when you click on the instrument
    // selected instrument will be the one you're playing now
    INSTRUMENT_HTML.DIV.onclick = function () {
        // get all instruments
        var allInstruments = document.querySelectorAll('.instrument');
        // loop through the instruments
        for (i = 0; i < allInstruments.length; i += 1) {
            // remove the selected class
            allInstruments[i].className = allInstruments[i].className.replace(' selected', '');
        }
        // add the selected class to the clicked instrument
        this.className = this.className + ' selected';
    };
    // add the class to the sheet music injection
    SHEET_HTML.DIV.className = 'instrument';
    SHEET_HTML.DIV.id = randomId;
    SHEET_HTML.DIV.dataset.config = config;
    // this loop will add the right number of measures to the new instrument
    for (i = 0; i < measureCount; i += 1) {
        SHEET_HTML.MEASURE = document.createElement('div');
        SHEET_HTML.MEASURE.className = 'measure';
        SHEET_HTML.DIV.appendChild(SHEET_HTML.MEASURE);
    }
    instruments[Object.keys(instruments).length] = {};

    instrumentsDOM.appendChild(INSTRUMENT_HTML.DIV);
    document.querySelector('.sheet').appendChild(SHEET_HTML.DIV);
}

/**
 * Adds a measure to the sheet
 */
function addMeasure() {
    'use strict';

    // setup variables
    var sheetElems = document.querySelectorAll('.sheet .instrument'),
        measure = document.createElement('div'),
        i;
    // set classname to div
    measure.className = 'measure';
    // grab the time-key div and append the measure to it
    document.querySelector('.time-key').appendChild(measure);

    // add measure to each sheet row
    for (i = 0; i < sheetElems.length; i += 1) {
        measure = document.createElement('div');
        measure.className = 'measure';
        sheetElems[i].appendChild(measure);
    }
}

function _checkOscillators() {
    'use strict';

    var i,
        key,
        configs,
        steps;
    function getFrequency(i, scale) {
        if (scale === undefined) {
            scale = 0;
        }
        if (i.length !== 0) {
            if (keyMap.hasOwnProperty(i)) {
                if (scale) {
                    steps = keyMap[i].steps + (scale * 12);
                    return 440 * Math.pow(a, steps);
                }
                return 440 * Math.pow(a, keyMap[i].steps);
            }
        }
        return false;
    }
    function selectedInstrumentConfigs() {
        var selectedInstrument = document.querySelector('.instrument.selected');
        if (selectedInstrument) {
            return JSON.parse(selectedInstrument.dataset.config);
        }
        return false;
    }
    for (i in keys) {
        if (keys.hasOwnProperty(i)) {
            // check if the key is down
            key = keyMap[i] ? document.querySelector('[data-steps="' + keyMap[i].steps + '"]') : false;
            if (keys[i].down === 1) {
                // check if this note is playing
                if (oscillators[i] === undefined) {
                    if (getFrequency(i)) {
                        configs = selectedInstrumentConfigs();
                        if (configs) {
                            oscillators[i] = audioContext.createOscillator();
                            oscillators[i].type = configs.type;
                            oscillators[i].frequency.value = getFrequency(i, configs.scale);
                            oscillators[i].connect(audioContext.destination);
                            oscillators[i].start();
                            if (key) {
                                key.className = key.className + ' playing';
                            }
                        }
                    }
                }
            } else {
                if (key) {
                    key.className = key.className.replace(' playing', '');
                }
                if (oscillators[i] !== undefined) {
                    oscillators[i].stop();
                    delete oscillators[i];
                }
            }
        }
    }
}

function sheet_click_handler(e) {
    'use strict';

    var rect = e.target.getBoundingClientRect(),
        HTML = {
            DIV: document.createElement('div')
        },
        p;
    HTML.DIV.className = 'note';
    if (rect.y === undefined) {
        HTML.DIV.style.top = (5 * Math.round((e.clientY - rect.top) / 5)) + 'px';
        HTML.DIV.style.left = (25 * Math.round((e.clientX - rect.left) / 25)) + 'px';
    } else {
        HTML.DIV.style.top = (5 * Math.round((e.clientY - rect.y) / 5)) + 'px';
        HTML.DIV.style.left = (25 * Math.round((e.clientX - rect.x) / 25)) + 'px';
    }

    p = (parseInt(HTML.DIV.style.top.replace('px', ''), 10) / 40);

    switch (p) {
    case 0:
        HTML.DIV.dataset.step = 7;
        break;
    case 0.125:
        HTML.DIV.dataset.step = 5;
        break;
    case 0.25:
        HTML.DIV.dataset.step = 3;
        break;
    case 0.375:
        HTML.DIV.dataset.step = 2;
        break;
    case 0.5:
        HTML.DIV.dataset.step = 0;
        break;
    case 0.625:
        HTML.DIV.dataset.step = -2;
        break;
    case 0.75:
        HTML.DIV.dataset.step = -4;
        break;
    case 0.875:
        HTML.DIV.dataset.step = -5;
        break;
    }

    e.target.appendChild(HTML.DIV);
}
sheet.addEventListener('click', sheet_click_handler);

function sheet_rightclick_handler(e) {
    'use strict';
    e.preventDefault();

    if (e.target.className === 'note') {
        e.target.parentElement.removeChild(e.target);
    }
}
sheet.addEventListener('contextmenu', sheet_rightclick_handler);

function sheet_mousemove_handler(e) {
    'use strict';

    var rect = sheet.getBoundingClientRect();

    if (mouse.className.indexOf('active') === -1) {
        mouse.className = mouse.className + ' active';
    }

    if (rect.y === undefined) {
        mouse.style.top = (5 * Math.round((e.clientY - rect.top) / 5)) + 'px';
        mouse.style.left = (25 * Math.round((e.clientX - rect.left) / 25)) + 'px';
    } else {
        mouse.style.top = (5 * Math.round((e.clientY - rect.y) / 5)) + 'px';
        mouse.style.left = (25 * Math.round((e.clientX - rect.x) / 25)) + 'px';
    }
}
sheet.addEventListener('mousemove', sheet_mousemove_handler);

function sheet_mouseout_handler() {
    'use strict';

    if (mouse.className.indexOf('active') > -1) {
        mouse.className = mouse.className.replace(' active', '');
    }
}
sheet.addEventListener('mouseout', sheet_mouseout_handler);

function window_keydown_handler(e) {
    'use strict';

    if (keys[e.keyCode] === undefined) {
        keys[e.keyCode] = { keyCode: e.keyCode };
    }
    if (keys[e.keyCode].down !== 1) {
        keys[e.keyCode].down = 1;
    }
    _checkOscillators();
}
window.addEventListener('keydown', window_keydown_handler);

function window_keyup_handler(e) {
    'use strict';

    if (keys[e.keyCode] !== undefined && keys[e.keyCode].down !== 0) {
        keys[e.keyCode].down = 0;
    }
    _checkOscillators();
}
window.addEventListener('keyup', window_keyup_handler);

function window_onload_handler() {
    'use strict';

    gain.connect(audioContext.destination);

    gain.gain.value = 1;
}
window.onload = window_onload_handler;