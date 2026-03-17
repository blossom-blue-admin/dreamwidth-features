/*
Main container open logic and flow adapted with permission from 
https://addons.mozilla.org/en-GB/firefox/addon/dreamwidth-thread-tracker/
*/

//console.log("start");
const SAVE_LINK_CLASS = 'dw-save-link';
let charName = '';
let useConstainerOpen = false;


/* Gmail functions */
function getThreadAnchor(el) {
    const thread = $(el).find('a').filter(
        function() {
            const text = $(this).text().trim().toLowerCase();
            return (
                    text.startsWith('view the thread') ||
                    text.startsWith('reply to this message') ||
                    text.startsWith('view entry titled')
                ) &&
                $(this).attr('href') &&
                $(this).attr('href').includes('.dreamwidth.org');
        }
    );
    return thread;
}

function extractEntryName(el) {
    const text = el.innerText ||
        '';
    const m = text.match(/Dreamwidth entry\s+"([^"]+)"/i);
    return m ? m[1] : '';
}

function makeLink(threadAnchor, charName) {
    const save = $('<a></a>');
    save.attr('href', '#').text('open in ' + charName)
        .attr('dwlink', threadAnchor.eq(0).attr('href'))
        .attr('charName', charName)
        .addClass(`${ SAVE_LINK_CLASS }`);
    save.on(
        'click',
        function(e) {
            e.preventDefault();
            doOpenClick(this, e);
            return false;
        }
    );
    return save;
}

function findMessageBlocks() {
    return $('div.adn, div.ii.gt');
}

function findCharacterLabel(el) {
    let toAddr = $(el).find('div.ajw');
    const text = toAddr.text() ||
        '';
    const m = text.match(/(?:to (?:[\w\.\-]+\+)?([\w\.\-]+))/i);
    return m ? m[1] : '';
}

function handleResponse(message) {
    if (message.response) console.log(`Message from the background script: ${ message.response }`);
}

function handleError(error) {
    console.log(`Error: ${ error }`);
}

function doOpenClick(clicked, e) {
    const dwlink = $(clicked).attr('dwlink');
    const charName = $(clicked).attr('charName');
    const sending = chrome.runtime.sendMessage({
        action: 'openThread',
        url: `${ dwlink }`,
        containerName: `${ charName }`,
        openInBackground: e.metaKey
    });
    sending.then(handleResponse, handleError);
}

function insertSaveLink(msg) {
    const threadAnchor = getThreadAnchor(msg)
    if (!threadAnchor || threadAnchor.length === 0) return;
    if ($(msg).find(`.${ SAVE_LINK_CLASS }`).length > 0) return; //already added links
    let headerDate = $(msg).find('.g3') ||
        $(msg).find('time');
    charName = charName + findCharacterLabel(msg);
    const save = makeLink(threadAnchor, charName);
    headerDate.add(threadAnchor).after(save);
}

async function loadContainerOpenSettings() {
    try {
        const gettingStorageItems = chrome.storage.local.get(["useContainerOpen"]);
        await gettingStorageItems.then((results) => {
            if (!results.useContainerOpen || results.useContainerOpen === "yes") {
                useContainerOpen = true;
            } else {
            	useContainerOpen = false;
            }
        })
    } catch (e) {
        console.log(`Error retrieving Dreamwidth Features extension settings, loading default.
Error: "${e}"`);
        useContainerOpen = true;

    }

}


function main() {
    let results = undefined;
	
    loadContainerOpenSettings().then((e) => {
        if (!useContainerOpen) return;
        
		let scanTimer = null;
		const throttle = (fn, delay = 500) => {
			clearTimeout(scanTimer);
			scanTimer = setTimeout(fn, delay);
		};

		function rescan() {
			charName = '';
			findMessageBlocks().each(function() {
				insertSaveLink(this)
			});
		}
		const observer = new MutationObserver(() => throttle(rescan, 400));
		observer.observe(document.documentElement, {
			childList: true,
			subtree: true
		});
		rescan();
        
    });
}

$(document).ready(async function init() {
    main();
});