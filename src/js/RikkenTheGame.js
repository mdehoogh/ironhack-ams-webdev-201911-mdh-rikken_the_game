/**
 * 
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

class RikkenTheGame{

    static get MY_NAME(){
        return "Me";
    }

    constructor(playernames){
        if(!playernames||!Array.isArray(playernames)||playernames.length<4)
            throw new Error("Not enough players!");
        this.players=playernames.map(playername => (playername.length>0?new Player(playername):new EmulatedPlayer(this.MY_NAME)));
        // we need a deck of cards
        this.deckOfCards=new DeckOfCards();
        // appoint the first player as dealer
        this.dealer=0; // the current dealer
        this.handsPlayed=0; // keep track of the number of 'slagen' (13 in total)
    }

    dealBy(numberOfCards){
        for(let player=1;player<=this.players.length;player++){
            // 'pop' off numberOfCards per player
            let cardsLeftToDeal=numberOfCards;
            while(--cardsLeftToDeal>=0)
                this.deckOfCards.getFirstCard().holder=this.players[(player+this.dealer)%this.players.length];
        }
    }

    logHands(){
        this.players.forEach((player)=>{console.log("Hand of "+player+":\n")+player._cards.join("\n");});
    }

    dealCards(){
        // every player is to get 13 cards (first seven than six)
        this.dealBy(7);
        this.dealBy(6);

        this.logHands();
    }

    initiateBidding(){
        // ask the players in turn what they bid passing the highest bid
        // until a bidding is accepted by all other players
        this.passed=0;

    }

    // when the bidding ends, the tricks can be played, starting with the person whos playing
    initiatePlaying(){
        // the player after the dealer plays the first card
        // who wins the trick starts first next
        // NOTE because the players take turn we can play the game synchronously!!!!
        this.tricks=[]; // the tricks played
        let numberOfTricksLeftToPlay=this.players[0].cards.length;
        let player=(dealer+1)%this.players.length; // the current player
        while(--numberOfTricksLeftToPlay>=0){
            trick=new Trick();
            
        }
    }

    start(){
        this.deckOfCards.shuffle(); // shuffle the cards again
        this.dealCards();
        this.initiateBidding();
    }

}