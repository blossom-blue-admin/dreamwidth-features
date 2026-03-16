let contextIDs = [];

function onCIDCreated(context,createOpts) {
// 	console.log("context: " +JSON.stringify(context));
// 	console.log("createOpts: " +JSON.stringify(createOpts));
//   	console.log(`New identity's ID: ${context.cookieStoreId}.`);
  	createOpts.cookieStoreId = `${context.cookieStoreId}`;
  	browser.tabs.create(createOpts).catch(() => {
  		browser.tabs.create({ createOpts });
	});
}

function onCIDCreateError(e) {
  	console.error(e);
}

function handleMessage(message, sender, sendResponse) {
   // console.log("Message: " + JSON.stringify(message));
	if(!message || !message.action) return;
	if (message.action === 'openThread') {
		const {url, cookieStoreId, containerName, openInBackground} = message;
		if (!url) return;
		const createOpts = {url};
		if (cookieStoreId){
			createOpts.cookieStoreId = cookieStoreId;
		} else {
			const container = contextIDs.filter((cID) => cID.name === containerName);
    		//console.log("container: " + JSON.stringify(container));
			if(!container || container.length < 1){
				browser.contextualIdentities.create({
					name: `${containerName}`,
					icon: "circle",
					color: "yellow"
				}).then(function (context){onCIDCreated(context,createOpts)}, onCIDCreateError);
			} else {
			//	console.log("container: " + container);
				createOpts.cookieStoreId = container[0].cookieStoreId;
			}
		}
		if (createOpts.cookieStoreId){
			createOpts.active = !openInBackground;
		//	console.log(browser.windows.WINDOW_ID_CURRENT);
			createOpts.windowId = browser.windows.WINDOW_ID_CURRENT;
			browser.tabs.create(createOpts).catch(() => {
			   browser.tabs.create({ url });
			 });
		}
		
	}
//  console.log(`A content script sent a message: ${request.greeting}`);
  sendResponse({ response: contextIDs });
}

browser.runtime.onMessage.addListener(handleMessage);

function docidUpdate(contexts) {
	contextIDs = contexts;
// 	for (const context of contexts) {
// 	//	console.log(`Name: ${context.name}`);
// 	}
}

function onCIDUpdateError(error) {
  console.error(error);
}

function updateContextIDs(){
   browser.contextualIdentities.query({}).then(docidUpdate, onCIDUpdateError);
}
updateContextIDs();
browser.contextualIdentities.onCreated.addListener(updateContextIDs);
browser.contextualIdentities.onRemoved.addListener(updateContextIDs);
browser.contextualIdentities.onUpdated.addListener(updateContextIDs);
