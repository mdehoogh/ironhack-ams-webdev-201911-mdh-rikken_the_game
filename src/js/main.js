// possible ranks and suites (in Dutch)
const DUTCH_RANK_NAMES=["twee","drie","vier","vijf","zes","zeven","acht","negen","tien","boer","vrouw","heer","aas"];
const DUTCH_SUITE_NAMES=["ruiten","klaveren","harten","schoppen"];

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
 * shows the current player names at the start of the game
 */
function showPlayerNames(){
    // in the header row of the tricks played table
    let tricksPlayedTableHeader=document.getElementById("tricks-played-table").querySelector("thead");
    let row=tricksPlayedTableHeader.children[0]; // the row we're interested in filling
    for(player=0;player<rikkenTheGame.numberOfPlayers;player++){
        let cell=row.children[player+1]; // use player to get the 'real' player column!!
        let playerName=rikkenTheGame.getPlayerName(player);
        console.log("Name of player #"+(player+1)+": '"+playerName+"'.");
        cell.innerHTML=playerName;
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

function setSuiteClass(element,suite){
    // remove the currently assigned suite
    element.classList.remove(SUITE_NAMES[parseInt(element.getAttribute("data-suite-id"))]);
    element.setAttribute("data-suite-id",String(suite));
    element.classList.add(SUITE_NAMES[parseInt(element.getAttribute("data-suite-id"))]);
}
function showCard(element,card,trumpSuite,winnerSign){
    if(card){
        setSuiteClass(element,card.suite); // we want to see the right color
        let elementIsTrump=element.classList.contains("trump");
        let elementShouldBeTrump=(card.suite===trumpSuite);
        if(elementIsTrump!==elementShouldBeTrump)element.classList.toggle("trump");
        element.innerHTML=card.getTextRepresentation();
        if(winnerSign!=0)element.innerHTML+="*";
        /* replacing: 
        // if this is the card of the winner so far it can be either + or -
        if(winnerSign>0)element.innerHTML+='+';else if(winnerSign<0)element.innerHTML+='-';
        */
    }else
        element.innerHTML="";
}

function showName(element,name,ispartner){
    element.innerHTML=(name?name:"?");
    element.style.color=(ispartner?"green":"black");
}
/**
 * shows the given trick
 * @param {*} trick 
 */
function showTrick(trick,playerIndex){
    console.log("Showing trick ",trick);
    // TODO do we need the play suite for anything??????
    //let tablebody=document.getElementById("trick-cards-table").requestSelector("tbody");
    // show the player names
    let partnerIndex=rikkenTheGame.getPartner(playerIndex);
    console.log(">>> Partner of "+rikkenTheGame.getPlayerName(playerIndex)+": "+rikkenTheGame.getPlayerName(partnerIndex)+".");
    showName(document.getElementById("player-name"),rikkenTheGame.getPlayerName(playerIndex),false);
    showName(document.getElementById("player-left-name"),rikkenTheGame.getPlayerName((playerIndex+1)%4),(playerIndex+1)%4===partnerIndex);
    showName(document.getElementById("player-opposite-name"),rikkenTheGame.getPlayerName((playerIndex+2)%4),(playerIndex+2)%4===partnerIndex);
    showName(document.getElementById("player-right-name"),rikkenTheGame.getPlayerName((playerIndex+3)%4),(playerIndex+3)%4===partnerIndex);
    // show the trick cards played by the left, opposite and right player
    showCard(document.getElementById("player-left-card"),trick.getPlayerCard((playerIndex+1)%4),trick.trumpSuite,
                (trick.winner===(playerIndex+1)%4?(rikkenTheGame.isPlayerPartner(playerIndex,(playerIndex+1)%4)?1:-1):0));
    showCard(document.getElementById("player-opposite-card"),trick.getPlayerCard((playerIndex+2)%4),trick.trumpSuite,
                (trick.winner===(playerIndex+2)%4?(rikkenTheGame.isPlayerPartner(playerIndex,(playerIndex+2)%4)?1:-1):0));
    showCard(document.getElementById("player-right-card"),trick.getPlayerCard((playerIndex+3)%4),trick.trumpSuite,
                (trick.winner===(playerIndex+3)%4?(rikkenTheGame.isPlayerPartner(playerIndex,(playerIndex+3)%4)?1:-1):0));
}
/* replacing:
function showTrickObjects(trickObjects,playSuite){
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
            trickLabel.innerHTML=trickObject.card.getTextRepresentation();
            trickLabel.style.display="initial";
        }else
            trickLabel.style.display="none";
    }
    console.log("Trick shown!");
}
*/
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

function clearTricksPlayedTable(){
    let tricksPlayedTableBody=document.getElementById("tricks-played-table").querySelector("tbody");
    for(let tricksPlayedTableCell of tricksPlayedTableBody.querySelectorAll('td'))
        tricksPlayedTableCell.innerHTML="";
}
function updateTricksPlayedTable(){
    let lastTrickPlayedIndex=rikkenTheGame.numberOfTricksPlayed-1;
    if(lastTrickPlayedIndex>=0){
        let trick=rikkenTheGame.getTrickAtIndex(lastTrickPlayedIndex);
        let tricksPlayedTablebody=document.getElementById("tricks-played-table").querySelector("tbody");
        let row=tricksPlayedTablebody.children[lastTrickPlayedIndex]; // the row we're interested in filling
        row.children[0].innerHTML=String(rikkenTheGame.numberOfTricksPlayed);
        for(trickPlayer=0;trickPlayer<trick._cards.length;trickPlayer++){
            let player=(trickPlayer+trick.firstPlayer)%4;
            let cell=row.children[player+1]; // use player to get the 'real' player column!!
            let card=trick._cards[trickPlayer];
            cell.innerHTML=String(trickPlayer+1)+": "+card.getTextRepresentation();
            if(trick.winner===player)cell.innerHTML+="*"; // mark the winner with an asterisk!!
            cell.style.color=(card.suite%2?'black':'red'); // first player adds blue!!
            // replacing: cell.style.color='#'+(card.suite%2?'FF':'00')+'00'+(trickPlayer==0?'FF':'00'); // first player adds blue!!
        }
        row.children[5].innerHTML=rikkenTheGame.getPlayerName(trick.winner); // show who won the trick!!
    }
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
    console.log("Determining game info.");
    let gameInfo="";
   if(rikkenTheGame){
        let highestBidders=rikkenTheGame.getHighestBidders(); // those bidding
        console.log("\tHighest bidders: "+highestBidders.join(", ")+".");
        let highestBid=rikkenTheGame.getHighestBid();
        console.log("\tHighest bid: "+BID_NAMES[highestBid]+".");
        let trumpSuite=rikkenTheGame.trumpSuite;
        console.log("\tTrump suite: "+trumpSuite+".");
        let partnerSuite=rikkenTheGame.partnerSuite;
        let partnerRank=rikkenTheGame.partnerRank;
        // playing with trump is easiest
        if(trumpSuite>=0){ // only a single highest bidder!!!
           let highestBidder=highestBidders[0];
            if(highestBid==BID_TROELA){
                let troelaPlayer=rikkenTheGame.getPlayerAtIndex(highestBidder);
                gameInfo=troelaPlayer.name+" heeft troela, en ";
                gameInfo+=rikkenTheGame.getPlayerAtIndex(rikkenTheGame.fourthAcePlayer)+" is mee.";
                /* you cannot show this unless the ace has been thrown!!!
                gameInfo+=" "+capitalize(DUTCH_SUITE_NAMES[trumpSuite])+" is troef.";
                */
                /*
                +", want ";
                // TODO why does troelaPlayer does NOT have a proper partner: troelaPlayer.partner
                gameInfo+=rikkenTheGame.getPlayerAtIndex(rikkenTheGame.fourthAcePlayer)+" heeft deze vierde aas, en is dus mee.";
                */
            }else{
                if(highestBid==BID_RIK||highestBid==BID_RIK_BETER){
                    gameInfo=rikkenTheGame.getPlayerAtIndex(highestBidder).name+" rikt in de "+DUTCH_SUITE_NAMES[trumpSuite];
                    gameInfo+=", en vraagt de "+DUTCH_SUITE_NAMES[partnerSuite]+" "+DUTCH_RANK_NAMES[partnerRank]+" mee.";    
                }else // without a partner
                    gameInfo=rikkenTheGame.getPlayerAtIndex(highestBidder).name+" speelt "+BID_NAMES[trumpSuite]+" met "+DUTCH_SUITE_NAMES[trumpSuite]+" als troef.";
            }
        }else{ // there's no trump, everyone is playing for him/herself
            let highestBidderPlayerNames=[];
            highestBidders.forEach((highestBidder)=>{highestBidderPlayerNames.push(rikkenTheGame.getPlayerAtIndex(highestBidder).name);});
            if(highestBidderPlayerNames.length>0){
                if(highestBid!=BID_RIK&&highestBid!=BID_RIK_BETER)
                    gameInfo=highestBidderPlayerNames.join(", ")+(highestBidderPlayerNames.length>1?" spelen ":" speelt ")+BID_NAMES[highestBid]+".";
                else // a rik (by a single person always)
                    gameInfo=highestBidderPlayerNames[0]+" rikt in de "+DUTCH_SUITE_NAMES[trumpSuite]+".";
            }else
                gameInfo="Iedereen heeft gepast. We spelen om de schoppen vrouw en de laatste slag!";
        }
   }
   return gameInfo;
}

function askingForPartnerCardBlind(event){
    currentPlayer.askingForPartnerCardBlind=event.currentTarget.checked;
}
function getNumberOfTricksToWinText(numberOfTricksToWin){
    switch(numberOfTricksToWin){
        case 0:
            return "Geeneen";
        case 1:
            return "Precies een";
        case 6:
            return "Zes om de rikkers te laten verliezen";
        case 8:
            return "Acht samen met je partner om de rik te winnen";
        case 9:
            return "Negen alleen";
        case 10:
            return "Tien alleen";
        case 11:
            return "Elf alleen";
        case 12:
            return "Twaalf alleen";
        case 13:
            return "Allemaal";
        case 14:
            return "Maakt niet uit mits niet de laatste slag of een slag met de schoppen vrouw";
    }
    return "Maakt niet uit";
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
    // almost the same as the replaced version except we now want to receive the trick itself
    playACard(trick){
        // if this is a new trick update the tricks played table with the previous trick
        if(trick.numberOfCards==0)updateTricksPlayedTable();
        currentPlayer=this;
        document.getElementById("can-ask-for-partner-card-blind").style.display=(trick.canAskForPartnerCardBlind?"block":"none");
        // always start unchecked...
        document.getElementById("ask-for-partner-card-blind").checked=false; // when clicked should generate 
        if(rikkenTheGame.numberOfTricksPlayed==0)document.getElementById("game-info").innerHTML=getGameInfo();
        document.getElementById("card-player").innerHTML=this.name;
        document.getElementById("trick-playsuite").innerHTML=(trick.playSuite>=0?DUTCH_SUITE_NAMES[trick.playSuite].toLowerCase():"kaart");
        let numberOfTricksWon=this.getNumberOfTricksWon();
        // add the tricks won by the partner
        if(this.partner>=0)numberOfTricksWon+=rikkenTheGame.getPlayerAtIndex(this.partner).getNumberOfTricksWon();
        document.getElementById("tricks-won-so-far").innerHTML=String(numberOfTricksWon);
        // show the number of tricks this player is supposed to win in total
        document.getElementById("tricks-to-win").innerHTML=getNumberOfTricksToWinText(this._numberOfTricksToWin);
        this._card=null; // get rid of any currently card
        console.log("ONLINE >>> Player '"+this.name+"' should play a card!");
        setInfo(this.name+", welke "+(trick.playSuite>=0?SUITE_NAMES[trick.playSuite]:"kaart")+" wil je "+(trick.numberOfCards>0?"bij":"")+"spelen?");
        updatePlayerSuiteCards(this._suiteCards=this._getSuiteCards()); // remember the suite cards!!!!
        // show the trick from the viewpoint of the current player
        showTrick(trick,this._index);
    }
    /* replacing:
    playACard(trickObjects,playSuite,canAskForPartnerCardBlind){
        // if this is a new trick update the tricks played table with the previous trick
        if(trickObjects.length==0)updateTricksPlayedTable();
        currentPlayer=this;
        document.getElementById("can-ask-for-partner-card-blind").style.display=(canAskForPartnerCardBlind?"block":"none");
        // always start unchecked...
        document.getElementById("ask-for-partner-card-blind").checked=false; // when clicked should generate 
        if(rikkenTheGame.numberOfTricksPlayed==0)document.getElementById("game-info").innerHTML=getGameInfo();
        document.getElementById("card-player").innerHTML=this.name;
        document.getElementById("trick-playsuite").innerHTML=(playSuite>=0?DUTCH_SUITE_NAMES[playSuite].toLowerCase():"kaart");
        let numberOfTricksWon=this.getNumberOfTricksWon();
        // add the tricks won by the partner
        if(this.partner>=0)numberOfTricksWon+=rikkenTheGame.getPlayerAtIndex(this.partner).getNumberOfTricksWon();
        document.getElementById("tricks-won-so-far").innerHTML=String(numberOfTricksWon);
        this._card=null; // get rid of any currently card
        console.log("ONLINE >>> Player '"+this.name+"' should play a card!");
        setInfo(this.name+", welke "+(playSuite>=0?SUITE_NAMES[playSuite]:"kaart")+" wil je "+(trickObjects.length>0?"bij":"")+"spelen?");
        updatePlayerSuiteCards(this._suiteCards=this._getSuiteCards()); // remember the suite cards!!!!
        showTrickObjects(trickObjects,playSuite);
    }
    */
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
    // OOPS using parseInt() here is SOOOO important
    let trumpSuite=parseInt(event.currentTarget.getAttribute("data-suite"));
    console.log("Trump suite "+trumpSuite+" chosen.");
    // go directly to the game (instead of through the player)
    rikkenTheGame.trumpSuite=trumpSuite;
}
/**
 * clicking a partner suite button registers the chosen partner suite with the current player 
 * @param {*} event 
 */
function partnerSuiteButtonClicked(event){
    // either trump or partner suite selected
    // parseInt VERY IMPORTANT!!!!
    let partnerSuite=parseInt(event.currentTarget.getAttribute("data-suite"));
    console.log("Partner suite "+partnerSuite+" chosen.");
    // go directly to the game (instead of through the player)
    rikkenTheGame.partnerSuite=partnerSuite;
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
                if(playmode!==PLAYMODE_DEMO){
                    setPage("page-finished");
                }
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
                    case 3:
                        {
                            setInfo("Wacht om de beurt op een verzoek tot het doen van een bod.");
                        }
                        break;
                    case 4:setInfo("Wacht op het verzoek tot het opgeven van de troefkleur en/of de aas/heer.");break;
                    case 7:
                        {
                            clearTricksPlayedTable();
                            showPlayerNames();
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

    document.getElementById("ask-for-partner-card-blind").onclick=askingForPartnerCardBlind;

    this.setPage(PAGES[0]);
};