/**
 * 
 */

// posssible game states
const OUT_OF_ORDER=-1,IDLE=0,DEALING=1,BIDDING=2,INITIATE_PLAYING=3,PLAYING=4;

// possible bids
// NOTE the highest possible bid (troela) is obligatory!!
const BID_NAMES=["pas","rik","rik (beter)","negen alleen","negen alleen (beter)","pico","tien alleen","tien alleen (beter)","11 alleen","11 alleen (beter)","misere","12 alleen","12 alleen (beter)","open misere","13 alleen","13 alleen (beter)","open misere met een praatje"]; // excluding: ,"troela"];
const BID_PAS=0,BID_RIK=1,BID_RIK_BETER=2,BID_NEGEN_ALLEEN=3,BID_NEGEN_ALLEEN_BETER=4,BID_PICO=5,BID_TIEN_ALLEEN=6,BID_TIEN_ALLEEN_BETER=7,BID_ELF_ALLEEN=8,BID_ELF_ALLEEN_BETER=9,BID_MISERE=10,BID_TWAALF_ALLEEN=11,BID_TWAALF_ALLEEN_BETER=12,BID_OPEN_MISERE=13,BID_DERTIEN_ALLEEN=14,BID_DERTIEN_ALLEEN_BETER=15,BID_OPEN_MISERE_MET_EEN_PRAATJE=16,BID_TROELA=17,BID_LAATSTE_SLAG_EN_SCHOPPEN_VROUW=18;
const BIDS_ALL_CAN_PLAY=[BID_PICO,BID_OPEN_MISERE,BID_OPEN_MISERE_MET_EEN_PRAATJE]; // trumpless games
const BIDS_WITH_PARTNER_IN_HEARTS=[BID_RIK_BETER,BID_TIEN_ALLEEN_BETER,BID_ELF_ALLEEN_BETER,BID_TWAALF_ALLEEN_BETER,BID_DERTIEN_ALLEEN_BETER]; // games with trump played with a partner
const BID_RANKS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,0,-1]; // how I played it (bid pass excluded (always rank 0))

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
    holdsCard(suite,rank){
        for(let card=0;card<this._cards.length;card++)
            if(this._cards[card].suite==suite&&this._cards[card].rank==rank)
                return true;
        return false;
    }
}

class RikkenTheGame extends PlayerEventListener{

    static get MY_NAME(){
        return "Me";
    }

    initializeTheGame(){
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
        this._playersBids=[];
        player=this._players.length;
        while(--player>=0){
            this._players[player].playsTheGameAtIndex(this,player);
            if(this._players[player].game!=this)
                throw new Error("Failed to register player '"+this._players[player].name+"'.");
            this._playersBids.push([]);
        }
        if(this._playersBids.length<4)throw new Error("Failed to initialize the player bids.");

        this.dealer=-1;

        this._state=OUT_OF_ORDER;

        // move the state to the IDLE state!!!!
        this.state=IDLE;

    }

    get numberOfPlayers(){return this._players.length;}
    getPlayerName(player){return(player>0&&player<this.numberOfPlayers?this._players[player].name:"");}
    
    // after dealing the cards, the game can be played
    startTheGame(){
        this.checkForTroela();
        // if a player has 3 aces the play to play is 'troela' and therefore the accepted bid
        if(this.fourthAcePlayer>=0){ // set the game to play to 'troela'
            this.bid=BID_TROELA;
            this.state=INITIATE_PLAYING;
        }else
            this.state=BIDDING;
    }

    // public methods
    getPossibleBids(){
        let possibleBids=[BID_PAS]; // player can always pass!!
        // this._highestBid contains the highest bid so far
        let possibleBid=this._highestBid+(BIDS_ALL_CAN_PLAY.indexOf(this._highestBid)<0);
        while(possibleBid<BID_TROELA){possibleBids.push(possibleBid);possibleBid++;}
        console.log("Possible bids equal to or higher than "+this._highestBid+": ",possibleBids);
        return possibleBids;
    }

    // getters
    get state(){return this._state;} 
    set state(newstate){
        this._state=newstate;
         // if there's a state change listener, play 'online', otherwise play through the console
        switch(this._state){
            case IDLE:
                this.initializeTheGame();
                break;
            case DEALING:
                this.deckOfCards.shuffle(); // shuffle the cards again
                if(this.dealCards())this.startTheGame();else console.error("Failed to deal the cards.");
                break;
            case BIDDING:
                {
                    this._player=(this.dealer+1)%this.numberOfPlayers;
                    this._highestBid=0;
                    this._highestBidPlayers=[]; // no highest bid players yet
                    for(let player=0;player<this._playersBids.length;player++)this._playersBids[player]=[]; // no bids yet
                    this._players[this._player].makeABid(this._playersBids,this.getPossibleBids());
                }
                break;
            case INITIATE_PLAYING:
                console.log("Bidding done, playing can be initiated...");
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
                        if(this._highestBidPlayers&&this._highestBidPlayers.length==0){
                            console.error("BUG: Player with highest bid vanished!");
                        }else{
                            this._player=this._highestBidPlayers[0];
                            this._players[this._player].chooseTrumpSuite();
                        }
                        break;                       
                    }
                    // a trumpless game anyone can play and that can be started immediately
                }else // in TROELA the player with the fourth ace will be the first player
                    this._player=this.fourthAcePlayer;
                this._state=PLAYING; // fall-through e.g. also doing the next stuff
            case PLAYING:
                {
                    // it's always possible to ask for the partner card blind, when there's trump!!!
                    // unless the partner card has already been played, or when the 'rikker' still has trumps!!!!
                    // if there's a partner suite (and rank) we have to check whether or not it was played or not
                    this._partnerCardPlayedStatus=(this._partnerSuite>=0?0:-1); // keep track of whether the partner card was played
                    console.log("Let the games begin!");
                    this.trick=new Trick(this._player,this._trumpSuiteIndex);
                    this._players[this._player].playACard(this._trick);
                }
                break;
        }
        if(this._eventListener)this._eventListener.stateChanged(this);
   }

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
        if(this._state==BIDDING){
            // find the next player that is allowed to bid (should be there)
            let player=this._player;
            while(1){
                player=(player+1)%this.numberOfPlayers;
                if(player==this._player){ // all have passed
                    console.log("Bidding over!");
                    this.state=INITIATE_PLAYING;
                    return;
                }
                if(this._playersBids[player].length==0)break; // when no bid so far, this is the one to ask next
                if(this._playersBids[player][0]!=BID_PAS)break; // if bid before and not passed this is the one to ask next
            }
            // ask that player for a bid
            this._player=player;
            // NOTE could have done this by: this.state=BIDDING;
            this._players[this._player].makeABid(this._playersBids,this.getPossibleBids());    
        }
    }
    trumpSuiteChosen(){
        console.log("Trump suite chosen!");
        this._trumpSuite=this._players[this._player].trumpSuite;
        // if it is a regular 'rik' ask the player to play it for the partner suite
        if(this._highestBid==BID_RIK||this._highestBid==BID_RIK_BETER)
            this._players[this._player].choosePartnerSuite();
        else // a solitary play, so we can start playing immediately
            this.state=PLAYING;
    }
    partnerSuiteChosen(){
        this._partnerSuite=this._players[this._player].partnerSuite;
        this._partnerRank=this._players[this._player].partnerRank;
        console.log("Partner with card "+new Card(this._partnerSuite,this._partnerRank).getTextRepresentation()+" chosen!");
        // I have to set the partner of all players (although this is not revealed), so technically we cannot do that yet????
        // basically the player with the partner card knows so we can set its partner of course
        // the others will know they are not with this player!!!
        self.state=PLAYING;
    }
    cardPlayed(){
        console.log("Card played");
        let card=this._players[this._player].card;
        // add the card to the trick
        this._trick.addCard(card);
        // is the trick complete?
        if(this._trick.numberOfCards==4){ // yes
            this._tricks.push(this._trick); // register the trick
            // who won the trick?????
            // the first player of the trick determines the play suite 
            // BUT could be asking for the partner ace/king blind)
            //     in that case that player can never win the trick but the partner would
            if(this._askingForThePartnerCardBlind){
                // the partner must have won the game
                // TODO we should actually check!!!!
                this._players[this._players[this._trick.firstPlayer].partner].trickWon(this._tricks.length);
            }else{
                let highestCardPlayer=this._trick.firstPlayer;
                let playSuite=this._trick[highestCardPlayer].suite;
                for(let player=1;player<4;player++){
                    if(compareCardsWithPlayAndTrumpSuite(this._trick[player],this._trick(highestCardIndex),this._trumpSuite)>0)
                        highestCardPlayer=player;
                }
                if(this._partnerCardPlayedStatus==0){ // partner card not received yet
                    let partner=this._trick.getCardPlayer(this._partnerSuite,this._partnerRank);
                    if(partner>=0){
                        this._partnerCardPlayedStatus=1; // this means the user cannot ask for this card again!!!
                        // the partner is now known
                        this._players[this._highestBidPlayers[0]].partner=partner;
                        this._players[partner].partner=this.highestBidPlayers[0];
                        // TODO the other two should also point to each other
                    }
                }
                // register the trick with the player who won
                this._players[this.highestCardPlayer].trickWon(this._tricks.length);
            }
            // initialize a new trick with the first player to play
            this._trick=new Trick(this._player);
        }else{ // not yet, more cards to play in this trick
            this._player=(this._player+1)%4;
        }
    }
    // end PlayerEventListener implementation

    // check whether 'troela', and if so initialize the play accordingly
    checkForTroela(){
        let threeAcePlayer=-1,oneAcePlayer=-1; // determine the player with 1 and 3 aces
        // get the number of aces each player has
        for(let player=this.numberOfPlayers-1;player>=0;player--){
            let aces=this._players[player].getNumberOfCardsWithRank(RANK_ACE);
            console.log("Number of aces in hand '"+this._players[player].name+"': "+aces+".");
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