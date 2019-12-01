/**
 * 
 */

// posssible game states
const IDLE=0,EXPECTING_BID=1,INITIATE_PLAYING=2,EXPECTING_CARD=3;

// possible bids
// NOTE the highest possible bid (troela) is obligatory!!
const BID_NAMES=["pas","rik","rik (beter)","negen alleen","negen alleen (beter)","pico","tien alleen","tien alleen (beter)","11 alleen","11 alleen (beter)","misere","12 alleen","12 alleen (beter)","misere met een praatje","13 alleen","13 alleen (beter)","open misere met een praatje"]; // excluding: ,"troela"];
const BID_PAS=0,BID_RIK=1,BID_RIK_BETER=2,BID_NEGEN_ALLEEN=3,BID_NEGEN_ALLEEN_BETER=4,BID_PICO=5,BID_TIEN_ALLEEN=6,BID_TIEN_ALLEEN_BETER=7,BID_ELF_ALLEEN=8,BID_ELF_ALLEEN_BETER=9,BID_MISERE=10,BID_TWAALF_ALLEEN=11,BID_TWAALF_ALLEEN_BETER=12,BID_MISERE_MET_EEN_PRAATJE=13,BID_DERTIEN_ALLEEN=14,BID_DERTIEN_ALLEEN_BETER=15,BID_OPEN_MISERE_MET_EEN_PRAATJE=16,BID_TROELA=17;
const BIDS_ALL_CAN_PLAY=["pico","misere","open misere","open misere met een praatje"];
const BID_RANKS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]; // how I played it (bid pass excluded (always rank 0))
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
        this._players=players;

        this._playerbids=[];
        // replace undefined players by emulated players and register myself as player event listener
        let player=this._players.length;
        while(--player>=0){
            if(!this._players[player])this._players[player]=new EmulatedPlayer(MY_NAME,this);else this._players[player].addEventListener(this);
            this._playerbids.push([]);
        }

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
    }

    get numberOfPlayers(){return this._players.length;}

    // PlayerEventListener implementation
    bidMade(){
        let bid=this._players[this._player].bid; // collect the bid made by the current player
        this._playerbids[this._player].unshift(bid);
        // if the bid of the given player is above the highest bid so far register, otherwise assume 
        if(bid==BID_PAS){
            this._passBidCount++;
            // after three successive 'pas' bids, the bidding is done
            if(this._passBidCount>=3){
                this.state=INITIATE_PLAYING;
                return;
            }
        }else
        if(BID_RANKS[bid]==17){ // highest possible bid
            this.state=INITIATE_PLAYING;
            return;
        }
        // ASSERT additional bids allowed unless
        this._passBidCount=0;
        // find the next player that is allowed to bid (should be there)
        while(1){
            this._player=(this._player+1)%this.numberOfPlayers;
            if(this._playerbids[this._player].length==0)break;
            if(this._playerbids[this._player][0]!=BID_PAS)break;
        }
        // ask that player for a bid...
        this._players[this._player].makeABid(this._playerbids);
    }
    cardPlayed(player,card){

    }
    // end PlayerEventListener implementation

    set state(newstate){
        this._state=newstate;
        // if there's a state change listener, play 'online', otherwise play through the console
        switch(this._state){
            case EXPECTING_BID:this._players[this._player].makeABid(this._bids);break;
            case EXPECTING_CARD:this._players[this._player].playACard(this._trick);break;
        }
    }

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
        for(let player=1;player<=this.numberOfPlayers;player++){
            // 'pop' off numberOfCards per player
            let cardsLeftToDeal=numberOfCards;
            while(--cardsLeftToDeal>=0)
                this.deckOfCards.getFirstCard().holder=this._players[(player+this.dealer)%this._players.length];
        }
    }

    logHands(){
        this._players.forEach((player)=>{console.log("Hand of "+player+":\n")+player._cards.join("\n");});
    }

    dealCards(){
        // every player is to get 13 cards (first seven than six)
        this.dealBy(7);
        this.dealBy(6);

        this.logHands();
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
            this.playTheGame();
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
        this.dealCards(); // deal the cards
        this.startTheGame();
    }

}