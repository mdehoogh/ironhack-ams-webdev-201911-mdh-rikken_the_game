
function setInfo(info){
    document.getElementById('info').innerHTML=info;
}
function clearInfo(){
    document.getElementById('info').innerHTML="";
}

function capitalize(str){return(str.length>0?str[0].toUpperCase()+str.slice(1):"");}

const PAGES=["page-rules","page-settings","page-setup-game","page-bidding","page-trump-choosing","page-partner-choosing","page-play-reporting","page-playing","page-finished"];

const SUITE_COLORS=["red","black"];

var currentPage; // the current page

var rikkenTheGame=null; // the game (engine) in charge of managing playing the game

var currentPlayer=null;

var bidderCardsElement=document.getElementById("bidder-cards");
function toggleBidderCards(event){
    if(event.currentTarget.value.length>0){
        event.currentTarget.innerHTML="Verberg kaarten";
        bidderCardsElement.innerHTML=event.currentTarget.value;
        event.currentTarget.value="";
    }else{
        event.currentTarget.innerHTML="Toon kaarten";
        event.currentTarget.value=bidderCardsElement.innerHTML;
        bidderCardsElement.innerHTML="";
    }
}
/**
 * clears the bid table
 * to be called with every new game
 */
function clearBidTable(){
    let bidTable=document.getElementById("bids-table").querySelector("tbody");
    for(let bidTableRow of bidTable.children)
        for(let bidTableColumn of bidTableRow.children)
            bidTableColumn.innerHTML="";
}
/**
 * shows the given trick
 * @param {*} trick 
 */
function showTrick(trickObjects){
    console.log("Showing trick objects: "+trickObjects+".");
    // the trick object contains the cards played by name
    for(let trickLabel of document.getElementsByClassName('trick')){
        let trickObjectIndex=parseInt(trickLabel.getAttribute("data-trick-index"));
        if(trickObjectIndex>=0&&trickObjectIndex<trickObjects.length){
            let trickObject=trickObjects[trickObjectIndex];
            trickLabel.style.color=SUITE_COLORS[trickObject.card.suite%2]; // in the right color
            // showing the name is not necessary per se
            trickLabel.innerHTML=/*trickObject.name+": "+*/trickObject.card.getTextRepresentation();
            trickLabel.style.display="initial";
        }else
            trickLabel.style.display="none";
    }
}
function askForCard(){
    // I guess I should place the cards of the current player on screen
    for(let cardButton of document.getElementsByClassName('card')){
        let cardIndex=parseInt(cardButton.getAttribute("data-card-index"));
        let card=(cardIndex<currentPlayer._cards.length?currentPlayer._cards[cardIndex]:null);
        cardButton.style.display=(card?"initial":"none");
        if(card){
            cardButton.style.color=SUITE_COLORS[card.suite%2]; // alternating suite colors
            cardButton.value=card.getTextRepresentation();
        }
    }
}

class OnlinePlayer extends Player{
    constructor(name){
        super(name);
    }
    // make a bid is called with 
    makeABid(playerBidsObjects,possibleBids){
        // debugger
        currentPlayer=this; // remember the current player
        setInfo(this.name+" moet nu bieden!");
        if(currentPage!="page-bidding")setPage("page-bidding"); // JIT to the right page
        console.log("Possible bids player '"+this.name+"' could make: ",possibleBids);
        //setInfo("Maak een keuze uit een van de mogelijke biedingen.");
        document.getElementById("bidder").innerHTML=this.name;
        bidderCardsElement.innerHTML="";
        document.getElementById("toggle-bidder-cards").value=this.getTextRepresentation("<br>");
        document.getElementById("toggle-bidder-cards").innerHTML="Toon kaarten";
        // only show the buttons
        for(let bidButton of document.getElementsByClassName("bid"))
            bidButton.style.display=(possibleBids.indexOf(parseInt(bidButton.getAttribute('data-bid')))>=0?"initial":"none");
        // show the player bids in the body of the bids table
        let bidTable=document.getElementById("bids-table").querySelector("tbody");
        if(playerBidsObjects)
        for(let player=0;player<playerBidsObjects.length;player++){
            let playerBidsObject=playerBidsObjects[player];
            let playerBidsRow=bidTable.children[player];
            playerBidsRow.children[0].innerHTML=capitalize(playerBidsObject.name); // write the name of the player
            let bidColumn=0;
            // write the bids (we have to clear the table with every new game though)
            playerBidsObject.bids.forEach((playerBid)=>{playerBidsRow.children[++bidColumn].innerHTML=playerBid;});
            // replacing: bidTable.children[player].children[1].innerHTML=playersBids[bid].join(" ");
        }
    }
    chooseTrumpSuite(suites){
        setPage("page-trump-choosing");
        // iterate over the trump suite buttons
        for(let suiteButton of document.querySelectorAll(".suite.trump"))
            suiteButton.style.visibility=(suites.indexOf(parseInt(suiteButton.getAttribute('data-suite')))<0?"hidden":"visible");
    }
    choosePartnerSuite(partnerRankName){
        setPage("page-partner-choosing");
        for(let suiteButton of document.querySelectorAll("suite.partner"))
            suiteButton.style.visibility=(suites.indexOf(parseInt(suiteButton.getAttribute('data-suite')))<0?"hidden":"visible");
        document.getElementById('partner-rank').innerHTML=partnerRankName;
    }
    playACard(trickObjects){
        currentPlayer=this;
        this._card=null; // get rid of any currently card
        console.log("ONLINE >>> Player '"+this.name+"' should play a card!");
        showTrick(trickObjects);
        askForCard();
    }
    // setter to set the trump and partner suite once the corresponding button is clicked
    set trumpSuite(trumpSuite){
        this._trumpSuite=trumpSuite;
        this.trumpSuiteChosen();
    }
    set partnerSuite(partnerSuite){
        this._partnerSuite=partnerSuite;
        this.partnerSuiteChosen();
    }
    setCardIndex(cardIndex){
        if(cardIndex>=0&&cardIndex<this.numberOfCards)
            this.setCard(this._cards[cardIndex]);
        else
            alert("Invalid card index "+String(cardIndex)+".");
    }
}

// button click event handlers
/**
 * clicking a bid button registers the chosen bid with the current player 
 * @param {*} event 
 */
function bidButtonClicked(event){
    let bid=parseInt(event.currentTarget.getAttribute("data-bid"));
    console.log("Bid chosen: ",bid);
    currentPlayer.setBid(bid); // the value of the button is the made bid
}
/**
 * clicking a trump suite button registers the chosen trump suite with the current player 
 * @param {*} event 
 */
function trumpSuiteButtonClicked(event){
    // either trump or partner suite selected
    let trumpSuite=event.currentTarget.getAttribute("data-suite");
    console.log("Trump suite "+trumpSuite+" chosen.");
    currentPlayer.trumpSuite=trumpSuite;
}
/**
 * clicking a partner suite button registers the chosen partner suite with the current player 
 * @param {*} event 
 */
function partnerSuiteButtonClicked(event){
    // either trump or partner suite selected
    let partnerSuite=event.currentTarget.getAttribute("data-suite");
    console.log("Partner suite "+partnerSuite+" chosen.");
    currentPlayer.partnerSuite=partnerSuite;
}
/**
 * clicking a partner suite button registers the chosen partner suite with the current player 
 * @param {*} event 
 */
function cardButtonClicked(event){
    currentPlayer.setCardIndex(event.currentTarget.getAttribute("data-card-index"));
}

class OnlineRikkenTheGameEventListener extends RikkenTheGameEventListener{
    stateChanged(fromstate,tostate){
        switch(tostate){
            case IDLE:
                setInfo("Een spel is aangemaakt.");
                break;
            case DEALING:
                setInfo("De kaarten worden geschud en gedeeld.");
                break;
            case BIDDING:
                // when moving from the DEALING state to the BIDDING state clear the bid table
                // ALTERNATIVELY this could be done when the game ends
                // BUT this is a bit safer!!!
                if(fromstate===DEALING)clearBidTable();
                ////// let's wait until a bid is requested!!!! setPage("page-bidding");
                break;
            case PLAYING:
                // initiate-playing will report on the game that is to be played!!!
                setPage("page-playing");
                break;
            case FINISHED:
                setPage("page-finished");
                break;
        }
        console.log("ONLINE >>> The state of rikkenTheGame changed to '"+tostate+"'.");
    }
    errorOccurred(error){
        alert("Fout: "+error);
    }
}
var onlineRikkenTheGameEventListener=new OnlineRikkenTheGameEventListener();

function setPage(newPage){
    currentPage=newPage;
    console.log("Current page: '"+currentPage+"' - Requested page: '"+newPage+"'.");
    // NOTE not changing currentPage to page until we have done what we needed to do
    PAGES.forEach(function(_page){
        let showPage=(_page===currentPage);
        console.log((showPage?"Showing ":"Hiding ")+" '"+_page+"'.");
        let pageElement=document.getElementById(_page);
        if(pageElement){
            pageElement.style.visibility=(showPage?"visible":"hidden");
            if(showPage){
                switch(PAGES.indexOf(_page)){
                    case 0:
                        {
                            setInfo("Stel de spelregels in.");
                        }
                        break;
                    case 1:
                        {
                            setInfo("Kies de speelwijze.");
                        }
                        break;
                    case 2:
                        {
                            setInfo("Vul de namen van de spelers in. Een spelernaam is voldoende.");
                        }
                        break;
                    case 3:
                        {
                            setInfo("Wacht om de beurt op een verzoek tot het doen van een bod.");
                            // did the players change? then we create a new rikkenTheGame
                        }
                    break;
                    case 4:
                        {
                            setInfo("Wacht op het verzoek tot het opgeven van de troefkleur en/of de aas/heer.");
                        }
                        break;
                    case 5:
                        {
                            setInfo("Wacht op het verzoek tot het (bij)spelen van een kaart.");
                        }
                        break;
                }
            }    
        }else
            alert("BUG: Unknown page '"+_page+"' requested!");
    });
}
function nextPage(event){
    let pageIndex=PAGES.indexOf(currentPage);
    setPage(PAGES[(pageIndex+1)%PAGES.length]);
}
function cancelPage(event){
    // go one page back
    let pageIndex=PAGES.indexOf(currentPage);
    setPage(PAGES[(pageIndex+PAGES.length-1)%PAGES.length]);
}
/**
 * to be called when the new-players button is clicked, to start a new game with a new set of players
 */
function newPlayers(){
    let players=[];
    let noPlayerNames=true;
    // iterate over all player input fields
    for(playerNameInput of document.getElementsByClassName("player-name-input")){
        if(playerNameInput.value.length>0){
            noPlayerNames=false;
            players.push(new OnlinePlayer(playerNameInput.value));
        }else
        if(players.length<4)
            players.push(null);
    }
    if(noPlayerNames){
        setInfo("Geen spelernamen opgegeven. Heb tenminste een spelernaam nodig!");
        return;
    }
    // try to create a game
    rikkenTheGame=null;
    try{
        rikkenTheGame=new RikkenTheGame(players,onlineRikkenTheGameEventListener);
        rikkenTheGame.start();
    }catch(error){
        setInfo("De volgende fout is opgetreden: "+error);
    }
}

window.onload=function(){
    // allow clearing the info by clicking it!!
    document.getElementById('info').onclick=clearInfo;
    // attach nextPage and cancelPage to any of the buttons in page-button-groups
    ///let pageButtonGroups=document.getElementsByClassName("page-button-group");
    /*
    for(let pageButtonGroup of pageButtonGroups){
        let pageButtons=pageButtonGroup.querySelectorAll("input[type=button]");
        for(let pageButton of pageButtons){
            if(pageButton.classList.contains("next"))pageButton.onclick=nextPage;else
            if(pageButton.classList.contains("cancel"))pageButton.onclick=cancelPage;else
            if(pageButton.classList.contains("new-players"))pageButton.onclick=newPlayers;
        };
    };
    */
    for(let nextButton of document.getElementsByClassName('next'))nextButton.onclick=nextPage;
    for(let cancelButton of document.getElementsByClassName('cancel'))cancelButton.onclick=cancelPage;
    for(let newPlayersButton of document.getElementsByClassName('new-players')){
        console.log("New players!");
        newPlayersButton.onclick=newPlayers;
    }
    // attach an onclick event handler for all bid buttons
    for(let bidButton of document.getElementsByClassName("bid"))bidButton.onclick=bidButtonClicked;
    document.getElementById("toggle-bidder-cards").onclick=toggleBidderCards;
    // event handler for selecting a suite
    for(let suiteButton of document.querySelectorAll(".suite.trump"))suiteButton.onclick=trumpSuiteButtonClicked;
    for(let suiteButton of document.querySelectorAll(".suite.partner"))suiteButton.onclick=partnerSuiteButtonClicked;
    // clicking card buttons
    for(let cardButton of document.getElementsByClassName("card"))cardButton.onclick=cardButtonClicked;
    this.setPage(PAGES[0]);
};