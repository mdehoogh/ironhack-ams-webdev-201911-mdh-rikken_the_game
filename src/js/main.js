
function setInfo(info){
    document.getElementById('info').innerHTML=info;
}
function clearInfo(){
    document.getElementById('info').innerHTML="";
}

function capitalize(str){return(str.length>0?str[0].toUpperCase()+str.slice(1):"");}

const PAGES=["page-rules","page-settings","page-setup-game","page-bidding","page-trump-choosing","page-partner-choosing","page-play-reporting","page-playing","page-finished"];

///// moved to CSS: const SUITE_COLORS=["red","black"];

var currentPage; // the current page

var rikkenTheGame=null; // the game (engine) in charge of managing playing the game

var currentPlayer=null;

const PLAYMODE_SERIOUS=0,PLAYMODE_DEMO=1;

var playmode=1;

// demo mode we use predefined player names
var DEFAULT_PLAYERS=[["","","","",""],["Marc","Jurgen","Monika","Anna",""]];

var bidderCardsElement=document.getElementById("bidder-cards");

function initializeBidderSuitecardsButton(){
    let button=document.getElementById("bidder-suitecards-button");
    button.addEventListener("click",function(){
        // console.log("Bidder suitecards button clicked!");
        this.classList.toggle("active-bid-button"); // a ha, didn't know this
        document.getElementById("bidder-suitecards").style.display=(this.classList.contains("active-bid-button")?"block":"none");
    });
}
/* replacing:
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
*/
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
function showTrick(trickObjects,playSuite){
    console.log("Showing trick objects: "+trickObjects+".");
    document.getElementById("play-suite").innerHTML=(playSuite>=0?"Er wordt "+SUITE_NAMES[playSuite]+" gespeeld!":"Slag "+String(rikkenTheGame.numberOfTricksPlayed+1));
    // the trick object contains the cards played by name
    for(let trickLabel of document.getElementsByClassName('trick')){
        let trickObjectIndex=parseInt(trickLabel.getAttribute("data-trick-index"));
        if(trickObjectIndex>=0&&trickObjectIndex<trickObjects.length){
            let trickObject=trickObjects[trickObjectIndex];
            trickLabel.classList.add(SUITE_NAMES[trickObject.card.suite]);
            /// replacing: trickLabel.style.color=SUITE_COLORS[trickObject.card.suite%2]; // in the right color
            // showing the name is not necessary per se
            trickLabel.innerHTML=/*trickObject.name+": "+*/trickObject.card.getTextRepresentation();
            trickLabel.style.display="initial";
        }else
            trickLabel.style.display="none";
    }
    console.log("Trick shown!");
}
/* obsolete now:
function askForCard(){
    // I guess I should place the cards of the current player on screen
    for(let cardButton of document.getElementsByClassName('card')){
        let cardIndex=parseInt(cardButton.getAttribute("data-card-index"));
        let card=(cardIndex<currentPlayer._cards.length?currentPlayer._cards[cardIndex]:null);
        cardButton.style.display=(card?"initial":"none");
        if(card){
            cardButton.classList.add(SUITE_NAMES[card.suite]);
            // replacing: cardButton.style.color=SUITE_COLORS[card.suite%2]; // alternating suite colors
            cardButton.value=card.getTextRepresentation();
        }
    }
}
*/
function updateBidderSuiteCards(suiteCards){
    console.log("Showing the (current player) cards for bidding.");
    let tablebody=document.getElementById("bidder-suitecards-table").querySelector("tbody");
    // console.log("Suite cards: ",suiteCards);
    let rows=tablebody.querySelectorAll("tr");
    // console.log("Number of rows: ",rows.length);
    for(let suite=0;suite<rows.length;suite++){
        let row=rows[suite];
        /////////let suiteColor=SUITE_COLORS[suite%2];
        let cardsInSuite=(suite<suiteCards.length?suiteCards[suite]:[]);
        // console.log("Number of cards in suite #"+suite+": "+cardsInSuite.length);
        let columns=row.querySelectorAll("td");
        // console.log("Number of columns: ",columns.length);
        for(let suiteCard=0;suiteCard<columns.length;suiteCard++){
            let cell=columns[suiteCard];
            let cardInSuite=(suiteCard<cardsInSuite.length?cardsInSuite[suiteCard]:null);
            if(cardInSuite){
                // console.log("Showing card: ",cardInSuite);
                cell.innerHTML=cardInSuite.getTextRepresentation();
                cell.classList.add(SUITE_NAMES[cardInSuite.suite]); // replacing: cell.style.color=suiteColor;  
            }else
                cell.innerHTML="";
        }
    }
}
/**
 * for playing the cards are shown in buttons inside table cells
 * @param {*} suiteCards 
 */
function updatePlayerSuiteCards(suiteCards){
    console.log("Showing the (current player) cards to choose from.");
    let tablebody=document.getElementById("player-suitecards-table").querySelector("tbody");
    console.log("Suite cards: ",suiteCards);
    let rows=tablebody.querySelectorAll("tr");
    console.log("Number of rows: ",rows.length);
    for(let suite=0;suite<rows.length;suite++){
        let row=rows[suite];
        /////////let suiteColor=SUITE_COLORS[suite%2];
        let cardsInSuite=(suite<suiteCards.length?suiteCards[suite]:[]);
        // console.log("Number of cards in suite #"+suite+": "+cardsInSuite.length);
        let columns=row.querySelectorAll("td");
        // console.log("Number of columns: ",columns.length);
        for(let suiteCard=0;suiteCard<columns.length;suiteCard++){
            let cellbutton=columns[suiteCard].querySelector("input[type=button]");
            if(!cellbutton){console.log("No cell button!");continue;}
            let cardInSuite=(suiteCard<cardsInSuite.length?cardsInSuite[suiteCard]:null);
            if(cardInSuite){
                // console.log("Showing card: ",cardInSuite);
                cellbutton.value=cardInSuite.getTextRepresentation();
                cellbutton.classList.add(SUITE_NAMES[cardInSuite.suite]); // replacing: cellbutton.style.color=suiteColor;
                cellbutton.style.display="inline";
            }else // hide the button
                cellbutton.style.display="none";
        }
    }
    console.log("Current player cards to choose from shown!");
}

function showDefaultPlayerNames(){
    console.log("Showing default player names!");
    let playerNames=DEFAULT_PLAYERS[document.getElementById("demo-playmode-checkbox").checked?1:0];
    for(playerNameInputElement of document.getElementsByClassName("player-name-input")){
        if(playerNameInputElement.value.length==0)
            playerNameInputElement.value=playerNames[parseInt(playerNameInputElement.getAttribute("data-player-id"))];
    }
}

/**
 * prepares the GUI for playing the game
 */
function getGameInfo(){
    let gameInfo="";
   if(rikkenTheGame){
        let highestBidders=rikkenTheGame.getHighestBidders(); // those bidding
        // playing with trump is easiest
        if(rikkenTheGame._trumpSuite>=0){ // only a single highest bidder!!!
           let highestBidder=highestBidders[0];
            if(rikkenTheGame.highestBid==BID_TROELA){
                let troelaPlayer=rikkenTheGame.getPlayerAtIndex(highestBidder);
                gameInfo=troelaPlayer.name+" heeft troela. ";
                gameInfo+=SUITE_NAMES[rikkenTheGame._trumpSuite]+" is troef. ";
                gameInfo+=rikkenTheGame.getPlayerAtIndex(troelaPlayer.partner).name+" is mee.";
            }else{
                gameInfo=rikkenTheGame.getPlayerAtIndex(highestBidder).name+" rikt in de "+SUITE_NAMES[rikkenTheGame._trumpSuite]+". ";
            }
       }else{ // there's no trump, everyone is playing for him/herself

       }
   }
   return gameInfo;
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
        /* replacing:
        document.getElementById("toggle-bidder-cards").innerHTML="Toon kaarten";
        bidderCardsElement.innerHTML="";
        document.getElementById("toggle-bidder-cards").value=this.getTextRepresentation("<br>");
        */
        // either show or hide the bidder cards immediately
        document.getElementById("bidder-suitecards").style.display=(playmode==PLAYMODE_DEMO?"block":"none");
        if(playmode==PLAYMODE_DEMO^document.getElementById("bidder-suitecards-button").classList.contains("active-bid-button"))
            document.getElementById("bidder-suitecards-button").classList.toggle("active-bid-button");
        updateBidderSuiteCards(this._suiteCards=this._getSuiteCards());

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
    playACard(trickObjects,playSuite){
        currentPlayer=this;
        if(rikkenTheGame.numberOfTricksPlayed==0)document.getElementById("game-info").innerHTML=getGameInfo();
        this._card=null; // get rid of any currently card
        console.log("ONLINE >>> Player '"+this.name+"' should play a card!");
        setInfo(this.name+", welke "+(playSuite>=0?SUITE_NAMES[playSuite]:"kaart")+" wil je "+(trickObjects.length>0?"bij":"")+"spelen?");
        updatePlayerSuiteCards(this._suiteCards=this._getSuiteCards()); // remember the suite cards!!!!
        showTrick(trickObjects,playSuite);
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
    setCardSuiteAndIndex(suite,index){
        let card=(suite<this._suiteCards.length&&this._suiteCards[suite].length?this._suiteCards[suite][index]:null);
        if(card)
            this.setCard(card);
        else
            alert("Invalid card suite "+String(suite)+" and suite index "+String(index)+".");
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
function playablecardButtonClicked(event){
    let playablecardCell=event.currentTarget;
    ////////if(playablecardCell.style.border="0px")return; // empty 'unclickable' cell
    currentPlayer.setCardSuiteAndIndex(parseInt(playablecardCell.getAttribute("data-suite-id")),parseInt(playablecardCell.getAttribute("data-suite-index")));
}

function newGame(players){

    if(!players&&rikkenTheGame)players=rikkenTheGame._players; // if this is a next game to play

    if(!players){alert("No players!");return;}

    rikkenTheGame=null;

    try{
        rikkenTheGame=new RikkenTheGame(players,onlineRikkenTheGameEventListener);
        rikkenTheGame.start();
    }catch(error){
        setInfo("Starten van het spel mislukt: "+error);
    }

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
                    case 0:setInfo("Stel de spelregels in.");break;
                    case 1:setInfo("Kies de speelwijze.");break;
                    case 2:
                        {
                            showDefaultPlayerNames();
                            setInfo("Vul de namen van de spelers in. Een spelernaam is voldoende.");
                        }
                        break;
                    case 3:setInfo("Wacht om de beurt op een verzoek tot het doen van een bod.");break;
                    case 4:setInfo("Wacht op het verzoek tot het opgeven van de troefkleur en/of de aas/heer.");break;
                    case 5:setInfo("Wacht op het verzoek tot het (bij)spelen van een kaart.");break;
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

    newGame(players);

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
    // event handlers for next, cancel, and newPlayers buttons
    for(let nextButton of document.getElementsByClassName('next'))nextButton.onclick=nextPage;
    for(let cancelButton of document.getElementsByClassName('cancel'))cancelButton.onclick=cancelPage;
    for(let newPlayersButton of document.getElementsByClassName('new-players')){
        console.log("New players!");
        newPlayersButton.onclick=newPlayers;
    }

    // attach an onclick event handler for all bid buttons
    for(let bidButton of document.getElementsByClassName("bid"))bidButton.onclick=bidButtonClicked;
    
    // prepare for showing/hiding the cards of the current bidder
    initializeBidderSuitecardsButton();
    // replacing: document.getElementById("toggle-bidder-cards").onclick=toggleBidderCards;

    // event handler for selecting a suite
    for(let suiteButton of document.querySelectorAll(".suite.bid-trump"))suiteButton.onclick=trumpSuiteButtonClicked;
    for(let suiteButton of document.querySelectorAll(".suite.bid-partner"))suiteButton.onclick=partnerSuiteButtonClicked;
    // clicking card 'buttons' (now cells in table)
    for(let playablecardButton of document.querySelectorAll(".playable.card"))playablecardButton.onclick=playablecardButtonClicked;
    
    // make the suite elements of a specific type show the right text!!!!
    for(let suite=0;suite<4;suite++)
        for(let suiteButton of document.querySelectorAll(".suite."+SUITE_NAMES[suite]))
            suiteButton.value=SUITE_CHARACTERS[suite];

    this.setPage(PAGES[0]);
};