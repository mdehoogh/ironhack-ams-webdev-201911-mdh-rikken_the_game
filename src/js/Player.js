/**
 * a placeholder for a player
 */

/**
 * a Player can make a bid, or play a card
 */
class PlayerEventListener{
    bidMade(){}
    cardPlayed(){}
    trumpSuiteChosen(){}
    partnerSuiteChosen(){}
}

const CHOICE_IDS=["a","b","c","d","e","f","g","h","i","j","k","l","m"];

// the base class of all Player instances
// would be defined abstract in classical OO
class Player extends CardHolder{

    addEventListener(playerEventListener){
        if(playerEventListener&&playerEventListener instanceof PlayerEventListener)
            this._eventListeners.push(playerEventListener);
        console.log("Player '"+this.name+"' event listeners: "+this._eventListeners+".");
    }

    constructor(name,playerEventListener){
        super();
        this.name=name;
        if(playerEventListener&&!(playerEventListener instanceof PlayerEventListener))
            throw new Error("Player event listener of wrong type.");
        this._eventListeners=[];
        this._bid=-1; // the last bid of this player
        // the game being played, and the index within that game
        this._playerIndex=-1;
        this._game=null;
        this._tricksWon=[]; // the tricks won (in any game)
        this.addEventListener(playerEventListener);
    }

    // getters exposing information to the game (after making a bid, playing a card or choosing trump or partner)
    get bid(){return this._bid;}

    //////////////get card(){return this._cards[this._cardPlayIndex];}

    // can be set directly when a better 'rik' variation bid was done!!!!
    get trumpSuite(){return this._trumpSuite;}
    set trumpSuite(trumpSuite){
        this._trumpSuite=trumpSuite;
        this.trumpSuiteChosen();
    }
    // TODO it would be easier to combine these in a card!!!!
    get partnerSuite(){return this._partnerSuite;}
    get partnerRank(){return this._partnerRank;}

    setPartnerSuiteAndRank(){

    }
    // end of getters/setters used by the game

    get game(){return this._game;}
    set game(game){
        this._game=(this._index>=0&&game&&game instanceof PlayerEventListener?game:null);
        // sync _index
        if(this._game){
            // prepare for playing the game
            this._bid=-1; // last bid (so far)
            this._trumpSuite=-1; // choosen trump suite
            this._partnerSuite=-1; // choose partner suite
            this._partnerRank=-1; // associated rank (either RANK_ACE or RANK_KING)
            this.partner=-1; // my partner (once I now who it is)
            this.tricksWon=[]; // storing the tricks won
            this._card=null; // no card played yet
        }else
            this._index=-1;
    }

    playsTheGameAtIndex(game,index){
        this._index=index;
        this.game=game;
    }

    addCard(card){
        super.addCard(card);
        console.log("Player '"+this+"' received card '"+card+"'.");
    }

    _getCardsOfSuite(cardSuite,whenNotFoundCard){
        return this.cards.filter((card)=>{return(card.suite==cardSuite);});
    }

    _getSuiteCards(){
        let suiteCards=[[],[],[],[]];
        this._cards.forEach((card)=>{suiteCards[card.suite].push(card);});
        return suiteCards;
    }

    // can be asked to play a card of a given card suite (or any card if cardSuite is undefined)
    contributeToTrick(trick) {
        if(this._cards.length==0)throw new Error("No cards left to play!");
        let cardsOfSuite=this._getCardsOfSuite(cardSuite);
        let card=(cardsOfSuite&&cardsOfSuite.length>0?cardsOfSuite[0]:this._cards[0]);
        card.holder=trick; // move the card to the trick
    }

    // to signal having made a bid
    bidMade(){
        if(this._eventListeners) // catch any error thrown by event listeners
            this._eventListeners.forEach((eventListener)=>{try{eventListener.bidMade();}catch(error){}});
        if(this._game)this._game.bidMade();
    }    
    // TODO a bid setter will allow subclasses to pass a bid by setting the property
    setBid(bid){
        this._bid=bid;
        this.bidMade();
    }

    // to signal having played a card
    get card(){return this._card;}

    cardPlayed(){
        if(this._eventListeners)this._eventListeners.forEach((eventListener)=>{eventListener.cardPlayed();});
        if(this._game)this._game.cardPlayed();
    }
    
    // TODO a bid setter will allow subclasses to pass a bid by setting the property
    setCard(card){
        this._card=card;
        this.cardPlayed();
    }

    // to signal having choosen a trump suite
    trumpSuiteChosen(){
        if(this._eventListeners)this._eventListeners.forEach((eventListener)=>{try{eventListener.trumpSuiteChosen();}catch(error){};});
        if(this._game)this._game.trumpSuiteChosen();
    }
    // to signal having chosen a partner
    partnerSuiteChosen(){
        if(this._eventListeners)this._eventListeners.forEach((eventListener)=>{try{eventListener.partnerSuiteChosen();}catch(error){};});
        if(this._game)this._game.partnerSuiteChosen();
    }

    // when a game is over, gameOver() should be called so a player can reset some stuff!!!
    gameOver(){
        if(this._tricksWon.length>0)this._tricksWon=[];
    }

    // can be asked to make a bid passing in the highest bid so far
    // NOTE this would be an 'abstract' method in classical OO
    makeABid(playerbids){
        // assumes that this player has made a bid before, or that this is the first bid
        // this default implementation assumes to be running in a browser so we can use prompt()
        // all other available bids should be better than the last bid by any other player
        let highestBidSoFar=BID_PAS;
        if(playerbids){
            console.log("Player bids:",playerbids);
            for(let player=0;player<playerbids.length;player++)
                if(playerbids[player].length>0&&playerbids[player][0]>highestBidSoFar)
                    highestBidSoFar=playerbids[player][0];
        }
        console.log("Highest bid so far: '"+BID_NAMES[highestBidSoFar]+"'.");
        // if the highest possible bid is not a bid all can play (at the same time), can't be bid again
        if(BIDS_ALL_CAN_PLAY.indexOf(BID_NAMES[highestBidSoFar])<0)highestBidSoFar++;
        let possibleBidNames=BID_NAMES.slice(highestBidSoFar);
        possibleBidNames.unshift(BID_NAMES[BID_PAS]); // user can always 'pas'
        console.log("Possible bids: ",possibleBidNames);
        this._bid=-1;
        while(this._bid<0){
            let bidname=prompt("@"+this.name+" (holding "+this.getTextRepresentation(true)+")\nWhat is your bid (options: '"+possibleBidNames.join("', '")+"')?",possibleBidNames[0]);
            this._bid=BID_NAMES.indexOf(bidname);
            if(this._bid<0)continue;
            try{
                this.bidMade();
            }catch(error){
                console.error(error);
                this._bid=-1;
            }
        }
    }
    chooseTrumpSuite(suites){
        // if this player has all aces it's gonna be the suite of a king the person hasn't
        // also it needs to be an ace of a suite the user has itself (unless you have all other aces)
        this._trumpSuite=-1;
        // any of the suites in the cards can be the trump suite!
        let possibleTrumpSuiteNames=this.getSuites().map((suite)=>{return CARD_SUITES[suite];});
        while(this._trumpSuite<0){
            let trumpName=prompt("@"+this.name+" (holding "+this.getTextRepresentation(true)+")\nWhat suite will be trump (options: '"+possibleTrumpSuiteNames.join("', '")+"')?",possibleTrumpSuiteNames[0]);
            this._trumpSuite=possibleTrumpSuiteNames.indexOf(trumpName);
        }
        this.trumpSuiteChosen();
    }
    /**
     * asks for the suite of the partner card of the given rank
     * @param {*} partnerRankName 
     */
    choosePartnerSuite(partnerRankName){
        this._partnerSuite=-1;
        this._partnerRank=RANK_ACE;
        // get all the aceless suites
        let suites=this.getSuites();
        let possiblePartnerSuites=this.getRanklessSuites(this._partnerRank);
        if(possiblePartnerSuites.length==0){ // player has ALL aces
            if(suites.length<4){ // but not all suites
                // all the suits the user does not have are allowed (asking the ace blind!!!)
                possiblePartnerSuites=[0,1,2,3].filter((suite)=>{return possiblePartnerSuites.indexOf(suite)<0;});
            }else{ // has all suits, so a king is to be selected!!!
                // all kings acceptable except for that in the trump color
                // NOTE if a person also has all the kings we have a situation, we simply continue onward
                while(1){
                    this._partnerRank--;
                    possiblePartnerSuites=this.getRanklessSuites(this._partnerRank);
                    let trumpSuiteIndex=possiblePartnerSuites.indexOf(this._trumpSuite);
                    if(trumpSuiteIndex>=0)possiblePartnerSuites.splice(trumpSuiteIndex,1);
                    if(possiblePartnerSuites.length>0)break;
                }
            }
        }
        let possiblePartnerSuiteNames=possiblePartnerSuites.map((suite)=>{return CARD_SUITES[suite];});

        while(this._partnerSuite<0){
            let partnerSuiteName=prompt("@"+this.name+" (holding "+this.getTextRepresentation(true)+")\nWhat "+CARD_NAMES[this._partnerRank]+" should your partner have (options: '"+possiblePartnerSuiteNames.join("', '")+"')?",possiblePartnerSuiteNames[0]);
            this._partnerSuite=possiblePartnerSuiteNames.indexOf(partnerSuiteName);
        }
        this.partnerSuiteChosen();
    }

    set partner(partner){this._partner=partner;} // to set the partner once the partner suite/rank card is in the trick!!!!

    // can be asked to play a card and add it to the given trick
    // NOTE this would be an 'abstract' method in classical OO
    playACard(trick){
        console.log("Player '"+this.name+"' asked to play a card.");
        // how about using the first letters of the alphabet?
        let possibleCardNames=[];
        for(let cardIndex=0;cardIndex<this.numberOfCards;cardIndex++)
            possibleCardNames.push(String.cardIndex+1)+": "+this._cards[cardIndex].getTextRepresentation();
        let cardPlayIndex=-1;
        while(cardPlayIndex<0){
            // we're supposed to play a card with suite equal to the first card unless the partner suite/rank is being asked for
            let cardId=parseInt(prompt("@"+this.name+"\nPress the id of the card you want to add to "+trick.getTextRepresentation()+" (options: '"+possibleCardNames.join("', '")+"')?",""));
            if(isNaN(cardId))continue;
            cardPlayIndex=cardId-1;
        }
        this.card=this._cards[cardPlayIndex];
    }

    trickWon(trickIndex){
        this._tricksWon.push(trickIndex);
        console.log("Trick #"+trickIndex+" won by '"+this.name+"': "+this._tricksWon+".");
    }

    toString(){
        return this.name;
    }

}