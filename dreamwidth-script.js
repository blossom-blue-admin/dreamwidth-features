/*
Main container open logic and flow adapted with permission from 
https://addons.mozilla.org/en-GB/firefox/addon/dreamwidth-thread-tracker/
*/

//console.log("start");
const SAVE_LINK_CLASS = 'dw-save-link';
let charName = '';
let codemap = {};
let shortcutmap = {};
let dwStrings = {};
let useButtons = false;
let useShortcuts = false;
//let useDisplayStyle = false;
let useStore = false;
let storeData = [];
let storeCount = 0;

function setupMaps(codemap, shortcutmap) {
    codemap.txt = {
        'start': '<span style="font-family:courier new, monospace">',
        'end': '</span>',
        'display':false,
        'index':11
    };
    codemap.action = {
        'start': '<small>[',
        'end': ']</small>',
        'display':false,
        'index':10
    };
    codemap.italic = {
        'start': '<em>',
        'end': '</em>',
        'display':false,
        'index':9
    };
    codemap.mdash = {
        'start': '&mdash;',
        'end': '',
        'display':false,
        'index':8
    };
    codemap.bold = {
        'start': '<strong>',
        'end': '</strong>',
        'display':false,
        'index':7
    };
    codemap.h4 = {
        'start': '<h4>',
        'end': '</h4>',
        'display':false,
        'index':6
    };
    codemap.h5 = {
        'start': '<h5>',
        'end': '</h5>',
        'display':false,
        'index':5
    };
    codemap.li = {
        'start': '<li>',
        'end': '</li>',
        'display':false,
        'index':4
        
    };
    codemap.ul = {
        'start': '<ul>',
        'end': '</ul>',
        'display':false,
        'index':3
    };
    codemap.link = {
        'start': '<a href="">',
        'end': '</a>',
        'display':false,
        'index':2
    };
    codemap.quote = {
        'start': '<blockquote>',
        'end': '</blockquote>',
        'display':false,
        'index':1
    };
    shortcutmap.i = {
        textMap: 'italicbtn',
        modifiers: {
            Control: true
        }
    };
    shortcutmap.I = {
        textMap: 'italicbtn',
        modifiers: {
            Control: true
        }
    };
    shortcutmap.b = {
        textMap: 'boldbtn',
        modifiers: {
            Control: true
        }
    };
    shortcutmap.B = {
        textMap: 'boldbtn',
        modifiers: {
            Control: true
        }
    };
    shortcutmap.l = {
        textMap: 'actionbtn',
        modifiers: {
            Control: true
        }
    };
    shortcutmap.L = {
        textMap: 'actionbtn',
        modifiers: {
            Control: true
        }
    };
}

async function loadDreamwidthSettings() {
    let results = undefined;
    try {
        const gettingStorageItems = chrome.storage.local.get(["useButtons", "useShortcuts","useStore","useDisplayStyle", "settings"]);
        await gettingStorageItems.then((results) => {
            useButtons = (!results.useButtons || results.useButtons === "yes");
            useShortcuts = (!results.useShortcuts && !results.useButtons) ||
                (useButtons && results.useShortcuts === "yes");
            useStore = (!results.useStore || results.useStore === "yes");
            useDisplayStyle = (!results.useDisplayStyle || results.useDisplayStyle === "yes");
            codemap = {};
            shortcutmap = {};
            if (results.settings) {
                const settings = JSON.parse(results.settings);
                codemap = settings.textMaps ?? setupMaps(codemap, {}) ?? {};
                shortcutmap = settings.shortcutMaps ?? setupMaps({}, shortcutmap) ?? {};
            } else {
                setupMaps(codemap, shortcutmap);
            }
            if (results.storeDataCount){
            	for (let i = 0;i < results.storeDataCount;i++){
            		storeData.push(results[`storeData${i}`]);
            	}
            }
        });
    } catch (e) {
        console.log(`Error retrieving Dreamwidth Features extension settings, loading defaults.
 Error: "${e}"`);
        useButtons = true;
        useShortcuts = true;
        useStore = true;
        setupMaps(codemap, shortcutmap);
    }
}

/* text adder functions */

function addStore(){
	
}

function addDWCommentButtons(){

	if ($('#qrform').length > 0) {
		dwStrings.formID = '#qrform';
	} else if ($('#postform').length > 0) {
		dwStrings.formID = '#postform';
	} else {
		return;
	}

	function addText(e) {
		const buttonId = e.currentTarget.id;
        const id = buttonId.substring(0,buttonId.length - 3);
		const code = codemap[$(`#${id}`).text()];
		const sStartTag = code.start;
		const sEndTag = code.end;
		let bDouble = true,
			oMsgInput = $("textarea#body")[0],
			nSelStart = oMsgInput.selectionStart,
			nSelEnd = oMsgInput.selectionEnd,
			sOldText = oMsgInput.value;
		oMsgInput.value = sOldText.substring(0, nSelStart) + (
			bDouble ? sStartTag + sOldText.substring(nSelStart, nSelEnd) + sEndTag : sStartTag
		) + sOldText.substring(nSelEnd);
		oMsgInput.setSelectionRange(
			bDouble ||
			nSelStart === nSelEnd ? nSelStart + sStartTag.length : nSelStart,
			(bDouble ? nSelEnd : nSelStart) + sStartTag.length
		);
		oMsgInput.focus();
	}

	//make the buttons
	function newButton(key) {
        const b = $(`<button type='button'></button>`)
			.prop('id', key + 'btn')
			.text(key)
			.on('click', addText);
        if(codemap[key].display) b.html(codemap[key].start + key + codemap[key].end)
		return b;
	}
	let newDiv = $("#addTextContainer");
	if (!newDiv || newDiv.length === 0) {
		newDiv = $('<div></div>').prop('id', 'addTextContainer');
	} else {
		newDiv.text("");
	}
	for (let key in codemap) {
		newDiv.prepend(newButton(key));
	};
	$(`${dwStrings.formID} .qr-markup`).append(newDiv);
}

function addShortcuts(){
	$(document).on(
		'keydown',
		function(e) {
			const pressed = e.key;
			if (pressed in shortcutmap) {
				e = e.originalEvent;
				const modifiers = shortcutmap[pressed].modifiers;
				let d = 0;
				const pressedMods = {
					Control: e.getModifierState("Control"),
					Alt: e.getModifierState("Alt"),
					Shift: e.getModifierState("Shift"),
					Meta: e.getModifierState("Meta")
				}
				for (const mod in modifiers) {
					d++;
					if (!pressedMods[mod]) return;
				}
				if (d !== (pressedMods.Control +
						pressedMods.Alt +
						pressedMods.Shift +
						pressedMods.Meta)) {
					return;
				}
				e.preventDefault();
				$(`#${shortcutmap[pressed].textMap}`).click();
				return false
			}
		}
	);

}

function main() {
     loadDreamwidthSettings().then((e) => {
        if (useButtons) addDWCommentButtons();
        if (useShortcuts) addShortcuts();
        if (useStore) addStore();
    }, (e) => console.log(e));
}

$(document).ready(async function init() {
    main();
});