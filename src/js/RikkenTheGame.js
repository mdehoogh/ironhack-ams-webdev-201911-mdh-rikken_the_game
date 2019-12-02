/**
 * 
 */

// posssible game states
const IDLE=0,EXPECTING_BID=1,INITIATE_PLAYING=2,EXPECTING_CARD=3;

// possible bids
// NOTE the highest possible bid (troela) is obligatory!!
const BID_NAMES=["pas","rik","rik (beter)","negen alleen","negen alleen (beter)","pico","tien alleen","tien alleen (beter)","11 alleen","11 alleen (beter)","misere","12 alleen","12 alleen (beter)","open misere","13 alleen","13 alleen (beter)","open misere met een praatje"]; // excluding: ,"troela"];
const BID_PAS=0,BID_RIK=1,BID_RIK_BETER=2,BID_NEGEN_ALLEEN=3,BID_NEGEN_ALLEEN_BETER=4,BID_PICO=5,BID_TIEN_ALLEEN=6,BID_TIEN_ALLEEN_BETER=7,BID_ELF_ALLEEN=8,BID_ELF_ALLEEN_BETER=9,BID_MISERE=10,BID_TWAALF_ALLEEN=11,BID_TWAALF_ALLEEN_BETER=12,BID_OPEN_MISERE=13,BID_DERTIEN_ALLEEN=14,BID_DERTIEN_ALLEEN_BETER=15,BID_OPEN_MISERE_MET_EEN_PRAATJE=16,BID_TROELA=17,BID_LAATSTE_SLAG_EN_SCHOPPEN_VROUW=18;
const BIDS_ALL_CAN_PLAY=[BID_PICO,BID_OPEN_MISERE,BID_OPEN_MISERE_MET_EEN_PRAATJE]; // trumpless games
const BIDS_WITH_PARTNER_IN_HEARTS=[BID_RIK_BETER,BID_TIEN_ALLEEN_BETER,BID_ELF_ALLEEN_BETER,BID_TWAALF_ALLEEN_BETER,BID_DERTIEN_ALLEEN_BETER]; // games with trump played with a partner
const BID_RANKS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,0,-1]; // how I played it (bid pass excluded (always rank 0))

/*
class RikkenTheGameEventListener{
    stateChanged(rikkenTheGame){
        if(new.target===RikkenTheGameEventListener)
            throw new Error("You're supposed to create a subclass of RikkenTheGameEventListener!");
    }
    errorOccurred(rikkenTheGame,error){
        if(new.target===RikkenTheGameEventListener)
            throw new Error("You're supposed to create a subclass of RikkenTheGameEventListener!");
    }
}
*/
class EmulatedPlayer extends Player{

    constructor(name){
        super(name);
    }
    getCardToPlay(cardSuite){
        let cardsOfSuite=this.getCardsOfSuite(cardSuite);
        if(cardsOfSuite&&cardsOfSuite.length>0)return cardsOfSuite[0];
        // we should return the card we want to get rid of most!!!
        return this.cards.pop(); // the last card is a good alternative!!!
    }
}

class Trick extends CardHolder{
    constructor(firstPlayer,trumpSuite){
        super(); // the cards successive played in the trick
        this.firstPlayer=firstPlayer;
        this.trumpSuite=trumpSuite;
        // let's keep track of the highest card
    }
    addCard(card){
        super.addCard(card);
    }
    getPlayerWhoWon(){
        // find out which player won the trick
        // it's either the highest trump card if any otherwise the highest card 
    }
}

class RikkenTheGame extends PlayerEventListener{

    static get MY_NAME(){
        return "Me";
    }

    constructor(players,stateChangeListener){

        super();

        if(stateChangeListener&&!(stateChangeListener instanceof RikkenTheGameStateListener))
            throw new Error("Invalid state change listener defined.");
        this._stateChangeListener=stateChangeListener;

        if(!players||!Array.isArray(players)||players.length<4)
            throw new Error("Not enough players!");
        
        this._players=[]; // to store the players myself
        // replace undefined players by emulated players and register myself as player event listener
        let player=players.length;
        while(--player>=0){
            if(players[player]){
                if(!(players[player] instanceof Player))
                    throw new Error("Player of wrong type.");
                this._players.unshift(players[player]);
            }else
                this._players.unshift(new EmulatedPlayer(MY_NAME));
        }
        // register the game with each of the players and initialie the player bids as well
        this._playerbids=[];
        player=this._players.length;
        while(--player>=0){
            this._players[player].playsTheGameAtIndex(this,player);
            if(this._players[player].game!=this)
                throw new Error("Failed to register player '"+this._players[player].name+"'.");
            this._playerbids.push([]);
        }
        if(this._playerbids.length<4)throw new Error("Failed to initialize the player bids.");

        // we need a deck of cards
        this.deckOfCards=new DeckOfCards();
        // appoint the first player as dealer
        this.dealer=0; // the current dealer
        this.handsPlayed=0; // keep track of the number of 'slagen' (13 in total)
        this._player=0;
        this._passBidCount=0; // keep track of the number of pass bids
        this._riksuite=-1; // in case the bid is 'rik' indicates the selected suite 
        this._state=IDLE; // starting in the idle state
        this._trick=null;
        this._tricks=[];
        this._bid=-1;
    }

    get numberOfPlayers(){return this._players.length;}

    set state(newstate){
        this._state=newstate;
        // if there's a state change listener, play 'online', otherwise play through the console
        switch(this._state){
            case EXPECTING_BID:
                {
                    this._highestBid=0;
                    this._highestBidPlayers=[]; // no highest bid players yet
                    this._players[this._player].makeABid(this._bids);
                }
                break;
            case INITIATE_PLAYING:
                // ASSERT requires this._bid and this._bidPlayers to be set 
                // in any game that is not solitary we need to ask for the trump and the partner card
                if(this._highestBid!=BID_TROELA){ // not troela
                    // the player next to the dealer is always the player to start playing
                    this._player=(this.dealer+1)%this.numberOfPlayers;
                    if(this._highestBid==BID_PAS){ // everybody passed
                        this._highestBid=BID_LAATSTE_SLAG_EN_SCHOPPEN_VROUW;
                        // everybody is playing for him/herself
                    }else
                    // if it's a bid that is played with a partner, ask the player for the partner
                    if(BIDS_ALL_CAN_PLAY.indexOf(this._highestBid)<0){ // a game with trumps
                        // if the trump is known (only with a better variation bid)
                        if(BIDS_WITH_PARTNER_IN_HEARTS.indexOf(this._bid)>=0)
                            this.trumpSuite=CARD_SUITES.indexOf("heart"); // set the trump suite directly!!!
                        else
                        if(this._highestBidPlayers.length==0){
                            console.error("BUG: Bidder vanished!");
                        }else
                            this._players[this._highestBidPlayers[0]].chooseTrumpSuite();
                        break;                        
                    }
                    // a trumpless game anyone can play and that can be started immediately
                }else // in TROELA the player with the fourth ace will be the first player
                    this._player=this.fourthAcePlayer;
                this._state=EXPECTING_CARD; // fall-through e.g. also doing the next stuff
            case EXPECTING_CARD:
                {
                    console.log("Let the games begin!");
                    this.trick=[];
                    this._players[this._player].playACard(this._trick);break;
                }
        }
    }

    // PlayerEventListener implementation
    bidMade(){
        // 1. register the bid
        let bid=this._players[this._player].bid; // collect the bid made by the current player

        // TODO check whether this bid is actually higher than the highest bid so far (when not a pass bid)
        this._playerbids[this._player].unshift(bid); // insert bid at start of player bids
        
        // 2. check if this bid ends the bidding
        if(bid==BID_PAS){
            this._passBidCount++;
            // after three successive 'pas' bids, the bidding is done
            if(this._passBidCount>=(this._highestBid==BID_PAS?4:3))
                this.state=INITIATE_PLAYING;
        }else{
            // a new accepted bid is always the highest bid
            if(bid<this._highestBid)
                throw new Error("Invalid bid!");
            if(bid==this._highestBid){ // same as before
                if(BIDS_ALL_CAN_PLAY.indexOf(bid)<0)
                    throw new Error("You cannot make the same bid!");
                this._highestBidPlayers.push(this._player);
            }else{ // a higher bid
                this._highestBid=bid; // remember the highest bid so far
                console.log("Highest bid so far: "+BID_NAMES[this._highestBid]+".");
                this._highestBidPlayers=[this._player]; // the first one to bid this
                // if this was the highest possible bid we're done
                if(BID_RANKS[bid]==17){ // highest possible player bid (which is played solitary)
                    this.state=INITIATE_PLAYING;
                }    
            }
        }
        // 3. if still in the bidding state, ask the next player that is still allowed to bid for a bid
        if(this._state==EXPECTING_BID){
            if(bid!=BID_PAS)this._passBidCount=0; // reset the number of successive pass bids
            // find the next player that is allowed to bid (should be there)
            while(1){
                this._player=(this._player+1)%this.numberOfPlayers;
                if(this._playerbids[this._player].length==0)break;
                if(this._playerbids[this._player][0]!=BID_PAS)break;
            }
            // ask that player for a bid
            // NOTE could have done this by: this.state=EXPECTING_BID;
            this._players[this._player].makeABid(this._playerbids);    
        }
    }
    trumpSuiteChosen(){
        console.log("Trump suite chosen!");
        // if it is a regular 'rik' ask the player to play it for the partner suite
        if(this._highestBid==BID_RIK||this._highestBidPlayers==BID_RIK_BETER)
            this._players[this._player].choosePartnerSuite();
        else // a solitary play, so we can start playing immediately
            this.state=EXPECTING_CARD;
    }
    parentSuiteChosen(){
        console.log("Parent suite choosen");
        self.state=EXPECTING_CARD;
    }

    cardPlayed(player,card){

    }
    // end PlayerEventListener implementation

    // check whether 'troela', and if so initialize the play accordingly
    checkForTroela(){
        let threeAcePlayer=-1,oneAcePlayer=-1; // determine the player with 1 and 3 aces
        // get the number of aces each player has
        for(let player=this.numberOfPlayers-1;player>=0;player--){
            let aces=this._players[player].getNumberOfCardsWithRank(RANK_ACE);
            if(aces==2||aces==4)break; // if a player has either 2 or 4 aces no player can have 3
            if(aces==3)threeAcePlayer=player;else oneAcePlayer=player;
        }
        this.fourthAcePlayer=(threeAcePlayer>=0?oneAcePlayer:-1);
    }

    // 'private' methods
    dealBy(numberOfCards){
        for(let clockwisePlayer=1;clockwisePlayer<=this.numberOfPlayers;clockwisePlayer++){
            // 'pop' off numberOfCards per player
            let player=this._players[(clockwisePlayer+this.dealer)%this.numberOfPlayers];
            let cardsLeftToDeal=numberOfCards;
            while(--cardsLeftToDeal>=0){
                console.log("Deck of cards to deal from: ",this.deckOfCards);
                let cardToDeal=this.deckOfCards.getFirstCard();
                if(!cardToDeal){console.error("No further cards to deal.");return false;}
                if(!(cardToDeal instanceof HoldableCard)){
                    console.error("Card to deal "+cardToDeal+" (with constructor "+cardToDeal.constructor.name+") not holdable!");return false;
                }
                console.log("Dealing #"+cardsLeftToDeal+" ("+cardToDeal.toString()+") to "+player.toString()+".");
                cardToDeal.holder=player;
                if(cardToDeal._holder!==player){
                    console.error("\tFailed to deal card "+cardToDeal.toString()+".");
                    return false;
                }
            }
        }
        return true;
    }

    logHands(){
        this._players.forEach((player)=>{console.log("Hand of "+player+": ")+player.getTextRepresentation(true);});
    }

    dealCards(){
        console.log("Cards to deal: ",this.deckOfCards);
        // every player is to get 13 cards (first seven than six)
        if(!this.dealBy(7)||!this.dealBy(6))return false;
        // let's sort the hands (for convenience)
        this._players.forEach((player)=>{player._cards.sort(compareCards);});
        this.logHands();
        return true;
    }

    /**
     * when it's clear what game to play set it to play
     */
    playTheGame(){
        // 1. determine the first player
        // the player after the dealer plays the first card unless we're playing 'troela'
        this._player=(this.fourthAcePlayer>=0?this.fourthAcePlayer:(this.dealer+1)%this.players.length);
        // 2. prepare for collecting the tricks
        // who wins the trick starts first next
        // NOTE because the players take turn we can play the game synchronously!!!!
        this.tricks=[]; // the tricks played
        let numberOfTricksLeftToPlay=this._players[0]._cards.length;
        this.trick=new Trick(); // the current trick
        // and start expecting cards
        this.state=EXPECTING_CARD;
    }

    // after dealing the cards, the game can be played
    startTheGame(){
        this.checkForTroela();
        // if a player has 3 aces the play to play is 'troela' and therefore the accepted bid
        if(this.fourthAcePlayer>=0){ // set the game to play to 'troela'
            this.bid=BID_TROELA;
            this.state=INITIATE_PLAYING;
        }else
            this.state=EXPECTING_BID;
    }

    // public methods
    // getters
    get state(){return this._state;}
    get bid(){return this._bid;} // the bid so far
    get player(){return this._player;}

    // to receive a new bid (by the current player), assign to bid 
    set bid(newbid){
        if(newbid!=BID_PAS){
            // must be larger than the last bid received
            if(BID_RANKS[newbid]>BID_RANKS[this._bid]){
                this._bid=newbid;
            }
        }else{
            this._passbidcount++;
        }
    }

    start(){
        this.deckOfCards.shuffle(); // shuffle the cards again
        if(this.dealCards())this.startTheGame();else console.error("Failed to deal the cards.");
    }

}