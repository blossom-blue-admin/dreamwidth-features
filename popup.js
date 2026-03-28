let settings = {}
let unsavedSettings = {
  "textMaps" : [],
  "shortcutMaps" : []
}
let warnings = [];
let maxIndex = 0;

function setupTextMaps(codemap) {
  if (!codemap) codemap = {};
  codemap.txt = {
    'start': '<span style="font-family:courier new, monospace">',
    'end': '</span>',
    'display':true
  };
  codemap.action = {
    'start': '<small>[',
    'end': ']</small>',
    'display':true
  };
  codemap.italic = {
    'start': '<em>',
    'end': '</em>',
    'display':true
  };
  codemap.mdash = {
    'start': '&mdash;',
    'end': '',
    'display':true
  };
  codemap.bold = {
    'start': '<strong>',
    'end': '</strong>',
    'display':true
  };
  codemap.h4 = {
    'start': '<h4>',
    'end': '</h4>',
    'display':true
  };
  codemap.h5 = {
    'start': '<h5>',
    'end': '</h5>',
    'display':true
  };
  codemap.li = {
    'start': '<li>',
    'end': '</li>',
    'display':true
  };
  codemap.ul = {
    'start': '<ul>',
    'end': '</ul>',
    'display':false
  };
  codemap.link = {
    'start': '<a href="">',
    'end': '</a>',
    'display':true
  };
  codemap.quote = {
    'start': '<blockquote>',
    'end': '</blockquote>',
    'display':true
  };
  return codemap;
}

function setupShortcutMaps(shortcutmap) {
  if(!shortcutmap) shortcutmap = {};
  shortcutmap.i = {textMap :'italicbtn',modifiers:{Control:true}};
  shortcutmap.I = {textMap :'italicbtn',modifiers:{Control:true}};
  shortcutmap.b = {textMap :'boldbtn',modifiers:{Control:true}};
  shortcutmap.B = {textMap :'boldbtn',modifiers:{Control:true}};
  shortcutmap.l = {textMap :'actionbtn',modifiers:{Control:true}};
  shortcutmap.L = {textMap :'actionbtn',modifiers:{Control:true}};
  return shortcutmap;
}


/* initialise variables */
//
// let inputTitle = document.querySelector('.new-note input');
// let inputBody = document.querySelector('.new-note textarea');
//
// let noteContainer = document.querySelector('.note-container');
//
//
// let clearBtn = document.querySelector('.clear');
// let addBtn = document.querySelector('.add');
//
// /*  add event listeners to buttons */
//
// addBtn.addEventListener('click', addNote);
// clearBtn.addEventListener('click', clearAll);

/* generic error handler */
function onError(error) {
  console.log(error);
}

function loadDefaultTextMaps(){
  const textMap = settings.textMaps;
  settings.textMaps = setupTextMaps(textMap);
}

function loadDefaultShortcutMaps(){
  const shortcutmap = settings.shortcutMaps;
  settings.shortcutMaps = setupShortcutMaps(shortcutmap);
}

function processTextMapForm(form,valid,allInvalid){

  const invalid = allInvalid.textMaps;
  if(!valid || !invalid || !form ||  !Array.isArray(invalid)){
    throw new Error("Invalid arguments passed to processTextMapForm");
  }
  form = $(form);
  const data = form.serializeArray();
  const t = {};
  for(pair of data){
    t[pair.name] = pair.value;
  }
  const [name,start,end,display,index] = [t.name,t.start,t.end,t.display,t.index];
  console.log({index});
  let warning = false;
  if(!name || !typeof name === "string" || name.length === 0){
    warning = "button must have a name";
    invalid.push({"name":"","startText":start,"endText":end,"display":display,"error":"button must have a name","element":form});
  } else if (name in valid) {

    warning = "button name already used";
    invalid.push({"name":name,"startText":start,"endText":end,"error":"button name already used","element":form});
  } else {
    const dispVal = display ? true : false;
    valid[name] = {"start":start,"end":end,"display":display,"index":index};
  }
  if(warning){
    warnings.push(warning);
    const warningAdd = $("<div class='form-warning'></div>").text(warning);
    form.append(warningAdd);
  }
  allInvalid.textMaps = invalid;
}

function processShortcutMapForm(form,valid,allInvalid,textMaps){
  const invalid = allInvalid.shortcutMaps;
  if(!valid || !invalid || !form ||  !Array.isArray(invalid)){
    throw new Error("Invalid arguments passed to processTextMapForm");
  }
  form = $(form);
//  console.log(`form: "${form.text()}"`);
  const data = form.serializeArray();
  const t = {};
  t.modifiers = {};
  for(pair of data){
//  console.log(`name = ${pair.name}`);
//  console.log(`value = ${pair.value}`);
  	if(pair.name === "modifier"){
  		t.modifiers[pair.value] = true;
  		continue;
  	}
    t[pair.name] = pair.value;
  }
  
  form.find(".form-warning").remove();

 //  console.log(`t ${JSON.stringify(t)}`);
  const [key,textMap,modifiers] = [t.shortcutKey,t.textMap,t.modifiers];
  
  let warning = false;

//   console.log(`key ${JSON.stringify(key)}`);
//   console.log(`textMap ${JSON.stringify(textMap)}`);
  if(!key || !typeof key === "string" || key.length !== 1){
    warning = "keyboard shortcut must be a single key";
    invalid.push({"key":key,"textMap":textMap,"error":warning, "element":form});
  } else if (key in valid) {
    warning = "key already used";
    invalid.push({"key":key,"textMap":textMap,"error":"key already used","element":form});
  } else if (!textMap || !textMap.substring(0,textMap.length-3) in textMaps) {
    warning = "does not match a valid button";
    invalid.push({"key":key,"textMap":textMap,"error":"keyboard shortcut must match a valid button","element":form});
  } else if (modifiers.length ===0) {
    warning = "no modifier key selected";
    invalid.push({"key":key,"textMap":textMap,"error":warning,"element":form});
  } else {
    valid[key] = {"textMap":textMap,"modifiers":modifiers};
  }
  if(warning){
    warnings.push(warning);
    const warningAdd = $("<div class='form-warning'></div>").text(warning);
    form.append(warningAdd);
  }
  allInvalid.shortcutMaps = invalid;
}

async function storeSettings(){
    // Await the fetch call and assign the response to a variable
    const saveSettings = {"textMaps":{},"shortcutMaps":{}};
    const errorDisplay = $("#error-display").text("");
    warnings = [];
    unsavedSettings = {
        "textMaps" : [],
        "shortcutMaps" : []
      }
      const textMaps = $("#textMaps form");
      const shortcutMaps = $("#shortcutMaps form");
     // console.log(`${textMaps.length}`);
      textMaps.each(function () {
        processTextMapForm(this,saveSettings.textMaps,unsavedSettings);
      });
   //   console.log(`shortcutmaps len ${shortcutMaps.length}`);
      shortcutMaps.each(function () {
  //      console.log("here");
  	//	console.log($(this).text());
        processShortcutMapForm(this,saveSettings.shortcutMaps,unsavedSettings,saveSettings.textMaps);
      });
  //    console.log(`saveSettings ${JSON.stringify(saveSettings)}`);
  //    console.log(`unsavedSettings ${JSON.stringify(unsavedSettings)}`);

  try {
      await chrome.storage.local.set({ ["settings"] : JSON.stringify(saveSettings) });
//     console.log("settings saved");
   } catch (error) {
//     // Handle any errors that occurred during the fetch or processing
//     console.error('Could not save settings:', error);
      errorDisplay.append($("<div class='error'></div>").text("save failed :("));
   }
   
   if(warnings.length > 0){
      displayWarning(`There are issues with ${warnings.length} items, see below for details.`);
   }
}

function displayWarning(warning){
	$("#error-display").append($("<div class='error'></div>")
        .text(`${warning}`));
}
// if sett then load to sett, else load to settings
function loadDefaults(sett){
  console.log("loading defaults");
  let addTo = sett ?? settings ?? {};
  let addToText = addTo.textMaps ?? {};
  let addToShortcut = addTo.textShortcuts ?? {};
  setupTextMaps(addToText);
  setupShortcutMaps(addToShortcut);
  if(!sett){
    settings = settings ?? {};
    settings.textMaps = addToText;
    settings.shortcutMaps = addToShortcut;
  } else {
    sett.textMaps = sett.textMaps ?? addToText;
    sett.shortcutMaps = sett.shortcutMaps ?? addToShortcut;
  }
}

function updateTextMapDropdowns(e){
	const changed = $(this);
	const index = changed.parent().prevAll().length;
//	console.log({index});
	$(`select[name='textMap'] option:nth-child(${index+1})`).text(changed.val()).val(`${changed.val()}btn`);
}

function removeFromDropdowns(toRemove){
	 toRemove = $(toRemove);
	const index = toRemove.prevAll().length;
	$(`select[name='textMap'] option:nth-child(${index+1})`).remove();
	
}

function updateIndex(e){
  const textMapContainer = $("#textMaps");
  var $listItems = textMapContainer.children('form').get(); // Convert jQuery object to a native JavaScript array

    // Sort the native JavaScript array using the data attribute values
    $listItems.sort(function(a, b) {
        var compA = parseInt($(a).find("[name='index']").val(), 10);
        var compB = parseInt($(b).find("[name='index']").val(), 10);
        return compA - compB; // Ascending sort for numbers
    });
 $.each($listItems, function(idx, item) {
        $(textMapContainer).append(item);
    });
}

function makeNewTextMapForm(name,text){
 // console.log(`name '${name}', text '${JSON.stringify(text)}'`);
 const index = text && text.index !== undefined && text.index !== null ? parseInt(text.index) : parseInt(maxIndex) + 1 ;
  maxIndex = maxIndex < index ? index : maxIndex;
  const newForm = $(`<form class='textMap' data-order="${index}"></form>`);
  if(!name) name = "";
  
  const nameInput = $(`<input type="text" name="name">`).val(name).on("change",updateTextMapDropdowns);
  newForm.append(nameInput);
  if(!text) text = {"start":"","end":""};
  newForm.append($(`<input type="text" name="start">`).val(text.start));
  newForm.append($(`<input type="text" name="end">`).val(text.end));
  const indInput = $(`<input type="number" value='${index}' name='index'>`)
    .on("change",updateIndex);
  newForm.append(indInput);
  const isDisplay = text.display ? " checked" : "";
  const displayBox = $(`<input type="checkbox" name="display" value="display" ${isDisplay}>`);
  newForm.append(displayBox);
  newForm.append( makeNewRemoveButton("textMap"));

 // console.log(`newform '${JSON.stringify(newForm)}'`);
  return newForm;
}

function makeNewTextMapDropdown(selected){
//	console.log(`selected ${selected} '${JSON.stringify(selected)}'`);
  if(!settings.textMap) settings.textMap = {};
  const newSelect = $(`<select name="textMap"></select>`);
  for(const [key,value] of Object.entries(settings.textMaps)){
    const isSelected = `${key}btn` === selected ? " selected" : "";
    newSelect.append($(`<option value="${key}btn"${isSelected}>${key}</option>`));
  }
  
  return newSelect;
}


function makeNewModifierCheckboxes(selected){
  const newSelect = $(`<div class="modifiers"></div>`);
  const modifiers = {
  	"Control":"Ctrl",
  	"Alt":"Alt",
  	"Shift":"Shift",
  	"Meta":"Command"
  }
  if(!selected || selected.length === 0){
  	selected = {"Control":true};
  	
  }
  for(const [key,value] of Object.entries(modifiers)){
  //	console.log(`key = '${key}'
  //	value = '${value}'
  //	value in selected  = '${value in selected }'`)
    const isSelected = key in selected ? " checked" : "";
    newSelect.append($(`<label><input type="checkbox" name="modifier" value="${key}" ${isSelected}>${value}</label>`));
  }
  return newSelect;
}

function makeNewShortcutMapForm(name,data){
//console.log(data.textMap);
//console.log(data.modifiers);
//console.log(JSON.stringify(data));
  const newForm = $("<form class='shortcutMap'></form>");
  if(!name) name = "";
  newForm.append($(`<input type="text" name="shortcutKey" value="${name}">`));
  if(!data) data = {textMap:"",modifier:{}};
  
//console.log(JSON.stringify(data));
  newForm.append(makeNewTextMapDropdown(data.textMap));
  newForm.append(makeNewModifierCheckboxes(data.modifiers));
  newForm.append(makeNewRemoveButton());
  return newForm;
}

function makeNewRemoveButton(textMap){
//	console.log({textMap});
	if (textMap){
//	console.log("in text map");
		return $("<button class='remove-button'>x</button>").on("click",function (e){
//			console.log("in correct remove");
			const parent = $(this).parent();
			removeFromDropdowns(parent);
			parent.remove();
		});
	}
  return  $("<button class='remove-button'>x</button>").on("click",function(e) {
  
	//		console.log("in wrong remove");
  	const parent = $(this).parent();
    $(this).parent().remove();
  });
}

function displaySettings(){
  const textMapContainer = $("#textMaps").text("");
  //console.log(`settings.textMaps: ${JSON.stringify(settings.textMaps)}`);
  for(const [k,i] of Object.entries(settings.textMaps)){
  //  console.log(`k, i = '${k}','${i}'`);
    textMapContainer.append(makeNewTextMapForm(k,i));
  }
  var $listItems = textMapContainer.children('form').get(); // Convert jQuery object to a native JavaScript array

    // Sort the native JavaScript array using the data attribute values
    $listItems.sort(function(a, b) {
        var compA = parseInt(a.getAttribute('data-order'), 10);
        var compB = parseInt(b.getAttribute('data-order'), 10);
        return compA - compB; // Ascending sort for numbers
    });
 $.each($listItems, function(idx, item) {
        $(textMapContainer).append(item);
    });
  //console.log(`settings.shortcutMaps: ${JSON.stringify(settings.shortcutMaps)}`);
  const shortcutMapContainer = $("#shortcutMaps").text("");
  for(const [k,i] of Object.entries(settings.shortcutMaps)){

//    console.log(`k, i = '${k}','${JSON.stringify(i)}'`);

    shortcutMapContainer.append(makeNewShortcutMapForm(k,i));
  }

}

/* display previously-saved stored notes on startup */
function initialize() {
  let gettingAllStorageItems = chrome.storage.local.get(null);
  gettingAllStorageItems.then((results) => {
 //   console.log(`storage results "${JSON.stringify(results)}"`);
 //   console.log(` settings string "${results.settings}"`);
    const pSettings = JSON.parse(results.settings??"{}");
 //   console.log(`pStorage "${JSON.stringify(pSettings)}"`);

    if(results && results.settings) {
      settings = JSON.parse(results.settings);
    } else {
      loadDefaults();
    }
  //  console.log(`settings: ${JSON.stringify(settings)}`);
    displaySettings();
    $("#save-settings").on("click",(e) => {
      storeSettings();
      saveUseSettings();
    });

    $("#reset-settings").on("click",(e) => {
      settings = undefined;
      loadDefaults();
      displaySettings();

    });
    if((results && results.useButtons && results.useButtons === "yes") || (results && !results.useButtons)){
    	$("#use-buttons").prop("checked",true);
    }
    $("#use-buttons").on("change", (e) =>{
    	if (! $("#use-buttons").prop("checked")) $("#use-shortcuts").prop("checked",false);
    	saveUseSettings();
    	
    });
    
    if((results && results.useShortcuts && results.useShortcuts === "yes") || (results && !results.useShortcuts)){
    	$("#use-shortcuts").prop("checked",true);
    }
    $("#use-shortcuts").on("change", (e) =>{
    	
    	if ( $("#use-shortcuts").prop("checked")) $("#use-buttons").prop("checked",true);
    	saveUseSettings();
    });
	
    if((results && results.useContainerOpen && results.useContainerOpen === "yes") || (results && !results.useContainerOpen)){
    	$("#use-container-open").prop("checked",true);
    }
    $("#use-container-open").on("change", (e) =>{
    	saveUseSettings();
    });
	if((results && results.useRememberMe && results.useRememberMe === "yes") || (results && !results.useRememberMe)){
    	$("#use-remember-me").prop("checked",true);
    }
    $("#use-remember-me").on("change", (e) =>{
    	saveUseSettings();
    });
	
    $("#new-text").on("click",(e) => {
    	$("select[name='textMap']").prepend('<option value="btn"></option>');
      $("#textMaps").prepend(makeNewTextMapForm());
    });

    $("#new-shortcut").on("click",(e) => {
    // 	console.log("fired");
//     	console.log($("#shortcutMaps"));
      $("#shortcutMaps").prepend(makeNewShortcutMapForm());
    });
	$("#clear-text-settings").on("click",function (e){
		$("#textMaps .remove-button").trigger("click");
	});
	
	$("#clear-shortcut-settings").on("click",function (e){
		$("#shortcutMaps .remove-button").trigger("click");
	});
//
//     // notes code
//     let noteKeys = Object.entries(results);
//     for (let [noteKey,value] of noteKeys) {
//
//       let curValue = results[noteKey];
//       displayNote(noteKey,curValue);
//     }
  }, onError);
  // notes code end

}

function saveUseSettings(){
    	const useButtons = $("#use-buttons").prop("checked") ? "yes" : "no";
    	const useShortcuts = $("#use-shortcuts").prop("checked") ? "yes" : "no";
    	const useContainerOpen = $("#use-container-open").prop("checked") ? "yes" : "no";
    	const useRememberMe = $("#use-remember-me").prop("checked") ? "yes" : "no";
    	try {
    		chrome.storage.local.set({useButtons,useShortcuts,useContainerOpen,useRememberMe});
    	} catch {
    		displayWarning("Save not completed. Press save button to retry.");
    	}
}

//initialize();

$(document).ready(async function init() {
  initialize();
});
