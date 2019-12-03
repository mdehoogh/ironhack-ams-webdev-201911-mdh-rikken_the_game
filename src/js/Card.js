/**
 * definition of a playing Card
 */
String.prototype.capitalize=function(){
    return (this.length>0?this[0].toUpperCase()+this.slice(1):this);
}

const CARD_SUITES=["diamond","club","heart","spade"];
const CARD_NAMES=["two","three","four","five","six","seven","eight","nine","ten","jack","queen","king","ace"];
// shorthand 'characters' for textual representation
// NOT WORKING: const CARD_SUITE_CHARACTERS=[String.fromCharCode(2666),String.fromCharCode(2663),String.fromCharCode(2665),String.fromCharCode(2660)];
const CARD_SUITE_CHARACTERS=['\u2666','\u2663','\u2665','\u2660']; // YES, WORKING!!!!!
const CARD_NAME_CHARACTERS=['2','3','4','5','6','7','8','9','10','B','V','K','A'];

const RANK_TWO=0,RANK_THREE=1,RANK_FOUR=2,RANK_FIVE=3,RANK_SIX=4,RANK_SEVEN=5,RANK_EIGHT=6,RANK_NINE=7,RANK_TEN=8,RANK_JACK=9,RANK_QUEEN=10,RANK_KING=11,RANK_ACE=12;

class Card{

    constructor(cardSuiteIndex,cardNameIndex){
        this._cardSuiteIndex=cardSuiteIndex;
        this._cardNameIndex=cardNameIndex;
    }
    toString(){
        return CARD_NAMES[this._cardNameIndex].capitalize()+" of "+CARD_SUITES[this._cardSuiteIndex]+"s";
    }
    
    get rank(){return this._cardNameIndex;}
    get suite(){return this._cardSuiteIndex;}

    getTextRepresentation(){return CARD_SUITE_CHARACTERS[this._cardSuiteIndex].concat(CARD_NAME_CHARACTERS[this._cardNameIndex]);}

}

function compareCards(card1,card2){
    let deltaSuite=card1._cardSuiteIndex-card2._cardSuiteIndex;
    if(deltaSuite!=0)return deltaSuite;
    return card1._cardNameIndex-card2._cardNameIndex;
}

// in a trick the play suite determines what cards are to be played, the trump suite determines what trump is
function compareCardsWithPlayAndTrumpSuite(card1,card2,playSuite,trumpSuite){
    // normally with any two regular cards they are never equal in a trick
    // the cards can be of the same suite 
    // let's first recompute the suite of both cards and elevate trump cards, and deevaluate non playSuite cards
    let card1Suite=(card1.suite==trumpSuite?4:(card1.suite!=playSuite?-1:card1.suite));
    let card2Suite=(card1.suite==trumpSuite?4:(card2.suite!=playSuite?-1:card2.suite));
    if(card1Suite>=0||card2Suite>=0){ // at least one of the cards is play suite or trump suite
        // if the suites are the same the highest rank wins
        if(card1Suite<0)return -1; // if the first card is irrelevant, the first card is lower
        if(card2Suite<0)return 1; // if the second card is irrelevant, the first card is higher
        // ASSERT both cards are either play suite or trump suite
        if(card1Suite==card2Suite)return card1.rank-card2.rank;
        // ASSERT one card is play suite, the other must be trump suite
        return(card1Suite==4?1:-1);
    }
    return 0; // considered equal that is irrelevant
}