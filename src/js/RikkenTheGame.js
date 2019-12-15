/**
 * 
 */

// posssible game states
const OUT_OF_ORDER=-1,IDLE=0,DEALING=1,BIDDING=2,INITIATE_PLAYING=3,TRUMP_CHOOSING=4,PARTNER_CHOOSING=5,PLAYING=6,CANCELING=7,FINISHED=8;

// possible bids
// NOTE the highest possible bid (troela) is obligatory!!
const BID_NAMES=["pas","rik","rik (beter)","negen alleen","negen alleen (beter)","pico","tien alleen","tien alleen (beter)","11 alleen","11 alleen (beter)","misere","12 alleen","12 alleen (beter)","open misere","13 alleen","13 alleen (beter)","open misere met een praatje","troela","schoppen vrouw en laatste slag"];
const BID_PAS=0,BID_RIK=1,BID_RIK_BETER=2,BID_NEGEN_ALLEEN=3,BID_NEGEN_ALLEEN_BETER=4,BID_PICO=5,BID_TIEN_ALLEEN=6,BID_TIEN_ALLEEN_BETER=7,BID_ELF_ALLEEN=8,BID_ELF_ALLEEN_BETER=9,BID_MISERE=10,BID_TWAALF_ALLEEN=11,BID_TWAALF_ALLEEN_BETER=12,BID_OPEN_MISERE=13,BID_DERTIEN_ALLEEN=14,BID_DERTIEN_ALLEEN_BETER=15,BID_OPEN_MISERE_MET_EEN_PRAATJE=16,BID_TROELA=17,BID_LAATSTE_SLAG_EN_SCHOPPEN_VROUW=18;
const BIDS_ALL_CAN_PLAY=[BID_PICO,BID_OPEN_MISERE,BID_OPEN_MISERE_MET_EEN_PRAATJE]; // trumpless games
const BIDS_WITH_PARTNER_IN_HEARTS=[BID_RIK_BETER,BID_TIEN_ALLEEN_BETER,BID_ELF_ALLEEN_BETER,BID_TWAALF_ALLEEN_BETER,BID_DERTIEN_ALLEEN_BETER]; // games with trump played with a partner
const BID_RANKS=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,0,-1]; // how I played it (bid pass excluded (always rank 0))

// each bid has a certain amount of points to receive when winning the game
const BID_POINTS=[0,1,1,2,2,4,3,3,4,4,5,5,5,6,10,2,2];

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

    makeABid(playerbids){

    }
    chooseTrumpSuite(suites){

    }
    choosePartnerSuite(suites){

    }
    playACard(){

    }

}

class Trick extends CardHolder{

    // MDH@07DEC2019: game data moved over to PlayerGame instance (as passed to each player)
    //                canAskForPartnerCard blind now determined by the game (engine) itself

    // by passing in the trump player (i.e. the person that can ask for the partner card)
    constructor(firstPlayer,trumpSuite,partnerSuite,partnerRank,canAskForPartnerCard){ // replacing: trumpSuite,partnerSuite,partnerRank,trumpPlayer){
        super(); // using 4 fixed positions for the trick cards so we will know who played them!!!!
        console.log(">>> New trick can ask for partner card: "+canAskForPartnerCard+".");
        this._firstPlayer=firstPlayer;
        this._trumpSuite=trumpSuite; // for internal use to be able to determine the winner of a trick
        this._partnerSuite=partnerSuite;this._partnerRank=partnerRank; // need this when it's being asked to determine the winner
        this._canAskForPartnerCard=canAskForPartnerCard; // -1 blind, 0 not, 1 non-blind
        this._askingForPartnerCard=0; // the 'flag' set by the trump player when asking for the partner card in a trick
        this._playSuite=-1; // the suite of the trick (most of the time the suite of the first card)
        this._winnerCard=-1; // the card of the winner (note: NOT transformed to the actual player index yet)
        // let's keep track of the highest card
    }

    get firstPlayer(){return this._firstPlayer;}

    // the winner exposed is the actual player who won
    get winner(){return(this._winnerCard<0?-1:(this._winnerCard+this._firstPlayer)%4);}
    
    // MDH@07DEC2019: moved from here to the game (as a PlayerGame instance)
    /*
    get trumpPlayer(){return this._trumpPlayer;} // exposes the current trump player
    get partnerSuite(){return this._partnerSuite;}
    get partnerRank(){return this._partnerRank;}
    */
    get askingForPartnerCard(){return this._askingForPartnerCard;}
    // pass in -1 when asking the partner card blind, or +1 when asking for it (non-blind)
    set askingForPartnerCard(askingForPartnerCard){
        if(askingForPartnerCard!=0&&this.numberOfCards>0)
            throw new Error("Opgeven de partner aas/heer (blind) te vragen niet meer toegestaan.");
        this._askingForPartnerCard=askingForPartnerCard;
        console.log("Asking for partner card set to "+this._askingForPartnerCard+".");
    }

    _setWinnerCard(winnerCard){
        this._winnerCard=winnerCard;
        console.log("Trick winner card: "+winnerCard+".");
    }

    /**
     * returns the card played by (the actual) player (as used for showing the trick cards)
     * @param {*} player 
     */
    getPlayerCard(player){
        let playerCard=(this._firstPlayer>=0?(player+4-this._firstPlayer)%4:null);
        return(playerCard>=0&&playerCard<this.numberOfCards?this._cards[playerCard]:null);
    }

    /*
    askingForPartnerCard(){
        if(this._cards.length>0)
            throw new Error("Only the first player can ask for the partner card blind!");
        if(!this._canAskForPartnerCardBlind)
            throw new Error("Cannot ask for the partner card blind (anymore).");
        this._playSuite=this._trumpSuite; // the play suite becomes the trump suite
    }
    */
    // NOTE addCard is NOT _addCard of the superclass! this is because we should set the holder on the card to add!!!!
    addCard(card){
        let numberOfCardsNow=this.numberOfCards;
         // if the flag of asking for the partner card blind is set, preset the 
        card.holder=this; // move the card to this trick by setting the holder property (will take care of adding/removing the card)
        if(this.numberOfCards<=numberOfCardsNow)
            throw new Error("Failed to add the card to the trick.");
        // ASSERT card added successfully
        if(this._askingForPartnerCard!=0&&this._trumpSuite<0)
            throw new Error("BUG: Asking for the partner card, but playing a game without trump.");
        // if the partner card is being asked for blind everyone has to play the partner card suite
        // MDH@09DEC2019: OOPS I was already using this._partnerSuite here BUT still after actually taking it out (now in again)
        if(this._playSuite<0)this._playSuite=(this._askingForPartnerCard<0?this._partnerSuite:card.suite);
        // ASSERT this._playSuite now definitely non-negative, so
        this._canAskForPartnerCard=0; // use the right property bro'
        // update winner
        if(numberOfCardsNow>0){
            // MDH@09DEC2019: when asking for the partner card only the partner card can ever win (even if there's trump!!)
            //                but we need to know whether the partner card was already thrown
            //                SOLUTION: (NEAT) it's easiest to simply ignore trump is the partner card is being asked for!!!!!!
            if(compareCardsWithPlayAndTrumpSuite(card,this._cards[this._winnerCard],this._playSuite,(this._askingForPartnerCard!=0?-1:this._trumpSuite))>0)
                this._setWinnerCard(numberOfCardsNow);
        }else // after the first card the first player is the winner of course
            this._setWinnerCard(0);
    }
    getCardPlayer(suite,rank){
        for(let player=0;player<this._cards.length;player++)
            if(this._cards[player].suite===suite&&this._cards[player].rank===rank)
                return (this._firstPlayer+player)%4; // TODO can we assume 4 players in total?????
        return -1;
    }

    // public getters
    get playSuite(){return this._playSuite;}
    get firstPlayer(){return this._firstPlayer;}

    /*
    get trumpSuite(){return this._trumpSuite;}
    */
    get canAskForPartnerCard(){return this._canAskForPartnerCard;}
}

class RikkenTheGame extends PlayerGame{

    static get MY_NAME(){
        return "Me";
    }

    // called when RikkenTheGame moves into the IDLE state
    _gameInitialized(){
        // reposses the cards in the tricks
        if(this._tricks&&this._tricks.length>0){
            console.log("Collecting trick cards.");
            this._tricks.forEach((trick)=>{while(1){let card=trick.getFirstCard();if(!card)break;card.holder=this.deckOfCards;}});
        }
        if(this.deckOfCards.numberOfCards!=52){
            alert("BUG: Deck of cards holds only "+this.deckOfCards.numberOfCards+".");
            return false;
        }
        // the successor of the current dealer is to deal next
        this.dealer=(this.dealer+1)%this.numberOfPlayers;
        this._trumpSuite=-1; // the trump suite
        this._partnerSuite=-1;this._partnerRank=-1; // the card of the partner (for games with trump and a partner)
        this._trick=null; // the current trick
        this._tricks=[]; // the tricks played
        this._highestBid=-1; // no highest bid yet
        this._highestBidPlayers=[]; // all the players that made the highest bid (and are playing it)
        this._playersBids=[]; // at most 5 players
        let player=this.numberOfPlayers;while(--player>=0)this._playersBids.push([]);
        // MDH@08DEC2019: keep track of the partner of each player in this.partners
        //                from the start of the game
        this._partners=null;
        this._arePartnersKnown=false; // should be set to true as soon the partner card was played!!
        return true;
    }

    constructor(players,eventListener){

        super();

        if(eventListener&&!(eventListener instanceof RikkenTheGameEventListener))
            throw new Error("Invalid event listener defined.");
        this._eventListener=eventListener;

        if(!players||!Array.isArray(players)||players.length<4)
            throw new Error("Not enough players!");
        
        this._points=[]; // the points each player has won
        this._deltaPoints=[]; // what is won/lost in a single game
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
            this._points.unshift(0); // start with zero points
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

        // it's easiest to simply create a new deck of cards each time (instead of repossessing the cards)
        this.deckOfCards=new DeckOfCards();
        
        this._player=-1; // TODO do we need this at all?????

        this.dealer=-1;

        // before asking for the trump and the partner suite, store the possible trump/partner suites
        this._possibleTrumpSuites=[];
        this._possiblePartnerSuites=[];

        this._state=OUT_OF_ORDER;

        // shuffle parameters
        this._shuffleCount=6;
        this._topopMinimum=11;
        this._topopMaximum=41;

        // move the state to the IDLE state!!!!
        this.state=IDLE;

    }

    get numberOfPlayers(){return this._players.length;}
    
    get numberOfTricksPlayed(){return this._tricks.length;}

    // PlayerGame implementation
    getTrumpSuite(){return this._trumpSuite;}
    getPartnerSuite(){return this._partnerSuite;}
    getPartnerRank(){return this._partnerRank;}
    getNumberOfTricksWonByPlayer(player){
        return(player>=0&&player<this.numberOfPlayers?this._players[player].numberOfTricksWon:0);
    }
    getPartnerName(player){ // here player denotes
        let partner=(player>=0&&player<this.numberOfPlayers?this._players[player].partner:-1);
        return(partner>=0&&partner<this.numberOfPlayers?this._players[partner].name:null);
    }
    // MDH@06DEC2019: the trump player is the player that can ask for the partner suite and rank              
    getTrumpPlayer(){
        // only when playing a 'rik' game (with trump, played with a partner, but not troela, we have a trump player)
        return(this._highestBid==BID_RIK||this._highestBid==BID_RIK_BETER?this._highestBidPlayers[0]:-1);
    }
    // end PlayerGame implementation

    getPlayerAtIndex(playerIndex){return(playerIndex>=0&&playerIndex<this.numberOfPlayers?this._players[playerIndex]:null);}

    getPlayerName(playerIndex){let player=this.getPlayerAtIndex(playerIndex);return(player?player.name:null);}

    // if asked for the team name adds the name of the partner as well
    getTeamName(playerIndex){
        let teamName="";
        let player=this.getPlayerAtIndex(playerIndex);
        if(player){teamName=player.name;if(player.partner>=0)teamName+"+"+this.getPlayerName(player.partner);}
        return(teamName.length>0?teamName:"?");
    }

    isPlayerPartner(playerIndex,partnerIndex){let player=this.getPlayerAtIndex(playerIndex);return(player?partnerIndex===player.partner:false);}

    getHighestBidders(){return this._highestBidPlayers;} // return all players that play the highest bid (possibly more than one)

    getHighestBid(){return this._highestBid;} // the bid of the game that is being played

    getLastBids(){
        let lastBids=[];this._highestBidPlayers.forEach((highestBidPlayer)=>{lastBids.push(highestBidPlayer[0]);});return lastBids;
    }

    getPartner(playerIndex){
        let player=(playerIndex>=0&&playerIndex<this.numberOfCards?this._players[playerIndex]:null);
        return(player?player.partner:-1);
    }

    getPlayerWithCard(suite,rank){
        for(let playerIndex=0;playerIndex<this.numberOfPlayers;playerIndex++)
            if(this._players[playerIndex].containsCard(suite,rank))
                return playerIndex;
        alert("BUG BUG BUG: Player with card ("+SUITE_NAMES[suite]+","+RANK_NAMES[rank]+") not found!");
        return -1;
    }

    isPartnerCard(card){return(card.suite==this._partnerSuite&&card.rank==this._partnerRank);}

    //getPlayerName(player){return(player>0&&player<this.numberOfPlayers?this._players[player].name:"");}
    
    /**
     * setting the partner (of the highest bidder) means all partners are known
     */
    _setPartners(partner1,partner2){
        console.log("Player #"+(partner1)+" and #"+(partner2)+" teaming up!");
        // MDH@08DEC2019: instead of directly setting the partner property of each player
        //                we wait with doing so as soon as the partner is known (by playing the partner card)
        this._partners=[-1,-1,-1,-1];
        let teams=[[partner1,partner2],[]];
        this._players.forEach((player)=>{if(player._index!==partner1&&player._index!==partner2)teams[1].push(player._index);});
        teams.forEach((team)=>{
            console.log("Team: ",team);
            this._partners[team[0]]=team[1];
            this._partners[team[1]]=team[0];
        });
    }
    _tellPlayersWhoTheirPartnerIs(){
        this._arePartnersKnown=true;
        this._players.forEach((player)=>{player.partner=this._partners[player._index];});
    }

    // after dealing the cards, the game can be played
    _startTheGame(){
        this._highestBidPlayers=[];
        this._highestBid=BID_PAS;
        //this._highestBid=-1;this._trumpSuite=-1;this._partnerSuite=-1;this._partnerRank=-1;
        this._checkForTroela(); // will if detected register the highest bidder!!!!
        // if a player has 3 aces the play to play is 'troela' and therefore the accepted bid
        if(this._highestBid===BID_TROELA){ // we will be playing 'troela'
            // better to go through the _setPartnerSuite()
            // NOTE the trump suite has been set, as well as the player with the fourth ace
            // NOTE we're skipping the entire process of asking for the partner card as we know all that already
            // partners are known to
            // obsolete because done by _setPartnerSuite() as well: this._setPartners(this.fourthAcePlayer,this._highestBidPlayers[0]);
            this._tellPlayersWhoTheirPartnerIs(); // ascertain that all players known there partner
            this._partnerRank=12; // MUST BE SET otherwise can't set the partner suite!!!
            // the player with the three aces will be the trump player
            this._setPartnerSuite(this._highestBidPlayers[0],this.getTrumpSuite()); // of course the partner card suite is the trump suite
            if(!this._partners)throw new Error("Partner of 'troela' player unknown!");
            this._tellPlayersWhoTheirPartnerIs(); // we have to do this before playing
            this._startPlaying(this.fourthAcePlayer);
            ////this._trumpSuite=this._players[this.fourthAcePlayer].getSuitesWithRank(RANK_ACE);
            // set the current player to the fourth ace player (which will take care of assigning all other partner properties)
            // no need to choose trump or partner, so we can start playing the game with the fourth ace player to play first!!
            // replacing: this._startPlaying(this.fourthAcePlayer);
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
     * returns 0 when the player cannot ask for the partner card anymore, 1 if he can ask for it non-blind, -1 when it has to be asked blind
     */
    _canAskForPartnerCard(){
        // theoretically the card can be played but it might be the card with which the partner card is asked!!
        // is this a game where there's a partner card that hasn't been played yet
        // alternatively put: should there be a partner and there isn't one yet?????
        if(this.getTrumpPlayer()===this._player){ // this is trump player is playing the first card
            if(!this._arePartnersKnown) // partner not known yet, therefore the partner card has not been played yet
                // asking for the partner card is only possible when the player does not have the partner cards anymore
                return(this._players[this._player].getNumberOfCardsWithSuite(this.getPartnerSuite())>0?1:-1);
            console.log("Partner known, so no need to ask for the partner card anymore!");
        }
        return 0;
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

    /**
     * determine how many tricks each player should win, to win in the game
     * and registers these with the given player
     */
    _setNumberOfTricksToWin(){
        for(let playerIndex=0;playerIndex<this.numberOfPlayers;playerIndex++){
            let player=this._players[playerIndex];
            player.setNumberOfTricksToWin(-1); // don't care how many
            if(this._highestBid!==BID_LAATSTE_SLAG_EN_SCHOPPEN_VROUW){ // at least one person is 'playing' something
                if(this._partnerSuite>=0){ // some game that involves working together
                    player.setNumberOfTricksToWin(player.isFriendly(this.getTrumpPlayer())>0?8:6);
                }else // a solitary game
                if(this._highestBidPlayers.indexOf(playerIndex)>=0){ // one of the 'players'
                    switch(this._highestBid){
                        case BID_MISERE:case BID_OPEN_MISERE:case BID_OPEN_MISERE_MET_EEN_PRAATJE: // zero trick game
                            player.setNumberOfTricksToWin(0);
                            break;
                        case BID_PICO: // one trick game
                            player.setNumberOfTricksToWin(1);
                            break;                           
                        case BID_NEGEN_ALLEEN:case BID_NEGEN_ALLEEN_BETER: // nine trick gam
                            player.setNumberOfTricksToWin(9);
                            break;
                        case BID_TIEN_ALLEEN:case BID_TIEN_ALLEEN_BETER: // ten trick game
                            player.setNumberOfTricksToWin(10);
                            break;
                        case BID_ELF_ALLEEN:case BID_ELF_ALLEEN_BETER: // eleven trick game
                            player.setNumberOfTricksToWin(11);
                            break;
                        case BID_TWAALF_ALLEEN:case BID_TWAALF_ALLEEN_BETER: // twelve trick game
                            player.setNumberOfTricksToWin(12);
                            break;
                        case BID_DERTIEN_ALLEEN:case BID_DERTIEN_ALLEEN_BETER: // thirteen trick game
                            player.setNumberOfTricksToWin(10);
                            break;
                    }
                }
            }else // any trick game
                player.setNumberOfTricksToWin(14); // undeterminate indicating as little as possible
        }
    }

    set state(newstate){
        let oldstate=this._state;
        this._state=newstate;
        // respond to the change of state BUT always call the event listener no matter what goes wrong along the way
        try{
            // if there's a state change listener, play 'online', otherwise play through the console
            switch(this._state){
                case IDLE:
                    // if failing to initialize the game I'm out of order!!!
                    if(!this._gameInitialized())this.state=OUT_OF_ORDER;
                    break;
                case DEALING:
                    // let's tell the players that a new game is starting
                    this._players.forEach((player)=>{player.newGame();});
                    this.deckOfCards.shuffle(this._shuffleCount,this._topopMinimum,this._topopMaximum); // shuffle the cards again
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
                        this._setNumberOfTricksToWin();
                        // it's always possible to ask for the partner card blind, when there's trump!!!
                        // unless the partner card has already been played, or when the 'rikker' still has trumps!!!!
                        // if there's a partner suite (and rank) we have to check whether or not it was played or not
                        ////////this._partnerCardPlayedStatus=(this._partnerSuite>=0?0:-1); // keep track of whether the partner card was played
                        console.log("Let the games begin!");
                        this._trick=new Trick(this._player,this.getTrumpSuite(),this.getPartnerSuite(),this.getPartnerRank(),this._canAskForPartnerCard()); // replacing: this._trumpSuite,this._partnerSuite,this._partnerRank,this._getTrumpPlayer()); // replacing: this._canAskForPartnerCardBlind());
                        this._players[this._player].playACard(this._trick);
                    }
                    break;
                case CANCELING:
                    // this is a pre-state of FINISHED where not all the player cards are in the tricks
                    // reposses the cards from the players
                    this._players.forEach((player)=>{while(1){let card=player.getFirstCard();if(!card)break;card.holder=this.deckOfCards;}});
                    console.log("Number of cards repossessed from the players: "+this.deckOfCards.numberOfCards+".");
                    this.state=FINISHED; // to get the event listener informed as well (before tricks are cleared!)
                    break;
                case FINISHED:
                    if(this._tricks.length==13){
                        // determine the points won and adjust the points
                        let pointsWon=0;
                        let pointsToWinOffset=BID_POINTS[this._highestBid];
                        let tricksToWin=(this._highestBidPlayers.length>0?this._players[this._highestBidPlayers[0]].numberOfTricksToWin:0);
                        // we're going to compute the delta points i.e. what each player will win (or loose)
                        this._deltaPoints=[0,0,0,0];
                        let aSolitaryGame=true;
                        switch(this._highestBid){
                            case BID_TROELA:case BID_RIK:case BID_RIK_BETER: // single highest bidder
                                aSolitaryGame=false; // not played alone
                            case BID_NEGEN_ALLEEN:case BID_NEGEN_ALLEEN_BETER:
                            case BID_TIEN_ALLEEN:case BID_TIEN_ALLEEN_BETER:
                            case BID_ELF_ALLEEN:case BID_ELF_ALLEEN_BETER:
                            case BID_TWAALF_ALLEEN:case BID_TWAALF_ALLEEN_BETER:
                            case BID_DERTIEN_ALLEEN:case BID_DERTIEN_ALLEEN_BETER:
                                let numberOfTricksWonByHighestBidder=this._players[this._highestBidPlayers[0]].getNumberOfTricksWon();
                                pointsWon=(numberOfTricksWonByHighestBidder>=tricksToWin?pointsToWinOffset+numberOfTricksWonByHighestBidder-tricksToWin:numberOfTricksWonByHighestBidder-tricksToWin-pointsToWinOffset);
                                if(aSolitaryGame){
                                    for(let player=0;player<4;player++)
                                        if(player==this._highestBidPlayers[0])
                                            this._deltaPoints[player]+=(3*pointsWon);
                                        else
                                            this._deltaPoints[player]-=pointsWon;
                                }else{ // played with partner, so the highest bidder and the partner get pointsWon and the others give pointsWon
                                    for(let player=0;player<4;player++)
                                        if(player==this._highestBidPlayers[0]||player==this._players[this._highestBidPlayers[0]].partner)
                                            this._deltaPoints[player]+=pointsWon;
                                        else
                                            this._deltaPoints[player]-=pointsWon;
                                }
                                break;
                            case BID_LAATSTE_SLAG_EN_SCHOPPEN_VROUW:
                                // the last trick winner has to pay the other players
                                let lastTrickWinner=this._tricks[12].winner;
                                for(let player=0;player<4;player++)
                                    if(player==lastTrickWinner)
                                        this._deltaPoints[player]-=(3*pointsToWinOffset);
                                    else
                                        this._deltaPoints[player]+=pointsToWinOffset;
                                // the winner of the 'schoppen vrouw' trick also has to pay the other players
                                let schoppenVrouwWinner=-1;
                                for(let trick=0;trick<12;trick++){
                                    if(this._tricks[trick].containsCard(SUITE_SPADE,RANK_QUEEN)){
                                        schoppenVrouwWinner=this._tricks[trick].winner;
                                        break;
                                    }
                                }
                                for(let player=0;player<4;player++)
                                    if(player==schoppenVrouwWinner)
                                        this._deltaPoints[player]-=(3*pointsToWinOffset);
                                    else
                                        this._deltaPoints[player]+=pointsToWinOffset;
                                break;
                            // the rest of the games (without trump) can be played by multiple players at the same time
                            // with points won by any of the highest bid players
                            case BID_PICO:
                                for(let highestBidPlayer=0;highestBidPlayer<this._highestBidPlayers.length;highestBidPlayer++){
                                    let deltaWon=Math.abs(this._players[this._highestBidPlayers[highestBidPlayer]].getNumberOfTricksWon()-1);
                                    pointsWon=(deltaWon?1-pointsToWinOffset-deltaWon:pointsToWinOffset);
                                    for(let player=0;player<4;player++)
                                        if(player==this._highestBidPlayers[this.highestBidPlayer])
                                            this._deltaPoints[player]+=(3*pointWon);
                                        else
                                            this._deltaPoints[player]-=pointsWon;
                                }
                                break;
                            case BID_MISERE:case BID_OPEN_MISERE:case BID_OPEN_MISERE_MET_EEN_PRAATJE:
                                for(let highestBidPlayer=0;highestBidPlayer<this._highestBidPlayers.length;highestBidPlayer++){
                                    // every trick one is one too many
                                    let deltaWon=this._players[this._highestBidPlayers[highestBidPlayer]].getNumberOfTricksWon();
                                    pointsWon=(deltaWon?1-pointsToWinOffset-deltaWon:pointsToWinOffset);
                                    for(let player=0;player<4;player++)
                                        if(player==this._highestBidPlayers[this.highestBidPlayer])
                                            this._deltaPoints[player]+=(3*pointsWon);
                                        else
                                            this._deltaPoints[player]-=pointsWon;
                                }
                                break;
                        }
                        for(let player=0;player<4;player++)
                            this._points[player]+=this._deltaPoints[player];
                    }else // incomplete game so ascertain to have no delta points
                        this._deltaPoints=null;
                    break;
            }

        }finally{
            if(this._eventListener)this._eventListener.stateChanged(oldstate,this._state);
        }
   }

   // expose the current points each player has
   get points(){return this._points.slice(0);} // returns a copy of the current set of points

   // and the results of the points won/lost in the last game (if any)
   get deltaPoints(){return(this._deltaPoints?this._deltaPoints.slice(0):null);}

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
        // NOTE the player playing 'rik' cannot have 3 aces, so unless the player has 4 aces there's always an ace to ask (even blind)
        //      it's different for the kings though, as this player could have 3 kings
        // TODO need to check for that as well
        let player=this._players[this._player];
        let partnerRank=(player?RANK_ACE:-1);
        while(partnerRank>=0){
            let partnerSuites=player.getSuitesWithRank(partnerRank); // all the suites with that rank
            // remove trump suite
            let partnerTrumpSuiteIndex=partnerSuites.indexOf(this._trumpSuite);
            if(partnerTrumpSuiteIndex>=0)partnerSuites.splice(partnerTrumpSuiteIndex,1);
            if(partnerSuites.length<3)break; // if less than three left it's selectable
            partnerRank--;
        }
        return partnerRank;
    }

    /**
     * setter for setting the trump suite
     * if the game played is not played by a single person (without a partner), the partner suite is requested next passing the rank of the card to ask for
     * @param {*} trumpSuite 
     */
    _setTrumpSuite(trumpSuite){
        // ASSERT shouldn't be called when the bid is 'troela'
        if(this._highestBid===BID_TROELA)throw new Error("Setting the trump suite this way not allowed when playing 'troela'!");
        this._trumpSuite=trumpSuite;
        if(this._trumpSuite<0){
            console.error("Cannot remove the trump suite this way!");
            return;
        }
        this._partnerRank=-1; // safety measure 
        console.log(">>> "+capitalize(SUITE_NAMES[this._trumpSuite])+" selected as trump playing '"+BID_NAMES[this._highestBid]+"'.");
        // is this a trump game with a partner (ace/king) to ask for?
        // I guess we can pass along the rank, which means we can choose the rank ourselves
        if(this._highestBid==BID_RIK||this._highestBid==BID_RIK_BETER){ // yes, a regular 'rik'
            this._partnerRank=this._getPartnerRank();
            console.log(">>> Partner card rank: "+RANK_NAMES[this._partnerRank]+".");
            let ranklessSuites=this._players[this._player].getSuitesWithoutRank(this._partnerRank);
            ranklessSuites[this.getTrumpSuite()]=-1; // can't choose trump!!
            this._players[this._player].choosePartnerSuite(ranklessSuites,DUTCH_RANK_NAMES[this._partnerRank]); // passing along the rank of the card the user can choose
        }else // a solitary play, so we can start playing immediately
            this._startPlaying((this.dealer+1)%this.numberOfPlayers);
    }
    /**
     * setter for setting the parent card suite
     * @param {*} trumpPlayer the player who will be playing the trump game (apart from with 'troela' the current player)
     * @param {*} partnerSuite 
     */
    _setPartnerSuite(trumpPlayer,partnerSuite){
        // IMPORTANT this._player has to be set to the trump player before calling _setPartnerSuite
        if(partnerSuite>=0&&this._partnerRank<=0)
            throw new Error("Can't accept the partner card suite without a partner card rank!");
        this._partnerSuite=partnerSuite;
        this._partners=null; // precaution
        if(this._partnerSuite>=0){
            console.log("Selected partner suite: "+SUITE_NAMES[this._partnerSuite]+".");
            // here we can determine who will be the partner and register that!!!
            let partner=this.getPlayerWithCard(this._partnerSuite,this._partnerRank);
            if(partner<0){
                alert("Programmafout: Partner met "+DUTCH_SUITE_NAMES[this._partnerSuite]+" "+DUTCH_RANK_NAMES[this._partnerRank]+" niet gevonden!");
                return;
            }
            this._setPartners(trumpPlayer,partner);
            /* replacing:
                partnerPlayer.partner=this._player;
                console.log("Partner of "+this.getPlayerName(this._player)+": "+partnerPlayer.name+"'.");
            */
        }
    }
    
    /**
     * determines the possible trump suites the current player may choose
     */
    _getPossibleTrumpSuites(){
        return this.getSuites();
    }
    /**
     * determines the possible partner suites the current player may choose
     */
    _getPossibleParentSuites(){

    }

    _doneBidding(){
        // ASSERT should not be called when playing 'troela'
        console.log("Bidding is over, determine whether to ask for trump or the partner card...");
        // the player next to the dealer is always the player to start playing
        if(this._highestBid!=BID_PAS){
            // is it a trump game?
            if(BIDS_ALL_CAN_PLAY.indexOf(this._highestBid)<0){ // yes
                // if the trump is not known we have to ask for the trump suite (color) first
                this._player=this._highestBidPlayers[0]; // required by _setTrumpSuite as well
                if(BIDS_WITH_PARTNER_IN_HEARTS.indexOf(this._highestBid)<0){
                    // pass along all the suites the player has (from which to choose from)
                    this._players[this._player].chooseTrumpSuite(this._players[this._player].getSuites());
                }else // trump is known (which can only be hearts) TODO what if this player does not have any trump cards?????????
                    this._setTrumpSuite(SUITE_NAMES.indexOf("heart")); // set the trump suite directly!!!
            }else // not a trump suite
                // played by the highest bidder(s) on his own
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
        let oneAceSuite=-1; // if a player has one ace remember which ace
        for(let player=this.numberOfPlayers-1;player>=0;player--){
            // get the aces the player has
            let aceSuites=this._players[player].getSuitesWithRank(RANK_ACE);
            let aces=aceSuites.length;
            console.log("Number of aces in "+this._players[player].name+"'s hand: "+aces+".");
            if(aces==0)continue; // (OOPS almost forgot this one) still possible
            if(aces==2||aces==4)break; // if a player has either 2 or 4 aces no player can have 3
            if(aces==1){oneAcePlayer=player;oneAceSuite=aceSuites[0];}else threeAcePlayer=player;
        }
        if(threeAcePlayer>=0){
            this._highestBidPlayers=[threeAcePlayer]; // TODO perhaps this should be done elsewhere?????
            this.fourthAcePlayer=oneAcePlayer;
            // NOTE with troela do NOT call _setTrumpSuite() as that would start playing immediately (which we don't want to)
            this._trumpSuite=oneAceSuite;
            this._highestBid=BID_TROELA; // OOPS should be _highestBid!!
        }else
            this.fourthAcePlayer=-1;
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
    bidMade(bid){
        // 1. register the bid
        ////////now passed in as argument: let bid=this._players[this._player].bid; // collect the bid made by the current player
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
    trumpSuiteChosen(chosenTrumpSuite){this._setTrumpSuite(chosenTrumpSuite);}
    /**
     * to be called by the player with the highest bid when selecting the partner suite
     */
    partnerSuiteChosen(chosenPartnerSuite){
        this._setPartnerSuite(this._player,chosenPartnerSuite);
        // player left from the dealer to start playing the first trick
        this._startPlaying((this.dealer+1)%this.numberOfPlayers);
    }

    getTrickAtIndex(index){return(index>=0&&index<this._tricks.length?this._tricks[index]:null);}

    cardPlayed(card){
        console.log("Card played");
        let numberOfPlayerCards=this._players[this._player].numberOfCards;
        ////////////////// now passed in as argument!!!! let card=this._players[this._player].card;
        // move the card into the trick (effectively removing it from the player cards)
        this._trick.addCard(card);
        if(card._holder!==this._trick)throw new Error("Failed to add the card to the trick!");
        if(this._players[this._player].numberOfCards>=numberOfPlayerCards)throw new Error("Played card not removed from player hand!");
        // is the trick complete?
        if(this._trick.numberOfCards==4){
            // 1. determine whether this trick contains the partner card of the highest bidder
            if(this._partners){ // a non-solitary game
                let partnerCardPresentInTrick=this._trick.containsCard(this.getPartnerSuite(),this.getPartnerRank());
                ////////if(partnerCardPresentInTrick)console.log(">>>> Partner card detected! <<<<");
                // serious error if it should have been there and it wasn't!!
                if(this._trick.askingForPartnerCard!=0) // it was asked for
                    if(!partnerCardPresentInTrick)
                        throw new Error("The partner card was asked for, but was not present in the trick though.");
                if(partnerCardPresentInTrick){
                    // if the partners are now known yet (in a regular rik situation then)
                    if(!this._arePartnersKnown)this._tellPlayersWhoTheirPartnerIs();
                }
            }
            /* replacing:
            // NOTE if this._trick.askingForPartnerCard is not zero, it should!!!
            let partner=-1;
            ////if(this._partnerCardPlayedStatus==0){ // partner card not received yet
                partner=this._trick.getCardPlayer(this._partnerSuite,this._partnerRank);
                if(partner>=0){
                    console.log(">>>> Partner card detected! Will create the teams!");
                    ///////this._partnerCardPlayedStatus=1; // this means the user cannot ask for this card again!!!
                    // the partner is now known, so everyone now knows its partner
                    this._setPartners(this._highestBidPlayers[0],partner);
                    // TODO the other two should also point to each other
                }else
                if(this._trick.askingForPartnerCard!=0){
                    alert("Er is"+(this._trick.askingForPartnerCard<0?" (blind)":"")+" om de "+DUTCH_SUITE_NAMES[this.getPartnerSuite()]+" "+DUTCH_RANK_NAMES[this.getPartnerRank()]+" gevraagd maar die is niet gevallen. De slag moet over vanaf de eerste kaart!");
                    // we have to give card of the second, third and fourth player back
                    let cardIndex=4;
                    while(--cardIndex>0)this._trick._cards[cardIndex].holder=this._players[(this._trick._firstPlayer+cardIndex)%this.numberOfPlayers];
                    return;
                }
            /////}
            */
            // 2. register the trick
            this._tricks.push(this._trick); // register the trick
            // MDH@06DEC2019: the trick now itself keeps track of the winner card, so no need to do it here anymore
            // the player to start the next trick is the winner
            this._player=this._trick.winner;
            this._players[this._player].trickWon(this._tricks.length);
            console.log("The trick was won by player #"+this._player+": '"+this._players[this._player].name+"'.");
            /* MDH@06DEC2019 replacing:
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
                let highestCardPlayer=0;
                for(let player=1;player<4;player++)
                    if(compareCardsWithPlayAndTrumpSuite(this._trick._cards[player],this._trick._cards[highestCardPlayer],this._trick.playSuite,this._trumpSuite)>0)
                        highestCardPlayer=player;
                // the player to start the next trick is the winner
                this._player=(highestCardPlayer+this._trick.firstPlayer)%4;
                this._trick.winner=this._player; // store the winner in the trick!!!
                // register the trick with the player who won
                this._players[this._player].trickWon(this._tricks.length);
                console.log("The trick was won by player #"+highestCardPlayer+": '"+this._players[highestCardPlayer].name+"'.");
            }
            */
            // game over?????? i.e. all 13 tricks complete
            if(this._tricks.length==13){
                this.state=FINISHED;
                return;
            }
            // initialize a new trick with the first player to play
            this._trick=new Trick(this._player,this.getTrumpSuite(),this.getPartnerSuite(),this.getPartnerRank(),this._canAskForPartnerCard()); // replacing: this._trumpSuite,this._partnerSuite,this._partnerRank,this._getTrumpPlayer()); // replacing: this._canAskForPartnerCardBlind());
        }else // not yet, more cards to play in this trick
            this._player=(this._player+1)%4;
        // and ask the new current player to play a card
        this._players[this._player].playACard(this._trick); // replacing: _getTrickObjects(),this._trick.playSuite,this._trick.canAskForPartnerCardBlind);
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

    get trumpSuite(){return this._trumpSuite;}
    get partnerSuite(){return this._partnerSuite;}
    get partnerRank(){return this._partnerRank;}
    
    start(){
        if(this._state!==IDLE)this.state=IDLE; // if not in the IDLE state go there first
        if(this._state===IDLE)this.state=DEALING; // only from the IDLE state can we start dealing
    }

    cancel(){
        if(this._state===BIDDING||this._state===PLAYING)
            this.state=CANCELING;
        else
            alert("Unable to cancel the game!");
    }

}