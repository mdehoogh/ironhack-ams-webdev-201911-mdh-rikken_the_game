/**
 * 
 */

// posssible game states
const OUT_OF_ORDER=-1,IDLE=0,DEALING=1,BIDDING=2,INITIATE_PLAYING=3,TRUMP_CHOOSING=4,PARTNER_CHOOSING=5,PLAYING=6,FINISHING=7;

// possible bids
// NOTE the highest possible bid (troela) is obligatory!!
const BID_NAMES=["pas","rik","rik (beter)","negen alleen","negen alleen (beter)","pico","tien alleen","tien alleen (beter)","11 alleen","11 alleen (beter)","misere","12 alleen","12 alleen (beter)","open misere","13 alleen","13 alleen (beter)","open misere met een praatje"]; // excluding: ,"troela"];
const BID_PAS=0,BID_RIK=1,BID_RIK_BETER=2,BID_NEGEN_ALLEEN=3,BID_NEGEN_ALLEEN_BETER=4,BID_PICO=5,BID_TIEN_ALLEEN=6,BID_TIEN_ALLEEN_BETER=7,BID_ELF_ALLEEN=8,BID_ELF_ALLEEN_BETER=9,BID_MISERE=10,BID_TWAALF_ALLEEN=11,BID_TWAALF_ALLEEN_BETER=12,BID_OPEN_MISERE=13,BID_DERTIEN_ALLEEN=14,BID_DERTIEN_ALLEEN_BETER=15,BID_OPEN_MISERE_MET_EEN_PRAATJE=16,BID_TROELA=17,BID_LAATSTE_SLAG_EN_SCHOPPEN_VROUW=18;
const BIDS_ALL_CAN_PLAY=[BID_PICO,BID_OPEN_MISERE,BID_OPEN_MISERE_MET_EEN_PRAATJE]; // trumpless games
const BIDS_WITH_PARTNER_IN_HEARTS=[BID_RIK_BETER,BID_TIEN_ALLEEN_BETER,BID_ELF_ALLEEN_BETER,BID_TWAALF_ALLEEN_BETER,BID_DERTIEN_ALLEEN_BETER]; // games with trump played with a partner
const BID_RANKS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,0,-1]; // how I played it (bid pass excluded (always rank 0))
// possible ranks (in Dutch)
const RANK_NAMES=["twee","drie","vier","vijf","zes","zeven","acht","negen","tien","boer","vrouw","heer","aas"];

/**
 * to be registered as event listener with a single RikkenTheGame instance (in the constructor)
 */
class RikkenTheGameEventListener{
    stateChanged(fromstate,tostate){
        if(new.target===RikkenTheGameEventListener)
            throw new Error("You're supposed to create a subclass of RikkenTheGameEventListener!");
    }
    errorOccurred(error){
        if(new.target===RikkenTheGameEventListener)
            throw new Error("You're supposed to create a subclass of RikkenTheGameEventListener!");
    }
}

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
    // adding a flag indicating whether or not the first player can ask for the partner card
    constructor(firstPlayer,trumpSuite,canAskForPartnerCardBlind){
        super(); // using 4 fixed positions for the trick cards so we will know who played them!!!!
        this.firstPlayer=firstPlayer;
        this.trumpSuite=trumpSuite;
        this.canAskForPartnerCardBlind=canAskForPartnerCardBlind;
        this._playSuite=-1; // the suite of the trick (most of the time the first card)
        // let's keep track of the highest card
    }
    askingForPartnerCard(){
        if(this._cards.length>0)
            throw new Error("Only the first player can ask for the partner card blind!");
        if(!this.canAskForPartnerCardBlind)
            throw new Error("Cannot ask for the partner card blind (anymore).");
        this.playSuite=this.trumpSuite; // the play suite becomes the trump suite
    }
    addCard(card){
        if(!super.addCard(card))return false;
        // if no play suite is defined yet, this (first) card defines the play suite!!!
        if(this.playSuite<0)this.playSuite=card.suite;
    }
    getPlayerWhoWon(){
        // find out which player won the trick
        // it's either the highest trump card if any otherwise the highest card 
    }
    holdsCard(suite,rank){
        for(let card=0;card<this._cards.length;card++)
            if(this._cards[card].suite==suite&&this._cards[card].rank==rank)
                return true;
        return false;
    }
    get playSuite(){
        return this._playSuite;
    }
}

class RikkenTheGame extends PlayerEventListener{

    static get MY_NAME(){
        return "Me";
    }

    _initializeTheGame(){
        // this means moving the game to the initialize state
        // it's easiest to simply create a new deck of cards each time (instead of repossessing the cards)
        this.deckOfCards=new DeckOfCards();
        // the successor of the current dealer is to deal next
        this.dealer=(this.dealer+1)%this.numberOfPlayers;
        this._player=0; // the current player
        this._trumpSuite=-1; // the trump suite
        this._partnerSuite=-1;this._partnerRank=-1; // the card of the partner (for games with trump and a partner)
        this._trick=null; // the current trick
        this._tricks=[]; // the tricks played
        this._highestBidPlayers=[]; // all the players that made the highest bid (and are playing it)
        this._partnerCardPlayedStatus=-1; // whether to check for the partner card of not (-1: not at all, 0=still not played, 1=played)
        this._askingForThePartnerCardBlind=false; // when a user asks for the partner card blind
        this._passBidCount=0; // the number of players that bid 'pass'
        this._playersBids=[]; // at most 5 players
        let player=this.numberOfPlayers;while(--player>=0)this._playersBids.push([]);
    }

    constructor(players,eventListener){

        super();

        if(eventListener&&!(eventListener instanceof RikkenTheGameEventListener))
            throw new Error("Invalid event listener defined.");
        this._eventListener=eventListener;

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
                this._players.unshift(new EmulatedPlayer(RikkenTheGame.MY_NAME));
        }
        // register the game with each of the players and initialie the player bids as well
        ////this._passBidCount=0; // the number of players that bid 'pass'
        ////this._playersBids=[];
        player=this._players.length;
        while(--player>=0){
            this._players[player].playsTheGameAtIndex(this,player);
            if(this._players[player].game!=this)
                throw new Error("Failed to register player '"+this._players[player].name+"'.");
            ////this._playersBids.push([]);
        }
        ////if(this._playersBids.length<4)throw new Error("Failed to initialize the player bids.");

        this.dealer=-1;

        this._state=OUT_OF_ORDER;

        // move the state to the IDLE state!!!!
        this.state=IDLE;

    }

    get numberOfPlayers(){return this._players.length;}
    //getPlayerName(player){return(player>0&&player<this.numberOfPlayers?this._players[player].name:"");}
    
    /**
     * setting the partner (of the highest bidder) means all partners are known
     */
    _setPartners(partner1,partner2){
        let teams=[[partner1,partner2],[]];
        this._players.forEach((player)=>{if(player._index!==partner1&&player._index!==partner2)teams[1].push(player._index);});
        teams.forEach((team)=>{
            console.log("Team: ",team);
            this._players[team[0]].partner=team[1];
            this._players[team[1]].partner=team[0];
        });
    }

    // after dealing the cards, the game can be played
    _startTheGame(){
        this._checkForTroela();
        // if a player has 3 aces the play to play is 'troela' and therefore the accepted bid
        if(this.fourthAcePlayer>=0){ // set the game to play to 'troela'
            this._highestBid=BID_TROELA; // register as (final) highest bid
            // set the current player to the fourth ace player (which will take care of assigning all other partner properties)
            this._setPartners(this.fourthAcePlayer,this._highestBidPlayers[0]);
            // no need to choose trump or partner, so we can start playing the game with the fourth ace player to play first!!
            this._startPlaying(this.fourthAcePlayer);
        }else
            this.state=BIDDING;
    }

    /**
     * returns an array with possible bid numbers
     */
    _getPossibleBids(){
        let possibleBids=[BID_PAS]; // player can always pass!!
        // this._highestBid contains the highest bid so far
        let possibleBid=this._highestBid+(BIDS_ALL_CAN_PLAY.indexOf(this._highestBid)<0);
        while(possibleBid<BID_TROELA){possibleBids.push(possibleBid);possibleBid++;}
        console.log("Possible bids equal to or higher than "+this._highestBid+": ",possibleBids);
        return possibleBids;
    }
    /**
     * returns true when the player with the highest bid is playing with a partner
     */
    _canAskForPartnerCardBlind(){
        // the player to play first (i.e. the current player) should be the highest bid player
        if(this._player==this._highestBidPlayers[0]){
            if(this.partnerSuite>=0){ // there is a partner suite (i.e. the highest bid player is not playing alone)
                if(this._partnerCardPlayedStatus==0){ // the partner card can be played and has not been played yet
                    // oops, almost forgot: the player must not have any cards in the given suite anymore
                    if(this._players[this._player].getSuites().indexOf(this.partnerSuite)<0)
                        return true;
                }
            }
        }
        return false;
    }
    /**
     * returns a user friendly array of player bids objects
     */
    _getPlayerBidsObjects(){
        let playerBidsObjects=[];
        this._playersBids.forEach((playerBids)=>{
            let playerBidsObject={name:this._players[playerBidsObjects.length].name,bids:[]};
            // use unshift NOT push as the bids are stored reverse order 
            playerBids.forEach((playerBid)=>{playerBidsObject.bids.unshift(BID_NAMES[playerBid])});
            playerBidsObjects.push(playerBidsObject);
        });
        return playerBidsObjects;
    }
    /**
     * returns a user friendly object of the cards in the trick so far (by player name)
     */
    _getTrickObjects(){
        let trickObjects=[];
        for(let trickCardIndex=0;trickCardIndex<this._trick.numberOfCards;trickCardIndex++)
            trickObjects.push({
                name:this._players[(trickCardIndex+this._trick.firstPlayer)%this.numberOfPlayers].name,
                card:this._trick._cards[trickCardIndex]
            });
        return trickObjects;
    }

    set state(newstate){
        let oldstate=this._state;
        this._state=newstate;
        // allow preparations by the state change event listener
        if(this._eventListener)this._eventListener.stateChanged(oldstate,this._state);
         // if there's a state change listener, play 'online', otherwise play through the console
        switch(this._state){
            case IDLE:
                this._initializeTheGame();
                break;
            case DEALING:
                this.deckOfCards.shuffle(); // shuffle the cards again
                if(this.dealCards())this._startTheGame();else console.error("Failed to deal the cards.");
                break;
            case BIDDING:
                {
                    this._player=(this.dealer+1)%this.numberOfPlayers;
                    console.log("The first player to bid: ",this._player);
                    this._highestBid=0;
                    this._highestBidPlayers=[]; // no highest bid players yet
                    this._players[this._player].makeABid(this._getPlayerBidsObjects(),this._getPossibleBids());
                }
                break;
            case PLAYING:
                {
                    // it's always possible to ask for the partner card blind, when there's trump!!!
                    // unless the partner card has already been played, or when the 'rikker' still has trumps!!!!
                    // if there's a partner suite (and rank) we have to check whether or not it was played or not
                    this._partnerCardPlayedStatus=(this._partnerSuite>=0?0:-1); // keep track of whether the partner card was played
                    console.log("Let the games begin!");
                    this._trick=new Trick(this._player,this._trumpSuiteIndex,this._canAskForPartnerCardBlind());
                    this._players[this._player].playACard(this._getTrickObjects());
                }
                break;
        }
   }

   /**
    * starts playing with player to start playing
    * @param {*} player 
    */
    _startPlaying(player){
       this._player=player;
       this.state=PLAYING;
    }
    /**
     * determines the rank of the partner card to be asked for
     */
    _getPartnerRank(){
        let partnerRank=RANK_ACE;
        while(this._players[this._player].getNumberOfCardsWithRank(partnerRank)==4)partnerRank--;
        return partnerRank;
    }
    /**
     * set the trump suite with _setTrumpSuite
     * if the game played is not played by a single person (without a partner), the partner suite is requested next passing the rank of the card to ask for
     * @param {*} trumpSuite 
     */
    _setTrumpSuite(trumpSuite){
        this._trumpSuite=trumpSuite;
        // is this a trump game with a partner (ace/king) to ask for?
        // I guess we can pass along the rank, which means we can choose the rank ourselves
        if(this._highestBid==BID_RIK||this._highestBid==BID_RIK_BETER){ // yes, a regular 'rik'
            this._partnerRank=this._getPartnerRank();
            this._players[this._player].choosePartnerSuite(RANK_NAMES[this._partnerRank]); // passing along the rank of the card the user can choose
        }else // a solitary play, so we can start playing immediately
            this._startPlaying((this.dealer+1)%this.numberOfPlayers);
    }
    _setPartnerSuite(partnerSuite){
        this._partnerSuite=partnerSuite;
        // the only player that knows its partner is the player that holds this card
        // the other players will still be in the dark
        this._startPlaying((this.dealer+1)%this.numberOfPlayers);
    }
    
    /**
     * determines the possible trump suites the current player may choose
     */
    _getPossibleTrumpSuites(){

    }
    _doneBidding(){
        // ASSERT should not be called when playing 'troela'
        console.log("Bidding is over, determine whether to ask for trump or the partner card...");
        // the player next to the dealer is always the player to start playing
        if(this._highestBid!=BID_PAS){
            // is it a trump game?
            if(BIDS_ALL_CAN_PLAY.indexOf(this._highestBid)<0){ // yes
                // if the trump is not known we have to ask for the trump suite (color) first
                if(BIDS_WITH_PARTNER_IN_HEARTS.indexOf(this._highestBid)<0){
                    this._player=this._highestBidPlayers[0]; // TODO should this be here?
                    // pass along all the suites the player has (from which to choose from)
                    this._players[this._player].chooseTrumpSuite(this._players[this._player].getSuites());
                }else // trump is known (which can only be hearts) TODO what if this player does not have any trump cards?????????
                    this._setTrumpSuite(CARD_SUITES.indexOf("heart")); // set the trump suite directly!!!
            }else // not a trump suite
                // played by the highest bidder on his own
                this._startPlaying((this.dealer+1)%this.numberOfPlayers);
        }else{ // everybody passed, so also not a trump suite
            this._highestBid=BID_LAATSTE_SLAG_EN_SCHOPPEN_VROUW;
            // everybody is playing for him/herself i.e. nobody has a partner
            this._startPlaying((this.dealer+1)%this.numberOfPlayers);
        }
    }
    // check whether 'troela', and if so initialize the play accordingly
    _checkForTroela(){
        let threeAcePlayer=-1,oneAcePlayer=-1; // determine the player with 1 and 3 aces
        // get the number of aces each player has
        for(let player=this.numberOfPlayers-1;player>=0;player--){
            let aces=this._players[player].getNumberOfCardsWithRank(RANK_ACE);
            console.log("Number of aces in hand '"+this._players[player].name+"': "+aces+".");
            if(aces==2||aces==4)break; // if a player has either 2 or 4 aces no player can have 3
            if(aces==3)threeAcePlayer=player;else oneAcePlayer=player;
        }
        this._highestBidPlayers=[threeAcePlayer]; // TODO perhaps this should be done elsewhere?????
        this.fourthAcePlayer=(threeAcePlayer>=0?oneAcePlayer:-1);
    }

    // public methods

    // getters
    get state(){return this._state;} 

    logBids(){
        console.log("Bids after the bid by player "+this._players[this._player].name+":");
        for(let player=0;player<this._playersBids.length;player++){
            console.log("\t"+this._players[player].name+":");
            if(this._playersBids&&Array.isArray(this._playersBids)&&this._playersBids.length>player)
                console.log("\t\t",this._playersBids[player]);
            else
                console.log("\t\t(invalid)");
        }
    }

    // PlayerEventListener implementation
    bidMade(){
        // 1. register the bid
        let bid=this._players[this._player].bid; // collect the bid made by the current player
        console.log("Bid by "+this._players[this._player].name+": '"+BID_NAMES[bid]+"'.");

        // TODO check whether this bid is actually higher than the highest bid so far (when not a pass bid)
        if(this._playersBids&&Array.isArray(this._playersBids)&&this._playersBids.length>this._player){
            this._playersBids[this._player].unshift(bid); // prepend the new bid to the bids of the current player
            this.logBids(); // show the current bids
        }else{
            console.error("BUG: Unable to store the bid!");
            return;
        }
        // 2. check if this bid ends the bidding
        if(bid!=BID_PAS){
            ////// WRONG!!!!! this._passBidCount=0; // start counting over
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
                    this.state=PLAY_REPORTING;
                }
            }
        }
        // 3. if still in the bidding state, ask the next player that is still allowed to bid for a bid
        if(this._state==BIDDING){
            // count the number of pass bids we have
            let passBidCount=0;
            let player=this.numberOfPlayers;
            while(--player>=0){
                //////console.log("Checking player bids: ",this._playersBids[player]);
                if(this._playersBids[player].length==0){passBidCount=0;break;} // somebody yet to bid
                if(this._playersBids[player][0]===BID_PAS)passBidCount++;
            }
            // if we have a total of 3 pass bids, bidding is over
            if(passBidCount<3){ // there must still be another player that can bid
                console.log("Last bid done by player "+this._player+".");
                // find the next player that is allowed to bid (should be there)
                let player=this._player;
                while(1){
                    player=(player+1)%this.numberOfPlayers;
                    //////if(player===this._player)break; // nobody was allowed to bid anymore
                    if(this._playersBids[player].length==0)break; // when no bid so far, this is the one to ask next
                    if(this._playersBids[player][0]!=BID_PAS)break; // if bid before and not passed this is the one to ask next
                    console.log("Player '"+this._players[player].name+"' can't bid anymore!");
                }
                /////if(player!==this._player){ // another player can still bid
                    this._player=player;
                    console.log("Player "+this._player+"next to bid!");
                    // NOTE could have done this by: this.state=BIDDING;
                    this._players[this._player].makeABid(this._getPlayerBidsObjects(),this._getPossibleBids());
                /////}    
            }else
                this._doneBidding();
        }
    }

    /**
     * to be called by the player with the highest bid when selecting the trump suite
     */
    trumpSuiteChosen(){
        console.log("Trump suite chosen by a player!");
        this._setTrumpSuite(this._players[this._player].trumpSuite);
    }
    /**
     * to be called by the player with the highest bid when selecting the partner suite
     */
    partnerSuiteChosen(){
        this._setPartnerSuite(this._players[this._player].partnerSuite);
    }

    cardPlayed(){
        console.log("Card played");
        let card=this._players[this._player].card;
        // move the card into the trick (effectively removing it from the player cards)
        this._trick.addCard(card);
        if(card._holder!==this._trick)throw new Error("Failed to add the card to the trick!");
        // is the trick complete?
        if(this._trick.numberOfCards==4){ // no more nulls in the trick
            // 1. register the trick
            this._tricks.push(this._trick); // register the trick
            // 2. determine whether this trick contains the partner card of the highest bidder
            let partner=-1;
            if(this._partnerCardPlayedStatus==0){ // partner card not received yet
                partner=this._trick.getCardPlayer(this._partnerSuite,this._partnerRank);
                if(partner>=0){
                    this._partnerCardPlayedStatus=1; // this means the user cannot ask for this card again!!!
                    // the partner is now known, so everyone now knows its partner
                    this._setPartners([this._highestBidPlayers[0],partner]);
                    /* replacing:
                    this._players[this._highestBidPlayers[0]].partner=partner;
                    this._players[partner].partner=this.highestBidPlayers[0];
                    */
                    // TODO the other two should also point to each other
                }
            }
            // who won the trick?????
            // the first player of the trick determines the play suite 
            // BUT could be asking for the partner ace/king blind)
            //     in that case that player can never win the trick but the partner would
            if(this._askingForThePartnerCardBlind){
                if(partner>=0){
                    this._players[partner].trickWon(this._tricks.length);
                    this._player=partner;
                }else
                    console.error("Asking for the partner card blind, but partner card not in trick!!!!");
            }else{
                let highestCardPlayer=this._trick.firstPlayer;
                let playSuite=this._trick._cards[highestCardPlayer].suite;
                for(let player=1;player<4;player++)
                    if(compareCardsWithPlayAndTrumpSuite(this._trick._cards[player],this._trick._cards[highestCardPlayer],this._trumpSuite)>0)
                        highestCardPlayer=player;
                // register the trick with the player who won
                this._players[highestCardPlayer].trickWon(this._tricks.length);
                this._player=highestCardPlayer;
                console.log("The trick was won by player #"+this.highestCardPlayer+": '"+this._players[this.highestCardPlayer].name+"'.");
            }
            // game over?????? i.e. all 13 tricks complete
            if(this._tricks.length==13){
                this.state=FINISHING;
                return;
            }
            // initialize a new trick with the first player to play
            this._trick=new Trick(this._player,this._trumpSuiteIndex,this._canAskForPartnerCardBlind());
        }else // not yet, more cards to play in this trick
            this._player=(this._player+1)%4;
        // and ask the new current player to play a card
        this._players[this._player].playACard(this._getTrickObjects());
    }
    // end PlayerEventListener implementation

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
    /*
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
        this.state=PLAYING;
    }
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
    */

    get bid(){return this._bid;} // the bid so far
    get player(){return this._player;}

    start(){
        if(this._state!==IDLE)this.state=IDLE; // if not in the IDLE state go there first
        if(this._state===IDLE)this.state=DEALING; // only from the IDLE state can we start dealing
    }

}